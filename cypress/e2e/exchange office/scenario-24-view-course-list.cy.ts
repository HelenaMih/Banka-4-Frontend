describe('Scenario 24: Pregled kursne liste', () => {
    it('prikazuje kursnu listu sa svim podržanim valutama i odnosom prema RSD', () => {
        cy.loginAsClient();

        cy.intercept('GET', '**/exchange/rates*', {
            statusCode: 200,
            body: {
                rates: [
                    { currency: 'EUR', buy_rate: 116.2, sell_rate: 117.2 },
                    { currency: 'CHF', buy_rate: 121.1, sell_rate: 122.1 },
                    { currency: 'USD', buy_rate: 108.9, sell_rate: 109.9 },
                    { currency: 'GBP', buy_rate: 136.7, sell_rate: 137.7 },
                    { currency: 'JPY', buy_rate: 0.71, sell_rate: 0.73 },
                    { currency: 'CAD', buy_rate: 79.2, sell_rate: 80.2 },
                    { currency: 'AUD', buy_rate: 72.8, sell_rate: 73.8 },
                ],
            },
        }).as('getRates');

        cy.visit('/client/exchange');
        cy.wait('@getRates').its('response.statusCode').should('eq', 200);
        cy.contains('h2', /kursna lista/i).should('be.visible');

        const currencies = ['EUR', 'CHF', 'USD', 'GBP', 'JPY', 'CAD', 'AUD'];

        currencies.forEach((currency) => {
            cy.contains('tbody tr', currency)
                .should('be.visible')
                .within(() => {
                    cy.contains(/RSD/i).should('be.visible');
                });
        });
    });
});