/// <reference types="cypress" />
Cypress.on('uncaught:exception', () => { return false })

import BasePage from '../page-objects/BasePage';
import Header from '../page-objects/comoponents/header';


  it('visit the page', () => {
    let countOfElements = 0
    cy.visit('https://www.deltachildren.com/')
    Header.clickMenu()
    Header.clickMenuCategory('Nursery')
    Header.clickMenuSubCategory('Nursery Sets')
    Header.selectFirstBundle()
    BasePage.pause(1000)
    cy.get('div.cb-bundle-layout__left > div.section-slider > div > div:nth-child(1) >').then($elements => {
    countOfElements = $elements.length;
    for (let cuenta = 1; cuenta <= countOfElements; cuenta++) {
      cy.get(`.components-section > :nth-child(1) > :nth-child(${cuenta}) > .cb-product-list-item-content`).click()
      cy.get('.components-section > :nth-child(1) > .cb-customizer-wrapper > .cb-customizer > .cb-customizer-footer > .v2-button--primary').click()
      Header.pause(1000)
    }
  });
    cy.get('.cb-bundle-layout__left > .cb-cart > .cb-tooltip-wrapper > #bundle-add-to-cart').click()
    cy.get(':nth-child(1) > .cb-addons-variant > :nth-child(4) > .v2-button').click()
    cy.get('.cb-addons-header__section-right > .d-flex > .v2-button').click()
  });