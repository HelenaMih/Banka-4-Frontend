describe('Scenario 34: Pregled kredita klijenta sa sortiranjem', () => {
    it('prikazuje kredite sortirane po iznosu opadajuce', () => {
        cy.loginAsClient();

        cy.intercept('GET', '**/clients/*/loans*', {
            statusCode: 200,
            body: {
                data: [
                    { id: 1, loan_type: 'AUTO', amount: 120000, currency: 'RSD', status: 'APPROVED', created_at: '2025-01-01T00:00:00Z', next_due_date: null },
                    { id: 2, loan_type: 'MORTGAGE', amount: 500000, currency: 'RSD', status: 'APPROVED', created_at: '2025-01-02T00:00:00Z', next_due_date: null },
                    { id: 3, loan_type: 'CASH', amount: 300000, currency: 'RSD', status: 'PENDING', created_at: '2025-01-03T00:00:00Z', next_due_date: null },
                ],
            },
        }).as('getLoans');

        cy.visit('/client/loans');
        cy.wait('@getLoans');

        cy.get('.ll-card').should('have.length.at.least', 3);
        cy.get('.ll-card').eq(0).should('contain.text', '500.000,00 RSD');
        cy.get('.ll-card').eq(1).should('contain.text', '300.000,00 RSD');
        cy.get('.ll-card').eq(2).should('contain.text', '120.000,00 RSD');
    });
});
