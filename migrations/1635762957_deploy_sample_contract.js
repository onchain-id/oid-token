const SampleContract = artifacts.require('SampleContract');

module.exports = function (deployer) {
  // Use deployer to state migration tasks.
  deployer.deploy(SampleContract);
};
