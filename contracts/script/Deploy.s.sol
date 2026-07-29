// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/AgentTrader.sol";

contract DeployAgentTrader is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        AgentTrader agent = new AgentTrader();
        vm.stopBroadcast();
        console.log("AgentTrader deployed at:", address(agent));
    }
}
