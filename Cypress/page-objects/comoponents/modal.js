import BasePage from "../BasePage";

export default class Modal extends BasePage {
  static closeModal() {

    cy.get('#email_01JBHJE18DJHA095HVX3S708J1').type('a@a.com');
    cy.get(':nth-child(5) > [data-testid="form-component"] > .needsclick').click();
    BasePage.pause(2000)
    cy.get(':nth-child(2) > div > div > div > div > div > button > svg').click();
    BasePage.pause(35000);
    cy.get('#email_01JBHGAA7HE7ZZ6SYW97K93QRJ').type('a@a.com');
    cy.get(':nth-child(5) > [data-testid="form-component"] > .needsclick').click({force:true});
    BasePage.pause(10000);
  }
}
