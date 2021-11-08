import chai, { expect } from 'chai';
import { solidity } from 'ethereum-waffle';
import { Contract } from 'ethers';
import { artifacts, ethers, waffle } from 'hardhat';
import { Artifact } from 'hardhat/types';

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import { OnchainId } from '../types';
import { VestingManager } from '../types/VestingManager';
import { Signers } from './types';

chai.use(solidity);

describe('Unit tests', () => {
  const decimals = 18;
  const totalSupply = ethers.utils.parseUnits('1000000', decimals);
  let oidToken: Contract;
  let vestingManager: Contract;
  const signers: Signers = {} as Signers;

  before(async () => {
    const signersArray: SignerWithAddress[] = await ethers.getSigners();
    signers.admin = signersArray[0];
    signers.user = signersArray[1];
  });
  beforeEach('deploy OID token', async () => {
    const oidTokenArtifact: Artifact = await artifacts.readArtifact('OnchainId');
    oidToken = <OnchainId>await waffle.deployContract(signers.admin, oidTokenArtifact, [totalSupply]);
  });

  describe('VestingManager', () => {
    beforeEach(async () => {
      const vestingManagerArtifact: Artifact = await artifacts.readArtifact('VestingManager');
      vestingManager = <VestingManager>await waffle.deployContract(signers.admin, vestingManagerArtifact);
    });

    it('should deploy', async () => {
      expect(vestingManager.address).to.not.equal(ethers.constants.AddressZero);
    });

    //Admin functions
    describe('Admin functions', () => {
      describe('setTokenAddress', () => {
        it('should revert if an address not the owner attempts to set oidAddress', async () => {
          return await expect(vestingManager.connect(signers.user).setTokenAddress('0xc7d5639eccfbe65ea3adde99fbe163389e8395fa')).to.be.revertedWith(
            'Ownable: caller is not the owner',
          );
        });
        context('if msg.sender is the contract owner', () => {
          it('should revert if _oidAddress is 0x0', async () => {});
          it('should set the oidAddress', async () => {});
          it('should revert if oidAddress has already been initialized', async () => {});
        });
      });
      describe('setReferenceDate', () => {
        it('should revert if an address not the owner attempts to set referenceDate', async () => {});
        context('if msg.sender is the contract owner', () => {
          it('should revert if referenceDate has already been initialized', async () => {});
          it('should revert if _referenceDate is 0', async () => {});
          it('should set the referenceDate', async () => {});
        });
      });
      describe('withdraw', () => {
        it('should revert if an address not the owner attempts to withdraw', async () => {});
        context('if msg.sender is the contract owner', () => {
          it('should revert if transaction fails', async () => {});
          it('should withdraw the correct amount', async () => {});
        });
      });
      describe('createVestingSchema', () => {
        it('should revert if an address not the owner attempts to create a new vesting schema', async () => {});
        context('if msg.sender is the contract owner', () => {
          it('should revert if schemaId overflows', async () => {});
          it('should revert if _vesting is not within 0 and 100', async () => {});
          it('should create a new schema, emit an event and return its ID', async () => {});
        });
      });
    });
    describe('Public functions', () => {
      describe('deposit', () => {
        context('when oidToken addr is not initialized', () => {
          it('should revert if oidToken address is not initialized', async () => {
            const userAddr = signers.user.address;
            return await expect(vestingManager.connect(signers.user).deposit(userAddr, 10, 0)).to.be.revertedWith('OID token not initialized');
          });
        });
        context('when oidToken addr is initialized', () => {
          beforeEach('initialize oitToken addr', async () => {
            await vestingManager.connect(signers.admin).setTokenAddress(oidToken.address);
          });
          it('should revert if _to address is not a valid address', async () => {
            return await expect(vestingManager.connect(signers.user).deposit(ethers.constants.AddressZero, 10, 0)).to.be.revertedWith(
              'Cannot deposit to address 0',
            );
          });
          it('should revert if _amount is 0', async () => {
            const userAddr = signers.user.address;
            return await expect(vestingManager.connect(signers.user).deposit(userAddr, 0, 0)).to.be.revertedWith('Value must be positive');
          });
          it('should revert if vesting schema with id _schemaId does not exist', async () => {
            const userAddr = signers.user.address;
            return await expect(vestingManager.connect(signers.user).deposit(userAddr, 10, 0)).to.be.revertedWith('Vesting schema does not exist');
          });
          context('when vesting schema exists', () => {
            let schemaId: number;
            beforeEach('create a vesting schema', async () => {
              const schemaIdTx = await vestingManager.connect(signers.admin).createVestingSchema(0, 10);
              schemaId = ethers.BigNumber.from(schemaIdTx.value._hex).toNumber();
            });

            it('should revert if msg.sender does not have enough allowance', async () => {
              const userAddr = signers.user.address;
              return await expect(
                vestingManager.connect(signers.admin).deposit(userAddr, ethers.utils.parseUnits('10', decimals), schemaId),
              ).to.be.revertedWith('Not enough allowance');
            });
            it('should revert if transferFrom is not successful', async () => {
              const userAddr = signers.user.address;
              await oidToken.connect(signers.user).approve(vestingManager.address, 100);
              await oidToken.connect(signers.user).approve(userAddr, ethers.constants.MaxUint256);
              return await expect(vestingManager.connect(signers.user).deposit(userAddr, 10, schemaId)).to.be.revertedWith(
                'ERC20: transfer amount exceeds balance',
              );
            });
            it('should increase _to holdings successfully', async () => {
              const userAddr = signers.user.address;
              await oidToken.connect(signers.admin).approve(vestingManager.address, 100);
              return await expect(vestingManager.connect(signers.admin).deposit(userAddr, 10, schemaId))
                .to.emit(vestingManager, 'Deposit')
                .withArgs(userAddr, 10, schemaId);
            });
          });
        });
      });
      describe('claim', () => {
        it('should revert if referenceDate is not initialized', async () => {});
        it('should revert if oidToken is not initialized', async () => {});
        it('should revert if user does not have any holding', async () => {});
        it('should revert if there is no available balance', async () => {});
        it('should revert if transferFrom fails', async () => {});
        it('should transfer available tokens and emit an event', async () => {});
        it('should not allow to claim indefinitely', async () => {});
        it('should unlock tokens every quarter', async () => {});
      });
      describe('getUserBalance', () => {
        it('should revert it fetching balance for address 0', async () => {});
        it('should return (0,0) if user has no holdings', async () => {});
        it('should return totalLockedAmount and availableAmount from _user', async () => {});
      });
    });
  });
});
