// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title AgentTrader
 * @notice Autonomous Trading Agent on Ritual Chain
 * @dev Uses Ritual precompiles for on-chain price data and LLM analysis
 *
 * Precompile addresses (Ritual Chain 1979):
 *   HTTP: 0x0801 — fetches real-world data (CoinGecko prices, news)
 *   LLM:  0x0802 — on-chain AI inference for market analysis
 *   Agent: 0x0820 — persistent autonomous agent lifecycle
 */

// ─── Precompile Interfaces ───────────────────────────────────────────

interface IHTTPPrecompile {
    struct HTTPRequest {
        string url;
        string method;          // GET, POST
        string[] headers;       // key:value pairs
        string body;            // request payload
        bool followRedirects;
        uint32 maxBodySize;
        uint64 maxOutputBodySize;
        uint32 cacheTTL;
        uint8 capability;       // 0 = HTTP
        address payment;        // msg.sender
        uint32 priorityFee;
        uint32 gasLimit;
        bytes extraData;
    }

    function run(HTTPRequest calldata req) external returns (bytes32 requestId);
}

interface ILLMPrecompile {
    struct LLMRequest {
        string model;
        string[] messages;       // JSON-formatted message array
        uint32 maxTokens;
        bool stream;
        uint8 capability;        // 1 = LLM
        address payment;
        uint32 priorityFee;
        uint32 gasLimit;
        uint64 temperature;
        uint64 topP;
        string systemPrompt;
        bytes extraData;
    }

    function run(LLMRequest calldata req) external returns (bytes32 requestId);
}

/// @notice Callback interface for async precompile results
interface IAsyncCallback {
    function onHTTPResponse(bytes32 requestId, bytes calldata response) external;
    function onLLMResponse(bytes32 requestId, bytes calldata response) external;
}

// ─── AgentTrader Contract ────────────────────────────────────────────

