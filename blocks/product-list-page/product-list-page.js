// Product Discovery Dropins
import SearchResults from '@dropins/storefront-product-discovery/containers/SearchResults.js';
import Facets from '@dropins/storefront-product-discovery/containers/Facets.js';
import SortBy from '@dropins/storefront-product-discovery/containers/SortBy.js';
import Pagination from '@dropins/storefront-product-discovery/containers/Pagination.js';
import { render as provider } from '@dropins/storefront-product-discovery/render.js';
import {
  Button,
  Icon,
  Price,
  PriceRange,
  provider as UI,
} from '@dropins/tools/components.js';
import { search } from '@dropins/storefront-product-discovery/api.js';
// Wishlist Dropin
import { WishlistToggle } from '@dropins/storefront-wishlist/containers/WishlistToggle.js';
import { render as wishlistRender } from '@dropins/storefront-wishlist/render.js';
// Cart Dropin
import * as cartApi from '@dropins/storefront-cart/api.js';
import { tryRenderAemAssetsImage } from '@dropins/tools/lib/aem/assets.js';
// Event Bus
import { events } from '@dropins/tools/event-bus.js';
// AEM
import { readBlockConfig } from '../../scripts/aem.js';
import { fetchPlaceholders, getProductLink } from '../../scripts/commerce.js';
import { getSearchStateFromUrl, applySearchStateToUrl } from './search-url.js';
/* eslint-disable import/extensions */
import {
  buildActiveFilterChips,
  buildFacetMetadataMap,
  getNextUserFiltersForChip,
  normalizeSearchRequest,
} from './product-list-page.utils.mjs';
/* eslint-enable import/extensions */

// Initializers
import '../../scripts/initializers/search.js';
import '../../scripts/initializers/wishlist.js';

const FACET_DRAWER_BREAKPOINT = window.matchMedia('(min-width: 1024px)');

function decodeText(value = '') {
  return new DOMParser().parseFromString(value, 'text/html').documentElement.textContent || '';
}

function getProductDisplayName(product) {
  return decodeText(product?.name || product?.sku || '');
}

function renderComponent(component, props) {
  const container = document.createElement('div');
  UI.render(component, props)(container);
  return container;
}

function createSimplePriceContent(product) {
  const priceWrapper = document.createElement('div');
  priceWrapper.className = 'product-discovery-product-price-block';

  const label = document.createElement('span');
  label.className = 'product-discovery-product-price-block__label';
  label.textContent = 'Configured price';
  priceWrapper.append(label);

  const values = document.createElement('div');
  values.className = 'product-discovery-product-price-block__values';

  const finalAmount = product?.price?.final?.amount?.value;
  const regularAmount = product?.price?.regular?.amount?.value;
  const currency = product?.price?.regular?.amount?.currency
    || product?.price?.final?.amount?.currency
    || 'USD';
  const hasDiscount = typeof finalAmount === 'number'
    && typeof regularAmount === 'number'
    && finalAmount < regularAmount;

  values.append(renderComponent(Price, {
    amount: hasDiscount ? finalAmount : regularAmount,
    currency,
  }));

  if (hasDiscount) {
    const compare = renderComponent(Price, {
      amount: regularAmount,
      currency,
    });
    compare.className = 'product-discovery-product-price-block__compare';
    values.append(compare);
  }

  priceWrapper.append(values);
  return priceWrapper;
}

