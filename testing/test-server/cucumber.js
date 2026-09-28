const path = require('path');
const dotenv = require('dotenv');

// Load environment properties from local.env if present
dotenv.config({ path: path.resolve(__dirname, 'local.env') });

module.exports = {
  default: {
    paths: ['features/**/*.feature'],
    require: ['step-definitions/**/*.ts', 'support/**/*.ts'],
    requireModule: ['ts-node/register', 'tsconfig-paths/register'],
    format: [
      'summary',
      '@cucumber/pretty-formatter',
      'html:reports/cucumber-report.html',
      'json:reports/cucumber-report.json',
    ],
    formatOptions: {
      snippetInterface: 'async-await',
    },
    forceExit: true,
  },
};
