// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

interface IVestingManager {
    function claimFromToken(address _from) external;

    function getUserBalance(address _user) external view returns (uint256 totalLocked, uint256 availableAmount);
}

contract OnchainId is ERC20 {
    address public vestingManager;

    constructor(uint256 initialSupply, address _vestingManager) ERC20('ONCHAINID', 'OID') {
        _mint(msg.sender, initialSupply);
        vestingManager = _vestingManager;
    }

    function claim() public {
        require(vestingManager != address(0));
        IVestingManager(vestingManager).claimFromToken(msg.sender);
    }

    function getFullBalance() public view returns (uint256 totalLocked, uint256 availableAmount) {
        return IVestingManager(vestingManager).getUserBalance(msg.sender);
    }
}
