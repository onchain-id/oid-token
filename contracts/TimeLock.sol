// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/utils/Counters.sol';

contract TimeLock {
    uint32 public constant QUARTER = 3 * 12 weeks;
    uint8 public schemaID = 0;

    struct VestingSchema {
        uint8 lockup;
        uint8 vesting;
    }

    struct Balance {
        //TODO TBD
        uint256 totalVestedAmount;
        uint256 availableBalance;
        uint256 releasedAmount;
        uint256 lastReleaseTime;
    }

    struct Holdings {
        uint256[] vestingSchemas;
    }

    mapping(uint8 => VestingSchema) VestingSchemas;
    mapping(address => Holdings) UserHoldings;

    event Deposit(address to, uint256 amount, uint256 lockupTime, uint256 vestingPeriod, uint8 vestingPct);
    event Withdraw(address to, uint256 amount);
    event SchemaCreated(uint8 schemaId, uint8 lockup, uint8 vesting);

    constructor() {}

    function createVestingSchema(uint8 _lockup, uint8 _vesting) external returns (uint8) {
        // Validate that we are not overflowing uint8
        uint8 newSchemaID = schemaID;
        schemaID++;
        require(newSchemaID > schemaID, 'Schema ID overflow');
        // Store new schema and emit event
        VestingSchemas[newSchemaID] = VestingSchema(_lockup, _vesting);
        emit SchemaCreated(newSchemaID, _lockup, _vesting);
        return newSchemaID;
    }

    // function deposit(
    //     address _to,
    //     uint256 _lockupTime,
    //     uint256 _vestingPeriod,
    //     uint8 _vestingPct
    // ) external payable {
    //     // Validate input parameters
    //     require(_to != address(0), 'Cannot deposit to address 0');
    //     require(msg.value > 0, 'Value must be positive');

    //     uint256 currentTime = block.timestamp;
    //     // Validate that lockup is either 0 (disabled) or in the future
    //     require(_lockupTime == 0 || _lockupTime >= currentTime, 'Lockup time cannot be in the past');

    //     // Validate that vesting period is not 0 and pct fits between 0 and 100
    //     require(_vestingPeriod > 0, 'Vesting period must be greater than 0');
    //     require(_vestingPct > 0 && _vestingPct < 100, 'Vesting percentage must be between 0 and 100');

    //     Locks[_to] = LockParameters(_vestingPct, _vestingPeriod, _lockupTime);
    //     Holdings[_to] = Balance(msg.value, 0, 0, 0);

    //     emit Deposit(_to, msg.value, _lockupTime, _vestingPeriod, _vestingPct);
    // }

    // function withdraw(uint256 _amount) external {
    //     Balance storage balance = Balances[msg.sender];
    //     require(_amount <= balance.availableBalance, 'Not enough available balance');

    //     emit Withdraw(msg.sender, _amount);
    // }
}
