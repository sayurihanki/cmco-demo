// Drop-in Tools
import { events } from '@dropins/tools/event-bus.js';

import { tryRenderAemAssetsImage } from '@dropins/tools/lib/aem/assets.js';
import { getConfigValue } from '@dropins/tools/lib/aem/configs.js';
import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import { fetchPlaceholders, getProductLink, rootLink } from '../../scripts/commerce.js';

import renderAuthCombine from './renderAuthCombine.js';
import { renderAuthDropdown } from './renderAuthDropdown.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 900px)');

const labels = await fetchPlaceholders();

const overlay = document.createElement('div');
overlay.classList.add('overlay');
document.querySelector('header').insertAdjacentElement('afterbegin', overlay);

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const navSections = nav.querySelector('.nav-sections');
    if (!navSections) return;
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      toggleAllNavSections(navSections);
      overlay.classList.remove('show');
      navSectionExpanded.focus();
    } else if (!isDesktop.matches) {
      toggleMenu(nav, navSections);
      overlay.classList.remove('show');
      nav.querySelector('button').focus();
      const navWrapper = document.querySelector('.nav-wrapper');
      navWrapper.classList.remove('active');
    }
  }
}

function closeOnFocusLost(e) {
  const nav = e.currentTarget;
  if (!nav.contains(e.relatedTarget)) {
    const navSections = nav.querySelector('.nav-sections');
    if (!navSections) return;
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      toggleAllNavSections(navSections, false);
      overlay.classList.remove('show');
    } else if (!isDesktop.matches) {
      toggleMenu(nav, navSections, true);
    }
  }
}

function openOnKeydown(e) {
  const focused = document.activeElement;
  const isNavDrop = focused.className === 'nav-drop';
  if (isNavDrop && (e.code === 'Enter' || e.code === 'Space')) {
    const dropExpanded = focused.getAttribute('aria-expanded') === 'true';
    toggleAllNavSections(focused.closest('.nav-sections'));
    focused.setAttribute('aria-expanded', dropExpanded ? 'false' : 'true');
  }
}

function focusNavSection() {
  document.activeElement.addEventListener('keydown', openOnKeydown);
}

/**
 * Toggles all nav sections
 * @param {Element} sections The container element
 * @param {Boolean} expanded Whether the element should be expanded or collapsed
 */
function toggleAllNavSections(sections, expanded = false) {
  if (!sections) return;
  sections
    .querySelectorAll('.nav-sections .default-content-wrapper > ul > li')
    .forEach((section) => {
      section.setAttribute('aria-expanded', expanded);
    });
}

/**
 * Toggles the entire nav
 * @param {Element} nav The container element
 * @param {Element} navSections The nav sections within the container element
 * @param {*} forceExpanded Optional param to force nav expand behavior when not null
 */
function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = expanded || isDesktop.matches ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  toggleAllNavSections(navSections, expanded || isDesktop.matches ? 'false' : 'true');
  button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  // enable nav dropdown keyboard accessibility
  if (navSections) {
    const navDrops = navSections.querySelectorAll('.nav-drop');
    if (isDesktop.matches) {
      navDrops.forEach((drop) => {
        if (!drop.hasAttribute('tabindex')) {
          drop.setAttribute('tabindex', 0);
          drop.addEventListener('focus', focusNavSection);
        }
      });
    } else {
      navDrops.forEach((drop) => {
        drop.classList.remove('active');
        drop.removeAttribute('tabindex');
        drop.removeEventListener('focus', focusNavSection);
      });
    }
  }

  // enable menu collapse on escape keypress
  if (!expanded || isDesktop.matches) {
    // collapse menu on escape press
    window.addEventListener('keydown', closeOnEscape);
    // collapse menu on focus lost
    nav.addEventListener('focusout', closeOnFocusLost);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
    nav.removeEventListener('focusout', closeOnFocusLost);
  }
}

const subMenuHeader = document.createElement('div');
subMenuHeader.classList.add('submenu-header');
subMenuHeader.innerHTML = '<h5 class="back-link">CMCO Products</h5><hr />';

