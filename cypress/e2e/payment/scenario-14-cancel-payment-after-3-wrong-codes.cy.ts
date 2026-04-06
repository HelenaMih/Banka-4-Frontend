describe('Scenario 14: Otkazivanje transakcije nakon tri pogresna koda', () => {
    it('nakon 3 pogresna koda prikazuje neuspesnu verifikaciju', () => {
        cy.loginAsClient();

        cy.intercept('POST', '**/clients/*/payments', {
            statusCode: 201,
            body: { id: 5514 },
        }).as('createPayment');

        let attempts = 0;
        cy.intercept('POST', '**/clients/*/payments/5514/verify', (req) => {
            attempts += 1;
            req.reply({
                statusCode: 400,
                body: { message: attempts >= 3 ? 'Neuspesna verifikacija nakon 3 pokusaja' : 'Pogresan kod' },
            });
        }).as('verifyPayment');

        cy.visit('/client/payments/new');

        cy.contains('label', /primalac/i).parent().find('input').type('Test Primaoc');
        cy.contains('label', /broj ra.una primaoca/i).parent().find('input').type('444000111222333444');
        cy.contains('label', /^iznos/i).parent().find('input').type('500');
        cy.contains('button', /nastavi/i).click();
        cy.wait('@createPayment');

        ['111111', '222222', '333333'].forEach((code) => {
            cy.contains('label', /verifikacioni kod/i).parent().find('input').clear().type(code);
            cy.contains('button', /potvrdi pla.anje/i).click();
            cy.wait('@verifyPayment');
            if (code !== '333333') {
                cy.contains(/pogre.an kod/i).should('be.visible');
                cy.contains('button', /nastavi/i).click();
            }
        });

        cy.contains(/neuspe.na verifikacija/i).should('be.visible');
    });
});