function createComplexPriceContent(product) {
  const priceWrapper = document.createElement('div');
  priceWrapper.className = 'product-discovery-product-price-block';

  const label = document.createElement('span');
  label.className = 'product-discovery-product-price-block__label';
  label.textContent = 'Configured range';
  priceWrapper.append(label);

  const values = document.createElement('div');
  values.className = 'product-discovery-product-price-block__values';

  const minimumFinal = product?.priceRange?.minimum?.final?.amount?.value;
  const maximumFinal = product?.priceRange?.maximum?.final?.amount?.value;
  const minimumRegular = product?.priceRange?.minimum?.regular?.amount?.value;
  const maximumRegular = product?.priceRange?.maximum?.regular?.amount?.value;
  const currency = product?.priceRange?.minimum?.regular?.amount?.currency
    || product?.priceRange?.minimum?.final?.amount?.currency
    || 'USD';
  const hasDiscount = typeof minimumFinal === 'number'
    && typeof maximumFinal === 'number'
    && typeof minimumRegular === 'number'
    && typeof maximumRegular === 'number'
    && (minimumFinal < minimumRegular || maximumFinal < maximumRegular);

  values.append(renderComponent(PriceRange, {
    display: 'from to',
    minimumAmount: hasDiscount ? minimumFinal : minimumRegular,
    maximumAmount: hasDiscount ? maximumFinal : maximumRegular,
    currency,
  }));

  if (hasDiscount) {
    const compare = renderComponent(PriceRange, {
      display: 'from to',
      minimumAmount: minimumRegular,
      maximumAmount: maximumRegular,
      currency,
    });
    compare.className = 'product-discovery-product-price-block__compare';
    values.append(compare);
  }

  priceWrapper.append(values);
  return priceWrapper;
}

function createProductNameContent(product) {
  const wrapper = document.createElement('div');
  wrapper.className = 'product-discovery-product-copy';

  const sku = document.createElement('span');
  sku.className = 'product-discovery-product-copy__sku';
  sku.textContent = product?.sku || '';

  const link = document.createElement('a');
  link.className = 'product-discovery-product-copy__name';
  link.href = getProductLink(product.urlKey, product.sku);
  link.textContent = getProductDisplayName(product);

  wrapper.append(sku, link);
  return wrapper;
}

function createProductPriceContent(product) {
  return product?.typename === 'ComplexProductView'
    ? createComplexPriceContent(product)
    : createSimplePriceContent(product);
}

function bindDummyFilters(panel) {
  const toggles = [...panel.querySelectorAll('[data-dummy-filter]')];
  const countLabel = panel.querySelector('.search__dummy-filter-count');
  const resultCount = panel.querySelector('[data-dummy-result-count]');
  const shipCount = panel.querySelector('[data-dummy-ship-count]');
  const summary = panel.querySelector('[data-dummy-summary]');
  const clearButton = panel.querySelector('[data-dummy-clear]');

  const updateCount = () => {
    const activeToggles = toggles.filter((toggle) => toggle.getAttribute('aria-pressed') === 'true');
    const activeCount = activeToggles.length;
    const matchReduction = activeToggles.reduce((total, toggle) => (
      total + (parseInt(toggle.dataset.dummyImpact, 10) || 0)
    ), 0);
    const shipLift = activeToggles.reduce((total, toggle) => (
      total + (parseInt(toggle.dataset.dummyShip, 10) || 0)
    ), 0);
    const estimatedMatches = Math.max(2, 7 - Math.min(matchReduction, 5));
    const estimatedShip = Math.min(estimatedMatches, Math.max(1, 3 + shipLift));

    countLabel.textContent = activeCount === 1 ? '1 active' : `${activeCount} active`;
    resultCount.textContent = estimatedMatches;
    shipCount.textContent = estimatedShip;
    summary.textContent = activeCount > 0
      ? `${estimatedMatches} demo matches tuned by ${activeCount} filter${activeCount === 1 ? '' : 's'}`
      : 'Select a few filters to shape the demo shortlist.';
    panel.classList.toggle('search__dummy-filters--active', activeCount > 0);
  };

  toggles.forEach((toggle) => {
    toggle.addEventListener('click', () => {
      const isPressed = toggle.getAttribute('aria-pressed') === 'true';
      toggle.setAttribute('aria-pressed', String(!isPressed));
      updateCount();
    });
  });

  clearButton.addEventListener('click', () => {
    toggles.forEach((toggle) => toggle.setAttribute('aria-pressed', 'false'));
    updateCount();
  });

  updateCount();
}

