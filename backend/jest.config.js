/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        module: 'commonjs',
        target: 'es2020',
        esModuleInterop: true,
        strict: false,
        strictNullChecks: false,
        exactOptionalPropertyTypes: false,
        noUncheckedIndexedAccess: false,
        skipLibCheck: true,
        ignoreDeprecations: '6.0',
      },
    }],
  },
  // Map the real db module to our manual mock
  moduleNameMapper: {
    '^.*/src/db$': '<rootDir>/src/__mocks__/db.ts',
    '^../db$': '<rootDir>/src/__mocks__/db.ts',
    '^./db$': '<rootDir>/src/__mocks__/db.ts',
  },
  clearMocks: true,
  verbose: true,
};
