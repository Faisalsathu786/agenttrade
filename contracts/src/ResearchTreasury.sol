// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title ResearchTreasury
 * @notice Fee collection + withdrawal for AI Research Agent
 * @dev UUPS proxy pattern — upgradeable, storage stays in proxy
 *
 * Deploy order:
 *   1. Deploy ResearchTreasury as implementation
 *   2. Deploy ERC1967Proxy with implementation + initialize(admin) data
 *   3. All user interaction through proxy address
 */
contract ResearchTreasury {
    // ─── Storage (proxy — permanent, never reorder) ──────
    address public implementation;      // UUPS: points to current logic
    address public admin;               // UUPS: upgrade authority
    bool public initialized;

    uint256 public feePerQuery;          // Fee in wei (default 0.001 ETH)
    uint256 public totalQueries;
    uint256 public totalCollected;       // Total fee collected ever
    mapping(address => uint256) public userQueryCount;
    mapping(address => uint256) public userTotalSpent;
    bool public paused;

    // ─── Events ──────────────────────────────────────────
    event QueryPaid(address indexed user, string question, uint256 fee, uint256 timestamp);
    event FeeUpdated(uint256 oldFee, uint256 newFee);
    event Withdrawn(address indexed to, uint256 amount, uint256 timestamp);
    event TreasuryPaused(bool paused);
    event Upgraded(address indexed newImplementation, uint256 timestamp);

    // ─── Errors ──────────────────────────────────────────
    error OnlyAdmin();
    error AlreadyInitialized();
    error InsufficientFee();
    error TransferFailed();
    error NoBalance();
    error ZeroAddress();
    error Paused();

    // ─── Modifiers ───────────────────────────────────────
    modifier onlyAdmin() {
        if (msg.sender != admin) revert OnlyAdmin();
        _;
    }
    modifier whenNotPaused() {
        if (paused) revert Paused();
        _;
    }

    // ─── UUPS Proxy Logic ────────────────────────────────
    /**
     * @dev Called by ERC1967Proxy via delegatecall.
     * Sets admin + initial storage. Can only be called once.
     */
    function initialize(address _admin) external {
        if (initialized) revert AlreadyInitialized();
        if (_admin == address(0)) revert ZeroAddress();
        admin = _admin;
        feePerQuery = 0.001 ether;
        initialized = true;
    }

    // ─── User Flow ───────────────────────────────────────
    /** User pays fee to ask a research question */
    function payForQuery(string calldata question) external payable whenNotPaused {
        if (msg.value < feePerQuery) revert InsufficientFee();

        userQueryCount[msg.sender] += 1;
        userTotalSpent[msg.sender] += msg.value;
        totalQueries += 1;
        totalCollected += msg.value;

        emit QueryPaid(msg.sender, question, msg.value, block.timestamp);

        // Refund excess payment
        uint256 excess = msg.value - feePerQuery;
        if (excess > 0) {
            (bool ok, ) = payable(msg.sender).call{value: excess}("");
            if (!ok) revert TransferFailed();
        }
    }

    /** Get question cost estimate */
    function queryCost() external view returns (uint256) {
        return feePerQuery;
    }

    // ─── Admin ────────────────────────────────────────────
    /** Owner withdraws all accumulated fees */
    function withdraw(address payable to) external onlyAdmin {
        if (to == address(0)) revert ZeroAddress();
        uint256 balance = address(this).balance;
        if (balance == 0) revert NoBalance();
        (bool ok, ) = to.call{value: balance}("");
        if (!ok) revert TransferFailed();
        emit Withdrawn(to, balance, block.timestamp);
    }

    /** Owner withdraws partial amount */
    function withdrawPartial(address payable to, uint256 amount) external onlyAdmin {
        if (to == address(0)) revert ZeroAddress();
        if (amount > address(this).balance) revert NoBalance();
        (bool ok, ) = to.call{value: amount}("");
        if (!ok) revert TransferFailed();
        emit Withdrawn(to, amount, block.timestamp);
    }

    /** Owner sets fee per query */
    function setFee(uint256 _newFee) external onlyAdmin {
        uint256 old = feePerQuery;
        feePerQuery = _newFee;
        emit FeeUpdated(old, _newFee);
    }

    /** Emergency pause */
    function pause() external onlyAdmin {
        paused = true;
        emit TreasuryPaused(true);
    }

    /** Resume */
    function unpause() external onlyAdmin {
        paused = false;
        emit TreasuryPaused(false);
    }

    // ─── UUPS Upgrade (admin-only) ───────────────────────
    // EIP-1967 implementation slot (same as proxy uses)
    bytes32 private constant _IMPLEMENTATION_SLOT =
        0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;

    /** Upgrade to a new implementation address */
    function upgradeTo(address _newImpl) external onlyAdmin {
        if (_newImpl == address(0)) revert ZeroAddress();
        assembly { sstore(_IMPLEMENTATION_SLOT, _newImpl) }
        implementation = _newImpl;
        emit Upgraded(_newImpl, block.timestamp);
    }
}

/**
 * @title ERC1967Proxy
 * @notice Minimal UUPS-compatible proxy. Delegates all calls (except admin) to implementation.
 * Stores implementation at EIP-1967 storage slot.
 */
contract ERC1967Proxy {
    // EIP-1967: bytes32(uint256(keccak256('eip1967.proxy.implementation')) - 1)
    bytes32 private constant _IMPLEMENTATION_SLOT =
        0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;
    // EIP-1967: bytes32(uint256(keccak256('eip1967.proxy.admin')) - 1)
    bytes32 private constant _ADMIN_SLOT =
        0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103;

    event Upgraded(address indexed implementation);

    /**
     * @param _logic Address of initial implementation
     * @param _data Calldata to delegatecall (abi.encodeWithSignature("initialize(address)", admin))
     */
    constructor(address _logic, bytes memory _data) {
        assembly {
            sstore(_IMPLEMENTATION_SLOT, _logic)
            sstore(_ADMIN_SLOT, caller())
        }
        (bool ok, ) = _logic.delegatecall(_data);
        require(ok, "Proxy: init failed");
    }

    /** Admin can upgrade implementation */
    function upgradeTo(address _newImpl) external {
        require(msg.sender == getAdmin(), "Proxy: only admin");
        assembly { sstore(_IMPLEMENTATION_SLOT, _newImpl) }
        emit Upgraded(_newImpl);
    }

    function getAdmin() public view returns (address) {
        address a;
        assembly { a := sload(_ADMIN_SLOT) }
        return a;
    }

    /** Delegate all calls to implementation */
    fallback() external payable {
        address impl;
        assembly { impl := sload(_IMPLEMENTATION_SLOT) }
        assembly {
            calldatacopy(0, 0, calldatasize())
            let result := delegatecall(gas(), impl, 0, calldatasize(), 0, 0)
            returndatacopy(0, 0, returndatasize())
            switch result
            case 0 { revert(0, returndatasize()) }
            default { return(0, returndatasize()) }
        }
    }

    receive() external payable {}
}
