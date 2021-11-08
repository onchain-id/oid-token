import chai, { expect } from 'chai';
import { solidity } from 'ethereum-waffle';
import { artifacts, ethers, waffle } from 'hardhat';
import { Artifact } from 'hardhat/types';

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import { VestingManager } from '../types/VestingManager';
import { Signers } from './types';

chai.use(solidity);

describe('Unit tests', function () {
  before(async function () {
    this.signers = {} as Signers;
    const signers: SignerWithAddress[] = await ethers.getSigners();
    this.signers.admin = signers[0];
    this.signers.user = signers[1];
  });

  describe('VestingManager', function () {
    beforeEach(async function () {
      const vestingManagerArtifact: Artifact = await artifacts.readArtifact('VestingManager');
      this.vestingManager = <VestingManager>await waffle.deployContract(this.signers.admin, vestingManagerArtifact);
    });

    it('should deploy', async function () {
      expect(this.vestingManager.address).to.not.equal(ethers.constants.AddressZero);
    });

    //Admin functions
    describe('Admin functions', function () {
      describe('setTokenAddress', function () {
        it('should revert if an address not the owner attempts to set oidAddress', async function () {
          return await expect(
            this.vestingManager.connect(this.signers.user).setTokenAddress('0xc7d5639eccfbe65ea3adde99fbe163389e8395fa'),
          ).to.be.revertedWith('Ownable: caller is not the owner');
        });
        context('if msg.sender is the contract owner', function () {
          it('should revert if _oidAddress is 0x0', async function () {});
          it('should set the oidAddress', async function () {});
          it('should revert if oidAddress has already been initialized', async function () {});
        });
      });
      describe('setReferenceDate', function () {
        it('should revert if an address not the owner attempts to set referenceDate', async function () {});
        context('if msg.sender is the contract owner', function () {
          it('should revert if referenceDate has already been initialized', async function () {});
          it('should revert if _referenceDate is 0', async function () {});
          it('should set the referenceDate', async function () {});
        });
      });
      describe('withdraw', function () {
        it('should revert if an address not the owner attempts to withdraw', async function () {});
        context('if msg.sender is the contract owner', function () {
          it('should revert if transaction fails', async function () {});
          it('should withdraw the correct amount', async function () {});
        });
      });
      describe('createVestingSchema', function () {
        it('should revert if an address not the owner attempts to create a new vesting schema', async function () {});
        context('if msg.sender is the contract owner', function () {
          it('should revert if schemaId overflows', async function () {});
          it('should revert if _vesting is not within 0 and 100', async function () {});
          it('should create a new schema, emit an event and return its ID', async function () {});
        });
      });
    });
    describe('Public functions', function () {
      describe('deposit', function () {
        it('should revert if oidToken address is not initialized', async function () {});
        it('should revert if _to address is not a valid address', async function () {});
        it('should revert if _amount is 0', async function () {});
        it('should revert if vesting schema with id _schemaId does not exist', async function () {});
        it('should revert if msg.sender does not have enough allowance', async function () {});
        it('should revert if transferFrom is not successful', async function () {});
        it('should increase _to holdings successfully', async function () {});
      });
      describe('claim', function () {
        it('should revert if referenceDate is not initialized', async function () {});
        it('should revert if oidToken is not initialized', async function () {});
        it('should revert if user does not have any holding', async function () {});
        it('should revert if there is no available balance', async function () {});
        it('should revert if transferFrom fails', async function () {});
        it('should transfer available tokens and emit an event', async function () {});
        it('should not allow to claim indefinitely', async function () {});
        it('should unlock tokens every quarter', async function () {});
      });
      describe('getUserBalance', function () {
        it('should revert it fetching balance for address 0', async function () {});
        it('should return (0,0) if user has no holdings', async function () {});
        it('should return totalLockedAmount and availableAmount from _user', async function () {});
      });
    });
  });
});
