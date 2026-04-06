describe('Scenario 37: Simulacija cron-a za naplatu rate', () => {
    it('prikazuje ratu kao PAID kada je status azuriran', () => {
        cy.loginAsClient();

        cy.intercept('GET', '**/clients/*/loans*', {
            statusCode: 200,
            body: {
                data: [
                    {
                        id: 601,
                        loan_type: 'CASH',
                        amount: 100000,
                        status: 'PAID',
                        created_at: '2025-01-15T00:00:00Z',
                        next_due_date: '2025-04-15T00:00:00Z',
                        installments: [
                            { id: 1, number: 1, status: 'PAID', amount: 5000, due_date: '2025-03-15T00:00:00Z' },
                        ],
                    },
                ],
            },
        }).as('getLoans');

        cy.visit('/client/loans');
        cy.wait('@getLoans');

        cy.get('.ll-card').first().click({ force: true });
        cy.contains(/pla.eno|paid/i).should('be.visible');
    });
});
