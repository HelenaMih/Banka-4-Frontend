describe('Scenario 22: Izmena podataka primaoca plaćanja', () => {
    it('menja naziv i broj računa primaoca', () => {
        cy.loginAsClient();

        cy.intercept('GET', '**/payees*', {
            statusCode: 200,
            body: {
                data: [
                    { id: 9101, name: 'Ana', account_number: '444000111222333444' },
                ],
            },
        }).as('getPayees');

        cy.intercept('PATCH', '**/payees/9101', {
            statusCode: 200,
            body: {
                data: { id: 9101, name: 'Mila Izmena', account_number: '444000127330072323' },
            },
        }).as('updatePayee');

        cy.visit('/client/recipients');
        cy.wait('@getPayees');

        cy.contains('button', /izmeni/i).first().click();

        cy.contains('label', /naziv primaoca/i)
            .parent()
            .find('input')
            .clear()
            .type('Mila Izmena');

        cy.contains('label', /broj računa/i)
            .parent()
            .find('input')
            .clear()
            .type('444000127330072323');

        cy.contains('button', /^potvrdi$/i).click();
        cy.wait('@updatePayee').its('response.statusCode').should('eq', 200);
    });
});