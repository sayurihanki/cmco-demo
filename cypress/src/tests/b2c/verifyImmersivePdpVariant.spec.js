/* global cy, describe, it */

describe('Verify immersive PDP variant', () => {
  it('activates the immersive stack for compatible configurable products', () => {
    cy.visit('/immersive-pdp-demo.html');

    cy.get('.product-configurator-luxe__shell', { timeout: 20000 }).should('be.visible');
    cy.get('.product-details')
      .should('have.class', 'product-details--configurator-active')
      .and('have.class', 'product-details--immersive-active')
      .and('have.class', 'product-details--svg-media-ready')
      .and('have.attr', 'data-media-view', 'photos');
    cy.get('.product-details__configuration').should('not.be.visible');
    cy.get('.product-details__details-card').should('not.be.visible');
    cy.get('.product-details__attributes-card').should('not.be.visible');
    cy.get('.product-details__media-selector--desktop', { timeout: 20000 })
      .scrollIntoView()
      .should('be.visible');
    cy.get('.product-details__media-selector--desktop .product-details__media-option')
      .should('have.length', 2);
    cy.get('.product-details__media-selector--desktop')
      .contains('.product-details__media-option', 'Technical view')
      .click();
    cy.get('.product-details').should('have.attr', 'data-media-view', 'technical');
    cy.get('.product-details__media-view--technical img')
      .should('have.attr', 'src')
      .and('include', '/media/bodea-network-enclosure-technical-view.svg');
    cy.get('.product-details__media-selector--desktop')
      .contains('.product-details__media-option', 'Photos')
      .click();
    cy.get('.product-details').should('have.attr', 'data-media-view', 'photos');

    cy.get('.product-technical-details__shell', { timeout: 20000 }).should('be.visible');
    cy.get('.product-technical-details__spec-card').should('have.length.at.least', 3);
    cy.get('.product-technical-details__accordion-button[aria-expanded="true"]').should('have.length', 1);
    cy.get('.product-configurator-luxe__primary-cta').should('exist');
    cy.get('.product-configurator-luxe__mobile-cta').should('exist');
  });

  it('renders the default shell on a non-immersive PDP without svg media', () => {
    cy.visit('/immersive-pdp-fallback-demo.html');

    cy.get('.product-details')
      .should('not.have.class', 'product-details--configurator-active')
      .and('not.have.class', 'product-details--immersive-active')
      .and('not.have.class', 'product-details--svg-media-ready');
    cy.get('.product-details__left-column .product-details__media-card').should('be.visible');
    cy.get('.product-details__configuration-card', { timeout: 20000 }).should('be.visible');
    cy.get('.product-details__intro-card').should('contain.text', 'Network Enclosures NE 12U GlassFront');
    cy.get('.product-details__media-selector--desktop .product-details__media-option').should('not.exist');
    cy.get('.product-details__media-card img').then(($images) => {
      const realImageSources = [...$images]
        .map((image) => image.getAttribute('src'))
        .filter((src) => src && !src.startsWith('data:image/gif'));
      if (realImageSources.length === 0) {
        throw new Error('Expected at least one real product image in the media card.');
      }
    });
    cy.get('.product-configurator-luxe__shell').should('not.exist');
    cy.get('.product-technical-details__shell').should('not.exist');
  });
});
