// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title AgentTrader
 * @notice Autonomous Trading Agent — fetches prices via Ritual HTTP precompile (0x0801),
 *         stores price data for on-chain verification.
 *
 * Future: LLM precompile (0x0802) for BUY/SELL/HOLD analysis.
 *
 * Precompile addresses (Ritual Chain 1979):
 *   HTTP: 0x0801
 *   LLM:  0x0802
 */
contract AgentTrader {

    address private constant HTTP_PRE = 0x0000000000000000000000000000000000000801;
    address private constant EXECUTOR = 0x7cEc336E46D8791fF9d9c5f7A5b8a6001ffD96d1;

    string public constant AGENT_NAME    = "AgentTrade V1";
    string public constant AGENT_VERSION = "1.0.0";

    enum Decision { NONE, BUY, SELL, HOLD }
    enum Asset    { NONE, BTC, ETH, SOL }

    struct AgentState {
        uint32  totalDecisions;
        int256  paperPnL;
        uint256 lastActivityBlock;
        bool    active;
    }

    struct PriceRecord {
        Asset     asset;
        uint256   price;
        uint256   timestamp;
        bytes32   httpRequestId;
    }

    struct DecisionRecord {
        uint256   id;
        Asset     asset;
        Decision  decision;
        uint256   priceAtDecision;
        uint256   timestamp;
        string    reasoning;
    }

    AgentState public agent;
    PriceRecord[] public priceHistory;
    DecisionRecord[] public decisions;

    mapping(bytes32 => bool) public pendingHTTP;
    mapping(bytes32 => Asset) public pendingAsset;

    event PriceFetched(Asset indexed asset, uint256 price, uint256 timestamp);
    event DecisionMade(uint256 indexed id, Asset asset, Decision decision, uint256 price, string reasoning);
    event AgentInitialized(address indexed owner, string name);

    constructor() {
        agent.active = true;
        agent.lastActivityBlock = block.number;
        emit AgentInitialized(msg.sender, AGENT_NAME);
    }

    receive() external payable {}
    function deposit() external payable {}

    /**
     * @notice Fetch live BTC/ETH/SOL price via Ritual HTTP precompile (0x0801)
     * @param _asset 1=BTC, 2=ETH, 3=SOL
     *
     * HTTP precompile ABI — 13 flat-encoded fields:
     *   (address,bytes[],uint256,bytes[],bytes, string,uint8,string[],string[],bytes, uint256,uint8,bool)
     * Returns: abi.encode(bytes simmedInput, bytes actualOutput)
     * actualOutput: (uint16,string[],string[],bytes,string)
     */
    function fetchPrice(Asset _asset) external returns (bytes32) {
        require(agent.active, "Agent inactive");
        require(_asset >= Asset.BTC && _asset <= Asset.SOL, "Invalid asset");

        (bool ok, bytes memory data) = address(HTTP_PRE).call(
            abi.encode(
                EXECUTOR, new bytes[](0), uint256(100), new bytes[](0), bytes(""),
                getAssetURL(_asset), uint8(1), new string[](0), new string[](0), bytes(""),
                uint256(0), uint8(0), false
            )
        );
        require(ok, "HTTP call failed");

        (bytes memory simmed,) = abi.decode(data, (bytes, bytes));
        bytes32 rid = keccak256(simmed);

        pendingHTTP[rid] = true;
        pendingAsset[rid] = _asset;
        return rid;
    }

    /**
     * @notice Callback invoked by Ritual chain when HTTP precompile completes
     * @param requestId Request identifier
     * @param response Encoded output: (uint16,string[],string[],bytes,string)
     */
    function onHTTPResponse(bytes32 requestId, bytes calldata response) external {
        require(pendingHTTP[requestId], "Unknown HTTP request");
        delete pendingHTTP[requestId];

        (, , , bytes memory body,) = abi.decode(response, (uint16, string[], string[], bytes, string));

        uint256 price = parsePrice(body);
        require(price > 0, "Price parse failed");

        Asset asset = pendingAsset[requestId];
        priceHistory.push(PriceRecord(asset, price, block.timestamp, requestId));
        agent.lastActivityBlock = block.number;

        emit PriceFetched(asset, price, block.timestamp);
    }

    // ── Parsers ───────────────────────────────────────────────────
    function parsePrice(bytes memory b) internal pure returns (uint256) {
        // Expected JSON: {"bitcoin":{"usd":67234.56}} etc.
        bytes memory key = bytes("usd");
        uint256 idx = indexOf(b, key);
        if (idx == type(uint256).max) return 0;
        uint256 s = idx + 6;
        while (s < b.length && b[s] == 0x20) s++;
        uint256 e = s;
        while (e < b.length && ((b[e] >= 0x30 && b[e] <= 0x39) || b[e] == 0x2E)) e++;
        if (e == s) return 0;
        bytes memory num = new bytes(e - s);
        for (uint256 i = s; i < e; i++) num[i - s] = b[i];
        return uint256(parseInt(num, 8));
    }

    // ── Helpers ───────────────────────────────────────────────────
    function getAssetURL(Asset a) internal pure returns (string memory) {
        if (a == Asset.BTC) return "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd";
        if (a == Asset.ETH) return "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd";
        if (a == Asset.SOL) return "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd";
        return "";
    }

    // ── Views ─────────────────────────────────────────────────────
    function getAgentState() external view returns (AgentState memory) { return agent; }
    function getPriceCount() external view returns (uint256) { return priceHistory.length; }
    function getDecisionCount() external view returns (uint256) { return decisions.length; }
    function getLatestPrice() external view returns (PriceRecord memory) {
        require(priceHistory.length > 0, "No prices yet");
        return priceHistory[priceHistory.length - 1];
    }
    function getContractBalance() external view returns (uint256) { return address(this).balance; }

    // ── Utilities ─────────────────────────────────────────────────
    function indexOf(bytes memory h, bytes memory n) internal pure returns (uint256) {
        if (n.length == 0) return 0;
        if (h.length < n.length) return type(uint256).max;
        for (uint256 i = 0; i <= h.length - n.length; i++) {
            bool f = true;
            for (uint256 j = 0; j < n.length; j++) if (h[i+j] != n[j]) { f = false; break; }
            if (f) return i;
        }
        return type(uint256).max;
    }

    function parseInt(bytes memory b, uint8 decimals) internal pure returns (int256) {
        int256 r = 0; int256 f = 0; uint8 fd = 0; bool neg = false; bool frac = false;
        uint256 i = 0;
        if (b.length > 0 && b[0] == 0x2D) { neg = true; i = 1; }
        for (; i < b.length; i++) {
            bytes1 c = b[i];
            if (c == 0x2E) { frac = true; continue; }
            if (c < 0x30 || c > 0x39) break;
            uint8 d = uint8(c) - 48;
            if (frac) { f = f * 10 + int256(uint256(d)); fd++; if (fd >= decimals) break; }
            else r = r * 10 + int256(uint256(d));
        }
        r = r * int256(10 ** decimals);
        for (uint8 d = fd; d < decimals; d++) f = f * 10;
        return neg ? -(r + f) : (r + f);
    }
}
