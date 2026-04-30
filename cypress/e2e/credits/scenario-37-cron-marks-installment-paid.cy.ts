describe('Scenario 37: Simulacija cron-a za naplatu rate', () => {
    it('prikazuje ratu kao PAID kada je status azuriran', () => {
        cy.loginAsClient();

        const mockLoan = {
            id: 601,
            loan_type: 'CASH',
            amount: 100000,
            currency: 'RSD',
            repayment_period: 12,
            status: 'PAID',
            created_at: '2025-01-15T00:00:00Z',
            next_due_date: null,
            installments: [
                { id: 1, number: 1, status: 'PAID', amount: 5000, due_date: '2025-03-15T00:00:00Z' },
            ],
        };

        // Intercept the loan-details call first so it takes precedence for
        // paths like /clients/123/loans/601 (more specific pattern).
        cy.intercept('GET', /\/clients\/[^/]+\/loans\/[^/?]+/, {
            statusCode: 200,
            body: mockLoan,
        }).as('getLoanDetails');

        // Intercept the loan-list call for paths like /clients/123/loans
        cy.intercept('GET', /\/clients\/[^/]+\/loans(\?.*)?$/, {
            statusCode: 200,
            body: { data: [mockLoan] },
        }).as('getLoans');

        cy.visit('/client/loans');
        cy.wait('@getLoans');
        // Auto-select triggers the detail fetch; wait for it so the UI is stable
        cy.wait('@getLoanDetails');

        cy.contains(/pla.eno|paid/i).should('be.visible');
    });
});
