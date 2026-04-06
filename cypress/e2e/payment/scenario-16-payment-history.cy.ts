describe('Scenario 16: Pregled istorije placanja', () => {
    it('prikazuje listu i omogucava filtriranje', () => {
        cy.loginAsClient();

        cy.intercept('GET', '**/clients/*/payments*', {
            statusCode: 200,
            body: {
                data: [
                    { id: 1, created_at: '2026-03-12T11:00:00', recipient_name: 'Ana', amount: 1250, currency: 'RSD', status: 'SUCCESS', type: 'payment' },
                    { id: 2, created_at: '2026-03-10T09:00:00', recipient_name: 'Milan', amount: 550, currency: 'RSD', status: 'SUCCESS', type: 'payment' },
                ],
                total_pages: 1,
            },
        }).as('getPayments');

        cy.visit('/client/payments');
        cy.wait('@getPayments');

        cy.contains(/pregled pla.anja/i).should('be.visible');
        cy.get('table tbody tr').its('length').should('be.greaterThan', 0);

        cy.get('select').first().select('completed');
        cy.get('input[type="number"]').first().clear().type('100');

        cy.get('table tbody tr').its('length').should('be.greaterThan', 0);
    });
});
