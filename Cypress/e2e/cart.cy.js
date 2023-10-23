/// <reference types="cypress" />

// Hide TypeError
Cypress.on('uncaught:exception', () => { return false })

// Hide fetch/XHR requests
const app = window.top;
if (!app.document.head.querySelector('[data-hide-command-log-request]')) {
  const style = app.document.createElement('style');
  style.innerHTML =
    '.command-name-request, .command-name-xhr { display: none }';
  style.setAttribute('data-hide-command-log-request', '');
  app.document.head.appendChild(style);
}

// Imports
import BasePage from '../page-objects/BasePage';
import NavBar from '../page-objects/comoponents/navbar';
import CartPage from '../page-objects/pages /CartPage';
import ProductDetailsPage from '../page-objects/pages /ProductDetailsPage';
import ProductsList from '../page-objects/pages /ProductsList';


  it('visit the page', () => {
    cy.visit('https://www.deltachildren.com/')
    NavBar.clickMenu()
    NavBar.clickMenuCategory('Nursery')
    NavBar.clickMenuSubCategory('Nursery Sets')
    ProductsList.selectFirstBundle()
    BasePage.pause(1000)
    ProductDetailsPage.selectVariants()
    ProductDetailsPage.bundleAddCart()
    CartPage.selectAddOns()
    CartPage.proceedToCart()
  });