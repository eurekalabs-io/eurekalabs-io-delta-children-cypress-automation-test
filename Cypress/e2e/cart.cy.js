describe.skip('Cart CC', () => {
    
    before(() => {
      Utils.clearUserFile();
      Utils.CreateRandomUser();
      HomePage.setMobileViewport();
    
    });
  
    it('User purchase three products ONE-TIME with CC', () => {
      cy.visit('/');
    });
});