const CMCO_CAT_ICONS = [
  '<path d="M12 2v8M9 7l3 4 3-4M7 15a5 5 0 0010 0" stroke-linecap="round" stroke-linejoin="round"/>',
  '<path d="M3 8h18M3 8v5M21 8l-5 7M16 15H7M7 15v3" stroke-linecap="round" stroke-linejoin="round"/>',
  '<path d="M8 7a4 4 0 018 0M12 11v5M8 16a4 4 0 008 0" stroke-linecap="round" stroke-linejoin="round"/>',
  '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>',
  '<path d="M3 17h18M3 17a3 3 0 106 0M21 17a3 3 0 11-6 0M3 7h18M3 12h18" stroke-linecap="round"/>',
  '<path d="M12 2C7 8 5 12 5 15a7 7 0 0014 0c0-3-2-7-7-13z" stroke-linecap="round" stroke-linejoin="round"/>',
  '<path d="M3 8h18M3 16h18M6 8v8M10 8v8M14 8v8M18 8v8" stroke-linecap="round"/>',
  '<path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" stroke-linecap="round" stroke-linejoin="round"/>',
];

const CMCO_CAT_HELPERS = {
  'Log in': 'Access your account',
  Registration: 'Create a personal account',
  'My Account': 'View account dashboard',
  'Create New Company Account': 'Start a business account',
  'Quick Order': 'Order quickly by SKU',
};

const CMCO_CAT_FALLBACK_HELPERS = [
  'Access your account',
  'Create a personal account',
  'View account dashboard',
  'Start a business account',
  'Order quickly by SKU',
];

const CMCO_FEAT_PANEL_HTML = `
<div class="cmco-feat-panel">
  <div class="cmco-feat-grid-bg"></div>
  <div class="cmco-feat-body">
    <span class="cmco-feat-eye">Featured · Intelligent Systems</span>
    <p class="cmco-feat-title">Motion.<br>Precision.<br>Control.</p>
    <p class="cmco-feat-desc">Integrated lifting and conveying systems engineered for the world's most demanding industrial environments.</p>
    <div class="cmco-feat-stats">
      <div class="cmco-fchip">
        <span class="cmco-fchip-lbl">Load Cap.</span>
        <span class="cmco-fchip-val">2.5<span class="cmco-fchip-unit"> T</span></span>
      </div>
      <div class="cmco-fchip">
        <span class="cmco-fchip-lbl">Uptime</span>
        <span class="cmco-fchip-val">99.97<span class="cmco-fchip-unit">%</span></span>
      </div>
      <div class="cmco-fchip">
        <span class="cmco-fchip-lbl">Precision</span>
        <span class="cmco-fchip-val">±0.01<span class="cmco-fchip-unit">mm</span></span>
      </div>
      <div class="cmco-fchip">
        <span class="cmco-fchip-lbl">Countries</span>
        <span class="cmco-fchip-val">50<span class="cmco-fchip-unit">+</span></span>
      </div>
    </div>
    <a href="/products" class="cmco-feat-cta">
      Explore Solutions
      <svg class="cmco-feat-arr" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M2 8h11M9 4l4 4-4 4"/>
      </svg>
    </a>
  </div>
</div>`;

/**
 * Sets up the submenu for a nav section.
 * Mobile: back header + title + plain ul.
 * Desktop: two-column mega layout with icon rows + feature panel.
 * @param {Element} navSection
 */
