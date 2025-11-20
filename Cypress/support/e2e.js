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
import './commands'
import 'wick-a11y';
// Alternatively you can use CommonJS syntax:
// require('./commands')

// Hide TypeError and other uncaught exceptions so tests don't fail on app errors
Cypress.on("uncaught:exception", () => {
  return false;
});

// Hide fetch/XHR requests in the Command Log to reduce noise
const app = window.top;
if (app && app.document && !app.document.head.querySelector('[data-hide-command-log-request]')) {
  const style = app.document.createElement('style');
  style.innerHTML = '.command-name-request, .command-name-xhr { display: none }';
  style.setAttribute('data-hide-command-log-request', '');
  app.document.head.appendChild(style);
}

// Global cleanup to release memory between tests
afterEach(() => {
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