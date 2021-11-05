const OnchainId = artifacts.require('OnchainId');
const VestingManager = artifacts.require('VestingManager');

module.exports = async function (deployer, network, accounts) {
  // deployment steps
  await deployer.deploy(OnchainId);
  await deployer.deploy(VestingManager);
};
