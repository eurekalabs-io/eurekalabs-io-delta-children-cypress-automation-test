import BasePage from '../BasePage';
import Utils from '../../support/utils';

const submitBtn = 'button[type="submit"]';
const checkoutradioBtn = '.information-steps__form__payment__radio-button';
const cartNextBtn = '#cart_nextButton';

export default class CheckoutPage extends BasePage {
  static selectCity(province) {
    cy.get('#mui-component-select-province').click({ force: true });
    cy.get(`[data-value="${province}"]`).click({ force: true });
  }

  static inputEmail() {
    let name = Utils.RandomEmail();
    cy.get('#email').type(name, { force: true });
  }

  static inputPhone() {
    let number = Utils.RandomPhone();
    cy.get('#phone').type(number, { force: true });
  }

  static inputAddress(address) {
    cy.get('#address').type(address, { force: true });
  }

  static clickSubmit(label) {
    cy.get(submitBtn).contains(`${label}`).click({ force: true });
  }

  static selectCOD() {
    cy.get(checkoutradioBtn).eq(1).click({ force: true });
  }

  static selectCC() {
    cy.get(checkoutradioBtn).eq(0).click({ force: true });
  }

  static selectOneTimePurchase() {
    cy.get('.cart-item__subscribe-button').eq(0).click({ force: true });
  }

  static selectSubscription() {
    cy.get('.cart-item__subscribe-button').eq(1).click({ force: true });
  }

  static clickCartNextBtn() {
    cy.get(cartNextBtn).eq(0).click({ force: true });
  }
}
