describe('Scenario 38: Simulacija neuspele naplate rate', () => {
    it('prikazuje status OVERDUE kada rata nije naplacena', () => {
        cy.loginAsClient();

        const mockLoan = {
            id: 602,
            loan_type: 'AUTO',
            amount: 220000,
            currency: 'RSD',
            repayment_period: 24,
            status: 'OVERDUE',
            created_at: '2025-01-20T00:00:00Z',
            next_due_date: '2025-04-20T00:00:00Z',
            installments: [
                { id: 2, number: 2, status: 'OVERDUE', amount: 7000, due_date: '2025-03-20T00:00:00Z' },
            ],
        };

        // Intercept the loan-details call first so it takes precedence for
        // paths like /clients/123/loans/602 (more specific pattern).
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

        cy.contains(/zakasnelo|overdue/i).should('be.visible');
    });
});
