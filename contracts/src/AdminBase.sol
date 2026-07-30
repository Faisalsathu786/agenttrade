// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AdminBase
 * @notice Shared admin/owner pattern + pause + platform fee withdrawal
 */
abstract contract AdminBase {
    address public owner;
    bool public systemPaused;

    event OwnerUpdated(address indexed oldOwner, address indexed newOwner);
    event SystemPaused(bool state);
    event Withdrawn(address indexed to, uint256 amount);

    error OnlyOwner();
    error ContractPaused();
    error ZeroAddress();
    error NoBalance();

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    modifier whenNotPaused() {
        if (systemPaused) revert ContractPaused();
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function transferOwnership(address _newOwner) external onlyOwner {
        if (_newOwner == address(0)) revert ZeroAddress();
        emit OwnerUpdated(owner, _newOwner);
        owner = _newOwner;
    }

    function setPaused(bool _paused) external onlyOwner {
        systemPaused = _paused;
        emit SystemPaused(_paused);
    }

    function withdrawBalance(address payable to) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        uint256 bal = address(this).balance;
        if (bal == 0) revert NoBalance();
        (bool ok,) = to.call{value: bal}("");
        require(ok, "Transfer failed");
        emit Withdrawn(to, bal);
    }

    function withdrawPartial(address payable to, uint256 amount) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        if (amount > address(this).balance) revert NoBalance();
        (bool ok,) = to.call{value: amount}("");
        require(ok, "Transfer failed");
        emit Withdrawn(to, amount);
    }

    receive() external payable {}
}
