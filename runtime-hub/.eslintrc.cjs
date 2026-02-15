module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  plugins: ['@typescript-eslint'],
  rules: {
    // B3 FIX: Enforce logging standards - prohibit console.log in production code
    // console.warn is allowed for critical security warnings (e.g., bind address 0.0.0.0)
    'no-console': ['error', { allow: ['warn', 'error'] }],
  },
  ignorePatterns: [
    'dist',
    'node_modules',
    '**/*.test.ts',
    '**/*.test.js',
  ],
};
