// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./AdminBase.sol";

/**
 * @title Reputation
 * @notice Track agent performance and user ratings on-chain
 */
contract Reputation is AdminBase {
    struct AgentRating {
        uint256 totalRating;
        uint256 ratingCount;
    }

    mapping(address => AgentRating) public agentRatings;

    mapping(address => mapping(address => bool)) public hasRated;

    event AgentRated(address indexed user, address indexed agent, uint8 rating, uint256 newAvgScore);

    error AlreadyRated();
    error InvalidRating();

    constructor() {}

    function rateAgent(address agent, uint8 rating) external {
        if (rating < 1 || rating > 5) revert InvalidRating();
        if (hasRated[msg.sender][agent]) revert AlreadyRated();

        hasRated[msg.sender][agent] = true;

        AgentRating storage r = agentRatings[agent];
        r.totalRating += rating;
        r.ratingCount++;

        uint256 avgScore = r.totalRating / r.ratingCount;
        emit AgentRated(msg.sender, agent, rating, avgScore);
    }

    function getAverageScore(address agent) external view returns (uint256) {
        AgentRating storage r = agentRatings[agent];
        if (r.ratingCount == 0) return 0;
        return r.totalRating / r.ratingCount;
    }

    function getRatingDetail(address agent) external view returns (uint256 avgScore, uint256 count) {
        AgentRating storage r = agentRatings[agent];
        if (r.ratingCount == 0) return (0, 0);
        return (r.totalRating / r.ratingCount, r.ratingCount);
    }
}
