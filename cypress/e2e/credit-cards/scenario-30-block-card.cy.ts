describe('Scenario 30: Blokiranje kartice od strane klijenta', () => {
    it('uloguje se kao Ana, pronalazi aktivnu karticu i blokira je', () => {
        cy.loginAsClientAna();

        cy.intercept('GET', '**/clients/*/accounts*', {
            statusCode: 200,
            body: {
                data: [
                    { account_number: '265-1234567890123-45', name: 'Tekuci', currency: 'RSD' },
                ],
            },
        }).as('getAccounts');

        cy.intercept('GET', '**/clients/*/accounts/265-1234567890123-45/cards*', {
            statusCode: 200,
            body: {
                data: [
                    {
                        id: 7001,
                        card_number: '4000123412341234',
                        card_type: 'DEBIT',
                        status: 'ACTIVE',
                        expiration_date: '2028-08-01T00:00:00Z',
                    },
                ],
            },
        }).as('getCards');

        cy.intercept('PUT', '**/cards/7001/block', {
            statusCode: 200,
            body: { message: 'Kartica je blokirana' },
        }).as('blockCard');

        cy.visit('/client/cards');
        cy.wait('@getAccounts');
        cy.wait('@getCards');
        cy.location('pathname').should('include', '/cards');

        cy.contains('button', /blokiraj karticu/i, { timeout: 10000 })
            .should('be.visible')
            .click({ force: true });

        cy.wait('@blockCard').its('response.statusCode').should('eq', 200);
        cy.contains(/uspešno izvr.ena|blokiraj|blokirana/i, { timeout: 10000 }).should('be.visible');
    });
});