function setupSubmenu(navSection) {
  const submenu = navSection.querySelector('ul');
  if (!submenu) return;

  const labelEl = navSection.querySelector(':scope > p') || navSection.querySelector(':scope > a');
  const labelText = labelEl ? labelEl.textContent.trim() : '';

  const wrapper = document.createElement('div');
  wrapper.classList.add('submenu-wrapper');

  // ── Mobile ───────────────────────────────────────────────────────
  const mobileHeader = subMenuHeader.cloneNode(true);
  const mobileTitle = document.createElement('h6');
  mobileTitle.classList.add('submenu-title');
  mobileTitle.textContent = labelText;
  const mobileUl = submenu.cloneNode(true);

  wrapper.appendChild(mobileHeader);
  wrapper.appendChild(mobileTitle);
  wrapper.appendChild(mobileUl);

  // ── Desktop mega ─────────────────────────────────────────────────
  const inner = document.createElement('div');
  inner.className = 'cmco-mega-inner';

  const leftCol = document.createElement('div');
  leftCol.className = 'cmco-mega-left';

  const eyebrow = document.createElement('p');
  eyebrow.className = 'cmco-mega-lbl';
  eyebrow.textContent = 'Product Categories';
  leftCol.appendChild(eyebrow);

  const catsGrid = document.createElement('div');
  catsGrid.className = 'cmco-cats-grid';

  submenu.querySelectorAll('li').forEach((li, i) => {
    const a = li.querySelector('a');
    if (!a) return;
    const iconPath = CMCO_CAT_ICONS[i] || CMCO_CAT_ICONS[0];
    const label = a.textContent.trim();
    const helper = CMCO_CAT_HELPERS[label] || CMCO_CAT_FALLBACK_HELPERS[i] || '';
    const row = document.createElement('a');
    row.className = 'cmco-cat-row';
    row.href = a.getAttribute('href') || '#';
    row.innerHTML = `<div class="cmco-cat-ico">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">${iconPath}</svg>
      </div>
      <div class="cmco-cat-info">
        <span class="cmco-cat-name">${label}</span>
        <span class="cmco-cat-count">${helper}</span>
      </div>
      <svg class="cmco-cat-arr" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M2 8h11M9 4l4 4-4 4"/>
      </svg>`;
    catsGrid.appendChild(row);
  });

  leftCol.appendChild(catsGrid);
  inner.appendChild(leftCol);

  const rightCol = document.createElement('div');
  rightCol.className = 'cmco-mega-right';
  rightCol.innerHTML = CMCO_FEAT_PANEL_HTML;
  inner.appendChild(rightCol);

  wrapper.appendChild(inner);
  navSection.appendChild(wrapper);
  navSection.removeChild(submenu);
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  // decorate nav DOM
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  const classes = ['brand', 'sections', 'tools'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  const navBrand = nav.querySelector('.nav-brand');
  const brandLink = navBrand.querySelector('.button');
  if (brandLink) {
    brandLink.className = '';
    brandLink.closest('.button-container').className = '';
  }

  // ── Logo mark (desktop) ──────────────────────────────────────────
  const brandA = navBrand.querySelector('a');
  if (brandA) {
    const brandText = brandA.textContent.trim() || 'CMCO';
    brandA.innerHTML = `<div class="cmco-logo-mark">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.88)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2v8M9 7l3 4 3-4M7 15a5 5 0 0010 0"/>
      </svg>
    </div>
    <div class="cmco-logo-text">
      <span class="cmco-logo-name">${brandText}</span>
      <span class="cmco-logo-tagline">Intelligent Motion</span>
    </div>`;
  }

  // Shared timer — cancelled on mouseenter, fires close on mouseout
  let closeMenuTimer;

  const navSections = nav.querySelector('.nav-sections');
  if (navSections) {
    navSections
      .querySelectorAll(':scope .default-content-wrapper > ul > li')
      .forEach((navSection) => {
        if (navSection.querySelector('ul')) navSection.classList.add('nav-drop');
        setupSubmenu(navSection);
        navSection.addEventListener('click', (event) => {
          if (event.target.tagName === 'A') return;
          if (!isDesktop.matches) {
            navSection.classList.toggle('active');
          }
        });
        navSection.addEventListener('mouseenter', () => {
          clearTimeout(closeMenuTimer);
          toggleAllNavSections(navSections);
          if (isDesktop.matches) {
            if (!navSection.classList.contains('nav-drop')) {
              overlay.classList.remove('show');
              return;
            }
            navSection.setAttribute('aria-expanded', 'true');
            overlay.classList.add('show');
          }
        });
      });
  }

  let navTools = nav.querySelector('.nav-tools');

  // Create the nav-tools section if it is missing. DA.live strips empty
  // divs during content processing, leaving nav with only 2 sections
  // (brand, sections) instead of 3 — without this guard header.js throws
  // "Cannot read properties of null".
  if (!navTools) {
    navTools = document.createElement('div');
    navTools.classList.add('nav-tools');
    nav.appendChild(navTools);
  }

  /** Wishlist */
  const wishlist = document.createRange().createContextualFragment(`
     <div class="wishlist-wrapper nav-tools-wrapper">
       <button type="button" class="nav-wishlist-button" aria-label="Wishlist"></button>
       <div class="wishlist-panel nav-tools-panel"></div>
     </div>
   `);

  navTools.append(wishlist);

  const wishlistButton = navTools.querySelector('.nav-wishlist-button');

  const wishlistMeta = getMetadata('wishlist');
  const wishlistPath = wishlistMeta ? new URL(wishlistMeta, window.location).pathname : '/wishlist';

  wishlistButton.addEventListener('click', () => {
    window.location.href = rootLink(wishlistPath);
  });

  /** Mini Cart */
  const excludeMiniCartFromPaths = ['/checkout'];

  const minicart = document.createRange().createContextualFragment(`
     <div class="minicart-wrapper nav-tools-wrapper">
       <button type="button" class="nav-cart-button" aria-label="Cart"></button>
       <div class="minicart-panel nav-tools-panel"></div>
     </div>
   `);

  navTools.append(minicart);

  const minicartPanel = navTools.querySelector('.minicart-panel');

  const cartButton = navTools.querySelector('.nav-cart-button');

  if (excludeMiniCartFromPaths.includes(window.location.pathname)) {
    cartButton.style.display = 'none';
  }

  /**
   * Handles loading states for navigation panels with state management
   *
   * @param {HTMLElement} panel - The panel element to manage loading state for
   * @param {HTMLElement} button - The button that triggers the panel
   * @param {Function} loader - Async function to execute during loading
   */
  async function withLoadingState(panel, button, loader) {
    if (panel.dataset.loaded === 'true' || panel.dataset.loading === 'true') return;

    button.setAttribute('aria-busy', 'true');
    panel.dataset.loading = 'true';

    try {
      await loader();
      panel.dataset.loaded = 'true';
    } finally {
      panel.dataset.loading = 'false';
      button.removeAttribute('aria-busy');

      // Execute pending toggle if exists
      if (panel.dataset.pendingToggle === 'true') {
        // eslint-disable-next-line no-nested-ternary
        const pendingState = panel.dataset.pendingState === 'true' ? true : (panel.dataset.pendingState === 'false' ? false : undefined);

        // Clear pending flags
        panel.removeAttribute('data-pending-toggle');
        panel.removeAttribute('data-pending-state');

        // Execute the pending toggle
        const show = pendingState ?? !panel.classList.contains('nav-tools-panel--show');
        panel.classList.toggle('nav-tools-panel--show', show);
      }
    }
  }

  function togglePanel(panel, state) {
    // If loading is in progress, queue the toggle action
    if (panel.dataset.loading === 'true') {
      // Store the pending toggle action
      panel.dataset.pendingToggle = 'true';
      panel.dataset.pendingState = state !== undefined ? state.toString() : '';
      return;
    }

    const show = state ?? !panel.classList.contains('nav-tools-panel--show');
    panel.classList.toggle('nav-tools-panel--show', show);
  }

  // Lazy loading for mini cart fragment
  async function loadMiniCartFragment() {
    await withLoadingState(minicartPanel, cartButton, async () => {
      const miniCartMeta = getMetadata('mini-cart');
      const miniCartPath = miniCartMeta ? new URL(miniCartMeta, window.location).pathname : '/mini-cart';
      const miniCartFragment = await loadFragment(miniCartPath);
      minicartPanel.append(miniCartFragment.firstElementChild);
    });
  }

  async function toggleMiniCart(state) {
    if (state) {
      await loadMiniCartFragment();
      const { publishShoppingCartViewEvent } = await import('@dropins/storefront-cart/api.js');
      publishShoppingCartViewEvent();
    }

    togglePanel(minicartPanel, state);
  }

  cartButton.addEventListener('click', () => toggleMiniCart(!minicartPanel.classList.contains('nav-tools-panel--show')));

  // Cart Item Counter
  events.on('cart/data', (data) => {
    // preload mini cart fragment if user has a cart
    if (data) loadMiniCartFragment();

    if (data?.totalQuantity) {
      cartButton.setAttribute('data-count', data.totalQuantity);
    } else {
      cartButton.removeAttribute('data-count');
    }
  }, { eager: true });

  /** Search */
  const searchFragment = document.createRange().createContextualFragment(`
  <div class="search-wrapper nav-tools-wrapper">
    <button type="button" class="nav-search-button">Search</button>
    <div class="nav-search-input nav-search-panel nav-tools-panel">
      <form id="search-bar-form"></form>
      <div class="search-bar-result" style="display: none;"></div>
    </div>
  </div>
  `);

  navTools.append(searchFragment);

  const searchPanel = navTools.querySelector('.nav-search-panel');
  const searchButton = navTools.querySelector('.nav-search-button');
  const searchForm = searchPanel.querySelector('#search-bar-form');
  const searchResult = searchPanel.querySelector('.search-bar-result');

  async function toggleSearch(state) {
    const pageSize = 4;

    if (state) {
      await withLoadingState(searchPanel, searchButton, async () => {
        await import('../../scripts/initializers/search.js');

        // Load search components in parallel
        const [
          { search },
          { render },
          { SearchResults },
          { provider: UI, Input, Button },
        ] = await Promise.all([
          import('@dropins/storefront-product-discovery/api.js'),
          import('@dropins/storefront-product-discovery/render.js'),
          import('@dropins/storefront-product-discovery/containers/SearchResults.js'),
          import('@dropins/tools/components.js'),
          import('@dropins/tools/lib.js'),
        ]);

        render.render(SearchResults, {
          skeletonCount: pageSize,
          scope: 'popover',
          routeProduct: ({ urlKey, sku }) => getProductLink(urlKey, sku),
          onSearchResult: (results) => {
            searchResult.style.display = results.length > 0 ? 'block' : 'none';
          },
          slots: {
            ProductImage: (ctx) => {
              const { product, defaultImageProps } = ctx;
              const anchorWrapper = document.createElement('a');
              anchorWrapper.href = getProductLink(product.urlKey, product.sku);

              tryRenderAemAssetsImage(ctx, {
                alias: product.sku,
                imageProps: defaultImageProps,
                wrapper: anchorWrapper,
                params: {
                  width: defaultImageProps.width,
                  height: defaultImageProps.height,
                },
              });
            },
            Footer: async (ctx) => {
              // View all results button
              const viewAllResultsWrapper = document.createElement('div');

              const viewAllResultsButton = await UI.render(Button, {
                children: labels.Global?.SearchViewAll,
                variant: 'secondary',
                href: rootLink('/search'),
              })(viewAllResultsWrapper);

              ctx.appendChild(viewAllResultsWrapper);

              ctx.onChange((next) => {
                viewAllResultsButton?.setProps((prev) => ({
                  ...prev,
                  href: `${rootLink('/search')}?q=${encodeURIComponent(next.variables?.phrase || '')}`,
                }));
              });
            },
          },
        })(searchResult);

        searchForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const query = e.target.search.value;
          if (query.length) {
            window.location.href = `${rootLink('/search')}?q=${encodeURIComponent(query)}`;
          }
        });

        UI.render(Input, {
          name: 'search',
          placeholder: labels.Global?.Search,
          onValue: (phrase) => {
            if (!phrase) {
              search(null, { scope: 'popover' });
              return;
            }

            if (phrase.length < 3) {
              return;
            }

            search({
              phrase,
              pageSize,
              filter: [
                { attribute: 'visibility', in: ['Search', 'Catalog, Search'] },
              ],
            }, { scope: 'popover' });
          },
        })(searchForm);
      });
    }

    togglePanel(searchPanel, state);
    if (state) searchForm?.querySelector('input')?.focus();
  }

  searchButton.addEventListener('click', () => toggleSearch(!searchPanel.classList.contains('nav-tools-panel--show')));

  navTools.querySelector('.nav-search-button').addEventListener('click', () => {
    if (isDesktop.matches) {
      toggleAllNavSections(navSections);
      overlay.classList.remove('show');
    }
  });

  // Close panels when clicking outside
  document.addEventListener('click', (e) => {
    // Check if undo is enabled for mini cart
    const miniCartElement = document.querySelector(
      '[data-block-name="commerce-mini-cart"]',
    );
    const undoEnabled = miniCartElement
      && (miniCartElement.textContent?.includes('undo-remove-item')
        || miniCartElement.innerHTML?.includes('undo-remove-item'));

    // For mini cart: if undo is enabled, be more restrictive about when to close
    const shouldCloseMiniCart = undoEnabled
      ? !minicartPanel.contains(e.target)
      && !cartButton.contains(e.target)
      && !e.target.closest('header')
      : !minicartPanel.contains(e.target) && !cartButton.contains(e.target);

    if (shouldCloseMiniCart) {
      toggleMiniCart(false);
    }

    if (!searchPanel.contains(e.target) && !searchButton.contains(e.target)) {
      toggleSearch(false);
    }
  });

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);

  // ── Utility topbar ───────────────────────────────────────────────
  const topbar = document.createElement('div');
  topbar.className = 'cmco-topbar';
  topbar.innerHTML = `<div class="cmco-topbar-inner">
    <div class="cmco-topbar-left">
      <span>13320 Ballantyne Corporate Place, Charlotte, NC 28277</span>
      <a href="tel:+17166895400">+1 (716) 689-5400</a>
    </div>
    <div class="cmco-topbar-right">
      <span class="cmco-ticker"><span class="cmco-ticker-dot"></span>CMCO · NYSE</span>
      <a href="#">Investor Relations</a>
      <a href="#">Careers</a>
      <a href="#">Contact</a>
    </div>
  </div>`;
  block.prepend(topbar);

  // ── Scroll shadow on sticky nav ──────────────────────────────────
  window.addEventListener('scroll', () => {
    navWrapper.classList.toggle('cmco-scrolled', window.scrollY > 40);
  }, { passive: true });

  navWrapper.addEventListener('mouseout', (e) => {
    if (isDesktop.matches && !nav.contains(e.relatedTarget)) {
      clearTimeout(closeMenuTimer);
      closeMenuTimer = setTimeout(() => {
        toggleAllNavSections(navSections);
        overlay.classList.remove('show');
      }, 200);
    }
  });

  // Keep menu alive when mouse re-enters any part of the nav
  navWrapper.addEventListener('mouseover', () => clearTimeout(closeMenuTimer));

  window.addEventListener('resize', () => {
    navWrapper.classList.remove('active');
    overlay.classList.remove('show');
    toggleMenu(nav, navSections, false);
  });

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => {
    navWrapper.classList.toggle('active');
    overlay.classList.toggle('show');
    toggleMenu(nav, navSections);
  });
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');
  // prevent mobile nav behavior on window resize
  toggleMenu(nav, navSections, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(nav, navSections, isDesktop.matches));

  renderAuthCombine(
    navSections,
    () => !isDesktop.matches && toggleMenu(nav, navSections, false),
  );
  renderAuthDropdown(navTools);

  /** Company Switcher */
  const isAuthenticated = events.lastPayload('authenticated');
  if (isAuthenticated && getConfigValue('commerce-companies-enabled') === true) {
    await (await import('./renderCompanySwitcher.js')).default(navTools);
  }
}
