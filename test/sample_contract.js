const truffleAssert = require('truffle-assertions');

const SampleContract = artifacts.require('SampleContract');

contract('SampleContract', (accounts) => {
  let instance;
  beforeEach('should setup the contract instance', async () => {
    instance = await SampleContract.deployed();
  });

  it('should return the name', async () => {
    const name = await instance.getName();

    assert.equal(name, 'my name');
  });

  it('should return change the name', async () => {
    await instance.changeName('your name');
    const name = await instance.getName();

    assert.equal(name, 'your name');
  });

  it('should fail executing by a different non owner user', async () => {
    await truffleAssert.reverts(
      instance.changeName('modifier', {
        from: accounts[1],
      }),
    );
  });

  it('should check the type of the event', async () => {
    const result = await instance.changeName('hello event');
    truffleAssert.eventEmitted(result, 'NameEvent');
  });

  it('should emit with correct parameters', async () => {
    const result = await instance.changeName('hello event');
    truffleAssert.eventEmitted(result, 'NameEvent', (event) => event.evPram === 'hello event');
  });

  it('should print the event parameters', async()=>{
    const result = await instance.changeName('hello event');
    truffleAssert.prettyPrintEmittedEvents(result);
  });
});
