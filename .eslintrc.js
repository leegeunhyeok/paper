module.exports = {
  'env': {
    'browser': true,
    'commonjs': true,
    'es6': true,
    'node': true
  },
  'ignorePatterns': ['**/*.min.js'],
  'extends': 'eslint:recommended',
  'globals': {
    '$': 'readonly',
    'updateTheme': 'readonly',
    'disableZoom': 'readonly',
    'urlB64ToUint8Array': 'readonly',
    'app': 'readonly',
    'util': 'readonly',
    'axios': 'readonly',
    'PaperStore': 'readonly',
    'importScripts': 'readonly'
  },
  'parserOptions': {
    'ecmaVersion': 2015
  },
  'rules': {
    'semi': ['error', 'always', {'omitLastInOneLineBlock': true}],
    'no-trailing-spaces': 'error',
    'quotes': ['error', 'single'],
    'comma-dangle': ['error', 'never'],
    'arrow-parens': ['error', 'always'],
    'no-unused-vars': 'off',
  }
};
