// cypress/e2e/employees/scenario-14-deactivate-2nd-employee.cy.ts
describe('Scenario 14: Admin deaktivira zaposlenog', () => {
    beforeEach(() => {
        cy.loginAsAdmin();
    });

    it('otvara 2. zaposlenog iz tabele, deaktivira ga i vraća se na listu', () => {
        cy.intercept('GET', '**/employees?page=1&page_size=20*').as('getEmployees');

        cy.visit('/employees');
        cy.wait('@getEmployees', { timeout: 20000 }).then(({ response }) => {
            expect([200, 304]).to.include(response?.statusCode);
        });

        cy.get('table', { timeout: 20000 }).should('be.visible');
        cy.get('table tbody tr', { timeout: 20000 })
            .should('have.length.greaterThan', 1)
            .eq(1)
            .click({ force: true });

        cy.location('pathname', { timeout: 20000 }).should('match', /^\/employees\/\d+$/);

        // Deaktivacija
        cy.intercept({ method: /PUT|PATCH/, url: '**/employees/*' }).as('deactivateEmployee');
        cy.contains('button', 'Deaktiviraj', { timeout: 20000 }).click();

        cy.wait('@deactivateEmployee', { timeout: 20000 }).then(({ request, response }) => {
            expect([200, 204]).to.include(response?.statusCode);
            expect(request.body).to.have.property('active', false);
        });

        // Provera da je status postao Neaktivan (na detail strani)
        cy.contains('div', 'Status', { timeout: 20000 }).parent().should('contain.text', 'Neaktivan');

        // Back to list via breadcrumb link "Zaposleni" (/employees)
        cy.intercept('GET', '**/employees?page=1&page_size=20*').as('getEmployeesAfterDeactivate');
        cy.contains('a', 'Zaposleni', { timeout: 20000 }).click();

        cy.location('pathname', { timeout: 20000 }).should('eq', '/employees');
        cy.wait('@getEmployeesAfterDeactivate', { timeout: 20000 });

        // Lista je opet prikazana
        cy.get('table', { timeout: 20000 }).should('be.visible');
    });
});