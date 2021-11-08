import { task } from 'hardhat/config';
import { TaskArguments } from 'hardhat/types';
import { OnchainId, OnchainId__factory } from '../../types';

task('deploy:OnchainId')
  .addParam('initialSupply', '10000000000000000')
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const onchainIdFactory: OnchainId__factory = await ethers.getContractFactory('OnchainId');
    const onchainId: OnchainId = <OnchainId>await onchainIdFactory.deploy(taskArguments.initialSupply);
    await onchainId.deployed();
    console.log('OnchainId deployed to: ', onchainId.address);
  });
