describe('Scenario 5: Kreiranje kartice kada je dostignut maksimalan broj kartica za račun', () => {
	it('ne dozvoljava kreiranje i prikazuje poruku o limitu', () => {
		cy.loginAsClient();

		cy.intercept('GET', '**/clients/*/accounts*', {
			statusCode: 200,
			body: {
				data: [
					{
						account_number: '265-1234567890123-45',
						name: 'Tekuci racun RSD',
						account_type: 'PERSONAL',
					},
				],
			},
		}).as('getAccounts');

		cy.intercept('GET', '**/clients/*/accounts/265-1234567890123-45/cards*', {
			statusCode: 200,
			body: {
				data: [
					{ id: 1001, card_number: '4000123412341111', status: 'ACTIVE' },
					{ id: 1002, card_number: '4000123412342222', status: 'ACTIVE' },
				],
			},
		}).as('getCards');

		cy.visit('/client/cards');
		cy.wait('@getAccounts');
		cy.wait('@getCards');

		cy.contains('button', /dostignut limit/i)
			.should('be.visible')
			.and('be.disabled');
	});
});