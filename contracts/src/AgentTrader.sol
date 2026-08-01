// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title AgentTrader
 * @notice Autonomous Trading Agent on Ritual Chain
 *
 * Uses HTTP precompile (0x0801) for on-chain price data via TEE.
 * Rule-based decision engine: compares trend, gives direction + confidence.
 * LLM precompile (0x0802) integration deferred to next milestone.
 *
 * Precompile addresses (Ritual Chain 1979):
 *   HTTP: 0x0801
 */
contract AgentTrader {

    address private constant HTTP_PRE = 0x0000000000000000000000000000000000000801;
    address private constant RWALLET  = 0x532F0dF0896F353d8C3DD8cc134e8129DA2a3948;
    address private constant EXECUTOR = 0x7cEc336E46D8791fF9d9c5f7A5b8a6001ffD96d1;

    string public constant AGENT_NAME    = "AgentTrade V1";
    string public constant AGENT_VERSION = "1.0.0";

    enum Asset { NONE, BTC, ETH, SOL }
    enum Direction { HOLD, BULLISH, BEARISH }

    struct AgentState {
        uint32  totalDecisions;
        int256  paperPnL;
        uint256 lastActivityBlock;
        bool    active;
    }

    struct PriceRecord {
        Asset   asset;
        uint256 price;
        uint256 timestamp;
    }

    struct Decision {
        Asset     asset;
        uint256   price;
        Direction direction;
        uint8     confidence;
        string    reason;
        uint256   timestamp;
    }

    uint256 private constant ASSET_BTC = 1;
    uint256 private constant ASSET_ETH = 2;
    uint256 private constant ASSET_SOL = 3;

    AgentState public agent;
    PriceRecord[] public priceHistory;
    Decision[] public decisions;

    // Track pending HTTP requests (first-execution phase)
    mapping(bytes32 => Asset) public pendingAsset;

    event PriceFetched(Asset indexed asset, uint256 price, uint256 timestamp);
    event DecisionMade(Asset indexed asset, Direction direction, uint8 confidence, uint256 price, uint256 timestamp);
    event AgentInitialized(address indexed owner, string name);

    constructor() {
        agent.active = true;
        agent.lastActivityBlock = block.number;
        emit AgentInitialized(msg.sender, AGENT_NAME);
    }

    receive() external payable {}
    function deposit() external payable {}

    /// @notice Fund RitualWallet for precompile fees
    function fundWallet(uint256 lockDuration) external {
        (bool ok,) = payable(RWALLET).call{value: address(this).balance}(
            abi.encodeWithSignature("deposit(uint256)", lockDuration)
        );
        require(ok, "Wallet fund failed");
    }

    /**
     * @notice Fetch live price via Ritual HTTP precompile (0x0801)
     *
     * ARCHITECTURE — Ritual split-phase execution:
     *   Phase 1 (first run): precompile returns simulated output →
     *     commitment created, requestId stored.
     *   Phase 2 (replayed run): the SAME tx runs again; precompile
     *     returns real HTTP data → price decoded and stored.
     *
     * @param _asset 1=BTC, 2=ETH, 3=SOL
     */
    function fetchPrice(uint256 _asset) external returns (bytes32) {
        require(agent.active, "Agent inactive");
        require(_asset >= ASSET_BTC && _asset <= ASSET_SOL, "Invalid asset");

        // Build HTTP precompile params (13 flat-encoded fields)
        (bool ok, bytes memory data) = address(HTTP_PRE).call(
            abi.encode(
                EXECUTOR,             // address executor
                new bytes[](0),       // bytes[] secrets
                uint256(100),         // uint256 ttl (blocks)
                new bytes[](0),       // bytes[] extraData
                bytes(""),            // bytes userPublicKey
                getAssetURL(Asset(_asset)), // string url
                uint8(1),             // uint8 method (GET)
                new string[](0),      // string[] headers
                new string[](0),      // string[] queryParams
                bytes(""),            // bytes body
                uint256(0),           // uint256 gasReserve
                uint8(0),             // uint8 numRetries
                false                 // bool shouldEncrypt
            )
        );
        require(ok, "HTTP precompile call failed");

        // Decode envelope: (bytes simmedInput, bytes actualOutput)
        (bytes memory simmed, bytes memory actualOutput) = abi.decode(data, (bytes, bytes));

        if (actualOutput.length > 0) {
            // ── Phase 2: Replayed execution with real data ──
            // Decode HTTP response: (uint16,string[],string[],bytes,string)
            (, , , bytes memory body, ) = abi.decode(actualOutput, (uint16, string[], string[], bytes, string));

            uint256 price = parsePrice(body);
            require(price > 0, "Price parse failed");

            priceHistory.push(PriceRecord(Asset(_asset), price, block.timestamp));
            agent.lastActivityBlock = block.number;

            emit PriceFetched(Asset(_asset), price, block.timestamp);
            return bytes32(uint256(1)); // success
        }

        // ── Phase 1: First execution, commitment created ──
        bytes32 rid = keccak256(simmed);
        pendingAsset[rid] = Asset(_asset);
        return rid;
    }

    // ── Parsers ───────────────────────────────────────────────────
    function parsePrice(bytes memory b) internal pure returns (uint256) {
        // Find "usd" key in CoinGecko JSON response
        bytes memory key = bytes("usd");
        uint256 idx = indexOf(b, key);
        if (idx == type(uint256).max) return 0;

        uint256 s = idx + 5; // skip past "usd": (5 bytes) — lands on first digit
        while (s < b.length && b[s] == 0x20) s++; // skip spaces

        uint256 e = s;
        while (e < b.length && ((b[e] >= 0x30 && b[e] <= 0x39) || b[e] == 0x2E)) e++;

        if (e == s) return 0;

        bytes memory num = new bytes(e - s);
        for (uint256 i = s; i < e; i++) num[i - s] = b[i];

        return parseInt(num, 8);
    }

    // ── URL Builder ────────────────────────────────────────────────
    function getAssetURL(Asset a) internal pure returns (string memory) {
        if (a == Asset.BTC) return "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd";
        if (a == Asset.ETH) return "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd";
        if (a == Asset.SOL) return "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd";
        return "";
    }

    // ── Decision Engine ─────────────────────────────────────────────

    /**
     * @notice Autonomous on-chain decision: compares latest 2 prices, stores direction
     * @param _asset 1=BTC, 2=ETH, 3=SOL
     */
    function makeDecision(uint256 _asset) external returns (uint256) {
        require(agent.active, "Agent inactive");
        require(_asset >= ASSET_BTC && _asset <= ASSET_SOL, "Invalid asset");

        // Find latest two price records for this asset
        uint256 cp;
        uint256 pp;
        (cp, pp) = _getLastTwoPrices(Asset(_asset));
        require(cp > 0, "No price data for asset");

        Direction dir;
        uint8 conf;

        if (pp == 0) {
            dir = Direction.HOLD;
            conf = 50;
        } else if (cp > pp) {
            dir = Direction.BULLISH;
            uint256 cpct = ((cp - pp) * 10000) / pp;
            if (cpct >= 300) conf = 85;
            else if (cpct >= 100) conf = 70;
            else conf = 55;
        } else if (cp < pp) {
            dir = Direction.BEARISH;
            uint256 cpct = ((pp - cp) * 10000) / pp;
            if (cpct >= 300) conf = 85;
            else if (cpct >= 100) conf = 70;
            else conf = 55;
        } else {
            dir = Direction.HOLD;
            conf = 60;
        }

        decisions.push(Decision(Asset(_asset), cp, dir, conf, "", block.timestamp));
        agent.totalDecisions++;
        agent.lastActivityBlock = block.number;

        emit DecisionMade(Asset(_asset), dir, conf, cp, block.timestamp);
        return uint256(dir);
    }

    // ── Views ─────────────────────────────────────────────────────
    function getAgentState() external view returns (AgentState memory) { return agent; }
    function getPriceCount() external view returns (uint256) { return priceHistory.length; }
    function getDecisionCount() external view returns (uint256) { return decisions.length; }
    function getLatestPrice() external view returns (PriceRecord memory) {
        require(priceHistory.length > 0, "No prices yet");
        return priceHistory[priceHistory.length - 1];
    }
    function getLatestDecision() external view returns (Decision memory) {
        require(decisions.length > 0, "No decisions yet");
        return decisions[decisions.length - 1];
    }
    function getContractBalance() external view returns (uint256) { return address(this).balance; }

    // ── String Utilities ───────────────────────────────────────────

    /// @notice Find latest two price records for an asset
    function _getLastTwoPrices(Asset a) internal view returns (uint256 latest, uint256 prev) {
        uint256 len = priceHistory.length;
        for (uint256 i = len; i > 0; i--) {
            if (priceHistory[i - 1].asset == a) {
                if (latest == 0) latest = priceHistory[i - 1].price;
                else { prev = priceHistory[i - 1].price; return (latest, prev); }
            }
        }
        return (latest, 0);
    }

    function indexOf(bytes memory h, bytes memory n) internal pure returns (uint256) {
        if (n.length == 0) return 0;
        if (h.length < n.length) return type(uint256).max;
        for (uint256 i = 0; i <= h.length - n.length; i++) {
            bool f = true;
            for (uint256 j = 0; j < n.length; j++) {
                if (h[i + j] != n[j]) { f = false; break; }
            }
            if (f) return i;
        }
        return type(uint256).max;
    }

    function parseInt(bytes memory b, uint8 decimals) internal pure returns (uint256) {
        uint256 r = 0;
        uint256 f = 0;
        uint8 fd = 0;
        bool frac = false;

        for (uint256 i = 0; i < b.length; i++) {
            bytes1 c = b[i];
            if (c == 0x2E) { frac = true; continue; }
            if (c < 0x30 || c > 0x39) break;

            uint8 d = uint8(c) - 48;
            if (frac) {
                f = f * 10 + uint256(d);
                fd++;
                if (fd >= decimals) break;
            } else {
                r = r * 10 + uint256(d);
            }
        }

        // Store raw integer price (e.g., 63949 for $63,949)
        // No decimal multiplier needed — frontend handles precision
        return r;
    }
}
