// cypress/e2e/kt2/scenario-11-nonexistent-recipient-account.cy.ts
describe('Scenario 11: Neuspešno plaćanje zbog nepostojećeg računa', () => {
    it('prikazuje poruku, ostaje na Novo plaćanje i prazni polje računa primaoca', () => {
        cy.loginAsClient();

        cy.intercept('GET', '**/clients/*/accounts*', {
            statusCode: 200,
            body: {
                data: [
                    {
                        account_number: '265-1111111111111-11',
                        name: 'Tekuci RSD',
                        currency: 'RSD',
                        balance: 10000,
                    },
                ],
            },
        }).as('getAccounts');

        cy.intercept('GET', '**/payees*', {
            statusCode: 200,
            body: { data: [] },
        }).as('getPayees');

        cy.intercept('POST', '**/clients/*/payments', {
            statusCode: 404,
            body: { message: 'recipient account not found' },
        }).as('createPayment');

        cy.visit('/client/payments/new');
        cy.wait('@getAccounts');
        cy.wait('@getPayees');
        cy.location('pathname').should('eq', '/client/payments/new');

        const nonexistent = '999000000000000000'; // 18 cifara, ali ne postoji u sistemu

        cy.contains('label', /^primalac$/i)
            .parent()
            .find('input')
            .clear()
            .type('Mila');

        // Unos broja računa primaoca
        cy.contains('label', /broj računa primaoca/i)
            .parent()
            .find('input')
            .as('recipientAccountInput');

        cy.get('@recipientAccountInput').clear().type(nonexistent);

        cy.get('input[type="number"]').first().clear().type('1');


        // Klik "Potvrdi" (kod vas je submit dugme sa strelicom)
        cy.get('form').first().within(() => {
            cy.get('button[type="submit"]').click();
        });

                cy.wait('@createPayment').its('response.statusCode').should('eq', 404);

                cy.contains('Uneti račun ne postoji.', { timeout: 20000 }).should('be.visible');

                cy.location('pathname').should('eq', '/client/payments/new');

                cy.get('@recipientAccountInput').should('have.value', '');
    });
});