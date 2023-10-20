export default class MyAccount {
  static accordion = '.MuiCollapse-root.MuiCollapse-entered';
  static actualDate = '.box__content__grey-section__header__status__shipping';

  static clickAccordion() {
    cy.get(this.accordion).click({ force: true });
  }

  static clickOneTimeOrders() {
    cy.contains('a', 'One-time orders').then(($el) => {
      cy.get($el).click({ force: true });
    });
  }

  static clickPaymentDetails() {
    cy.contains('a', 'Payment details').then(($el) => {
      cy.get($el).click({ force: true });
    });
  }
}
