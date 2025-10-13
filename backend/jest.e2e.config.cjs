/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }]
  },
  testMatch: ['**/test/e2e.test.js'],
  maxWorkers: 1,
  testPathIgnorePatterns: ['/dist/', '/dist-cjs/']
};