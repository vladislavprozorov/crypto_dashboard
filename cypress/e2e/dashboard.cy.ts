describe('Dashboard', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it('показывает рынок и открывает страницу монеты через поиск', () => {
    cy.visit('/');
    cy.contains('h2', 'Топ-').should('be.visible');
    cy.get('[role=combobox]').type('eth');
    cy.get('[role=option]').first().click();
    cy.location('hash').should('eq', '#/coin/ethereum');
    cy.contains('h1', 'Ethereum');
  });

  it('добавляет монету в вотчлист', () => {
    cy.visit('/');
    cy.get('button[aria-label="Добавить Solana в вотчлист"]').filter(':visible').click();
    cy.contains('a', 'Вотчлист').click();
    cy.contains('Solana').should('be.visible');
  });

  it('создаёт ценовой алерт', () => {
    cy.visit('/#/coin/bitcoin');
    cy.contains('label', 'Цена, USD').find('input').type('1000000');
    cy.contains('button', 'Создать алерт').click();
    cy.contains('Алерт создан');
    cy.contains('a', 'Алерты').click();
    cy.contains('BTC');
  });

  it('ведёт портфель: покупка, продажа сверх остатка отклоняется', () => {
    cy.visit('/#/portfolio', {
      // портфель живёт в IndexedDB, которую clearLocalStorage не трогает
      onBeforeLoad: (win) => void win.indexedDB.deleteDatabase('crypto-dashboard'),
    });
    cy.contains('button', 'Добавить первую сделку').click();
    cy.contains('label', 'Количество').find('input').type('0.5');
    cy.contains('button', 'Добавить покупку').click();
    cy.contains('Стоимость портфеля');
    cy.contains('[role=radio]', 'Продажа').click();
    cy.contains('label', 'Количество').find('input').clear().type('2');
    cy.contains('button', 'Добавить продажу').click();
    cy.get('#tx-form [role=alert]').should('contain', 'только 0.5 BTC');
  });
});
