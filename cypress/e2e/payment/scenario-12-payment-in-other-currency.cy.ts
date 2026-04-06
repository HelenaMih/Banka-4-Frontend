describe('Scenario 12: Plaćanje u različitim valutama uz konverziju (Transfer prozor)', () => {
    it('sa prvog računa prebacuje na drugi i radi konverziju + proviziju', () => {
        cy.loginAsClient();

        cy.intercept('GET', '**/api/clients/*/accounts*', {
            statusCode: 200,
            body: {
                data: [
                    { account_number: '265-1111111111111-11', name: 'RSD 1', currency: 'RSD', balance: 100000 },
                    { account_number: '265-2222222222222-22', name: 'EUR 1', currency: 'EUR', balance: 2000 },
                    { account_number: '265-3333333333333-33', name: 'RSD 2', currency: 'RSD', balance: 50000 },
                ],
            },
        }).as('getAccounts');

        // Ključno: bez ovoga app zove pravi backend i dobija 404 "source account not found"
        cy.intercept('POST', '**/api/clients/*/transfers', {
            statusCode: 201,
            body: {
                message: 'Transfer uspešno izvršen',
                data: {
                    id: 5001,
                    status: 'SUCCESS',
                },
            },
        }).as('createTransfer');

        // Transfer prozor
        cy.visit('/transfers/new');
        cy.wait('@getAccounts', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
        cy.location('pathname').should('eq', '/transfers/new');

        // FROM
        cy.contains('label', /izvorni račun/i).parent().find('select').as('fromSelect');
        cy.get('@fromSelect').find('option').then(($opts) => {
            expect($opts.length).to.be.greaterThan(1);
            const firstAccountValue = $opts[1].getAttribute('value');
            expect(firstAccountValue).to.be.ok;
            cy.get('@fromSelect').select(firstAccountValue!);
        });

        // TO
        cy.contains('label', /odredišni račun/i).parent().find('select').as('toSelect');
        cy.get('@toSelect').find('option').then(($opts) => {
            expect($opts.length).to.be.greaterThan(1);
            const firstValidToAccount = Array.from($opts)
                .map((o) => o.getAttribute('value'))
                .find((v) => !!v);
            expect(firstValidToAccount).to.be.ok;
            cy.get('@toSelect').select(firstValidToAccount!);
        });

        // Iznos
        cy.contains('label', /^iznos/i).parent().find('input[type="number"]').clear().type('50');

        cy.contains('button', /nastavi|dalje/i).click();

        // Potvrda transfera
        cy.location('pathname', { timeout: 20000 }).should('eq', '/transfers/confirm');

        cy.contains(/kurs|prodajni/i).should('be.visible');
        cy.contains(/proviz/i).should('be.visible');

        cy.contains('button', /potvrdi|izvrši/i).click();

        // Sačekaj backend stub + tek onda očekuj uspeh
        cy.wait('@createTransfer', { timeout: 20000 })
            .its('response.statusCode')
            .should('be.oneOf', [200, 201]);

        cy.contains(/uspešno|success/i, { timeout: 20000 }).should('be.visible');
    });
});