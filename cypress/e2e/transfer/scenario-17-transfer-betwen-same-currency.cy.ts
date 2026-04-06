describe('Scenario 17: Transfer između sopstvenih računa u istoj valuti', () => {
    it('izvrsava transfer bez provizije i prikazuje azuriranje stanja', () => {
        cy.loginAsClient();

        cy.intercept('GET', '**/clients/*/accounts*', {
            statusCode: 200,
            body: {
                data: [
                    { account_number: '265-1111111111111-11', name: 'RSD 1', currency: 'RSD', balance: 100000 },
                    { account_number: '265-2222222222222-22', name: 'RSD 2', currency: 'RSD', balance: 90000 },
                ],
            },
        }).as('getAccounts');

        cy.intercept('POST', '**/clients/*/transfers', (req) => {
            expect(req.body.from_account).to.eq('265-1111111111111-11');
            expect(req.body.to_account).to.eq('265-2222222222222-22');
            expect(req.body.amount).to.eq(5000);
            req.reply({
                statusCode: 201,
                body: {
                    transfer_id: 9901,
                    from_account_number: '265-1111111111111-11',
                    to_account_number: '265-2222222222222-22',
                    initial_amount: 5000,
                    final_amount: 5000,
                    commission: 0,
                    status: 'SUCCESS',
                },
            });
        }).as('executeTransfer');

        cy.visit('/transfers/new');
        cy.wait('@getAccounts');
        cy.location('pathname').should('eq', '/transfers/new');

        cy.contains('label', /izvorni ra.un/i).parent().find('select').select('265-1111111111111-11');
        cy.contains('label', /odredi.ni ra.un/i).parent().find('select').select('265-2222222222222-22');
        cy.contains('label', /^iznos/i).parent().find('input[type="number"]').clear().type('5000');
        cy.contains('button', /nastavi/i).click();

        cy.location('pathname').should('eq', '/transfers/confirm');

        cy.contains(/provizija/i).should('not.exist');
        cy.contains(/primenjeni kurs/i).should('not.exist');
        cy.contains(/stanje/i).should('be.visible');

        cy.contains('button', /potvrdi transfer/i).click();
        cy.wait('@executeTransfer').its('response.statusCode').should('eq', 201);
        cy.contains(/transfer uspe.no izvr.en/i, { timeout: 20000 }).should('be.visible');
    });
});