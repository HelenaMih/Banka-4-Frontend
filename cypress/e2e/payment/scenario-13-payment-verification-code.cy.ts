describe('Scenario 13: Placanje uz verifikacioni kod', () => {
    it('potvrdjuje transakciju validnim 2FA kodom', () => {
        cy.loginAsClient();

        cy.intercept('GET', '**/clients/*/accounts*', {
            statusCode: 200,
            body: {
                data: [
                    {
                        account_number: '265-1111111111111-11',
                        name: 'Tekuci RSD',
                        currency: 'RSD',
                        balance: 100000,
                        daily_limit: 50000,
                    },
                ],
            },
        }).as('getAccounts');

        cy.intercept('GET', '**/payees*', {
            statusCode: 200,
            body: { data: [] },
        }).as('getPayees');

        cy.intercept('POST', '**/clients/*/payments', {
            statusCode: 201,
            body: { id: 5513 },
        }).as('createPayment');

        cy.intercept('POST', '**/clients/*/payments/5513/verify', {
            statusCode: 200,
            body: { status: 'SUCCESS' },
        }).as('verifyPayment');

        cy.visit('/client/payments/new');
        cy.wait('@getAccounts');
        cy.wait('@getPayees');

        cy.contains('label', /ra.un platioca/i)
            .parent()
            .find('select')
            .select('265-1111111111111-11');

        cy.contains('label', /primalac/i).parent().find('input').type('Test Primaoc');
        cy.contains('label', /broj ra.una primaoca/i).parent().find('input').type('444000111222333444');
        cy.contains('label', /^iznos/i).parent().find('input').type('500');
        cy.contains('button', /nastavi/i).click();

        cy.wait('@createPayment');
        cy.contains('h3', /verifikacija pla.anja/i).should('be.visible');

        cy.get('input[placeholder="000000"], input[maxlength="6"]').first().type('654321');
        cy.contains('button', /potvrdi pla.anje/i).click({ force: true });

        cy.wait('@verifyPayment').its('response.statusCode').should('eq', 200);
        cy.contains(/nalog je uspe.no poslat/i).should('be.visible');
    });
});
