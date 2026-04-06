describe('Scenario 19: Pregled istorije transfera', () => {
    it('prikazuje listu transfera sortiranu od najnovijeg ka najstarijem', () => {
        cy.loginAsClient();
        cy.intercept('GET', '**/clients/*/transfers*', {
            statusCode: 200,
            body: {
                data: [
                    {
                        transfer_id: 1,
                        created_at: '2026-03-01T10:00:00Z',
                        from_account_number: '265-1111111111111-11',
                        to_account_number: '265-2222222222222-22',
                        initial_amount: 1000,
                        final_amount: 1000,
                        commission: 0,
                    },
                    {
                        transfer_id: 2,
                        created_at: '2026-03-03T12:30:00Z',
                        from_account_number: '265-1111111111111-11',
                        to_account_number: '265-3333333333333-33',
                        initial_amount: 2000,
                        final_amount: 1980,
                        commission: 20,
                    },
                    {
                        transfer_id: 3,
                        created_at: '2026-03-02T09:15:00Z',
                        from_account_number: '265-1111111111111-11',
                        to_account_number: '265-4444444444444-44',
                        initial_amount: 1500,
                        final_amount: 1500,
                        commission: 0,
                    },
                ],
                total_pages: 1,
            },
        }).as('getTransferHistory');

        cy.visit('/transfers/history');
        cy.wait('@getTransferHistory').its('response.statusCode').should('eq', 200);

        cy.contains(/istorija transfera/i).should('be.visible');
        cy.get('table tbody tr').should('have.length', 3);

        // Najnoviji transfer (03.03.2026) mora biti prvi u listi.
        cy.get('table tbody tr').first().within(() => {
            cy.contains('03.03.2026').should('be.visible');
            cy.contains('+1.980,00').should('be.visible');
        });

        // Najstariji (01.03.2026) mora biti poslednji.
        cy.get('table tbody tr').last().within(() => {
            cy.contains('01.03.2026').should('be.visible');
            cy.contains('+1.000,00').should('be.visible');
        });

    });
});