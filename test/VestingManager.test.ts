import chai, { expect } from 'chai';
import { solidity } from 'ethereum-waffle';
import { BigNumber, Contract } from 'ethers';
import { artifacts, ethers, network, waffle } from 'hardhat';
import { Artifact } from 'hardhat/types';

import { FakeContract, smock } from '@defi-wonderland/smock';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import { OnchainId } from '../types';
import { VestingManager } from '../types/VestingManager';
import { Signers } from './types';

chai.use(solidity);
chai.use(smock.matchers);

describe('Unit tests', () => {
  const decimals = 18;
  const totalSupply = ethers.utils.parseUnits('1000000', decimals);
  let oidToken: Contract;
  let vestingManager: Contract;
  const signers: Signers = {} as Signers;

  const parseUnits = (numStr: string): BigNumber => {
    return ethers.utils.parseUnits(numStr, decimals);
  };

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
      vestingManager = <VestingManager>await waffle.deployContract(signers.admin, vestingManagerArtifact, [oidToken.address]);
    });

    it('should deploy', async () => {
      expect(vestingManager.address).to.not.equal(ethers.constants.AddressZero);
    });

    //Admin functions
    describe('Admin functions', () => {
      describe('constructor', () => {
        context('if msg.sender is the contract owner', () => {
          it('should revert if _oidAddress is 0x0', async () => {
            const artifact: Artifact = await artifacts.readArtifact('VestingManager');
            const fakeOidToken: FakeContract<OnchainId> = await smock.fake('OnchainId');
            fakeOidToken.symbol.returns('NotOID');
            try {
              <VestingManager>await waffle.deployContract(signers.admin, artifact, [fakeOidToken.address]);
            } catch (e: unknown) {
              if (e instanceof Error) {
                return expect(e.message).to.equal("VM Exception while processing transaction: reverted with reason string 'OID token must be used'");
              }
            }
          });
        });
      });
      describe('setReferenceDate', () => {
        it('should revert if an address not the owner attempts to set referenceDate', async () => {
          return await expect(vestingManager.connect(signers.user).setReferenceDate(0)).to.be.revertedWith('Ownable: caller is not the owner');
        });
        context('if msg.sender is the contract owner', () => {
          it('should revert if referenceDate has already been initialized', async () => {
            const date = new Date().getTime();
            const birthDateInUnixTimestamp = (date / 1000).toFixed(0);
            await vestingManager.connect(signers.admin);
            await vestingManager.setReferenceDate(birthDateInUnixTimestamp);
            return await expect(vestingManager.setReferenceDate(birthDateInUnixTimestamp)).to.be.revertedWith(
              'Reference date has already been initialized',
            );
          });
          it('should revert if _referenceDate is 0', async () => {
            return await expect(vestingManager.setReferenceDate(0)).to.be.revertedWith('Cannot set reference date to 0');
          });
          it('should set the referenceDate', async () => {
            const date = new Date().getTime();
            const birthDateInUnixTimestamp = Number((date / 1000).toFixed(0));
            expect(await vestingManager.referenceDate()).to.equal(0);
            await vestingManager.connect(signers.admin).setReferenceDate(birthDateInUnixTimestamp);
            return expect(await vestingManager.referenceDate()).to.equal(birthDateInUnixTimestamp);
          });
        });
      });
      describe('createVestingSchema', () => {
        it('should revert if an address not the owner attempts to create a new vesting schema', async () => {
          return await expect(vestingManager.connect(signers.user).createVestingSchema(13, 1000)).to.be.revertedWith(
            'Ownable: caller is not the owner',
          );
        });
        context('if msg.sender is the contract owner', () => {
          it('should revert if _vesting is not within 0 and 100', async () => {
            return await expect(vestingManager.connect(signers.admin).createVestingSchema(13, 12345)).to.be.revertedWith(
              'Vesting % should be withing 0 and 10000 (2 decimal floating point)',
            );
          });
          it('should create a new schema, emit an event and return its ID', async () => {
            await vestingManager.connect(signers.admin);
            await expect(vestingManager.createVestingSchema(13, 1000)).to.emit(vestingManager, 'SchemaCreated').withArgs(0, 13, 1000);
            return await expect(vestingManager.createVestingSchema(0, 1)).to.emit(vestingManager, 'SchemaCreated').withArgs(1, 0, 1);
          });
        });
      });
    });
    describe('Public functions', () => {
      describe('deposit', () => {
        const amount = parseUnits('10');
        context('when oidToken addr is initialized', () => {
          it('should revert if _to address is not a valid address', async () => {
            return await expect(vestingManager.connect(signers.user).deposit(ethers.constants.AddressZero, amount, 0)).to.be.revertedWith(
              'Cannot deposit to address 0',
            );
          });
          it('should revert if _amounts 0', async () => {
            const userAddr = signers.user.address;
            return await expect(vestingManager.connect(signers.user).deposit(userAddr, 0, 0)).to.be.revertedWith('Value must be positive');
          });
          it('should revert if vesting schema with id _schemaId does not exist', async () => {
            const userAddr = signers.user.address;
            return await expect(vestingManager.connect(signers.user).deposit(userAddr, amount, 0)).to.be.revertedWith(
              'Vesting schema does not exist',
            );
          });
          context('when vesting schema exists', () => {
            let schemaId: number;
            beforeEach('create a vesting schema', async () => {
              const schemaIdTx = await vestingManager.connect(signers.admin).createVestingSchema(0, 10);
              schemaId = ethers.BigNumber.from(schemaIdTx.value._hex).toNumber();
            });

            it('should revert if msg.sender does not have enough allowance', async () => {
              const userAddr = signers.user.address;

              return await expect(vestingManager.connect(signers.admin).deposit(userAddr, amount, schemaId)).to.be.revertedWith(
                'ERC20: transfer amount exceeds allowance',
              );
            });
            it('should revert if transferFrom is not successful', async () => {
              const userAddr = signers.user.address;
              await oidToken.connect(signers.user).approve(vestingManager.address, parseUnits('100'));
              await oidToken.connect(signers.user).approve(userAddr, ethers.constants.MaxUint256);
              return await expect(vestingManager.connect(signers.user).deposit(userAddr, amount, schemaId)).to.be.revertedWith(
                'ERC20: transfer amount exceeds balance',
              );
            });
            it('should increase _to holdings successfully', async () => {
              const userAddr = signers.user.address;
              await oidToken.connect(signers.admin).approve(vestingManager.address, parseUnits('100'));
              return await expect(vestingManager.connect(signers.admin).deposit(userAddr, amount, schemaId))
                .to.emit(vestingManager, 'Deposit')
                .withArgs(userAddr, parseUnits('10'), schemaId);
            });
          });
        });
      });
      describe('claim', () => {
        beforeEach('setup contract', async () => {
          await vestingManager.connect(signers.admin).createVestingSchema(0, 5000);
        });
        it('should revert if referenceDate is not initialized', async () => {
          return await expect(vestingManager.connect(signers.user).claim(signers.user.address)).to.be.revertedWith('Reference date not initialized');
        });
        context('when referenceDate is initialized', function () {
          beforeEach('initialize referenceDate', async () => {
            const referenceDate = Math.floor(new Date().valueOf() / 1000);
            await vestingManager.connect(signers.admin).setReferenceDate(referenceDate);
          });
          context('when oidToken addr is initialized', async () => {
            beforeEach('initialize oidToken addr', async () => {
              await oidToken.connect(signers.admin).approve(vestingManager.address, parseUnits('100'));
            });
            it('should revert if user does not have any holding', async () => {
              return await expect(vestingManager.connect(signers.user).claim(signers.user.address)).to.be.revertedWith(
                'User does not have any holding',
              );
            });
            it('should transfer 0 tokens and emit an event', async () => {
              // Add holding to user
              await vestingManager.connect(signers.admin).deposit(signers.user.address, parseUnits('10'), 0);
              return await expect(vestingManager.connect(signers.user).claim(signers.user.address))
                .to.emit(vestingManager, 'Withdraw')
                .withArgs(signers.user.address, parseUnits('0'));
            });
            it('should transfer available tokens and emit an event', async () => {
              const userInstance = vestingManager.connect(signers.user);
              await vestingManager.connect(signers.admin).deposit(signers.user.address, parseUnits('10'), 0);
              // Back to the future
              const date = new Date();
              date.setDate(date.getDate() + 92); //Set time to next quarter
              let dateValueInSeconds = Math.floor(date.valueOf() / 1000);

              await network.provider.send('evm_setNextBlockTimestamp', [dateValueInSeconds]);
              await network.provider.send('evm_mine');

              // Should be able to claim part of the tokens
              await expect(userInstance.claim(signers.user.address))
                .to.emit(vestingManager, 'Withdraw')
                .withArgs(signers.user.address, parseUnits('5'));

              await expect(userInstance.claim(signers.user.address))
                .to.emit(vestingManager, 'Withdraw')
                .withArgs(signers.user.address, parseUnits('0'));

              // Unlock rest of tokens and claim them
              date.setDate(date.getDate() + 92); //Set time to next quarter
              dateValueInSeconds = Math.floor(date.valueOf() / 1000);

              await network.provider.send('evm_setNextBlockTimestamp', [dateValueInSeconds]);
              await network.provider.send('evm_mine');
              await expect(userInstance.claim(signers.user.address))
                .to.emit(vestingManager, 'Withdraw')
                .withArgs(signers.user.address, parseUnits('5'));

              // Should not be able to claim anymore and balance locked should be 0
              await expect(userInstance.claim(signers.user.address))
                .to.emit(vestingManager, 'Withdraw')
                .withArgs(signers.user.address, parseUnits('0'));

              const userBalance = await userInstance.getUserBalance(signers.user.address);
              expect(userBalance.totalLocked).to.equal(parseUnits('0'));
              return expect(userBalance.availableBalance).to.equal(parseUnits('0'));
            });
          });
        });
      });
      describe('getUserBalance', () => {
        const amount = parseUnits('10');

        beforeEach('initialize oitToken addr', async () => {
          await oidToken.connect(signers.admin).approve(vestingManager.address, ethers.constants.MaxUint256);
        });
        it('should revert it fetching balance for address 0', async () => {
          return await expect(vestingManager.connect(signers.user).getUserBalance(ethers.constants.AddressZero)).to.be.revertedWith(
            'Cannot get balance for address 0',
          );
        });
        it('should return (10,0) if referenceDate has not been set', async () => {
          const vestingAdmin = vestingManager.connect(signers.admin);

          await vestingAdmin.createVestingSchema(3, 5000);
          await vestingAdmin.deposit(signers.user.address, amount, 0);

          const result = await vestingManager.connect(signers.user).getUserBalance(signers.user.address);
          expect(result.totalLocked).to.equal(parseUnits('10'));
          return expect(result.availableBalance).to.equal(parseUnits('0'));
        });
        it('should return (10,0) if vesting has not started yet', async () => {
          const vestingAdmin = vestingManager.connect(signers.admin);

          const currentBlock = await ethers.provider.getBlock('latest');
          await vestingAdmin.setReferenceDate(currentBlock.timestamp);
          await vestingAdmin.createVestingSchema(3, 5000);
          await vestingAdmin.deposit(signers.user.address, amount, 0);

          const result = await vestingManager.connect(signers.user).getUserBalance(signers.user.address);
          expect(result.totalLocked).to.equal(parseUnits('10'));
          return expect(result.availableBalance).to.equal(parseUnits('0'));
        });
        it('should return (0,0) if user has no holdings', async () => {
          const userAddr = signers.user.address;
          const [totalLocked, availableBalance] = await vestingManager.connect(signers.user).getUserBalance(userAddr);
          expect(ethers.BigNumber.from(totalLocked).toNumber()).to.be.equal(0);
          return expect(ethers.BigNumber.from(availableBalance).toNumber()).to.be.equal(0);
        });
        it('should return totalLockedAmount and availableAmount from _user', async () => {
          const vestingAdmin = vestingManager.connect(signers.admin);
          // Set current date into block timestamp
          const currentBlock = await ethers.provider.getBlock('latest');
          // Setup contract required parameters
          await vestingAdmin.setReferenceDate(currentBlock.timestamp + 1);
          await vestingAdmin.createVestingSchema(0, 5000); // 50.00%
          await vestingManager.createVestingSchema(0, 1000); // 10.00%

          await vestingAdmin.deposit(signers.user.address, amount, 0);
          await vestingAdmin.deposit(signers.user.address, amount, 1);

          // Move forward in time
          const date = new Date(currentBlock.timestamp * 1000);
          date.setDate(date.getDate() + 92); //Set time to next quarter
          const dateValueInSeconds = Math.floor(date.valueOf() / 1000);
          await network.provider.send('evm_setNextBlockTimestamp', [dateValueInSeconds]);
          await network.provider.send('evm_mine');

          const vestingUser = vestingManager.connect(signers.user);
          let userBalance = await vestingUser.getUserBalance(signers.user.address);
          expect(userBalance.totalLocked).to.be.equal(parseUnits('14'));
          expect(userBalance.availableBalance).to.be.equal(parseUnits('6'));

          // Should be able to claim part of the tokens
          await expect(vestingUser.claim(signers.user.address)).to.emit(vestingManager, 'Withdraw').withArgs(signers.user.address, parseUnits('6'));

          userBalance = await vestingUser.getUserBalance(signers.user.address);
          expect(userBalance.totalLocked).to.be.equal(parseUnits('14'));
          return expect(userBalance.availableBalance).to.be.equal(parseUnits('0'));
        });
      });
    });
  });
});
