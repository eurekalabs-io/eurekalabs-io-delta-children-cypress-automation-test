const { defineConfig } = require("cypress");

// Import the accessibility tasks from wick-a11y plugin
const addAccessibilityTasks = require('wick-a11y/accessibility-tasks');

module.exports = defineConfig({
  e2e: {
    watchForFileChanges: false,
    supportFile: 'Cypress/support/e2e.js',
    specPattern: 'Cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    fixturesFolder: 'Cypress/fixtures',
    setupNodeEvents(on, config) {
         // Add accessibility tasks
      addAccessibilityTasks(on);
      // Reduce memory usage by disabling video/screenshots unless needed
      config.video = false;
      config.screenshotOnRunFailure = false;
      return config;
    },
    baseUrl: 'https://www.deltachildren.com/',
    defaultCommandTimeout: 20000,
    chromeWebSecurity: false,
    projectId: 'ds6q9s',
    // Lower memory footprint by reducing concurrency and junk collector pressure
    numTestsKeptInMemory: 1,
    viewportWidth: 1366,
    viewportHeight: 768,
    retries: { runMode: 2, openMode: 0 },
    experimentalMemoryManagement: true,
    // Chrome flags to limit GPU/renderer memory usage
    browser: 'chrome',
    env: {
      CYPRESS_INTERNAL_ENV: 'production'
    },
    // Optimize test execution
    requestTimeout: 30000,
    responseTimeout: 30000,
    pageLoadTimeout: 60000
  }
});

