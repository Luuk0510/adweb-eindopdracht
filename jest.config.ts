import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  dir: "./",
});

const config = {
  clearMocks: true,
  collectCoverageFrom: [
    "src/components/**/*.{ts,tsx}",
    "src/utils/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/components/household-books/detail/FinancialOverview.tsx",
  ],
  moduleNameMapper: {
    "^recharts$": "<rootDir>/src/tests/mocks/recharts.tsx",
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testEnvironment: "jest-environment-jsdom",
};

export default createJestConfig(config);
