module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/setupTests.ts"],
  moduleNameMapping: {
    "^@/(.*)$": "<rootDir>/client/$1",
    "^@shared/(.*)$": "<rootDir>/shared/$1",
  },
  testMatch: [
    "<rootDir>/client/**/__tests__/**/*.{js,jsx,ts,tsx}",
    "<rootDir>/client/**/*.(test|spec).{js,jsx,ts,tsx}",
  ],
  collectCoverageFrom: [
    "client/**/*.{js,jsx,ts,tsx}",
    "!client/**/*.d.ts",
    "!client/main.tsx",
    "!client/vite-env.d.ts",
  ],
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
  rootDir: ".",
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
};
