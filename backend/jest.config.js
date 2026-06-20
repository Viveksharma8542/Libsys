module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/'],
  collectCoverageFrom: ['src/**/*.js'],
  coverageDirectory: 'coverage',
};
