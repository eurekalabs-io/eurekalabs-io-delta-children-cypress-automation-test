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

      // Shopify Checkout Extensibility and bot protection flag Chromium when
      // --enable-automation / navigator.webdriver are present. Strip those
      // switches and disable AutomationControlled so guest checkout can load.
      // Use Chrome (not Electron): Electron cannot drop the automation signal.
      on('before:browser:launch', (browser = {}, launchOptions) => {
        if (browser.family === 'chromium') {
          launchOptions.args = (launchOptions.args || []).filter(
            (arg) =>
              arg !== '--enable-automation' &&
              !String(arg).includes('enable-automation')
          );
          launchOptions.args.push(
            '--disable-blink-features=AutomationControlled',
            '--disable-infobars',
            '--disable-dev-shm-usage',
            '--no-first-run',
            '--no-default-browser-check',
            '--lang=en-US'
          );

          if (browser.name !== 'electron') {
            launchOptions.preferences = launchOptions.preferences || {};
            launchOptions.preferences.excludeSwitches = ['enable-automation'];
            launchOptions.preferences.useAutomationExtension = false;
          }
        }
        return launchOptions;
      });

      // Debug dumps for checkout (JSON + console). Used when Complete order
      // is missing or Shopify shows "There was a problem with our checkout".
      on('task', {
        checkoutTrace(report) {
          const fs = require('fs');
          const path = require('path');
          const dir = path.join(__dirname, 'Cypress/reports');
          fs.mkdirSync(dir, { recursive: true });
          const file = path.join(dir, `checkout-trace-${Date.now()}.json`);
          fs.writeFileSync(file, JSON.stringify(report, null, 2));
          console.log('[checkout-trace]', file);
          console.log(JSON.stringify(report, null, 2));
          return file;
        },
      });

      // Reduce memory usage by disabling video
      config.video = false;
      // Enable screenshots for accessibility tests (handled in test)
      config.screenshotOnRunFailure = true;
      return config;
    },
    baseUrl: 'https://www.deltachildren.com/',
    // Realistic Chrome UA. Shopify / Cloudflare score HeadlessChrome and
    // "Cypress" user agents as automated card-testing traffic.
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.6778.140 Safari/537.36',
    // Default true: Cypress rewrites framebusting JS. That rewrite breaks
    // Shopify Checkout Extensibility and surfaces
    // "There was a problem with our checkout" with a Request ID.
    modifyObstructiveCode: false,
    defaultCommandTimeout: 30000, // Higher timeout for accessibility checks
    scrollBehavior: false, // Disable auto-scroll on interaction (less page movement in tests)
    chromeWebSecurity: false,
    projectId: 'ds6q9s',
    // Lower memory footprint by reducing concurrency and junk collector pressure
    numTestsKeptInMemory: 1,
    viewportWidth: 1728, // MacBook Pro 16" (viewport)
    viewportHeight: 1117,
    retries: { runMode: 2, openMode: 0 },
    // Cypress 16: use `expose` for non-sensitive values (replaces Cypress.env in the browser)
    expose: {
      CYPRESS_INTERNAL_ENV: 'production',
      BASE_ENV_URL: process.env.BASE_ENV_URL || 'https://www.deltachildren.com/',
      COMPARE_ENV_URL: process.env.COMPARE_ENV_URL || 'https://tyh68bklvgoqhgvq-52269121736.shopifypreview.com/',
      ENABLE_ENV_COMPARISON: process.env.ENABLE_ENV_COMPARISON !== 'false',
      ENV_COMPARISON_MODE: process.env.ENV_COMPARISON_MODE || 'compare',
      enableAccessibilityVoice: false,
      updateSnapshots: false,
      // Optional Storefront API cartCreate → checkoutUrl. Empty token falls
      // back to the Ajax cart cookie + /checkout?skip_shop_pay=true.
      SHOPIFY_STOREFRONT_API_VERSION: process.env.SHOPIFY_STOREFRONT_API_VERSION || '2024-10',
      SHOPIFY_STOREFRONT_DOMAIN:
        process.env.SHOPIFY_STOREFRONT_DOMAIN || 'www.deltachildren.com',
      SHOPIFY_STOREFRONT_ACCESS_TOKEN: process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN || '',
    },
    // Optimize test execution
    requestTimeout: 30000,
    responseTimeout: 30000,
    pageLoadTimeout: 90000,
    blockHosts: [
      '*.google-analytics.com',
      '*.googletagmanager.com',
      '*.facebook.net',
      '*.doubleclick.net',
      '*.hotjar.com',
      '*.clarity.ms',
    ]
  }
});

