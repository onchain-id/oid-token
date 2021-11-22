import { task } from 'hardhat/config';
import { TaskArguments } from 'hardhat/types';

import { VestingManager, VestingManager__factory } from '../../types';

task('deploy:VestingManager')
  .addParam('oidToken', 'OID token address')
  .setAction(async (taskArguments: TaskArguments, { ethers }) => {
    const vestingManagerFactory: VestingManager__factory = await ethers.getContractFactory('VestingManager');
    const vestingManager: VestingManager = <VestingManager>await vestingManagerFactory.deploy(taskArguments.oidToken);
    await vestingManager.deployed();
    console.log('VestingManager deployed to: ', vestingManager.address);
  });
