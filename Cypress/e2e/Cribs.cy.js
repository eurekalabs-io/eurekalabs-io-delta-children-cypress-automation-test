/// <reference types="cypress" />

// Hide TypeError
Cypress.on("uncaught:exception", () => {
  return false;
});

// Hide fetch/XHR requests
const app = window.top;
if (!app.document.head.querySelector("[data-hide-command-log-request]")) {
  const style = app.document.createElement("style");
  style.innerHTML =
    ".command-name-request, .command-name-xhr { display: none }";
  style.setAttribute("data-hide-command-log-request", "");
  app.document.head.appendChild(style);
}

// Imports
import BasePage from "../page-objects/BasePage";
import Modal from "../page-objects/comoponents/modal";
import NavBar from "../page-objects/comoponents/navbar";
import CartPage from "../page-objects/pages/CartPage";
import ProductDetailsPage from "../page-objects/pages/ProductDetailsPage";
import ProductsList from "../page-objects/pages/ProductsList";
import ProductsListCribsBestSellers from "../page-objects/pages/ProductsListCribsBestSellers";
import ProductsListCribs from "../page-objects/pages/ProductsListCribsBestSellers";
import ProductsListCribsExclusivelyTarget from "../page-objects/pages/ProductsListCribsExclusivelyTarget";

// Data
const sets = require("../fixtures/Cribs.json");

beforeEach(() => {
  cy.visit("https://www.deltachildren.com/collections/cribs");
    BasePage.pause(100);
});

it("Select Crib PDP seconds variant", () => {
  cy.get('a.product__title.product__item-title').each(($element,indexs,$list) => {
    console.log(`ELEMENT:${indexs}`, $element);
        cy.get(`div:nth-child(2) > div:nth-child(${indexs+1}) > div.product__item.mb4.old-crib-mobile-layout > div > div.col-12.col-md-7.col-xl-8.product__item-title-wrap.product__item-title-restyle > a`).click({force: true});
     if(cy.get('ul.swatches__list').should('be.visible'))
     { 
        cy.xpath(`//*[@id="shopify-section-product-main"]/div[1]/div[4]/div[1]/div/div[2]/ul/li[2]/span/img`).wait(1000);
        cy.xpath(`//*[@id="shopify-section-product-main"]/div[1]/div[4]/div[1]/div/div[2]/ul/li[2]`).click({force: true});
        cy.go('back');
      }
      else {cy.go('back');
      }}
  )
});

it("select Crib collections variants", () => {

  cy.get('ul.swatches__list').each(($el, index, $list) => {
       if($el.children().length>1){  
    //If the UL has more than one child (color), select the second one from the color palette. 
     cy.log($el, index);
     cy.get($el).find('li:nth-child(2)').click({force: true});
     cy.get($el).wait(1000);
         
    }
  })
});