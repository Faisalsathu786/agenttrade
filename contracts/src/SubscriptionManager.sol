// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./AdminBase.sol";

/**
 * @title SubscriptionManager
 * @notice Tier/cycle subscription engine — payment, renewal, expiry, platform fee
 */
contract SubscriptionManager is AdminBase {
    enum Tier { BASIC, STANDARD, PREMIUM }
    enum Cycle { THREE_DAY, SEVEN_DAY, THIRTY_DAY }

    struct Subscription {
        address user;
        Tier tier;
        uint256 startTime;
        uint256 endTime;
        uint256 tasksUsed;
        uint256 dailyLimit;
        bool active;
    }

    uint256 public constant PLATFORM_FEE_BPS = 2000; // 20%
    uint256 public accumulatedFees;

    mapping(address => Subscription) public subscriptions;
    mapping(Tier => mapping(Cycle => uint256)) public pricing;

    event Subscribed(address indexed user, Tier tier, Cycle cycle, uint256 price);
    event SubscriptionRenewed(address indexed user);
    event RenewalFailed(address indexed user);
    event PricingUpdated(Tier tier, Cycle cycle, uint256 price);
    event FeeWithdrawn(address indexed to, uint256 amount);

    constructor() {}

    function initialize() external {
        // Basic
        pricing[Tier.BASIC][Cycle.THREE_DAY]   = 0.5 ether;
        pricing[Tier.BASIC][Cycle.SEVEN_DAY]   = 1 ether;
        pricing[Tier.BASIC][Cycle.THIRTY_DAY]  = 3 ether;
        // Standard
        pricing[Tier.STANDARD][Cycle.THREE_DAY]  = 1.5 ether;
        pricing[Tier.STANDARD][Cycle.SEVEN_DAY]  = 3 ether;
        pricing[Tier.STANDARD][Cycle.THIRTY_DAY] = 8 ether;
        // Premium
        pricing[Tier.PREMIUM][Cycle.THREE_DAY]  = 4 ether;
        pricing[Tier.PREMIUM][Cycle.SEVEN_DAY]  = 8 ether;
        pricing[Tier.PREMIUM][Cycle.THIRTY_DAY] = 20 ether;
    }

    function subscribe(Tier tier, Cycle cycle) external payable whenNotPaused {
        uint256 price = pricing[tier][cycle];
        require(msg.value >= price, "Insufficient payment");

        uint256 duration = _cycleDuration(cycle);
        Subscription storage sub = subscriptions[msg.sender];
        sub.user = msg.sender;
        sub.tier = tier;
        sub.startTime = block.timestamp;
        sub.endTime = block.timestamp + duration;
        sub.tasksUsed = 0;
        sub.dailyLimit = _getDailyLimit(tier);
        sub.active = true;

        // Platform fee (20%)
        uint256 fee = (price * PLATFORM_FEE_BPS) / 10000;
        accumulatedFees += fee;

        // Refund excess
        if (msg.value > price) {
            payable(msg.sender).transfer(msg.value - price);
        }

        emit Subscribed(msg.sender, tier, cycle, price);
    }

    function requestService(string calldata question) external whenNotPaused {
        Subscription storage sub = subscriptions[msg.sender];
        require(sub.active, "No active sub");
        require(block.timestamp < sub.endTime, "Expired");

        if (_isNewDay(msg.sender)) {
            sub.tasksUsed = 0;
        }

        uint256 limit = _getDailyLimit(sub.tier);
        require(sub.tasksUsed < limit || sub.tier == Tier.PREMIUM, "Daily limit reached");
        sub.tasksUsed++;

        emit ServiceRequested(msg.sender, question, sub.tier);
    }

    function renewSubscription(address user) external {
        Subscription storage sub = subscriptions[user];
        require(block.timestamp >= sub.endTime, "Still active");

        uint256 price = pricing[sub.tier][_getCycleFromDuration(sub.endTime - sub.startTime)];
        if (address(this).balance >= price) {
            uint256 fee = (price * PLATFORM_FEE_BPS) / 10000;
            accumulatedFees += fee;
            sub.startTime = block.timestamp;
            sub.endTime = block.timestamp + _cycleDuration(_getCycleFromDuration(sub.endTime - sub.startTime));
            sub.tasksUsed = 0;
            emit SubscriptionRenewed(user);
        } else {
            sub.active = false;
            emit RenewalFailed(user);
        }
    }

    function getUserSub(address user) external view returns (Subscription memory) {
        return subscriptions[user];
    }

    function getDailyLimit(Tier tier) external pure returns (uint256) {
        return _getDailyLimit(tier);
    }

    function setPricing(Tier tier, Cycle cycle, uint256 price) external onlyOwner {
        pricing[tier][cycle] = price;
        emit PricingUpdated(tier, cycle, price);
    }

    function withdrawPlatformFees(address payable to) external onlyOwner {
        uint256 fees = accumulatedFees;
        accumulatedFees = 0;
        (bool ok,) = to.call{value: fees}("");
        require(ok, "Transfer failed");
        emit FeeWithdrawn(to, fees);
    }

    // ─── Internal ────────────────────────────────────
    function _cycleDuration(Cycle cycle) internal pure returns (uint256) {
        if (cycle == Cycle.THREE_DAY) return 3 days;
        if (cycle == Cycle.SEVEN_DAY) return 7 days;
        return 30 days;
    }

    function _getCycleFromDuration(uint256 dur) internal pure returns (Cycle) {
        if (dur == 3 days) return Cycle.THREE_DAY;
        if (dur == 7 days) return Cycle.SEVEN_DAY;
        return Cycle.THIRTY_DAY;
    }

    function _getDailyLimit(Tier tier) internal pure returns (uint256) {
        if (tier == Tier.BASIC) return 2;
        if (tier == Tier.STANDARD) return 5;
        return type(uint256).max; // Premium - unlimited
    }

    function _isNewDay(address user) internal view returns (bool) {
        Subscription storage sub = subscriptions[user];
        return sub.tasksUsed > 0 && (block.timestamp / 1 days) > (sub.startTime / 1 days);
    }

    // ─── Events ─────────────────────────────────────
    event ServiceRequested(address indexed user, string question, Tier tier);
}
