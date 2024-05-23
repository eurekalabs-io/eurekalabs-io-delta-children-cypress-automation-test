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

it("select Crib collections variant Best Sellers", () => {

  cy.get('ul.swatches__list').each(($el, index, $list) => {
    // Este es el UL 
    if($el.children().length>1){  
    //Si el UL tiene mas de un hijo (color) selecciona el segundo de la paleta de colores. 
     cy.log($el, index);
     cy.get($el).find('li:nth-child(2)').click({force: true});
     
    }
  })
});

/*it("select Crib collections variant Exclusively at Target", () => {
  for (let i = 1; i <= 29; i++) {
    sets.forEach((data) => {
      BasePage.pause(10000);
     ProductsListCribsExclusivelyTarget.selectCribsExclusivelyTarget(i);
      //BasePage.pause(10000);
    });
  }
});*/
