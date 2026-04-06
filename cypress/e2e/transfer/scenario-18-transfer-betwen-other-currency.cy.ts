describe('Scenario 18: Transfer između sopstvenih računa u različitim valutama', () => {
    it('prikazuje konverziju i proviziju i izvrsava transfer', () => {
        cy.loginAsClient();

        cy.intercept('GET', '**/clients/*/accounts*', {
            statusCode: 200,
            body: {
                data: [
                    { account_number: '265-1111111111111-11', name: 'RSD 1', currency: 'RSD', balance: 100000 },
                    { account_number: '265-2222222222222-22', name: 'EUR 1', currency: 'EUR', balance: 2000 },
                ],
            },
        }).as('getAccounts');

        cy.intercept('GET', '**/exchange/rates*', {
            statusCode: 200,
            body: {
                rates: [
                    { currency: 'EUR', buy_rate: 116.5, sell_rate: 117.5 },
                ],
            },
        }).as('getRates');

        cy.intercept('POST', '**/clients/*/transfers', (req) => {
            expect(req.body.from_account).to.eq('265-1111111111111-11');
            expect(req.body.to_account).to.eq('265-2222222222222-22');
            expect(req.body.amount).to.eq(11750);
            req.reply({
                statusCode: 201,
                body: {
                    transfer_id: 9902,
                    initial_amount: 11750,
                    final_amount: 99,
                    commission: 1,
                    status: 'SUCCESS',
                },
            });
        }).as('executeTransfer');

        cy.visit('/transfers/new');
        cy.wait('@getAccounts');
        cy.wait('@getRates');
        cy.location('pathname').should('eq', '/transfers/new');

        cy.contains('label', /izvorni ra.un/i).parent().find('select').select('265-1111111111111-11');
        cy.contains('label', /odredi.ni ra.un/i).parent().find('select').select('265-2222222222222-22');
        cy.contains('label', /^iznos/i).parent().find('input[type="number"]').clear().type('11750');
        cy.contains('button', /nastavi/i).click();

        cy.location('pathname').should('eq', '/transfers/confirm');

        cy.contains(/primenjeni kurs/i).should('be.visible');
        cy.contains(/proviz/i).should('be.visible');
        cy.contains(/kona.ni iznos koji sti.e/i).should('be.visible');

        cy.contains('button', /potvrdi transfer/i).click();
        cy.wait('@executeTransfer').its('response.statusCode').should('eq', 201);

        cy.contains(/transfer uspe.no izvr.en/i, { timeout: 20000 }).should('be.visible');
    });
});