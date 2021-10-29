// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/access/Ownable.sol';

contract Migrations is Ownable{
  uint256 public lastCompletedMigration;

  constructor(){}

  function setCompleted(uint256 completed) external onlyOwner {
    lastCompletedMigration = completed;
  }
}