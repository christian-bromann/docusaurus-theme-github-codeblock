module.exports = {
    testEnvironment: 'node',
    collectCoverage: true,
    testMatch: ['<rootDir>/tests/**/*.test.ts'],
    transform: {
        '^.+\\.(ts|js|tsx)$': 'ts-jest'
    },
    coverageThreshold: {
		global: {
			branches: 51,
			functions: 36,
			lines: 60,
			statements: 60
		}
    }
};
