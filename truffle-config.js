const solcStable = {
  version: '^0.8.0',
  settings: {
    optimizer: {
      enabled: true,
      runs: 200,
    },
  },
};

module.exports = {
  networks: {
    development: {
      host: 'localhost',
      network_id: '*',
      port: 8545,
      gas: 4600000,
      gasPrice: 0x01,
    },
  },

  compilers: {
    solc: solcStable,
  },
  mocha: {
    reporter: 'eth-gas-reporter',
    reporterOptions: { outputFile: './gas-report' },
  },
  plugins: ['solidity-coverage'],
};
