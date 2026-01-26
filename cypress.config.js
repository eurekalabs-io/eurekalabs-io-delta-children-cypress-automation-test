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
      html: false,  // Solo generar JSON, el HTML se genera después
      json: true,
      timestamp: 'mmddyyyy_HHMMss',
      reportFilename: '[name]-report',
      charts: true,
      code: false,
      inline: true,
      saveJson: true  // Asegurar que se guarden los archivos JSON
    },
    setupNodeEvents(on, config) {
      // Add accessibility tasks
      addAccessibilityTasks(on);
      // Add image diff plugin (solo requiere 'on', no 'config')
      addMatchImageSnapshotPlugin(on);
      // Reduce memory usage by disabling video
      config.video = false;
      // Enable screenshots for accessibility tests (handled in test)
      config.screenshotOnRunFailure = true;
      return config;
    },
    baseUrl: 'https://www.deltachildren.com/',
    defaultCommandTimeout: 30000, // Aumentar timeout para verificaciones de accesibilidad
    chromeWebSecurity: false,
    projectId: 'ds6q9s',
    // Lower memory footprint by reducing concurrency and junk collector pressure
    numTestsKeptInMemory: 1,
    viewportWidth: 1728, // MacBook Pro 16" (viewport)
    viewportHeight: 1117,
    retries: { runMode: 2, openMode: 0 },
    env: {
      CYPRESS_INTERNAL_ENV: 'production',
      // Configuración de ambientes para comparación visual
      // Ambiente base (por defecto: producción)
      BASE_ENV_URL: process.env.BASE_ENV_URL || 'https://www.deltachildren.com/',
      // Ambiente a comparar (por defecto: staging o desarrollo)
      COMPARE_ENV_URL: process.env.COMPARE_ENV_URL || 'https://tyh68bklvgoqhgvq-52269121736.shopifypreview.com/',
      // Habilitar comparación entre ambientes (habilitado por defecto)
      ENABLE_ENV_COMPARISON: process.env.ENABLE_ENV_COMPARISON !== 'false',
      // Modo de comparación: 'create-base' para crear snapshots base, 'compare' para comparar
      ENV_COMPARISON_MODE: process.env.ENV_COMPARISON_MODE || 'compare'
    },
    // Optimize test execution
    requestTimeout: 30000,
    responseTimeout: 30000,
    pageLoadTimeout: 60000
  }
});

