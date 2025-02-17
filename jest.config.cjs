// jest.config.cjs
module.exports = {
  collectCoverageFrom: [
    "!benchmark/**/*",
    "!lab/**/*",
    "!docs/**/*",
    "!jest.config.cjs",
    "!coverage/**/*",
  ],
  moduleFileExtensions: ["js", "cjs"],
  testEnvironment: "node",
  testTimeout: 30000,
  testMatch: [
    "**/tests/**/*.test.cjs", // Matches any .test.cjs files under tests/
    "**/tests/**/*.test.js"    // Also match .test.js files if any
  ],
};
