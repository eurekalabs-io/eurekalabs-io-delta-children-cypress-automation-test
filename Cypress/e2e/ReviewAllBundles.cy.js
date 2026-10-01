/// <reference types="cypress" />

import ProductsList from '../page-objects/pages/ProductsList.js';

const sets = require('../fixtures/NurserySets.json');
const BUNDLES_PATH = '/pages/bundles';
const MAX_VISIT_ATTEMPTS = 4;

/**
 * Shopify answers 429 on the *.myshopify.com hostname from CI. Visit the public
 * storefront (baseUrl) and, if the edge still rate-limits, back off and retry
 * before the beforeEach fails and skips the rest of the suite.
 */
const openBundlesPage = (attempt = 1) => {
  return cy.visit(BUNDLES_PATH, { failOnStatusCode: false }).then(() => {
    return cy.window().then((win) => {
      const entry = win.performance.getEntriesByType('navigation')[0];
      const status = entry && entry.responseStatus;
      const bodyText = (win.document.body && win.document.body.innerText) || '';
      const rateLimited = status === 429 || /too many requests/i.test(bodyText);

      if (rateLimited && attempt < MAX_VISIT_ATTEMPTS) {
        const pauseMs = attempt * 5000;
        cy.log(`Bundles page rate limited (HTTP ${status || 429}). Retry ${attempt + 1} of ${MAX_VISIT_ATTEMPTS} in ${pauseMs}ms`);
        return cy.wait(pauseMs).then(() => openBundlesPage(attempt + 1));
      }

      expect(rateLimited, 'Shopify rate limit on /pages/bundles').to.eq(false);
      if (status) {
        expect(status, 'bundles page HTTP status').to.be.within(200, 399);
      }
    });
  });
};

/**
 * Validates that on the bundle builder product list (PLP slider), each item with multiple
 * swatches allows selecting another variant and reflects the change (image or swatch UI).
 */
describe('Bundle builder PLP — swatch and variant selection per product', () => {
  beforeEach(() => {
    cy.log('Opening bundles landing page and starting a set');
    openBundlesPage();
    cy.acceptCookieBannerIfPresent();
    cy.scrollTo(0, 0);
    cy.window().then((win) => win.scrollTo(0, 0));

    cy.get('body', { timeout: 30000 }).should('exist');

    cy.get('body').then(($body) => {
      const buttonsByClass = $body.find('a.js-create-set-button, button.js-create-set-button');

      if (buttonsByClass.length > 0) {
        const buttons = buttonsByClass.toArray();
        const randomIndex = Math.floor(Math.random() * buttons.length);
        cy.wrap(buttons[randomIndex]).click({ force: true });
        cy.log(`"Create your set" button clicked (${randomIndex + 1} of ${buttons.length})`);
        return;
      }

      const $allButtons = $body.find('a, button').filter((i, el) => {
        const text = Cypress.$(el).text().toLowerCase();
        return text.includes('create') || text.includes('set') || text.includes('bundle');
      });

      if ($allButtons.length > 0) {
        const buttons = $allButtons.toArray();
        const randomIndex = Math.floor(Math.random() * buttons.length);
        cy.wrap(buttons[randomIndex]).click({ force: true });
        cy.log(`Fallback set/bundle button clicked (${randomIndex + 1} of ${buttons.length})`);
      } else {
        cy.wait(2000);
        cy.url().then((url) => {
          if (!url.includes('/products/')) {
            cy.log('No set-creation button found; page may still be loading');
          }
        });
      }
    });
  });

  afterEach(() => {
    cy.hardCleanup();
  });

  sets.forEach((data, index) => {
    it(`should change variants via swatches for each bundle PLP product — ${data.category} / ${data.subcategory}`, function () {
      this.test.title =
        `Bundle PLP — ${data.category} / ${data.subcategory}: validate swatch selection and variant updates on the builder list`;

      cy.log(`Fixture ${index + 1} of ${sets.length}: ${data.category} — ${data.subcategory}`);

      cy.url({ timeout: 45000 }).should('include', '/products/');

      cy.get('.components-section', { timeout: 30000 }).should('exist').and('be.visible');

      ProductsList.validateBundlePlSwatches();
    });
  });
});
