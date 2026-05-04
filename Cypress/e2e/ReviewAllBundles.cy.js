/// <reference types="cypress" />

import ProductsList from '../page-objects/pages/ProductsList.js';

const sets = require('../fixtures/NurserySets.json');
const BUNDLES_URL = 'https://deltachildrenstore.myshopify.com/pages/bundles';

describe('Review All Bundles — PLP swatches y variantes', () => {
  beforeEach(() => {
    cy.log('Abriendo landing de bundles y creando un set (Shopify preview)');
    cy.visit(BUNDLES_URL);
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
        cy.log(`Botón "Create your set" (${randomIndex + 1} de ${buttons.length})`);
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
        cy.log(`Botón alternativo de set/bundle (${randomIndex + 1} de ${buttons.length})`);
      } else {
        cy.wait(2000);
        cy.url().then((url) => {
          if (!url.includes('/products/')) {
            cy.log('No se encontró botón de creación de set; la página puede cargar con retraso');
          }
        });
      }
    });
  });

  afterEach(() => {
    cy.hardCleanup();
  });

  sets.forEach((data, index) => {
    it(`debe permitir cambiar variante vía swatches en cada producto de la PLP del bundle — ${data.category} / ${data.subcategory}`, function () {
      this.test.title =
        `Review All Bundles PLP — ${data.category} / ${data.subcategory}: swatches por producto en la lista`;

      cy.log(`Caso ${index + 1} de ${sets.length}: ${data.category} — ${data.subcategory}`);

      cy.url({ timeout: 45000 }).should('include', '/products/');

      cy.get('.components-section', { timeout: 30000 }).should('exist').and('be.visible');

      ProductsList.validateBundlePlSwatches();
    });
  });
});
