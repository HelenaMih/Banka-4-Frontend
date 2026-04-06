describe('Scenario 23: Brisanje primaoca plaćanja sa potvrdom', () => {
    it('pronalazi Anu u listi i potvrđuje brisanje u malom meniju', () => {
        cy.loginAsClient();

        cy.intercept('GET', '**/api/payees*', {
            statusCode: 200,
            body: {
                data: [{ id: 9102, name: 'Ana', account_number: '444000111222333444' }],
            },
        }).as('getPayees');

        // Bitno: na tvojoj app request ide na /api/payees/9102 (ne samo /payees/9102)
        cy.intercept('DELETE', '**/api/payees/9102*', {
            statusCode: 200,
            body: { message: 'Obrisano' },
        }).as('deletePayee');

        cy.visit('/client/recipients');
        cy.wait('@getPayees', { timeout: 20000 }).its('response.statusCode').should('eq', 200);

        // Otvori modal brisanja (može biti više "Obriši" dugmadi, zato ciljamo red sa "Ana")
        // pronađi element koji sadrži "Ana" (bilo gde)
        cy.contains('Ana', { timeout: 20000 })
            .should('be.visible')
            // popni se na neki razuman container (najčešće red/kartica)
            .closest('tr, li, [role="row"], div')
            .within(() => {
                cy.contains(/obriši/i).click({ force: true });
            });
        
        // Klik na "Obriši" unutar stvarnog delete modala (CSS module klase)
        cy.get('[class*="modalOverlay"]', { timeout: 20000 })
            .should('be.visible')
            .within(() => {
                cy.contains('h3', /obriši primaoca/i).should('be.visible');
                cy.contains('button', /^obriši$/i).click({ force: true });
            });

        cy.wait('@deletePayee', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
    });
});