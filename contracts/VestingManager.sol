// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';

import 'hardhat/console.sol';

contract VestingManager is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable oidToken;
    uint256 public referenceDate = 0;
    uint32 public constant QUARTER = 13 weeks;
    uint8 public schemaId = 0;

    struct VestingSchema {
        uint8 lockup; // Number of quarters during which the holders tokens are locked and not accountable for vesting
        uint16 vesting; // % of total tokens released every quarter with two decimals of resolution (i.e. 1256 -> 12,56%)
    }

    struct Holding {
        uint256 totalVestedAmount; // amount of tokens in vesting on the contract for a given address and a given vesting schema 
        uint256 releasedAmount;
        uint8 vestingSchema;
    }

    /* Mappings */
    mapping(uint8 => VestingSchema) public VestingSchemas;
    mapping(address => Holding[]) public Holdings;

    /* Events */
    event Deposit(address to, uint256 amount, uint8 schemaId);
    event Withdraw(address to, uint256 amount);
    event SchemaCreated(uint8 schemaId, uint8 lockup, uint16 vesting);
    event EthDeposit(address sender, uint256 value, uint256 balance);

    /* Modifiers */
    modifier referenceInitiated() {
        require(referenceDate != 0, 'Reference date not initialized');
        _;
    }

    constructor(IERC20 oidToken_) {
        require(address(oidToken_) != address(0), 'Token address cannot be addr(0)');
        oidToken = oidToken_;
    }

    /* Admin functions */

    /**
     * @dev Sets the reference date for all lockups in the contract.
     * @param _referenceDate period in quarters that tokens remain blocked
     */
    function setReferenceDate(uint256 _referenceDate) external onlyOwner {
        require(referenceDate == 0, 'Reference date has already been initialized');
        require(_referenceDate != 0, 'Cannot set reference date to 0');
        referenceDate = _referenceDate;
    }

    /**
     * @dev Default withdraw function in case someone deposits ETH erroneously.
     */
    function withdraw() external onlyOwner {
        uint256 amount = address(this).balance;

        (bool success, ) = owner().call{value: amount}('');
        require(success, 'Failed to send Ether');
    }

    /**
     * @dev Withdraws remaining unlocked tokens across offerings.
     * @param _lockup period in quarters that tokens remain blocked
     * @param _vesting percentage of total tokens released each quarter
     * @return created schema ID
     */
    function createVestingSchema(uint8 _lockup, uint16 _vesting) external onlyOwner returns (uint8) {
        // Validate that we are not overflowing uint8
        uint8 newSchemaId = schemaId;
        schemaId++;
        require(_vesting > 0 && _vesting <= 10000, 'Vesting % should be withing 0 and 10000 (2 decimal floating point)');
        // Store new schema and emit event
        VestingSchemas[newSchemaId] = VestingSchema(_lockup, _vesting);
        emit SchemaCreated(newSchemaId, _lockup, _vesting);

        return newSchemaId;
    }

    /* Public functions */

    /**
     * @dev Withdraws remaining unlocked tokens across offerings.
     * @param _to address of the recipient of the tokens
     * @param _amount of tokens to be deposited into the contract
     * @param _schemaId vesting schema used in the deposit
     */
    function deposit(
        address _to,
        uint256 _amount,
        uint8 _schemaId
    ) external {
        // Validate input parameters
        require(_to != address(0), 'Cannot deposit to address 0');
        require(_amount > 0, 'Value must be positive');

        // Validate that vesting schema exists by checking against unaccepted value
        VestingSchema memory schema = VestingSchemas[_schemaId];
        require(schema.vesting != 0, 'Vesting schema does not exist');

        // Validate that spender is allowed to operate with OID token
        require(oidToken.allowance(msg.sender, address(this)) >= _amount, 'Not enough allowance');
        // Transfer OID token to locker contract
        oidToken.safeTransferFrom(msg.sender, address(this), _amount);
        // Add new vesting storage to user holdings
        Holdings[_to].push(Holding(_amount, 0, _schemaId));

        emit Deposit(_to, _amount, _schemaId);
    }

    /**
     * @dev Withdraws remaining unlocked tokens from address.
     * @param _from the users address
     */
    function claim(address _from) external referenceInitiated {
        Holding[] storage userHoldings = Holdings[_from];
        require(userHoldings.length > 0, 'User does not have any holdings');

        uint256 availableBalance = 0;
        for (uint256 i = 0; i < userHoldings.length; i++) {
            uint256 unlockedBalance = _getAvailableBalance(userHoldings[i]);
            if (unlockedBalance > 0) {
                userHoldings[i].releasedAmount += unlockedBalance;
                availableBalance += unlockedBalance;
            }
        }
        require(availableBalance > 0, 'There are no tokens available to claim');
        oidToken.safeTransfer(_from, availableBalance);

        emit Withdraw(_from, availableBalance);
    }

    /**
     * @dev Fetches user's locked and available tokens across different offerings.
     * @param _user the users address
     * @return totalLocked remaining user's locked tokens
     * @return availableBalance amount of freely available tokens
     */
    function getUserBalance(address _user) external view returns (uint256 totalLocked, uint256 availableBalance) {
        require(_user != address(0), 'Cannot get balance for address 0');
        Holding[] memory userHoldings = Holdings[_user];
        if (userHoldings.length == 0) {
            return (0, 0);
        }
        uint256 _totalLocked = 0;
        uint256 _availableBalance = 0;
        for (uint256 i = 0; i < userHoldings.length; i++) {
            uint256 unlockedBalance = _getAvailableBalance(userHoldings[i]);
            if (unlockedBalance > 0) {
                _availableBalance += unlockedBalance;
            }
            // Acummulate locked balance
            _totalLocked += (userHoldings[i].totalVestedAmount - unlockedBalance - userHoldings[i].releasedAmount);
        }

        return (_totalLocked, _availableBalance);
    }

    fallback() external payable {}

    receive() external payable {
        emit EthDeposit(msg.sender, msg.value, address(this).balance);
    }

    /* Internal functions */

    /**
     * @dev Calculates free token balance from each user holding.
     * @param _holding the user holding struct
     * @return amount of freely available tokens
     */
    function _getAvailableBalance(Holding memory _holding) internal view returns (uint256) {
        if (_holding.totalVestedAmount == _holding.releasedAmount) {
            //All tokens released
            return 0;
        }
        if (referenceDate == 0) {
            return 0;
        }

        // solhint-disable-next-line not-rely-on-time
        uint256 currentTime = block.timestamp;
        VestingSchema memory schema = VestingSchemas[_holding.vestingSchema];

        uint256 startVesting = referenceDate + (schema.lockup * QUARTER);
        if (currentTime < startVesting) {
            return 0; // All balance is still locked
        }

        uint256 vestingTicks = (currentTime - startVesting) / QUARTER;

        // Divide by floating point and %
        uint256 tokensPerTick = (_holding.totalVestedAmount * schema.vesting) / 10000;
        uint256 unlockedBalance = tokensPerTick * vestingTicks;

        if (_holding.releasedAmount >= unlockedBalance) {
            return 0;
        } else {
            return unlockedBalance - _holding.releasedAmount;
        }
    }
}
