describe('Scenario 35: Admin odobrava kreditni zahtev', () => {
    it('menja status zahteva iz PENDING u APPROVED', () => {
        cy.loginAsAdmin();

        cy.intercept('GET', '**/loan-requests*', {
            statusCode: 200,
            body: {
                data: [
                    {
                        id: 501,
                        client_id: 101,
                        _clientName: 'Ana Anic',
                        loan_type: 'CASH',
                        amount: 200000,
                        term_months: 36,
                        purpose: 'Renoviranje',
                        status: 'PENDING',
                        created_at: '2025-02-10T10:00:00Z',
                    },
                ],
            },
        }).as('getRequests');

        cy.intercept('PATCH', '**/loan-requests/501/approve', {
            statusCode: 200,
            body: { message: 'Kredit je odobren i klijent je obavesten email-om.' },
        }).as('approveLoan');

        cy.visit('/admin/loans');
        cy.wait('@getRequests');

        cy.contains('tr', 'Ana Anic').within(() => {
            cy.contains('button', /odobri/i).click({ force: true });
        });

        cy.wait('@approveLoan').its('response.statusCode').should('eq', 200);
        cy.contains(/odobren|sredstva su preba.ena na ra.un klijenta/i).should('be.visible');
    });
});
