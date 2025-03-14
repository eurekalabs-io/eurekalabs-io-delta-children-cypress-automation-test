const { defineConfig } = require("cypress");

// Import the accessibility tasks from wick-a11y plugin
const addAccessibilityTasks = require('wick-a11y/accessibility-tasks');

module.exports = defineConfig({
  e2e: {
    watchForFileChanges: false,
    setupNodeEvents(on, config) {
         // Add accessibility tasks
      addAccessibilityTasks(on);
    },
    baseUrl: 'https://www.deltachildren.com/'
    },
    defaultCommandTimeout: 15000,
    chromeWebSecurity: false,
    projectId: 'ds6q9s',
});

