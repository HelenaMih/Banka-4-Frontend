describe('Scenario 28: Kreiranje kartice na zahtev klijenta', () => {
    it('klijent salje zahtev i potvrdjuje ga 2FA kodom', () => {
        cy.loginAsClient();

        cy.intercept('POST', '**/cards/request', {
            statusCode: 200,
            body: { request_id: 8801, message: 'OTP poslat na email' },
        }).as('requestCard');

        cy.intercept('POST', '**/cards/request/confirm', {
            statusCode: 201,
            body: { message: 'Kartica je uspesno kreirana.' },
        }).as('confirmRequest');

        cy.visit('/client/cards');

        cy.contains('button', /zatra.i novu/i, { timeout: 10000 }).click({ force: true });
        cy.contains('h3', /zatra.i novu karticu/i).should('be.visible');

        cy.contains('label', /ra.un/i).parent().find('select').select(1);
        cy.contains('button', /potvrdi zahtev/i).click();
        cy.wait('@requestCard').its('response.statusCode').should('eq', 200);

        cy.contains('h3', /2FA potvrda/i).should('be.visible');
        cy.contains('label', /6-cifren kod/i).parent().find('input').type('123456');
        cy.contains('button', /po.alji zahtev/i).click();

        cy.wait('@confirmRequest').its('response.statusCode').should('eq', 201);
        cy.contains(/kartica je uspe.no kreirana/i).should('be.visible');
    });
});
