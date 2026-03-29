// cypress/e2e/employees/scenario-12-search-employees-multi.cy.ts
describe('Scenario 12: Admin pretražuje zaposlene (više filtera)', () => {
    beforeEach(() => {
        cy.loginAsAdmin();
    });

    it('filtrira po email, imenu, prezimenu i poziciji redom', () => {
        cy.intercept('GET', '**/employees?page=1&page_size=20*').as('getEmployeesInitial');

        cy.visit('/employees');
        cy.location('pathname').should('eq', '/employees');

        cy.wait('@getEmployeesInitial', { timeout: 20000 }).then(({ response }) => {
            expect([200, 304]).to.include(response?.statusCode);
        });

        // helper: unesi u filter i sačekaj odgovarajući request
        const applyFilter = (placeholder: string, value: string, qsKey: string) => {
            cy.intercept('GET', `**/employees*${qsKey}=${encodeURIComponent(value)}*`).as(`filtered_${qsKey}`);

            cy.get(`input[placeholder="${placeholder}"]`).clear().type(value);

            cy.wait(`@filtered_${qsKey}`, { timeout: 20000 }).then(({ request, response }) => {
                expect([200, 304]).to.include(response?.statusCode);
                expect(request.url).to.include(`${qsKey}=${encodeURIComponent(value)}`);
            });

            // sanity: lista se prikazuje (bar jedan link ka detaljima)
            cy.get('a[href^="/employees/"]', { timeout: 20000 }).should('have.length.greaterThan', 0);
        };

        const clearFilter = (placeholder: string, qsKey: string) => {
            // kad obrišeš filter, treba da se vrati na base request bez tog qsKey
            cy.intercept('GET', '**/employees?page=1&page_size=20*').as(`reset_${qsKey}`);

            cy.get(`input[placeholder="${placeholder}"]`).clear();

            cy.wait(`@reset_${qsKey}`, { timeout: 20000 }).then(({ request, response }) => {
                expect([200, 304]).to.include(response?.statusCode);
                expect(request.url).to.not.include(`${qsKey}=`);
            });
        };

        // 1) Email
        applyFilter('Email...', 'petar@raf.rs', 'email');
        clearFilter('Email...', 'email');

        // 2) Ime
        applyFilter('Ime...', 'Petar', 'first_name');
        clearFilter('Ime...', 'first_name');

        // 3) Prezime
        applyFilter('Prezime...', 'Petrovic', 'last_name');
        clearFilter('Prezime...', 'last_name');

        // 4) Pozicija
        applyFilter('Pozicija...', 'HR', 'position');
    });
});