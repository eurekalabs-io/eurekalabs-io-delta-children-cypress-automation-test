import BasePage from "../BasePage";

export default class Modal extends BasePage {
  static closeModal() {
    // Handle first email subscription modal
    cy.get('body').then(($body) => {
      if ($body.find('#email_01K2MXJH0G03GZGSJP007CN95E').length > 0) {
        cy.get('#email_01K2MXJH0G03GZGSJP007CN95E').type('a@a.com');
        cy.get(':nth-child(5) > [data-testid="form-component"] > .needsclick').click();
        cy.get('button[data-testid="close-button"], .modal-close, button svg').first().click({ force: true });
      }
    });

    /*/ Handle second email subscription modal if it appears
    cy.get('body').then(($body) => {
      if ($body.find('#email_01JBHGAA7HE7ZZ6SYW97K93QRJ').length > 0) {
        cy.get('#email_01JBHGAA7HE7ZZ6SYW97K93QRJ').type('a@a.com');
        cy.get(':nth-child(5) > [data-testid="form-component"] > .needsclick').click({ force: true });
      }
    }); */

    // Wait for any modals to close and verify page is ready
   // cy.get('.modal', { timeout: 5000 }).should('not.exist');
  }
}
