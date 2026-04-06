describe('Scenario 8: Promena naziva računa', () => {
    it('menja naziv računa i prikazuje potvrdu o uspešnoj promeni', () => {
        cy.loginAsClient();

        cy.intercept('GET', '**/clients/*/accounts*', {
            statusCode: 200,
            body: {
                data: [
                    {
                        account_number: '265-1234567890123-45',
                        name: 'Moj racun',
                        currency: 'RSD',
                        balance: 50000,
                        reserved_funds: 0,
                        status: 'ACTIVE',
                    },
                ],
            },
        }).as('getAccounts');

        cy.intercept('GET', '**/clients/*/accounts/*/payments*', {
            statusCode: 200,
            body: { data: [] },
        });

        const newName = `Naziv ${Date.now()}`;
        cy.intercept('PUT', '**/clients/*/accounts/*/name', (req) => {
            expect(req.body).to.deep.equal({ name: newName });
            req.reply({
                statusCode: 200,
                body: { message: 'Naziv računa je uspešno promenjen.' },
            });
        }).as('renameAccount');

        cy.visit('/client/accounts');
        cy.wait('@getAccounts').its('response.statusCode').should('eq', 200);

        cy.contains('button', /^Detalji$/i).first().click();
        cy.contains(/detalji računa/i).should('be.visible');

        cy.contains('button', /promena naziva računa/i).click();
        cy.contains(/promena naziva računa/i).should('be.visible');

        cy.contains('label', /novo ime računa/i)
            .parent()
            .find('input')
            .clear()
            .type(newName);

        cy.contains('button', /^sačuvaj$/i).click();

        cy.wait('@renameAccount').its('response.statusCode').should('eq', 200);
        cy.contains(/naziv računa je uspešno promenjen!/i).should('be.visible');

        cy.wait(1700);
        cy.contains(newName).should('be.visible');
    });
});