contract AgentTrader is IAsyncCallback {
    // ─── Constants ───────────────────────────────────────────────────

    address public constant HTTP_PRECOMPILE = 0x0000000000000000000000000000000000000801;
    address public constant LLM_PRECOMPILE  = 0x0000000000000000000000000000000000000802;

    string public constant AGENT_NAME    = "AgentTrade V1";
    string public constant AGENT_VERSION = "1.0.0";

    // ─── State ───────────────────────────────────────────────────────

    enum Decision { NONE, BUY, SELL, HOLD }
    enum Asset    { NONE, BTC, ETH, SOL }

    struct AgentState {
        uint32  totalDecisions;
        int256  paperPnL;            // simulated PnL in basis points
        uint256 lastActivityBlock;
        bool    active;
    }

    struct DecisionRecord {
        uint256   id;
        Asset     asset;
        Decision  decision;
        uint256   priceAtDecision;   // price with 8 decimals
        uint256   timestamp;
        string    reasoning;         // LLM output
        bytes32   llmRequestId;
        bytes32   httpRequestId;
    }

    AgentState public agent;
    DecisionRecord[] public decisions;

    mapping(bytes32 => bool) public pendingHTTP;
    mapping(bytes32 => bool) public pendingLLM;
    mapping(bytes32 => DecisionRequest) public requestMap;

    struct DecisionRequest {
        Asset    asset;
        uint256  price;
        bool     stage;             // false=waiting price, true=waiting LLM
    }

    // ─── Events ──────────────────────────────────────────────────────

    event PriceFetched(Asset indexed asset, uint256 price, uint256 timestamp);
    event AnalysisRequested(Asset indexed asset, uint256 price, bytes32 llmRequestId);
    event DecisionMade(uint256 indexed id, Asset asset, Decision decision, uint256 price, string reasoning);
    event AgentInitialized(address indexed owner, string name);
    event ErrorOccurred(string reason);

    // ─── Constructor ─────────────────────────────────────────────────

    constructor() {
        agent.active = true;
        agent.lastActivityBlock = block.number;
        emit AgentInitialized(msg.sender, AGENT_NAME);
    }

    // ─── Public: Trigger Price Check ─────────────────────────────────

    /**
     * @notice Fetch live price for an asset via Ritual HTTP precompile
     * @param _asset 0=BTC, 1=ETH, 2=SOL
     */
    function fetchPrice(Asset _asset) external returns (bytes32) {
        require(agent.active, "Agent inactive");
        require(_asset != Asset.NONE, "Invalid asset");

        string memory url = getAssetURL(_asset);

        string[] memory headers = new string[](1);
        headers[0] = "Accept: application/json";

        IHTTPPrecompile.HTTPRequest memory req = IHTTPPrecompile.HTTPRequest({
            url:              url,
            method:           "GET",
            headers:          headers,
            body:             "",
            followRedirects:  true,
            maxBodySize:      5000,
            maxOutputBodySize: 1000,
            cacheTTL:         60,
            capability:       0,
            payment:          address(this),
            priorityFee:      0,
            gasLimit:         300000,
            extraData:        ""
        });

        bytes32 requestId = IHTTPPrecompile(HTTP_PRECOMPILE).run(req);
        pendingHTTP[requestId] = true;
        requestMap[requestId] = DecisionRequest({
            asset: _asset,
            price: 0,
            stage: false
        });

        return requestId;
    }

    // ─── Callback: HTTP Response ─────────────────────────────────────

    function onHTTPResponse(bytes32 requestId, bytes calldata response) external override {
        require(pendingHTTP[requestId], "Unknown HTTP request");
        delete pendingHTTP[requestId];

        DecisionRequest storage req = requestMap[requestId];

        // Parse price from CoinGecko JSON response
        int256 price = parsePrice(response);
        if (price <= 0) {
            emit ErrorOccurred("Price parse failed");
            return;
        }

        // forge-lint: disable-next-line(unsafe-typecast)
        req.price = uint256(price);
        req.stage = true;

        emit PriceFetched(req.asset, req.price, block.timestamp);

        // Now request LLM analysis
        requestLLMAnalysis(req.asset, req.price, requestId);
    }

    // ─── Callback: LLM Response ──────────────────────────────────────

    function onLLMResponse(bytes32 requestId, bytes calldata response) external override {
        require(pendingLLM[requestId], "Unknown LLM request");
        delete pendingLLM[requestId];

        DecisionRequest storage req = requestMap[requestId];
        require(req.stage, "Invalid state");

        (Decision dec, string memory reasoning) = parseLLMOutput(response);

        uint256 id = decisions.length;
        decisions.push(DecisionRecord({
            id:              id,
            asset:           req.asset,
            decision:        dec,
            priceAtDecision: req.price,
            timestamp:       block.timestamp,
            reasoning:       reasoning,
            llmRequestId:    requestId,
            httpRequestId:   bytes32(0)
        }));

        agent.totalDecisions++;
        agent.lastActivityBlock = block.number;

        emit DecisionMade(id, req.asset, dec, req.price, reasoning);
    }

    // ─── Internal: LLM Request ───────────────────────────────────────

    function requestLLMAnalysis(Asset _asset, uint256 _price, bytes32 _httpReqId) internal {
        string[] memory messages = new string[](1);
        messages[0] = buildPrompt(_asset, _price);

        ILLMPrecompile.LLMRequest memory req = ILLMPrecompile.LLMRequest({
            model:        "llama-3.1-8b-instruct",
            messages:     messages,
            maxTokens:    256,
            stream:       false,
            capability:   1,
            payment:      address(this),
            priorityFee:  0,
            gasLimit:     500000,
            temperature:  0.3e18,
            topP:         0.95e18,
            systemPrompt: "You are a professional trading analyst. Analyze the given price and respond with exactly one word: BUY, SELL, or HOLD. Then provide a brief technical reason in the next sentence.",
            extraData:    ""
        });

        bytes32 requestId = ILLMPrecompile(LLM_PRECOMPILE).run(req);
        pendingLLM[requestId] = true;

        DecisionRequest storage dr = requestMap[_httpReqId];
        dr.price = _price;
        dr.stage = true;

        emit AnalysisRequested(_asset, _price, requestId);
    }

    // ─── Internal Parsers ────────────────────────────────────────────

    function parsePrice(bytes memory response) internal pure returns (int256) {
        // Parse JSON response from CoinGecko:
        // {"bitcoin":{"usd":67234.56}} or {"ethereum":{"usd":3241.89}} etc
        // Simplified parser for known format
        // Find the "usd" value in the response
        bytes memory searchFor = bytes("usd");
        uint256 idx = indexOf(response, searchFor);
        if (idx == type(uint256).max) return -1;

        // Navigate to number after "usd":
        uint256 numStart = idx + 6; // skip "usd":
        uint256 numEnd = numStart;

        while (numEnd < response.length) {
            bytes1 c = response[numEnd];
            if ((c >= 0x30 && c <= 0x39) || c == 0x2E) {
                numEnd++;
            } else {
                break;
            }
        }

        if (numEnd == numStart) return -1;

        bytes memory numBytes = new bytes(numEnd - numStart);
        for (uint256 i = numStart; i < numEnd; i++) {
            numBytes[i - numStart] = response[i];
        }

        return parseIntBytes(numBytes, 8); // return with 8 decimals
    }

    function parseLLMOutput(bytes memory response) internal pure returns (Decision, string memory) {
        // Parse LLM response for BUY/SELL/HOLD decision
        string memory resp = string(response);

        if (containsWord(resp, "BUY")) {
            return (Decision.BUY, resp);
        } else if (containsWord(resp, "SELL")) {
            return (Decision.SELL, resp);
        } else {
            return (Decision.HOLD, resp);
        }
    }

    // ─── Helpers ─────────────────────────────────────────────────────

    function getAssetURL(Asset _asset) internal pure returns (string memory) {
        if (_asset == Asset.BTC) {
            return "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd";
        } else if (_asset == Asset.ETH) {
            return "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd";
        } else {
            return "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd";
        }
    }

    function getPriceKey(Asset _asset) internal pure returns (bytes memory) {
        if (_asset == Asset.BTC)  return bytes("bitcoin");
        if (_asset == Asset.ETH)  return bytes("ethereum");
        return bytes("solana");
    }

    function buildPrompt(Asset _asset, uint256 _price) internal pure returns (string memory) {
        string memory assetName = getAssetName(_asset);
        uint256 usdPrice = _price / 1e8;
        return string(abi.encodePacked(
            "Current ", assetName, " price: $", uint2str(usdPrice),
            ". Based on this price level, should an autonomous trading agent BUY, SELL, or HOLD? Respond with one word first, then a brief reason."
        ));
    }

    function getAssetName(Asset _asset) internal pure returns (string memory) {
        if (_asset == Asset.BTC) return "BTC";
        if (_asset == Asset.ETH) return "ETH";
        return "SOL";
    }

    // ─── View Functions ──────────────────────────────────────────────

    function getDecisionCount() external view returns (uint256) {
        return decisions.length;
    }

    function getLatestDecision() external view returns (DecisionRecord memory) {
        require(decisions.length > 0, "No decisions yet");
        return decisions[decisions.length - 1];
    }

    function getDecision(uint256 _id) external view returns (DecisionRecord memory) {
        require(_id < decisions.length, "Invalid ID");
        return decisions[_id];
    }

    function getAgentState() external view returns (AgentState memory) {
        return agent;
    }

    // ─── String/Byte Utilities ───────────────────────────────────────

    function indexOf(bytes memory haystack, bytes memory needle) internal pure returns (uint256) {
        if (needle.length == 0) return 0;
        if (haystack.length < needle.length) return type(uint256).max;

        for (uint256 i = 0; i <= haystack.length - needle.length; i++) {
            bool found = true;
            for (uint256 j = 0; j < needle.length; j++) {
                if (haystack[i + j] != needle[j]) {
                    found = false;
                    break;
                }
            }
            if (found) return i;
        }
        return type(uint256).max;
    }

    function parseIntBytes(bytes memory b, uint8 decimals) internal pure returns (int256) {
        int256 result = 0;
        int256 fraction = 0;
        uint8 fracDigits = 0;
        bool inFraction = false;
        bool negative = false;
        uint256 i = 0;

        if (b.length > 0 && b[0] == 0x2D) { // '-'
            negative = true;
            i = 1;
        }

        for (; i < b.length; i++) {
            bytes1 c = b[i];
            if (c == 0x2E) { // '.'
                inFraction = true;
                continue;
            }
            if (c >= 0x30 && c <= 0x39) {
                uint8 digit = uint8(c) - 48;
                if (inFraction) {
                    fraction = fraction * 10 + int256(uint256(digit));
                    fracDigits++;
                    if (fracDigits >= decimals) break;
                } else {
                    result = result * 10 + int256(uint256(digit));
                }
            }
        }

        // Scale
        result = result * int256(10**decimals);
        for (uint8 d = fracDigits; d < decimals; d++) {
            fraction = fraction * 10;
        }
        result += fraction;

        return negative ? -result : result;
    }

    function uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) return "0";
        uint256 j = _i;
        uint256 len;
        while (j != 0) { len++; j /= 10; }
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        j = _i;
        while (j != 0) { bstr[--k] = bytes1(uint8(48 + (j % 10))); j /= 10; }
        return string(bstr);
    }

    function containsWord(string memory text, string memory word) internal pure returns (bool) {
        bytes memory t = bytes(text);
        bytes memory w = bytes(word);
        if (t.length < w.length) return false;

        for (uint256 i = 0; i <= t.length - w.length; i++) {
            bool match_ = true;
            for (uint256 j = 0; j < w.length; j++) {
                if (t[i + j] != w[j]) { match_ = false; break; }
            }
            if (match_) return true;
        }
        return false;
    }
}
