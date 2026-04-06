import { visitEmployeeLogin } from '../../support/authHelpers';

describe('Feature 1 - Autentifikacija korisnika', () => {
    it('Scenario 4: Zaboravljena lozinka - slanje zahteva', () => {
        cy.intercept('POST', '**/auth/forgot-password', (req) => {
            expect(req.body).to.deep.equal({ email: 'admin@raf.rs' });
            req.reply({
                statusCode: 200,
                body: { message: 'Reset link sent' },
            });
        }).as('forgot');

        visitEmployeeLogin();

        cy.contains('a', /zaboravili ste lozinku\?/i).click();

        cy.location('pathname').should('eq', '/reset-password');

        cy.get('#email').should('be.visible');
        cy.get('#email').clear();
        cy.get('#email').type('admin@raf.rs');

        cy.contains('button', /pošalji link za resetovanje/i).click();

        cy.wait('@forgot').its('response.statusCode').should('eq', 200);

        cy.contains(/email je poslat!/i).should('be.visible');

        cy.window().then((win) => {
            expect(win.localStorage.getItem('token')).to.be.null;
            expect(win.localStorage.getItem('refresh_token')).to.be.null;
        });
    });
});