describe('Scenario 34: Pregled kredita klijenta', () => {
    it('Klijent vidi listu svojih kredita sortiranu po ukupnom iznosu', () => {
        cy.loginAsClient();

        cy.intercept('GET', '**/clients/*/accounts*', {
            statusCode: 200,
            body: {
                data: [
                    { account_number: '265-1111111111111-11', name: 'Tekuci RSD', currency: 'RSD', balance: 200000 },
                ],
            },
        }).as('getAccounts');

        cy.intercept('GET', '**/clients/*/loans*', {
            statusCode: 200,
            body: {
                data: [
                    { id: 1, loan_type: 'AUTO', amount: 120000, currency: 'RSD', status: 'APPROVED', created_at: '2025-01-01T00:00:00Z' },
                    { id: 2, loan_type: 'MORTGAGE', amount: 500000, currency: 'RSD', status: 'APPROVED', created_at: '2025-01-02T00:00:00Z' },
                    { id: 3, loan_type: 'CASH', amount: 300000, currency: 'RSD', status: 'PENDING', created_at: '2025-01-03T00:00:00Z' },
                ],
            },
        }).as('getLoans');

        cy.visit('/client/loans');
        cy.wait('@getLoans');
        cy.wait('@getAccounts');

        // UI koristi kartice, ne tabelu; redosled mora biti po iznosu opadajuce.
        cy.get('.ll-card').should('have.length.at.least', 3);
        cy.get('.ll-card').eq(0).should('contain.text', '500.000,00 RSD');
        cy.get('.ll-card').eq(1).should('contain.text', '300.000,00 RSD');
        cy.get('.ll-card').eq(2).should('contain.text', '120.000,00 RSD');

    });
});