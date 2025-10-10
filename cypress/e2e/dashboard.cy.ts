describe('Dashboard', () => {
  it('renders and allows coin selection', () => {
    cy.visit('/');
    cy.contains('Cyberpunk Crypto Dashboard');
    cy.get('button').contains('Выберите монету').click();
    cy.get('input[placeholder="Поиск..."]').type('eth');
    cy.contains('Ethereum').click();
    cy.contains('History — ethereum');
  });
});
