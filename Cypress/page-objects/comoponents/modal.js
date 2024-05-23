import BasePage from "../BasePage";

export default class Modal extends BasePage {
  static closeModal() {
    cy.get('#email_70385909').type('a@a.com');
    cy.get(':nth-child(5) > [data-testid="form-component"] > .needsclick').click();
    BasePage.pause(2000)
    cy.get(':nth-child(2) > div > div > div > div > div > button > svg').click();
  }
}
//cy.get('#delta-children > div> div > div > div > div > div > div > button > svg > circle').click({force:true});
