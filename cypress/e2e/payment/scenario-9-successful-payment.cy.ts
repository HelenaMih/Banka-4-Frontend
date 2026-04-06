describe('Scenario 9: Uspesno placanje drugom klijentu', () => {
    it('izvrsava placanje i prikazuje potvrdu', () => {
        cy.loginAsClient();

        cy.intercept('POST', '**/clients/*/payments', {
            statusCode: 201,
            body: { id: 5011 },
        }).as('createPayment');

        cy.intercept('POST', '**/clients/*/payments/5011/verify', {
            statusCode: 200,
            body: { status: 'SUCCESS' },
        }).as('verifyPayment');

        cy.visit('/client/payments/new');

        cy.contains('label', /primalac/i).parent().find('input').type('Ana Anic');
        cy.contains('label', /broj ra.una primaoca/i).parent().find('input').type('444000111222333444');
        cy.contains('label', /^iznos/i).parent().find('input').type('1000');

        cy.contains('button', /nastavi/i).click();

        cy.wait('@createPayment').its('response.statusCode').should('eq', 201);
        cy.contains('h3', /verifikacija pla.anja/i).should('be.visible');

        cy.contains('label', /verifikacioni kod/i).parent().find('input').type('123456');
        cy.contains('button', /potvrdi pla.anje/i).click();

        cy.wait('@verifyPayment').its('response.statusCode').should('eq', 200);
        cy.contains(/nalog je uspe.no poslat/i).should('be.visible');
    });
});
