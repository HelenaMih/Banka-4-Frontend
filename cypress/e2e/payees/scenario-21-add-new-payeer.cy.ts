describe('Scenario 21: Dodavanje novog primaoca plaćanja', () => {
    it('dodaje primaoca i prikazuje ga u listi', () => {
        cy.loginAsClient();

        cy.intercept('GET', '**/payees*', {
            statusCode: 200,
            body: { data: [] },
        }).as('getPayees');

        cy.intercept('POST', '**/payees', {
            statusCode: 201,
            body: {
                data: {
                    id: 9001,
                    name: 'Milan Test',
                    account_number: '444000123456789123',
                },
            },
        }).as('createPayee');

        cy.visit('/client/recipients');
        cy.wait('@getPayees');

        cy.contains('button', /dodaj novog primaoca/i).click();

        cy.contains('label', /naziv primaoca/i)
            .parent()
            .find('input')
            .clear()
            .type('Milan Test');

        cy.contains('label', /broj računa/i)
            .parent()
            .find('input')
            .clear()
            .type('444000123456789123');

        cy.contains('button', /^potvrdi$/i).click();
        cy.wait('@createPayee').its('response.statusCode').should('eq', 201);
    });
});
