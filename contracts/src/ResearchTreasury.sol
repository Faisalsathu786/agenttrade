// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
 * @title ResearchTreasury
 * @notice Fee collection + withdrawal for AI Research Agent
 * @dev UUPS proxy — upgradeable, storage stays in proxy
 *
 * Deploy order:
 *   1. Deploy ResearchTreasury (implementation)
 *   2. Deploy ERC1967Proxy with implementation address + initialize data
 *   3. Users interact with proxy address
 *   4. Admin upgrades via upgradeTo()
 */
contract ResearchTreasury is Initializable, UUPSUpgradeable, OwnableUpgradeable, PausableUpgradeable {
    // ─── Storage (proxy — permanent, never reorder) ──────
    uint256 public feePerQuery;          // Fee in wei (default 0.001 ETH)
    uint256 public totalQueries;
    uint256 public totalCollected;       // Total fee collected ever
    mapping(address => uint256) public userQueryCount;
    mapping(address => uint256) public userTotalSpent;

    // ─── Events ──────────────────────────────────────────
    event QueryPaid(address indexed user, string question, uint256 fee, uint256 timestamp);
    event FeeUpdated(uint256 oldFee, uint256 newFee);
    event Withdrawn(address indexed to, uint256 amount);
    event TreasuryPaused(bool paused);

    // ─── Errors ──────────────────────────────────────────
    error InsufficientFee();
    error TransferFailed();
    error NoBalance();
    error ZeroAddress();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _owner) public initializer {
        require(_owner != address(0), "Zero address");
        __UUPSUpgradeable_init();
        __Ownable_init();
        __Pausable_init();
        transferOwnership(_owner);
        feePerQuery = 0.001 ether; // Default: 0.001 ETH
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
    function withdraw(address payable to) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        uint256 balance = address(this).balance;
        if (balance == 0) revert NoBalance();
        (bool ok, ) = to.call{value: balance}("");
        if (!ok) revert TransferFailed();
        emit Withdrawn(to, balance);
    }

    /** Owner withdraws partial amount */
    function withdrawPartial(address payable to, uint256 amount) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        if (amount > address(this).balance) revert NoBalance();
        (bool ok, ) = to.call{value: amount}("");
        if (!ok) revert TransferFailed();
        emit Withdrawn(to, amount);
    }

    /** Owner sets fee per query */
    function setFee(uint256 _newFee) external onlyOwner {
        uint256 old = feePerQuery;
        feePerQuery = _newFee;
        emit FeeUpdated(old, _newFee);
    }

    /** Emergency pause */
    function pause() external onlyOwner {
        _pause();
        emit TreasuryPaused(true);
    }

    /** Resume */
    function unpause() external onlyOwner {
        _unpause();
        emit TreasuryPaused(false);
    }

    // ─── UUPS Upgrade ─────────────────────────────────────
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
