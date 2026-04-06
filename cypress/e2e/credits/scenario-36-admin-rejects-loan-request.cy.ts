describe('Scenario 36: Admin odbija kreditni zahtev', () => {
    it('menja status zahteva u REJECTED', () => {
        cy.loginAsAdmin();

        cy.intercept('GET', '**/loan-requests*', {
            statusCode: 200,
            body: {
                data: [
                    {
                        id: 502,
                        client_id: 102,
                        _clientName: 'Marko Markovic',
                        loan_type: 'AUTO',
                        amount: 180000,
                        term_months: 24,
                        purpose: 'Kupovina vozila',
                        status: 'PENDING',
                        created_at: '2025-02-11T10:00:00Z',
                    },
                ],
            },
        }).as('getRequests');

        cy.intercept('PATCH', '**/loan-requests/502/reject', {
            statusCode: 200,
            body: { message: 'Kreditni zahtev je odbijen. Klijent je obavesten email-om.' },
        }).as('rejectLoan');

        cy.visit('/admin/loans');
        cy.wait('@getRequests');

        cy.contains('tr', 'Marko Markovic').within(() => {
            cy.contains('button', /odbij/i).click({ force: true });
        });

        cy.wait('@rejectLoan').its('response.statusCode').should('eq', 200);
        cy.contains(/odbijen|uspe.no izvr.ena/i).should('be.visible');
    });
});