export default async function decorate(block) {
  const labels = await fetchPlaceholders();
  const config = readBlockConfig(block);
  const pageSize = parseInt(config.pagesize, 10) || 9;
  const blockId = `product-list-page-${Math.random().toString(36).slice(2, 9)}`;
  const searchState = getSearchStateFromUrl(new URL(window.location.href));
  const isCategoryPage = Boolean(config.urlpath);

  document.body.classList.toggle('page-category-plp', isCategoryPage);

  let latestRequest = normalizeSearchRequest({
    request: searchState,
    urlpath: config.urlpath,
    pageSize,
  });
  let latestFacetMetadata = new Map();
  let lastFilterTrigger = null;

  const fragment = document.createRange().createContextualFragment(`
    <div class="search__wrapper">
      <div class="search__layout">
        <div class="search__facets-backdrop" hidden></div>
        <aside class="search__sidebar">
          <div class="search__facets-drawer">
            <div class="search__facets-header">
              <div class="search__facets-header-copy">
                <p class="search__facets-kicker">Product filters</p>
                <h2 class="search__facets-title" id="${blockId}-facets-title">Refine the shortlist</h2>
              </div>
              <button
                type="button"
                class="search__facets-close"
                aria-label="Close filters"
              >
                Close
              </button>
            </div>
            <div class="search__dummy-filters" aria-label="Popular product filters">
              <div class="search__dummy-filter-hero">
                <span class="search__dummy-filter-count" aria-live="polite">0 active</span>
                <strong>Refined equipment match</strong>
                <p data-dummy-summary>Select a few filters to shape the demo shortlist.</p>
                <div class="search__dummy-filter-metrics" aria-label="Filter summary">
                  <span><b data-dummy-result-count>7</b> matches</span>
                  <span><b data-dummy-ship-count>3</b> fast ship</span>
                </div>
              </div>
              <div class="search__dummy-filter-group">
                <div class="search__dummy-filter-group-heading">
                  <h3>Product type</h3>
                  <span>Multiple</span>
                </div>
                <div class="search__dummy-filter-stack search__dummy-filter-stack--type">
                  <button type="button" data-dummy-filter data-dummy-impact="1" aria-pressed="true">
                    <span>Anchor shackles</span>
                    <em>7</em>
                  </button>
                  <button type="button" data-dummy-filter data-dummy-impact="1" aria-pressed="false">
                    <span>Chain hoists</span>
                    <em>4</em>
                  </button>
                  <button type="button" data-dummy-filter data-dummy-impact="2" aria-pressed="false">
                    <span>Lever tools</span>
                    <em>3</em>
                  </button>
                </div>
              </div>
              <div class="search__dummy-filter-group">
                <div class="search__dummy-filter-group-heading">
                  <h3>Capacity</h3>
                  <span>Rated load</span>
                </div>
                <div class="search__dummy-filter-grid">
                  <button type="button" data-dummy-filter data-dummy-impact="0" aria-pressed="true">Light duty</button>
                  <button type="button" data-dummy-filter data-dummy-impact="1" aria-pressed="false">1 ton</button>
                  <button type="button" data-dummy-filter data-dummy-impact="1" aria-pressed="false">2 ton</button>
                  <button type="button" data-dummy-filter data-dummy-impact="2" aria-pressed="false">Heavy lift</button>
                </div>
              </div>
              <div class="search__dummy-filter-group search__dummy-filter-group--summary">
                <div class="search__dummy-filter-group-heading">
                  <h3>Finish</h3>
                  <span>Material</span>
                </div>
                <div class="search__dummy-filter-stack">
                  <button type="button" data-dummy-filter data-dummy-impact="0" aria-pressed="true">
                    <span>
                      <i class="search__dummy-filter-swatch search__dummy-filter-swatch--galv"></i>
                      Galvanized finish
                    </span>
                    <em>7</em>
                  </button>
                  <button type="button" data-dummy-filter data-dummy-impact="1" aria-pressed="false">
                    <span>
                      <i class="search__dummy-filter-swatch search__dummy-filter-swatch--alloy"></i>
                      Alloy steel
                    </span>
                    <em>4</em>
                  </button>
                </div>
              </div>
              <div class="search__dummy-filter-group search__dummy-filter-group--summary">
                <div class="search__dummy-filter-group-heading">
                  <h3>Availability</h3>
                  <span>Fulfillment</span>
                </div>
                <div class="search__dummy-filter-stack">
                  <button type="button" data-dummy-filter data-dummy-impact="1" data-dummy-ship="2" aria-pressed="false">
                    <span>Ready to ship</span>
                    <em>5</em>
                  </button>
                  <button type="button" data-dummy-filter data-dummy-impact="0" aria-pressed="false">
                    <span>Quote eligible</span>
                    <em>7</em>
                  </button>
                </div>
              </div>
              <div class="search__dummy-filter-group search__dummy-price-card">
                <div class="search__dummy-price-label">
                  <span class="search__dummy-price-label-text">Configured price</span>
                  <strong>$2.8K - $4.3K</strong>
                </div>
                <div class="search__dummy-price-track" aria-hidden="true">
                  <span class="search__dummy-price-range"></span>
                </div>
                <div class="search__dummy-price-options">
                  <button type="button" class="search__dummy-price-option" data-dummy-filter data-dummy-impact="1" aria-pressed="false">Under $3K</button>
                  <button type="button" class="search__dummy-price-option" data-dummy-filter data-dummy-impact="1" aria-pressed="false">Best value</button>
                </div>
              </div>
              <button type="button" class="search__dummy-filter-reset" data-dummy-clear>Reset filters</button>
            </div>
            <div class="search__facets"></div>
          </div>
        </aside>
        <div class="search__main">
          <div class="search__toolbar">
            <div class="search__toolbar-copy">
              <div class="search__result-info"></div>
              <div class="search__active-filters" hidden></div>
            </div>
            <div class="search__toolbar-controls">
              <div class="search__view-facets"></div>
              <div class="search__product-sort"></div>
            </div>
          </div>
          <div class="search__product-list"></div>
          <div class="search__pagination"></div>
        </div>
      </div>
    </div>
  `);

  const $resultInfo = fragment.querySelector('.search__result-info');
  const $activeFilters = fragment.querySelector('.search__active-filters');
  const $viewFacets = fragment.querySelector('.search__view-facets');
  const $facetsBackdrop = fragment.querySelector('.search__facets-backdrop');
  const $facetsDrawer = fragment.querySelector('.search__facets-drawer');
  const $facetsClose = fragment.querySelector('.search__facets-close');
  const $dummyFilters = fragment.querySelector('.search__dummy-filters');
  const $facets = fragment.querySelector('.search__facets');
  const $productSort = fragment.querySelector('.search__product-sort');
  const $productList = fragment.querySelector('.search__product-list');
  const $pagination = fragment.querySelector('.search__pagination');

  block.innerHTML = '';
  block.appendChild(fragment);
  block.classList.toggle('product-list-page--category', isCategoryPage);
  bindDummyFilters($dummyFilters);

  if (config.urlpath) {
    block.dataset.urlpath = config.urlpath;
  }

  const setFilterTriggerCount = (count) => {
    const button = $viewFacets.querySelector('button');
    if (!button) return;

    if (count > 0) {
      button.setAttribute('data-count', count);
    } else {
      button.removeAttribute('data-count');
    }

    button.setAttribute(
      'aria-label',
      count > 0
        ? `${labels.Global?.Filters || 'Filters'} (${count} applied)`
        : (labels.Global?.Filters || 'Filters'),
    );
  };

  const syncFacetDrawerMode = () => {
    const isDesktop = FACET_DRAWER_BREAKPOINT.matches;
    const triggerButton = $viewFacets.querySelector('button');

    if (!isDesktop) {
      $facetsDrawer.setAttribute('role', 'dialog');
      $facetsDrawer.setAttribute('aria-modal', 'true');
      $facetsDrawer.setAttribute('aria-labelledby', `${blockId}-facets-title`);
      $facetsDrawer.setAttribute(
        'aria-hidden',
        block.classList.contains('product-list-page--filters-open') ? 'false' : 'true',
      );

      if (triggerButton) {
        triggerButton.setAttribute('aria-haspopup', 'dialog');
        triggerButton.setAttribute('aria-controls', blockId);
        triggerButton.setAttribute(
          'aria-expanded',
          block.classList.contains('product-list-page--filters-open') ? 'true' : 'false',
        );
      }
      return;
    }

    block.classList.remove('product-list-page--filters-open');
    $facetsBackdrop.hidden = true;
    $facetsDrawer.removeAttribute('role');
    $facetsDrawer.removeAttribute('aria-modal');
    $facetsDrawer.removeAttribute('aria-hidden');
    document.body.classList.remove('search-facets-open');
    document.body.style.overflow = '';

    if (triggerButton) {
      triggerButton.removeAttribute('aria-haspopup');
      triggerButton.removeAttribute('aria-expanded');
      triggerButton.removeAttribute('aria-controls');
    }
  };

  const closeFacetDrawer = ({ restoreFocus = true } = {}) => {
    if (FACET_DRAWER_BREAKPOINT.matches) return;

    block.classList.remove('product-list-page--filters-open');
    $facetsBackdrop.hidden = true;
    $facetsDrawer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('search-facets-open');
    document.body.style.overflow = '';

    const triggerButton = $viewFacets.querySelector('button');
    if (triggerButton) {
      triggerButton.setAttribute('aria-expanded', 'false');
    }

    if (restoreFocus && lastFilterTrigger?.focus) {
      lastFilterTrigger.focus();
    }
  };

  const openFacetDrawer = () => {
    if (FACET_DRAWER_BREAKPOINT.matches) return;

    lastFilterTrigger = document.activeElement;
    block.classList.add('product-list-page--filters-open');
    $facetsBackdrop.hidden = false;
    $facetsDrawer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('search-facets-open');
    document.body.style.overflow = 'hidden';

    const triggerButton = $viewFacets.querySelector('button');
    if (triggerButton) {
      triggerButton.setAttribute('aria-expanded', 'true');
    }

    window.requestAnimationFrame(() => {
      $facetsClose.focus();
    });
  };

  const runSearch = async (request) => {
    latestRequest = normalizeSearchRequest({
      request,
      urlpath: config.urlpath,
      pageSize,
    });

    await search(latestRequest).catch((error) => {
      console.error('Error searching for products', error);
    });
  };

  const renderActiveFilters = (chips) => {
    $activeFilters.innerHTML = '';
    block.classList.toggle('product-list-page--has-active-filters', chips.length > 0);

    if (!chips.length) {
      $activeFilters.hidden = true;
      return;
    }

    const heading = document.createElement('span');
    heading.className = 'search__active-filters-title';
    heading.textContent = 'Active filters';

    $activeFilters.append(heading);

    chips.forEach((chip) => {
      const chipButton = document.createElement('button');
      chipButton.type = 'button';
      chipButton.className = 'search__active-filter';
      chipButton.setAttribute('aria-label', `Remove ${chip.label} filter`);

      const chipLabel = document.createElement('span');
      chipLabel.className = 'search__active-filter-label';
      chipLabel.textContent = chip.label;

      const chipDismiss = document.createElement('span');
      chipDismiss.className = 'search__active-filter-dismiss';
      chipDismiss.setAttribute('aria-hidden', 'true');
      chipDismiss.textContent = '×';

      chipButton.append(chipLabel, chipDismiss);
      chipButton.addEventListener('click', () => {
        runSearch({
          ...latestRequest,
          currentPage: 1,
          filter: getNextUserFiltersForChip(latestRequest.filter, chip),
        });
      });
      $activeFilters.append(chipButton);
    });

    const clearButton = document.createElement('button');
    clearButton.type = 'button';
    clearButton.className = 'search__clear-filters';
    clearButton.textContent = 'Clear all';
    clearButton.addEventListener('click', () => {
      runSearch({
        ...latestRequest,
        currentPage: 1,
        filter: [],
      });
    });
    $activeFilters.append(clearButton);
    $activeFilters.hidden = false;
  };

  const getAddToCartButton = (product) => {
    if (product.typename === 'ComplexProductView') {
      return renderComponent(Button, {
        children: labels.Global?.AddProductToCart || 'View product',
        icon: Icon({ source: 'Cart' }),
        href: getProductLink(product.urlKey, product.sku),
        variant: 'primary',
      });
    }

    return renderComponent(Button, {
      children: labels.Global?.AddProductToCart || 'Add to cart',
      icon: Icon({ source: 'Cart' }),
      onClick: () => cartApi.addProductsToCart([{
        sku: product.sku,
        quantity: 1,
      }]),
      variant: 'primary',
    });
  };

  await Promise.all([
    provider.render(SortBy, {})($productSort),

    provider.render(Pagination, {
      onPageChange: () => {
        window.scrollTo({
          top: 0,
          behavior: 'smooth',
        });
      },
    })($pagination),

    UI.render(Button, {
      children: labels.Global?.Filters || 'Filters',
      icon: Icon({ source: 'Burger' }),
      variant: 'secondary',
      onClick: () => {
        openFacetDrawer();
      },
    })($viewFacets),

    provider.render(Facets, {})($facets),

    provider.render(SearchResults, {
      routeProduct: (product) => getProductLink(product.urlKey, product.sku),
      slots: {
        ProductImage: (ctx) => {
          const {
            product,
            defaultImageProps,
          } = ctx;
          const anchorWrapper = document.createElement('a');
          anchorWrapper.href = getProductLink(product.urlKey, product.sku);
          anchorWrapper.className = 'product-discovery-product-image-link';

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
        ProductName: (ctx) => {
          ctx.replaceWith(createProductNameContent(ctx.product));
        },
        ProductPrice: (ctx) => {
          ctx.replaceWith(createProductPriceContent(ctx.product));
        },
        ProductActions: async (ctx) => {
          const actionsWrapper = document.createElement('div');
          actionsWrapper.className = 'product-discovery-product-actions';

          const addToCartBtn = getAddToCartButton(ctx.product);
          addToCartBtn.classList.add('product-discovery-product-actions__add-to-cart');

          const wishlistToggle = document.createElement('div');
          wishlistToggle.classList.add('product-discovery-product-actions__wishlist-toggle');
          wishlistRender.render(WishlistToggle, {
            product: ctx.product,
            variant: 'tertiary',
          })(wishlistToggle);

          actionsWrapper.append(addToCartBtn, wishlistToggle);

          try {
            const { initializeRequisitionList } = await import('./requisition-list.js');

            const requisitionList = await initializeRequisitionList({
              product: ctx.product,
              labels,
            });

            requisitionList.classList.add('product-discovery-product-actions__requisition-list');
            actionsWrapper.append(requisitionList);
          } catch (error) {
            console.warn('Requisition list module not available:', error);
          }

          ctx.replaceWith(actionsWrapper);
        },
      },
    })($productList),
  ]);

  $facetsDrawer.id = blockId;
  $facetsBackdrop.addEventListener('click', () => closeFacetDrawer());
  $facetsClose.addEventListener('click', () => closeFacetDrawer());

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && block.classList.contains('product-list-page--filters-open')) {
      closeFacetDrawer();
    }
  });

  FACET_DRAWER_BREAKPOINT.addEventListener('change', syncFacetDrawerMode);
  syncFacetDrawerMode();

  const normalizedUrl = new URL(window.location.href);
  applySearchStateToUrl(normalizedUrl, latestRequest);
  window.history.replaceState({}, '', normalizedUrl.toString());

  events.on('search/result', (payload) => {
    const totalCount = payload.result?.totalCount || 0;
    const countFormatter = new Intl.NumberFormat('en-US');

    latestRequest = normalizeSearchRequest({
      request: payload.request,
      urlpath: config.urlpath,
      pageSize,
    });
    latestFacetMetadata = buildFacetMetadataMap(payload.result?.facets || []);

    const chips = buildActiveFilterChips(latestRequest.filter, latestFacetMetadata);

    block.classList.toggle('product-list-page--empty', totalCount === 0);

    $resultInfo.innerHTML = payload.request?.phrase
      ? `${countFormatter.format(totalCount)} results for <strong>"${payload.request.phrase}"</strong>`
      : `${countFormatter.format(totalCount)} products`;

    renderActiveFilters(chips);
    setFilterTriggerCount(chips.length);
  }, { eager: true });

  events.on('search/result', (payload) => {
    const url = new URL(window.location.href);
    applySearchStateToUrl(url, payload.request);
    window.history.pushState({}, '', url.toString());
  }, { eager: false });

  await runSearch(searchState);
}
