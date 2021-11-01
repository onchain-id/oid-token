// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SampleContract {
  string public name;
  address private owner;
  event NameEvent(string evPram);

  constructor() {
    name = 'my name';
    owner = msg.sender;
  }

  modifier onlyOwner() {
    require(msg.sender == owner);

    _;
  }

  function getName() public view returns (string memory) {
    return (name);
  }

  function changeName(string memory _name) public onlyOwner {
    name = _name;
    emit NameEvent(name);
  }
}
