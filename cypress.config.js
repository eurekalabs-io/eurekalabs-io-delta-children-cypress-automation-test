const { defineConfig } = require("cypress");

// Import the accessibility tasks from wick-a11y plugin
const addAccessibilityTasks = require('wick-a11y/accessibility-tasks');
// Import cypress-image-diff plugin
const { addMatchImageSnapshotPlugin } = require('cypress-image-diff/plugin');

module.exports = defineConfig({
  e2e: {
    watchForFileChanges: false,
    supportFile: 'Cypress/support/e2e.js',
    specPattern: 'Cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    fixturesFolder: 'Cypress/fixtures',
    // Configure HTML reporter
    reporter: 'mochawesome',
    reporterOptions: {
      reportDir: 'Cypress/reports',
      overwrite: false,
      html: false,  // JSON only; HTML is generated separately
      json: true,
      timestamp: 'mmddyyyy_HHMMss',
      reportFilename: '[name]-report',
      charts: true,
      code: false,
      inline: true,
      saveJson: true  // Persist JSON report files
    },
    setupNodeEvents(on, config) {
      // Add accessibility tasks
      addAccessibilityTasks(on);
      // Add image diff plugin (only needs 'on', not 'config')
      addMatchImageSnapshotPlugin(on);
      // Reduce memory usage by disabling video
      config.video = false;
      // Enable screenshots for accessibility tests (handled in test)
      config.screenshotOnRunFailure = true;
      return config;
    },
    baseUrl: 'https://www.deltachildren.com/',
    defaultCommandTimeout: 30000, // Higher timeout for accessibility checks
    scrollBehavior: false, // Disable auto-scroll on interaction (less page movement in tests)
    chromeWebSecurity: false,
    projectId: 'ds6q9s',
    // Lower memory footprint by reducing concurrency and junk collector pressure
    numTestsKeptInMemory: 1,
    viewportWidth: 1728, // MacBook Pro 16" (viewport)
    viewportHeight: 1117,
    retries: { runMode: 2, openMode: 0 },
    env: {
      CYPRESS_INTERNAL_ENV: 'production',
      // Visual comparison environment settings
      // Base environment (default: production)
      BASE_ENV_URL: process.env.BASE_ENV_URL || 'https://www.deltachildren.com/',
      // Environment to compare (default: staging / preview)
      COMPARE_ENV_URL: process.env.COMPARE_ENV_URL || 'https://tyh68bklvgoqhgvq-52269121736.shopifypreview.com/',
      // Enable cross-environment comparison (on by default)
      ENABLE_ENV_COMPARISON: process.env.ENABLE_ENV_COMPARISON !== 'false',
      // Comparison mode: 'create-base' to seed base snapshots, 'compare' to diff against base
      ENV_COMPARISON_MODE: process.env.ENV_COMPARISON_MODE || 'compare'
    },
    // Optimize test execution
    requestTimeout: 30000,
    responseTimeout: 30000,
    pageLoadTimeout: 60000
  }
});

