// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/AdminBase.sol";
import "../src/SubscriptionManager.sol";
import "../src/ServiceRegistry.sol";
import "../src/AgentExecutor.sol";
import "../src/JobEscrow.sol";
import "../src/Reputation.sol";

contract DeployAI is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(pk);

        // 1. SubscriptionManager
        SubscriptionManager subMgr = new SubscriptionManager();
        subMgr.initialize();

        // 2. ServiceRegistry
        ServiceRegistry registry = new ServiceRegistry();

        // 3. AgentExecutor
        AgentExecutor executor = new AgentExecutor();

        // 4. JobEscrow (takes executor address)
        JobEscrow escrow = new JobEscrow(address(executor));

        // 5. Reputation
        Reputation reputation = new Reputation();

        vm.stopBroadcast();

        console.log("SubscriptionManager:", address(subMgr));
        console.log("ServiceRegistry:   ", address(registry));
        console.log("AgentExecutor:     ", address(executor));
        console.log("JobEscrow:         ", address(escrow));
        console.log("Reputation:        ", address(reputation));
    }
}
