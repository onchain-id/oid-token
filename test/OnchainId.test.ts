import { expect } from 'chai';
import { artifacts, ethers, waffle } from 'hardhat';

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import { OnchainId } from '../types/OnchainId';
import { Signers } from './types';

import type { Artifact } from 'hardhat/types';
describe('Unit tests', function () {
  before(async function () {
    this.signers = {} as Signers;

    const signers: SignerWithAddress[] = await ethers.getSigners();
    this.signers.admin = signers[0];
  });

  describe('OnchainId', function () {
    beforeEach(async function () {
      const onchainIdArtifact: Artifact = await artifacts.readArtifact('OnchainId');
      this.onchainId = <OnchainId>await waffle.deployContract(this.signers.admin, onchainIdArtifact, [1000]);
    });

    it('should deploy the contract without errors', async function () {
      expect(await this.onchainId.connect(this.signers.admin).totalSupply()).to.equal(1000);
    });
  });
});
