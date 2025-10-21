module.exports = {
  testTimeout: 180000,
  reporters: ['detox/runners/jest/reporter'],
  setupFilesAfterEnv: ['detox/runners/jest/setup'],
  testEnvironment: 'node'
};
