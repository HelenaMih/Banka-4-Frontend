import './commands';

// cypress/support/commands.ts
declare global {
    namespace Cypress {
        interface Chainable {
            loginAsAdmin(): Chainable<void>;
        }
    }
}

Cypress.Commands.add('loginAsAdmin', () => {
    const apiUrl = Cypress.env('API_URL');
    if (!apiUrl) throw new Error('Missing Cypress env API_URL');

    cy.session('admin', () => {
        cy.request('POST', `${apiUrl}/auth/login`, {
            email: 'admin@raf.rs',
            password: 'admin123',
        }).then((res) => {
            expect(res.status).to.eq(200);

            const { user, token, refresh_token } = res.body;

            window.localStorage.setItem('token', token);
            if (refresh_token) window.localStorage.setItem('refreshToken', refresh_token);
            else window.localStorage.removeItem('refreshToken');

            window.localStorage.setItem('user', JSON.stringify(user));
        });
    });
});