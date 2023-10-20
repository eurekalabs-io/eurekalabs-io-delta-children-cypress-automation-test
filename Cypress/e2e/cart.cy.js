/// <reference types="cypress" />
import BasePage from '../page-objects/BasePage';
import HomePage from '../page-objects/pages/HomePage';
import ProductsPage from '../page-objects/pages/ProductsPage';
import NavBar from '../page-objects/components/navbar';
import ProductDetailsPage from '../page-objects/pages/ProductDetailsPage';
import Header from '../page-objects/components/header';
import CartPage from '../page-objects/pages/CartPage';
import CheckoutPage from '../page-objects/pages/CheckoutPage';

describe.skip('Cart', () => {
    
    before(() => {
      HomePage.setMobileViewport();
    
    });
  
    it('visit the page', () => {
      cy.visit('/');
    });
});
