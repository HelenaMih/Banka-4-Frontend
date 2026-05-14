import { agentUser, loginAs } from './helpers';

describe('Scenario 48: Agent nema pristup portalu Profit Banke', () => {
  it('dobija odbijen pristup i biva preusmerena na dashboard', () => {
    loginAs(agentUser, '/profit-bank');

    cy.location('pathname', { timeout: 10000 }).should('not.eq', '/profit-bank');

    cy.contains('Profit Banke').should('not.exist');
    cy.contains('Portal dostupan isključivo supervizorima').should('not.exist');
  });
});
