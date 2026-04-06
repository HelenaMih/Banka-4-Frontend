describe('Scenario 6: Pregled računa klijenta', () => {
    it('prikazuje samo aktivne račune i sortira ih po raspoloživom stanju', () => {
        cy.loginAsClient();

        cy.intercept('GET', '**/clients/*/accounts*', {
            statusCode: 200,
            body: {
                data: [
                    {
                        account_number: '265-1111111111111-11',
                        name: 'Racun A',
                        currency: 'RSD',
                        balance: 100000,
                        reserved_funds: 90000,
                        status: 'ACTIVE',
                    },
                    {
                        account_number: '265-2222222222222-22',
                        name: 'Racun B',
                        currency: 'RSD',
                        balance: 50000,
                        reserved_funds: 0,
                        status: 'ACTIVE',
                    },
                    {
                        account_number: '265-3333333333333-33',
                        name: 'Racun C',
                        currency: 'RSD',
                        balance: 20000,
                        reserved_funds: 1000,
                        status: 'ACTIVE',
                    },
                    {
                        account_number: '265-9999999999999-99',
                        name: 'Racun Zatvoren',
                        currency: 'RSD',
                        balance: 999999,
                        reserved_funds: 0,
                        status: 'CLOSED',
                    },
                ],
            },
        }).as('getAccounts');

        cy.intercept('GET', '**/clients/*/accounts/*/payments*', {
            statusCode: 200,
            body: { data: [] },
        });

        cy.visit('/client/accounts');
        cy.wait('@getAccounts').its('response.statusCode').should('eq', 200);

        cy.contains(/moji računi/i).should('be.visible');

        cy.contains(/sortiraj račune/i)
            .parent()
            .find('select')
            .select('available');

        cy.contains('Racun Zatvoren').should('not.exist');

        cy.get('button').then(($buttons) => {
            const detailButtons = Array.from($buttons).filter((btn) =>
                /^Detalji$/i.test((btn.textContent ?? '').trim())
            );

            expect(detailButtons).to.have.length(3);

            const orderedAccountNumbers = detailButtons
                .map((btn) => {
                    const cardText = (btn.closest('div')?.parentElement?.textContent ?? '').replace(/\s+/g, ' ');
                    const match = cardText.match(/265-\d{13}-\d{2}/);
                    return match?.[0] ?? '';
                })
                .filter(Boolean);

            expect(orderedAccountNumbers).to.deep.equal([
                '265-2222222222222-22',
                '265-3333333333333-33',
                '265-1111111111111-11',
            ]);
        });
    });
});