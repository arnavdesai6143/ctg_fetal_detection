module.exports = {
    testEnvironment: 'node',
    testTimeout: 10000,
    verbose: true,
    collectCoverageFrom: [
        'routes/**/*.js',
        'database/**/*.js',
        '!**/node_modules/**',
    ],
    coverageThreshold: {
        global: {
            branches: 50,
            functions: 50,
            lines: 50,
            statements: 50,
        },
    },
};
