export function fieldRootByLabel(labelText: string): Cypress.Chainable<JQuery<HTMLElement>> {
    // labelText može biti npr. "Ime" (matchuje i "Ime *")
    const escaped = Cypress._.escapeRegExp(labelText.trim());
    return cy.contains('label', new RegExp(`^\\s*${escaped}(\\s|\\*|$)`, 'i'), { timeout: 10000 }).parent();
}

export function fillInputByLabel(labelText: string, value: string): void {
    fieldRootByLabel(labelText)
        .find('input')
        .first()
        .clear({ force: true })
        .type(value, { force: true });
}

export function fillDateByLabel(labelText: string, value: string): void {
    fieldRootByLabel(labelText)
        .find('input[type="date"]')
        .first()
        .clear({ force: true })
        .type(value, { force: true });
}

export function selectByLabel(labelText: string, value: string): void {
    fieldRootByLabel(labelText)
        .find('select')
        .first()
        .select(value, { force: true });
}