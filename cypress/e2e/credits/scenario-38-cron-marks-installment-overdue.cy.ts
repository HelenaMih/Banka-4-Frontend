describe('Scenario 38: Simulacija neuspele naplate rate', () => {
    it('prikazuje status OVERDUE kada rata nije naplacena', () => {
        cy.loginAsClient();

        cy.intercept('GET', '**/clients/*/loans*', {
            statusCode: 200,
            body: {
                data: [
                    {
                        id: 602,
                        loan_type: 'AUTO',
                        amount: 220000,
                        status: 'OVERDUE',
                        created_at: '2025-01-20T00:00:00Z',
                        next_due_date: '2025-04-20T00:00:00Z',
                        installments: [
                            { id: 2, number: 2, status: 'OVERDUE', amount: 7000, due_date: '2025-03-20T00:00:00Z' },
                        ],
                    },
                ],
            },
        }).as('getLoans');

        cy.visit('/client/loans');
        cy.wait('@getLoans');

        cy.get('.ll-card').first().click({ force: true });
        cy.contains(/zakasnelo|overdue/i).should('be.visible');
    });
});
