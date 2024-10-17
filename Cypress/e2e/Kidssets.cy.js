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

// Data
const sets = require("../fixtures/KidsSets.json");

beforeEach(() => {
  cy.visit("https://www.deltachildren.com/");
    BasePage.pause(50000);
    Modal.closeModal();
});

it("select kids sets", () => {
  for (let i = 1; i <= 4; i++) {
    sets.forEach((data) => {
      NavBar.clickMenu();
      NavBar.clickMenuCategory(data.category);
      NavBar.clickMenuSubCategory(data.subcategory);
      //ProductsList.selectBundle(i);
      BasePage.pause(1000);
      ProductDetailsPage.selectVariants();
      ProductDetailsPage.bundleAddCart();
      BasePage.pause(5000);
    });
  }
});