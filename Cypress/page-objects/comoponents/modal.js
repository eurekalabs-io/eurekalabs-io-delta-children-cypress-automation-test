import BasePage from "../BasePage";

export default class Modal extends BasePage {
  static closeModal() {
    BasePage.pause(35000);
    cy.get('#email_01JBHGAA7HE7ZZ6SYW97K93QRJ').type('a@a.com');
    cy.get(':nth-child(5) > [data-testid="form-component"] > .needsclick').click({force:true});
    BasePage.pause(10000);
  }
}
