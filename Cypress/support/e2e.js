// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './cypress-env-shim'
import './commands'
import { resetScenarioSteps, scenarioSteps } from './scenarioSteps'
// Guest checkout visit + optional Storefront cartCreate (skip Shop Pay).
import './shopifyCheckout'
import 'wick-a11y';

// Import cypress-image-diff commands
// Cypress can handle CommonJS modules with ES6 import syntax
const cypressImageDiff = require('cypress-image-diff/command');
const { addMatchImageSnapshotCommand, addCleanupDiffOutputCommand } = cypressImageDiff;

// Add cypress-image-diff commands
addMatchImageSnapshotCommand({
  failureThreshold: 0.2, // threshold for entire image (20%)
  failureThresholdType: 'percent', // percent of image or number of pixels
  customDiffConfig: { threshold: 0.1 }, // threshold for each pixel
  capture: 'fullPage' // capture full page in screenshot
});
addCleanupDiffOutputCommand();

// Hide TypeError and other uncaught exceptions so tests don't fail on app errors
Cypress.on("uncaught:exception", () => {
  return false;
});

// Hide fetch/XHR requests in the Command Log to reduce noise
const app = window.top;
if (app && app.document && !app.document.head.querySelector('[data-hide-command-log-request]')) {
  const style = app.document.createElement('style');
  style.innerHTML = '.command-name-request, .command-name-xhr, .command-name-fetch { display: none !important }';
  style.setAttribute('data-hide-command-log-request', '');
  app.document.head.appendChild(style);
}

const failedStepSlug = (message) => {
  const slug = String(message || 'before the first step')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 90);
  return slug || 'unknown-step';
};

const annotateFailure = (test) => {
  if (!test || test.state !== 'failed' || !test.err) return;
  if (String(test.err.message || '').includes('\nFailed at:')) return;

  const executed = scenarioSteps();
  const last = executed[executed.length - 1] || 'before the first step';
  const lines = executed.length
    ? executed.map((step, index) => `${index + 1}. ${step}`).join('\n')
    : '(no steps were recorded)';

  test.err.message = `${test.err.message}\n\nFailed at: ${last}\n\nSteps run:\n${lines}`;
};

beforeEach(() => {
  resetScenarioSteps();
  cy.stubStorefrontNoise();
});

// Global cleanup to release memory between tests
afterEach(function () {
  annotateFailure(this.currentTest);

  if (this.currentTest && this.currentTest.state === 'failed') {
    const last = scenarioSteps().slice(-1)[0] || 'before the first step';
    cy.screenshot(`failed-step--${failedStepSlug(last)}`, { capture: 'viewport' });
  }

  // Checkout specs must keep cart/checkout cookies until the next
  // beforeEach. Clearing here emptied the cart while checkout still ran.
  if (
    Cypress.spec.relative.includes('NurserySetCheckout') ||
    Cypress.spec.relative.includes('KidsBedroomSetCheckout') ||
    Cypress.spec.relative.includes('CribsCheckout') ||
    Cypress.spec.relative.includes('ShippingValidation')
  ) {
    cy.log(`Skipping cookie cleanup for ${Cypress.spec.name}`);
    return;
  }

  // Clear cookies/localStorage/sessionStorage for AUT
  cy.clearCookies({ domain: "https://www.deltachildren.com/" });
  cy.clearLocalStorage();
  // best-effort: clear indexedDB databases created by app
  cy.window({ log: false }).then((win) => {
    if (win.indexedDB && win.indexedDB.databases) {
      return win.indexedDB.databases().then((dbs) => {
        dbs.forEach((db) => {
          if (db && db.name) {
            try { win.indexedDB.deleteDatabase(db.name); } catch (e) { /* ignore */ }
          }
        });
      });
    }
  });
});