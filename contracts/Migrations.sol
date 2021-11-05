// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

contract Migrations {
    address public owner = msg.sender;

    // A function with the signature `last_completed_migration()`, returning a uint, is required.
    uint256 public last_completed_migration;

    modifier restricted() {
        require(msg.sender == owner, 'This function is restricted to the contracts owner');
        _;
    }

    // A function with the signature `setCompleted(uint)` is required.
    function setCompleted(uint256 completed) public restricted {
        last_completed_migration = completed;
    }
}
