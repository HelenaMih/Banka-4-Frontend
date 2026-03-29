// cypress/e2e/employees/scenario-13-edit-2nd-employee-firstname.cy.ts
describe('Scenario 13: Admin menja podatke zaposlenog', () => {
    beforeEach(() => {
        cy.loginAsAdmin();
    });

    it('otvara 2. zaposlenog iz tabele, menja ime u "Milenko" i vraća se na listu', () => {
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

        cy.contains('button', 'Izmeni', { timeout: 20000 }).click();

        cy.intercept({ method: /PUT|PATCH/, url: '**/employees/*' }).as('updateEmployee');

        const newFirstName = 'Milenko';

        cy.contains('label', 'Ime').parent().find('input').clear().type(newFirstName);
        cy.contains('button[type="submit"]', 'Sačuvaj izmene').click();



        // Back to list via breadcrumb link "Zaposleni" (/employees)
        cy.intercept('GET', '**/employees?page=1&page_size=20*').as('getEmployeesAfterEdit');
        cy.contains('a', 'Zaposleni', { timeout: 20000 }).click();

        cy.location('pathname', { timeout: 20000 }).should('eq', '/employees');
        cy.wait('@getEmployeesAfterEdit', { timeout: 20000 });

        // Provera da se novo ime vidi u tabeli
        cy.get('table', { timeout: 20000 }).should('be.visible');
        cy.get('table').should('contain.text', newFirstName);
    });
});