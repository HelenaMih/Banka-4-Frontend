describe('Scenario 20: Neuspešan transfer zbog nedovoljnih sredstava', () => {
    it('prikazuje poruku o nedovoljnom stanju i ne dozvoljava nastavak transfera', () => {
        cy.loginAsClient();

        cy.intercept('GET', '**/clients/*/accounts*', {
            statusCode: 200,
            body: {
                data: [
                    { account_number: '265-1111111111111-11', name: 'Tekuci RSD', currency: 'RSD', balance: 1000 },
                    { account_number: '265-2222222222222-22', name: 'Stedni RSD', currency: 'RSD', balance: 5000 },
                ],
            },
        }).as('getAccounts');

        cy.intercept('GET', '**/exchange/rates*', {
            statusCode: 200,
            body: { rates: [] },
        }).as('getRates');

        cy.visit('/transfers/new');
        cy.wait('@getAccounts');
        cy.wait('@getRates');
        cy.location('pathname').should('eq', '/transfers/new');

        cy.contains('label', /izvorni račun/i)
            .parent()
            .find('select')
            .as('fromSelect');

        cy.get('@fromSelect').find('option').then(($opts) => {
            expect($opts.length).to.be.greaterThan(1);
            const firstAccountValue = $opts[1].getAttribute('value');
            expect(firstAccountValue).to.be.ok;
            cy.get('@fromSelect').select(firstAccountValue!);
        });

        cy.contains('label', /odredišni račun/i)
            .parent()
            .find('select')
            .as('toSelect');

        cy.get('@toSelect').find('option').then(($opts) => {
            expect($opts.length).to.be.greaterThan(1);
            const firstValidToAccount = Array.from($opts).map(o => o.getAttribute('value')).find(v => !!v);
            expect(firstValidToAccount).to.be.ok;
            cy.get('@toSelect').select(firstValidToAccount!);
        });

        cy.contains('label', /^iznos/i)
            .parent()
            .find('input[type="number"]')
            .clear()
            .type('500000');

        cy.contains(/nedovoljno sredstava/i).should('be.visible');
        cy.contains('button', /nastavi/i).should('be.disabled');
        cy.location('pathname').should('eq', '/transfers/new');

    });
});