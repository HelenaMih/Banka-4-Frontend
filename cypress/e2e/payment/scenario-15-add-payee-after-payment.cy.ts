describe('Scenario 15: Dodavanje primaoca nakon uspesnog placanja', () => {
    it('nudi opciju i dodaje primaoca u listu', () => {
        cy.loginAsClient();

        cy.intercept('POST', '**/clients/*/payments', { statusCode: 201, body: { id: 5515 } }).as('createPayment');
        cy.intercept('POST', '**/clients/*/payments/5515/verify', { statusCode: 200, body: { status: 'SUCCESS' } }).as('verifyPayment');
        cy.intercept('POST', '**/payees', { statusCode: 201, body: { data: { id: 9901, name: 'Novi Primaoc' } } }).as('addPayee');

        cy.visit('/client/payments/new');

        cy.contains('label', /primalac/i).parent().find('input').type('Novi Primaoc');
        cy.contains('label', /broj ra.una primaoca/i).parent().find('input').type('444000111222333444');
        cy.contains('label', /^iznos/i).parent().find('input').type('100');
        cy.contains('button', /nastavi/i).click();

        cy.wait('@createPayment');
        cy.contains('label', /verifikacioni kod/i).parent().find('input').type('123456');
        cy.contains('button', /potvrdi pla.anje/i).click();
        cy.wait('@verifyPayment');

        cy.contains('button', /dodaj .* primaoce/i).click();
        cy.wait('@addPayee').its('response.statusCode').should('eq', 201);
    });
});
