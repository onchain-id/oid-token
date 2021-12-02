import { VestingManager } from '../types/VestingManager';

import type { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
import type { Fixture } from 'ethereum-waffle';

import type { OnchainId } from '../types/OnchainId';

declare module 'mocha' {
  export interface Context {
    onchainId: OnchainId;
    vestingManager: VestingManager;
    loadFixture: <T>(fixture: Fixture<T>) => Promise<T>;
    signers: Signers;
  }
}

export interface Signers {
  admin: SignerWithAddress;
  user: SignerWithAddress;
}
