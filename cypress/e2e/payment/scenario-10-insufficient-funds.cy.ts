describe('Scenario 10: Neuspesno placanje zbog nedovoljnih sredstava', () => {
    it('prikazuje poruku i ne pokrece verifikaciju', () => {
        cy.loginAsClient();
        cy.visit('/client/payments/new');

        cy.contains('label', /primalac/i).parent().find('input').type('Ana Anic');
        cy.contains('label', /broj ra.una primaoca/i).parent().find('input').type('444000111222333444');
        cy.contains('label', /^iznos/i).parent().find('input').type('999999999');

        cy.contains('button', /nastavi/i).click();

        cy.contains(/nedovoljno sredstava na ra.unu/i).should('be.visible');
        cy.contains('h3', /verifikacija pla.anja/i).should('not.exist');
    });
});
