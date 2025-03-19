describe ('Accessibility Suite', () => {
    beforeEach(() => {
        cy.visit('https://www.deltachildren.com/');
    })
    it('Accessibility Test', () => {
        cy.checkAccessibility();
    })
})

