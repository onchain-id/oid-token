// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract OnchainId is ERC20 {
    constructor(uint256 initialSupply) ERC20('ONCHAINID', 'OID') {
        _mint(msg.sender, initialSupply);
    }
}
