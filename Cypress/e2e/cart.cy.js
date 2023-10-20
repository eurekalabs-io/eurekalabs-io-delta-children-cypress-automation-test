/// <reference types="cypress" />
import BasePage from '../page-objects/BasePage';
import Header from '../page-objects/comoponents/header';


  it('visit the page', () => {
    cy.visit('https://www.deltachildren.com/')
    Header.clickMenu()
    Header.clickMenuCategory()
    Header.clickMenuSubCategory()
  });