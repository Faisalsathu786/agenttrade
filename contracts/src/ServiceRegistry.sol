// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./AdminBase.sol";

/**
 * @title ServiceRegistry
 * @notice Register agents and their service capabilities
 */
contract ServiceRegistry is AdminBase {
    struct AgentProfile {
        address agentAddress;
        string name;
        string description;
        string serviceType;    // "sentiment", "summarizer", "market", "research", "ta", "qa", "strategy"
        uint256 price;         // per-task price or 0 if subscription-only
        uint256 completedJobs;
        uint256 totalRating;
        uint256 ratingCount;
        bool active;
    }

    uint256 public agentCount;
    mapping(address => AgentProfile) public agents;
    mapping(string => address[]) public serviceTypeAgents; // type -> agent list
    address[] public agentList;

    event AgentRegistered(address indexed agent, string name, string serviceType);
    event AgentUpdated(address indexed agent, bool active);
    event AgentRated(address indexed agent, uint8 rating, uint256 newScore);

    error NotRegistered();
    error InvalidRating();
    error AlreadyRegistered();

    function registerAgent(
        address _agent,
        string calldata name,
        string calldata description,
        string calldata serviceType,
        uint256 _price
    ) external onlyOwner {
        if (agents[_agent].active) revert AlreadyRegistered();
        agents[_agent] = AgentProfile({
            agentAddress: _agent,
            name: name,
            description: description,
            serviceType: serviceType,
            price: _price,
            completedJobs: 0,
            totalRating: 0,
            ratingCount: 0,
            active: true
        });
        agentList.push(_agent);
        serviceTypeAgents[serviceType].push(_agent);
        agentCount++;
        emit AgentRegistered(_agent, name, serviceType);
    }

    function setAgentActive(address _agent, bool _active) external onlyOwner {
        if (!agents[_agent].active && !_active) revert NotRegistered();
        agents[_agent].active = _active;
        emit AgentUpdated(_agent, _active);
    }

    function incrementJobs(address _agent) external {
        if (!agents[_agent].active) revert NotRegistered();
        agents[_agent].completedJobs++;
    }

    function getAgentCount() external view returns (uint256) {
        return agentList.length;
    }

    function getAgentsByType(string calldata serviceType) external view returns (address[] memory) {
        return serviceTypeAgents[serviceType];
    }

    function getAllAgents() external view returns (AgentProfile[] memory) {
        AgentProfile[] memory result = new AgentProfile[](agentList.length);
        for (uint256 i = 0; i < agentList.length; i++) {
            result[i] = agents[agentList[i]];
        }
        return result;
    }

    /** Called by Reputation contract when user rates an agent */
    function recordRating(address _agent, uint8 rating) external {
        if (rating < 1 || rating > 5) revert InvalidRating();
        AgentProfile storage p = agents[_agent];
        p.totalRating += rating;
        p.ratingCount++;
        emit AgentRated(_agent, rating, p.totalRating / p.ratingCount);
    }
}
