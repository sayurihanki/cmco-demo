import {
  Button, Icon, InLineAlert, provider as UI,
} from '@dropins/tools/components.js';
import { h } from '@dropins/tools/preact.js';
import { events } from '@dropins/tools/event-bus.js';
import { tryRenderAemAssetsImage } from '@dropins/tools/lib/aem/assets.js';
import * as pdpApi from '@dropins/storefront-pdp/api.js';
import { render as pdpRendered } from '@dropins/storefront-pdp/render.js';
import { render as wishlistRender } from '@dropins/storefront-wishlist/render.js';
import { render as quickOrderProvider } from '@dropins/storefront-quick-order/render.js';

// Quick Order Dropin
import QuickOrderVariantsGrid from '@dropins/storefront-quick-order/containers/QuickOrderVariantsGrid.js';

// Wishlist Dropin
import { WishlistToggle } from '@dropins/storefront-wishlist/containers/WishlistToggle.js';
import { WishlistAlert } from '@dropins/storefront-wishlist/containers/WishlistAlert.js';

// PDP Containers
import ProductHeader from '@dropins/storefront-pdp/containers/ProductHeader.js';
import ProductPrice from '@dropins/storefront-pdp/containers/ProductPrice.js';
import ProductShortDescription from '@dropins/storefront-pdp/containers/ProductShortDescription.js';
import ProductOptions from '@dropins/storefront-pdp/containers/ProductOptions.js';
import ProductQuantity from '@dropins/storefront-pdp/containers/ProductQuantity.js';
import ProductDescription from '@dropins/storefront-pdp/containers/ProductDescription.js';
import ProductAttributes from '@dropins/storefront-pdp/containers/ProductAttributes.js';
import ProductGallery from '@dropins/storefront-pdp/containers/ProductGallery.js';
import ProductGiftCardOptions from '@dropins/storefront-pdp/containers/ProductGiftCardOptions.js';

// Libs
import {
  checkIsAuthenticated,
  fetchPlaceholders, getProductLink, rootLink, setJsonLd,
} from '../../scripts/commerce.js';
import { readBlockConfig } from '../../scripts/aem.js';

// Initializers
import { IMAGES_SIZES } from '../../scripts/initializers/pdp.js';
import '../../scripts/initializers/cart.js';
import '../../scripts/initializers/wishlist.js';
import '../../scripts/initializers/quick-order.js';
import {
  initializeRequisitionListForProduct,
  createRequisitionListRenderer,
} from './requisition-list.js';
import { mountProductInputOptions } from '../../scripts/components/pdp-input-options/pdp-input-options.js';
/* eslint-disable import/extensions */
import {
  PRODUCT_DETAILS_PRESENTATIONS,
  normalizeProductDetailsConfig,
  shouldActivateConfigurator,
  shouldActivateImmersivePresentation,
} from './product-details.utils.mjs';
import { getProductDetailsConfigTableData } from './product-details.config-table-data.mjs';
import {
  PRODUCT_DETAILS_CONFIG_TABLE_PAGE_SIZE,
  applyProductDetailsConfigTableState,
  getProductDetailsConfigTableFilterOptions,
  normalizeProductDetailsConfigTableQuantity,
} from './product-details.config-table-utils.mjs';
import {
  addConfigTableRowToCart,
  buildConfigTableCartItem,
  canBuildConfigTableCartItem,
  loadConfigTableCommerceContext,
} from './product-details.config-table-commerce.mjs';
/* eslint-enable import/extensions */

/**
 * Checks if the page has prerendered product JSON-LD data
 * @returns {boolean} True if product JSON-LD exists and contains @type=Product
 */
function isProductPrerendered() {
  const jsonLdScript = document.querySelector('script[type="application/ld+json"]');

  if (!jsonLdScript?.textContent) {
    return false;
  }

  try {
    const jsonLd = JSON.parse(jsonLdScript.textContent);
    return jsonLd?.['@type'] === 'Product';
  } catch (error) {
    console.debug('Failed to parse JSON-LD:', error);
    return false;
  }
}

// Function to update the Add to Cart button text
function updateAddToCartButtonText(addToCartInstance, inCart, labels) {
  const buttonText = inCart
    ? labels.Global?.UpdateProductInCart
    : labels.Global?.AddProductToCart;
  if (addToCartInstance) {
    addToCartInstance.setProps((prev) => ({
      ...prev,
      children: buttonText,
    }));
  }
}

/**
 * Formats numeric attribute values for display (e.g., "10.000000" → "10").
 * Non-numeric values are returned as-is.
 */
function formatNumericAttributeValue(value) {
  const trimmed = value.trim();
  if (!/^[+-]?\d+(\.\d+)?$/.test(trimmed)) return value;
  return new Intl.NumberFormat(document.documentElement.lang).format(Number(trimmed));
}

function hideRedundantShortDescription($header, $shortDescription) {
  if (!$header || !$shortDescription) return;

  const title = $header.querySelector('.pdp-header__title')?.textContent?.trim();
  const shortText = $shortDescription.textContent?.trim();

  if (!title || !shortText) return;

  const isDuplicate = title.localeCompare(shortText, undefined, { sensitivity: 'accent' }) === 0;
  $shortDescription.hidden = isDuplicate;
  $shortDescription.setAttribute('aria-hidden', isDuplicate ? 'true' : 'false');
}

function hideRedundantHeaderSku($header) {
  if (!$header) return;

  const title = $header.querySelector('.pdp-header__title')?.textContent?.trim();
  const $sku = $header.querySelector('.pdp-header__sku');

  if (!$sku || !title) return;

  const skuText = $sku.textContent?.trim();
  const isDuplicate = skuText && title.localeCompare(skuText, undefined, { sensitivity: 'accent' }) === 0;
  $sku.hidden = isDuplicate;
  $sku.setAttribute('aria-hidden', isDuplicate ? 'true' : 'false');
}

function resolveProductDetailsSvgUrl(value = '') {
  const normalized = String(value || '').trim();

  if (!normalized) {
    return '';
  }

  try {
    return new URL(normalized, window.location.href).toString();
  } catch (error) {
    console.warn('product-details: invalid svg-url value', error);
    return '';
  }
}

function loadProductDetailsSvgMedia(url = '') {
  if (!url) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve({ url });
    image.onerror = () => resolve(null);
    image.src = url;
  });
}

function getPrimaryProductImageUrl(product = {}) {
  const mainImage = product?.images?.find((image) => image?.roles?.includes('thumbnail'));
  return mainImage?.url || product?.images?.[0]?.url || '';
}

function getScrollBehavior() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
}

function scrollElementIntoView(element) {
  if (!element) {
    return;
  }

  element.scrollIntoView({
    behavior: getScrollBehavior(),
    block: 'center',
  });
}

function createMediaOptionButton({
  view,
  label,
  meta,
  previewUrl,
  isActive,
  onSelect,
}) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'product-details__media-option';
  button.dataset.mediaView = view;
  button.setAttribute('aria-pressed', isActive ? 'true' : 'false');

  if (isActive) {
    button.classList.add('is-active');
  }

  const preview = document.createElement('span');
  preview.className = 'product-details__media-option-preview';

  if (previewUrl) {
    const image = document.createElement('img');
    image.src = previewUrl;
    image.alt = '';
    image.loading = 'lazy';
    preview.append(image);
  } else {
    const fallback = document.createElement('span');
    fallback.className = 'product-details__media-option-fallback';
    fallback.textContent = label.slice(0, 1).toUpperCase();
    preview.append(fallback);
  }

  const copy = document.createElement('span');
  copy.className = 'product-details__media-option-copy';

  const title = document.createElement('span');
  title.className = 'product-details__media-option-title';
  title.textContent = label;

  const metaText = document.createElement('span');
  metaText.className = 'product-details__media-option-meta';
  metaText.textContent = meta;

  copy.append(title, metaText);
  button.append(preview, copy);
  button.addEventListener('click', () => onSelect(view));

  return button;
}

function hasRenderedContent(element) {
  return [...element.childNodes].some((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent.trim().length > 0;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return false;
    }

    if (['IMG', 'VIDEO', 'IFRAME', 'TABLE', 'UL', 'OL', 'DL'].includes(node.nodeName)) {
      return true;
    }

    return node.textContent.trim().length > 0 || Boolean(
      node.querySelector('img, video, iframe, table, ul, ol, dl, li, p, div, section, article'),
    );
  });
}

const PDP_SECTION_IDS = Object.freeze({
  OVERVIEW: 'pdp-overview',
  PURCHASE: 'pdp-purchase-controls',
  CONFIG_TABLE: 'pdp-config-table',
  FEATURES: 'pdp-features',
  SPECIFICATIONS: 'pdp-specifications',
  RELATED: 'pdp-related',
});

const CONFIG_TABLE_COLUMNS = Object.freeze([
  { key: 'id', label: 'Long Item #', sortable: true },
  { key: 'desc', label: 'Description', sortable: true },
  {
    key: 'wll', label: 'WLL (lbs)', sortable: true, align: 'right',
  },
  { key: 'size', label: 'Size (in)', sortable: true },
  { key: 'pin', label: 'Pin Type', sortable: true },
  { key: 'finish', label: 'Finish', sortable: true },
  { key: 'qty', label: 'Qty. in Stock', align: 'right' },
  { key: 'lt', label: 'Lead Time', align: 'center' },
  {
    key: 'price', label: 'List Price', sortable: true, align: 'right',
  },
  { key: 'actions', label: 'Actions', align: 'right' },
]);

const PRODUCT_CONFIG_TABLE_FALLBACKS = Object.freeze({
  'cm anchor shackles': 'cm-anchor-shackles',
});

function createElement(tag, className = '', attrs = {}) {
  const element = document.createElement(tag);
  if (className) element.className = className;

  Object.entries(attrs).forEach(([name, value]) => {
    if (value === undefined || value === null || value === '') return;
    element.setAttribute(name, value);
  });

  return element;
}

function formatConfigTableMoney(amount, currency = 'USD') {
  return new Intl.NumberFormat(document.documentElement.lang || 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatConfigTableNumber(value) {
  return new Intl.NumberFormat(document.documentElement.lang || 'en-US').format(value);
}

function getConfigTableFinishModifier(finish = '') {
  const normalized = finish.toLowerCase();

  if (normalized.includes('galvanized')) return 'galvanized';
  if (normalized.includes('orange')) return 'orange';
  return 'self';
}

function getConfigTableLeadTimeModifier(days = 0) {
  if (days <= 5) return 'fast';
  if (days <= 14) return 'mid';
  return 'slow';
}

function getConfigTableStockModifier(quantity) {
  if (!quantity) return 'none';
  if (quantity < 10) return 'low';
  return 'in';
}

function appendConfigTableCell(rowElement, content, { align = '', className = '' } = {}) {
  const cell = document.createElement('td');
  if (align) cell.classList.add(`product-details__config-table-cell--${align}`);
  if (className) cell.classList.add(className);

  if (content instanceof Node) {
    cell.append(content);
  } else {
    cell.textContent = content;
  }

  rowElement.append(cell);
  return cell;
}

function createConfigTableSelect(label, values, formatValue, onChange) {
  const field = createElement('label', 'product-details__config-table-field');
  const labelText = createElement('span', 'product-details__config-table-field-label');
  labelText.textContent = label;

  const select = createElement('select', 'product-details__config-table-select');
  select.append(new Option('All', ''));
  values.forEach((value) => {
    select.append(new Option(formatValue(value), String(value)));
  });

  select.addEventListener('change', () => onChange(select.value));
  field.append(labelText, select);

  return field;
}

function createConfigTableStatus() {
  const status = createElement('div', 'product-details__config-table-status', {
    role: 'status',
    'aria-live': 'polite',
    hidden: true,
  });

  let timeoutId = null;

  return {
    element: status,
    show(message, type = 'success') {
      clearTimeout(timeoutId);
      status.textContent = message;
      status.hidden = false;
      status.dataset.status = type;

      timeoutId = window.setTimeout(() => {
        status.hidden = true;
      }, 4200);
    },
  };
}

function buildVariantOptionSummary(row) {
  if (!row) {
    return '';
  }

  const parts = [
    row.id || '',
    row.wll ? `${formatConfigTableNumber(row.wll)} lbs WLL` : '',
    row.size ? `${row.size}"` : '',
    row.pin || '',
    row.finish || '',
    row.qty ? `${formatConfigTableNumber(row.qty)} in stock` : 'Made to order',
    row.lt ? `${row.lt}d lead time` : '',
    Number.isFinite(row.price) ? formatConfigTableMoney(row.price) : '',
  ].filter(Boolean);

  return parts.join(' / ');
}

function getConfigTableRowKey(row = {}) {
  return String(row?.id || '').trim().toLowerCase();
}

function getProductConfigTableFallbackFamily(product = {}) {
  const keys = [
    product?.sku,
    product?.name,
  ]
    .map((value) => String(value || '').trim().toLowerCase())
    .filter(Boolean);

  return keys.map((key) => PRODUCT_CONFIG_TABLE_FALLBACKS[key]).find(Boolean) || '';
}

function getBuyBoxConfigTableData(product = {}, config = {}) {
  if (getOptionGroupCount(product) > 0) {
    return null;
  }

  if (config.configTableEnabled) {
    return getProductDetailsConfigTableData(config.configTableFamily);
  }

  const fallbackFamily = getProductConfigTableFallbackFamily(product);
  return fallbackFamily ? getProductDetailsConfigTableData(fallbackFamily) : null;
}

function getConfigTableRowOptionsUIDs(commerceContext, row = {}) {
  if (!commerceContext) {
    return [];
  }

  const key = getConfigTableRowKey(row);
  const variantPayload = commerceContext.variantMap.get(key);
  const optionUID = commerceContext.optionMap.get(key);

  return variantPayload?.optionsUIDs || (optionUID ? [optionUID] : []);
}

function hasBackendMappedConfigTableRow(row = {}) {
  return Array.isArray(row?.optionsUIDs) && row.optionsUIDs.length > 0;
}

function getBuyBoxConfigTableRows(tableData, commerceContext) {
  if (!tableData?.rows?.length) {
    return [];
  }

  return tableData.rows.map((row) => ({
    ...row,
    optionsUIDs: getConfigTableRowOptionsUIDs(commerceContext, row),
  }));
}

function createFallbackOptionSelect({
  id,
  label,
  values,
  value,
  formatValue = String,
  disabled = false,
  onChange,
}) {
  const field = createElement('label', 'product-details__fallback-options-field', { for: id });
  const labelText = createElement('span', 'product-details__fallback-options-field-label');
  labelText.textContent = label;

  const select = createElement('select', 'product-details__fallback-options-select', { id });
  select.disabled = disabled;
  select.append(new Option('Select', ''));
  values.forEach((optionValue) => {
    select.append(new Option(formatValue(optionValue), String(optionValue)));
  });
  select.value = values.some((optionValue) => String(optionValue) === String(value)) ? String(value) : '';
  select.addEventListener('change', () => onChange(select.value));

  field.append(labelText, select);
  return field;
}

function renderFallbackVariantSelector(
  container,
  rows = [],
  {
    onChange = () => {},
    isRowCartReady = () => true,
    unavailableMessage = '',
  } = {},
) {
  if (!container) {
    return { hasOptions: false, getSelectedRow: () => null };
  }

  container.replaceChildren();

  if (!Array.isArray(rows) || rows.length === 0) {
    container.hidden = true;
    return { hasOptions: false, getSelectedRow: () => null };
  }

  container.hidden = false;

  const wrapper = createElement('div', 'product-details__fallback-options');
  const title = createElement('p', 'product-details__fallback-options-label');
  title.textContent = 'Customizable shackle options';

  const helper = createElement('p', 'product-details__fallback-options-helper');
  const hasMappedRows = rows.some(isRowCartReady);
  helper.textContent = hasMappedRows
    ? 'Select all attributes to choose a shackle option.'
    : unavailableMessage;
  helper.hidden = !helper.textContent;

  const summary = createElement('p', 'product-details__fallback-options-summary');
  summary.hidden = true;

  const state = {
    filters: {
      wll: '',
      size: '',
      pin: '',
      finish: '',
    },
  };

  const keys = ['wll', 'size', 'pin', 'finish'];
  const labels = {
    wll: 'Working Load Limit',
    size: 'Size',
    pin: 'Pin Type',
    finish: 'Finish',
  };
  const formatters = {
    wll: (value) => `${formatConfigTableNumber(value)} lbs`,
    size: (value) => `${value}"`,
    pin: String,
    finish: String,
  };

  const getMatchingRows = (ignoredKey = '') => rows.filter((row) => keys.every((key) => (
    key === ignoredKey || !state.filters[key] || String(row[key]) === String(state.filters[key])
  )));

  const getValues = (key) => {
    const values = getMatchingRows(key)
      .map((row) => row[key])
      .filter((value) => value !== undefined && value !== null && value !== '');
    const unique = [...new Set(values)];

    return key === 'wll'
      ? unique.sort((a, b) => Number(a) - Number(b))
      : unique.sort((a, b) => String(a).localeCompare(String(b)));
  };

  const sync = () => {
    const selectedRow = keys.every((key) => state.filters[key])
      ? rows.find((row) => keys.every((key) => (
        String(row[key]) === String(state.filters[key])
      ))) || null
      : null;
    const summaryText = buildVariantOptionSummary(selectedRow);
    const selectedRowUnavailable = selectedRow && !isRowCartReady(selectedRow);
    const selectedMessage = selectedRowUnavailable && unavailableMessage
      ? `${summaryText} ${unavailableMessage}`
      : summaryText;

    summary.textContent = selectedMessage;
    if (selectedRowUnavailable) {
      summary.dataset.status = 'warning';
    } else {
      delete summary.dataset.status;
    }
    summary.hidden = !selectedMessage;
    onChange(selectedRow);
  };

  const renderControls = () => {
    wrapper.replaceChildren(title, helper);

    const controls = createElement('div', 'product-details__fallback-options-controls');
    keys.forEach((key) => {
      const values = getValues(key);
      const hasCurrentValue = values.some((value) => (
        String(value) === String(state.filters[key])
      ));
      if (state.filters[key] && !hasCurrentValue) {
        state.filters[key] = '';
      }

      controls.append(createFallbackOptionSelect({
        id: `product-details-fallback-${key}`,
        label: labels[key],
        values,
        value: state.filters[key],
        formatValue: formatters[key],
        disabled: values.length === 0,
        onChange: (value) => {
          state.filters[key] = value;
          renderControls();
        },
      }));
    });

    wrapper.append(controls, summary);
    sync();
  };

  container.append(wrapper);
  renderControls();

  return {
    hasOptions: true,
    getSelectedRow: () => (keys.every((key) => state.filters[key])
      ? rows.find((row) => keys.every((key) => (
        String(row[key]) === String(state.filters[key])
      ))) || null
      : null),
  };
}

function createConfigTableSortButton(column, state, onSort) {
  const button = createElement('button', 'product-details__config-table-sort');
  button.type = 'button';
  button.textContent = column.label;
  button.dataset.sortKey = column.key;
  button.addEventListener('click', () => {
    onSort({
      key: column.key,
      direction: state.sort.key === column.key && state.sort.direction === 'asc'
        ? 'desc'
        : 'asc',
    });
  });

  return button;
}

function syncConfigTableSortHeaders(table, state) {
  table.querySelectorAll('.product-details__config-table-sort').forEach((button) => {
    const isActive = button.dataset.sortKey === state.sort.key;
    button.dataset.direction = isActive ? state.sort.direction : '';
    button.setAttribute('aria-sort', isActive ? state.sort.direction : 'none');
  });
}

async function renderProductDetailsConfigTable(
  container,
  tableData,
  parentSku = '',
  commerceContextPromise = null,
) {
  if (!container || !tableData?.rows?.length) return;

  container.hidden = true;

  const normalizedParentSku = String(parentSku || '').trim();
  if (!normalizedParentSku) return;

  let commerceContext = null;
  try {
    commerceContext = commerceContextPromise
      ? await commerceContextPromise
      : await loadConfigTableCommerceContext(normalizedParentSku);
  } catch (error) {
    console.warn('product-details: unable to load backend options for config table.', error);
    return;
  }

  const { rows } = tableData;

  if (rows.length === 0) {
    console.warn(
      `product-details: no backend-backed configuration rows are available for "${normalizedParentSku}".`,
    );
    return;
  }

  container.hidden = false;

  const filterOptions = getProductDetailsConfigTableFilterOptions(rows);
  const status = createConfigTableStatus();
  const state = {
    filters: {},
    page: 1,
    pageSize: PRODUCT_DETAILS_CONFIG_TABLE_PAGE_SIZE,
    quantities: {},
    selectedId: '',
    sort: { key: '', direction: 'asc' },
  };

  const intro = createElement('div', 'product-details__config-table-intro');
  const copy = createElement('div', 'product-details__config-table-copy');
  const eyebrow = createElement('p', 'product-details__section-kicker');
  eyebrow.textContent = tableData.eyebrow || 'Config table';
  const title = createElement('h2', 'product-details__section-heading');
  title.textContent = tableData.title || 'Configuration table';
  const description = createElement('p', 'product-details__config-table-description');
  description.textContent = tableData.description || '';
  copy.append(eyebrow, title, description);

  const count = createElement('div', 'product-details__config-table-count');
  intro.append(copy, count);

  const controls = createElement('div', 'product-details__config-table-controls');
  const searchField = createElement('label', 'product-details__config-table-search');
  const searchLabel = createElement('span', 'product-details__config-table-field-label');
  searchLabel.textContent = 'Search';
  const searchInput = createElement('input', 'product-details__config-table-input', {
    type: 'search',
    placeholder: 'Search item or description',
  });
  searchInput.addEventListener('input', () => {
    state.filters.query = searchInput.value;
    state.page = 1;
    render();
  });
  searchField.append(searchLabel, searchInput);

  controls.append(
    searchField,
    createConfigTableSelect('Description', filterOptions.desc, String, (value) => {
      state.filters.desc = value;
      state.page = 1;
      render();
    }),
    createConfigTableSelect('WLL', filterOptions.wll, formatConfigTableNumber, (value) => {
      state.filters.wll = value;
      state.page = 1;
      render();
    }),
    createConfigTableSelect('Size', filterOptions.size, String, (value) => {
      state.filters.size = value;
      state.page = 1;
      render();
    }),
    createConfigTableSelect('Pin Type', filterOptions.pin, String, (value) => {
      state.filters.pin = value;
      state.page = 1;
      render();
    }),
    createConfigTableSelect('Finish', filterOptions.finish, String, (value) => {
      state.filters.finish = value;
      state.page = 1;
      render();
    }),
  );

  const tableShell = createElement('div', 'product-details__config-table-card');
  const tableWrap = createElement('div', 'product-details__config-table-wrap');
  const table = createElement('table', 'product-details__config-table-table');
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  const tbody = document.createElement('tbody');
  const pagination = createElement('div', 'product-details__config-table-pagination');

  CONFIG_TABLE_COLUMNS.forEach((column) => {
    const header = document.createElement('th');
    header.scope = 'col';
    if (column.align) header.classList.add(`product-details__config-table-cell--${column.align}`);

    if (column.sortable) {
      header.append(createConfigTableSortButton(column, state, (nextSort) => {
        state.sort = nextSort;
        state.page = 1;
        render();
      }));
    } else {
      header.textContent = column.label;
    }

    headerRow.append(header);
  });

  thead.append(headerRow);
  table.append(thead, tbody);
  tableWrap.append(table);
  tableShell.append(tableWrap, pagination);
  container.replaceChildren(intro, status.element, controls, tableShell);

  function renderPagination(tableState) {
    pagination.replaceChildren();

    if (tableState.totalItems === 0) {
      pagination.hidden = true;
      return;
    }

    pagination.hidden = false;

    const pageInfo = createElement('span', 'product-details__config-table-page-info');
    pageInfo.textContent = `Showing ${tableState.startIndex}-${tableState.endIndex} of ${tableState.totalItems}`;

    const controlsWrapper = createElement('div', 'product-details__config-table-page-controls');
    [
      ['First', 1, tableState.currentPage === 1],
      ['Previous', tableState.currentPage - 1, tableState.currentPage === 1],
      ['Next', tableState.currentPage + 1, tableState.currentPage === tableState.totalPages],
      ['Last', tableState.totalPages, tableState.currentPage === tableState.totalPages],
    ].forEach(([label, page, disabled]) => {
      const button = createElement('button', 'product-details__config-table-page-button');
      button.type = 'button';
      button.textContent = label;
      button.disabled = disabled;
      button.addEventListener('click', () => {
        state.page = page;
        render();
      });
      controlsWrapper.append(button);
    });

    pagination.append(pageInfo, controlsWrapper);
  }

  function renderRows(tableState) {
    tbody.replaceChildren();

    if (tableState.rows.length === 0) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = CONFIG_TABLE_COLUMNS.length;
      cell.className = 'product-details__config-table-empty';
      cell.textContent = 'No items match the current filters.';
      row.append(cell);
      tbody.append(row);
      return;
    }

    tableState.rows.forEach((row) => {
      const tr = document.createElement('tr');
      tr.classList.toggle('is-selected', state.selectedId === row.id);
      tr.addEventListener('click', () => {
        state.selectedId = state.selectedId === row.id ? '' : row.id;
        render();
      });

      const item = createElement('span', 'product-details__config-table-item');
      item.textContent = row.id;
      appendConfigTableCell(tr, item);
      appendConfigTableCell(tr, row.desc);
      appendConfigTableCell(tr, `${formatConfigTableNumber(row.wll)} lbs`, { align: 'right' });
      appendConfigTableCell(tr, `${row.size}"`);
      appendConfigTableCell(tr, row.pin);

      const finish = createElement(
        'span',
        `product-details__config-table-badge product-details__config-table-badge--${getConfigTableFinishModifier(row.finish)}`,
      );
      finish.textContent = row.finish === 'Orange Powder Coated' ? 'Orange P.C.' : row.finish;
      appendConfigTableCell(tr, finish);

      const stock = createElement(
        'span',
        `product-details__config-table-stock product-details__config-table-stock--${getConfigTableStockModifier(row.qty)}`,
      );
      stock.textContent = row.qty ? String(row.qty) : '-';
      appendConfigTableCell(tr, stock, { align: 'right' });

      const leadTime = createElement(
        'span',
        `product-details__config-table-lead product-details__config-table-lead--${getConfigTableLeadTimeModifier(row.lt)}`,
      );
      leadTime.textContent = `${row.lt}d`;
      appendConfigTableCell(tr, leadTime, { align: 'center' });

      appendConfigTableCell(tr, formatConfigTableMoney(row.price), { align: 'right' });

      const actions = createElement('div', 'product-details__config-table-actions');
      const quantity = createElement('input', 'product-details__config-table-quantity', {
        type: 'number',
        min: '1',
        value: String(state.quantities[row.id] || 1),
        'aria-label': `Quantity for ${row.id}`,
      });
      quantity.addEventListener('click', (event) => event.stopPropagation());
      quantity.addEventListener('change', () => {
        state.quantities[row.id] = normalizeProductDetailsConfigTableQuantity(quantity.value);
        quantity.value = String(state.quantities[row.id]);
      });

      const add = createElement('button', 'product-details__config-table-add');
      add.type = 'button';
      add.textContent = 'Add';
      if (!canBuildConfigTableCartItem(commerceContext, row)) {
        add.title = 'This option still needs Commerce mapping before it can be added to cart.';
        add.disabled = true;
      }
      add.addEventListener('click', async (event) => {
        event.stopPropagation();
        add.disabled = true;
        add.textContent = 'Adding';

        try {
          if (!canBuildConfigTableCartItem(commerceContext, row)) {
            throw new Error('This option still needs Commerce mapping before it can be added to cart.');
          }

          const selectedQuantity = normalizeProductDetailsConfigTableQuantity(quantity.value);
          state.quantities[row.id] = selectedQuantity;

          await addConfigTableRowToCart(commerceContext, row, selectedQuantity);

          status.show(`${row.id} added to cart.`);
        } catch (error) {
          status.show(error?.message || `Unable to add ${row.id}.`, 'error');
        } finally {
          add.disabled = false;
          add.textContent = 'Add';
        }
      });

      actions.append(quantity, add);
      appendConfigTableCell(tr, actions, { align: 'right' });
      tbody.append(tr);
    });
  }

  function render() {
    const tableState = applyProductDetailsConfigTableState(rows, state);
    count.textContent = `${formatConfigTableNumber(tableState.totalItems)} item${tableState.totalItems === 1 ? '' : 's'}`;
    syncConfigTableSortHeaders(table, state);
    renderRows(tableState);
    renderPagination(tableState);
  }

  render();
}

function normalizeText(value = '') {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function getProductTitle(product, header) {
  return normalizeText(
    product?.name || header?.querySelector('.pdp-header__title')?.textContent || '',
  );
}

function getStockLabel(product) {
  return product?.inStock ? 'In stock' : 'Unavailable';
}

function getGalleryCount(product) {
  return Array.isArray(product?.images) ? product.images.length : 0;
}

function getViewsLabel({ svgReady, svgLabel }) {
  return svgReady ? `Photos + ${svgLabel}` : 'Photos only';
}

function getOptionGroupCount(product) {
  const selectableOptionCount = Array.isArray(product?.options) ? product.options.length : 0;
  const inputOptionCount = Array.isArray(product?.inputOptions) ? product.inputOptions.length : 0;

  return selectableOptionCount + inputOptionCount;
}

function shouldDisableBaseAddToCart(product = {}, config = {}) {
  return Boolean(config.configTableEnabled) && getOptionGroupCount(product) === 0;
}

function splitSentences(value = '') {
  return normalizeText(value)
    .match(/[^.!?]+[.!?]?/g)?.map((sentence) => normalizeText(sentence))?.filter(Boolean) ?? [];
}

function extractDescriptionBullets(container) {
  return [...container.querySelectorAll('li')]
    .map((item) => normalizeText(item.textContent))
    .filter(Boolean);
}

function extractShortDescriptionSentences(container) {
  return [...container.querySelectorAll('p')]
    .flatMap((paragraph) => splitSentences(paragraph.textContent))
    .filter(Boolean);
}

function createFeaturePillar(copy) {
  const normalized = normalizeText(copy);

  if (!normalized) {
    return null;
  }

  const separator = [' : ', ': ', ' - ', ' – ', ' — ']
    .find((token) => normalized.includes(token));

  if (separator) {
    const [rawTitle, ...rest] = normalized.split(separator);
    const title = normalizeText(rawTitle);
    const body = normalizeText(rest.join(separator));

    if (title && body) {
      return { title, body };
    }
  }

  const sentences = splitSentences(normalized);
  if (sentences.length > 1 && sentences[0].split(' ').length <= 12) {
    return {
      title: sentences[0],
      body: normalizeText(sentences.slice(1).join(' ')),
    };
  }

  return {
    title: normalized,
    body: '',
  };
}

function collectFeaturePillars(descriptionContainer, shortDescriptionContainer) {
  const bullets = extractDescriptionBullets(descriptionContainer);
  const fallbacks = extractShortDescriptionSentences(shortDescriptionContainer);
  const copies = [];

  bullets.forEach((bullet) => {
    if (copies.length < 4 && !copies.includes(bullet)) {
      copies.push(bullet);
    }
  });

  fallbacks.forEach((sentence) => {
    if (copies.length < 4 && !copies.includes(sentence)) {
      copies.push(sentence);
    }
  });

  return copies.map(createFeaturePillar).filter(Boolean);
}

function createStateBadge(text, modifier = 'info') {
  const badge = document.createElement('li');
  badge.className = `product-details__state-badge product-details__state-badge--${modifier}`;
  badge.textContent = text;
  return badge;
}

function createMiniSpecCard(label, value) {
  const item = document.createElement('li');
  item.className = 'product-details__mini-spec';

  const heading = document.createElement('span');
  heading.className = 'product-details__mini-spec-label';
  heading.textContent = label;

  const copy = document.createElement('strong');
  copy.className = 'product-details__mini-spec-value';
  copy.textContent = value;

  item.append(heading, copy);
  return item;
}

function createFeatureCard(pillar, index) {
  const card = document.createElement('article');
  card.className = 'product-details__feature-card';

  const count = document.createElement('span');
  count.className = 'product-details__feature-index';
  count.textContent = `${index + 1}`.padStart(2, '0');

  const title = document.createElement('h3');
  title.className = 'product-details__feature-title';
  title.textContent = pillar.title;

  card.append(count, title);

  if (pillar.body) {
    const body = document.createElement('p');
    body.className = 'product-details__feature-copy';
    body.textContent = pillar.body;
    card.append(body);
  }

  return card;
}

function createSupportCard({
  href,
  title,
  description,
  target,
}) {
  const link = document.createElement('a');
  link.className = 'product-details__support-card';
  link.href = href;
  link.dataset.target = target;

  const heading = document.createElement('strong');
  heading.className = 'product-details__support-card-title';
  heading.textContent = title;

  const body = document.createElement('span');
  body.className = 'product-details__support-card-copy';
  body.textContent = description;

  link.append(heading, body);
  return link;
}

function setCollectionVisibility(element, isVisible) {
  if (!element) {
    return;
  }

  element.hidden = !isVisible;
  element.setAttribute('aria-hidden', isVisible ? 'false' : 'true');
}

function hidePdpCardsBlock(block, shouldHide) {
  const scope = block.closest('main');
  if (!scope) {
    return;
  }

  scope.querySelectorAll('.cards').forEach((cardsBlock) => {
    const section = cardsBlock.closest('.section');
    if (section) {
      section.hidden = shouldHide;
    } else {
      cardsBlock.hidden = shouldHide;
    }
  });
}

function activateSectionLink(links, nextId) {
  links.forEach((link) => {
    const isActive = link.dataset.target === nextId;
    link.classList.toggle('is-active', isActive);
    link.setAttribute('aria-current', isActive ? 'true' : 'false');
  });
}

function bindSectionLinks(links) {
  links.forEach((link) => {
    link.addEventListener('click', () => {
      activateSectionLink(links, link.dataset.target);
    });
  });
}

async function renderInlineError(error, alertContainer) {
  const inlineAlert = await UI.render(InLineAlert, {
    heading: 'Error',
    description: error.message,
    icon: h(Icon, { source: 'Warning' }),
    'aria-live': 'assertive',
    role: 'alert',
    onDismiss: () => {
      inlineAlert.remove();
    },
  })(alertContainer);

  scrollElementIntoView(alertContainer);
  return inlineAlert;
}

export default async function decorate(block) {
  let product = events.lastPayload('pdp/data') ?? null;
  // bug: the pdp sends an object with event data even if product is not found.
  product = product?.sku ? product : null;

  const blockConfig = readBlockConfig(block);
  const config = normalizeProductDetailsConfig(blockConfig);
  const { 'grid-ordering-enabled': gridOrderingEnabledString = 'false' } = blockConfig;
  const gridOrderingEnabled = gridOrderingEnabledString === 'true';
  const svgMediaUrl = resolveProductDetailsSvgUrl(config.svgUrl);
  const svgMediaPromise = loadProductDetailsSvgMedia(svgMediaUrl);

  // Grid Ordering B2B feature (Quick Order Drop-in) - enabled only for Configurable Products
  const isConfigurableProduct = (product?.productType === 'complex' || !!product?.externalParentId) && !product?.isBundle;
  const isGridOrderingView = gridOrderingEnabled && isConfigurableProduct;
  // Separate Add to Cart button used in the Grid Ordering container
  let gridOrderingAddToCartButton = null;
  let gridOrderingVariants = [];
  let gridOrderingSelectedVariants = [];

  const labels = await fetchPlaceholders();

  // Read itemUid from URL
  const urlParams = new URLSearchParams(window.location.search);
  const itemUidFromUrl = urlParams.get('itemUid');

  // State to track if we are in update mode
  let isUpdateMode = false;

  // Layout
  const fragment = document.createRange()
    .createContextualFragment(`
    <div class="product-details__alert"></div>
    <nav class="product-details__breadcrumbs" aria-label="Breadcrumb">
      <a class="product-details__breadcrumb-link" href="${rootLink('/')}">Home</a>
      <span class="product-details__breadcrumb-separator" aria-hidden="true">/</span>
      <a class="product-details__breadcrumb-link" href="${rootLink('/products')}">Products</a>
      <span class="product-details__breadcrumb-separator" aria-hidden="true">/</span>
      <span class="product-details__breadcrumb-current" aria-current="page"></span>
    </nav>
    <div class="product-details__wrapper" id="${PDP_SECTION_IDS.OVERVIEW}">
      <div class="product-details__left-column">
        <div class="product-details__media-shell product-details__media-shell--desktop">
          <div class="product-details__media-card">
            <div class="product-details__media-corners" aria-hidden="true">
              <span></span><span></span><span></span><span></span>
            </div>
            <div class="product-details__media-state-chips product-details__media-state-chips--desktop"></div>
            <div class="product-details__media-frame">
              <div class="product-details__media-view product-details__media-view--photos">
                <div class="product-details__gallery product-details__gallery--desktop"></div>
              </div>
              <div class="product-details__media-view product-details__media-view--technical" hidden>
                <div class="product-details__svg-stage">
                  <img class="product-details__svg-image product-details__svg-image--desktop" alt="" loading="lazy">
                </div>
              </div>
            </div>
            <div class="product-details__media-selector product-details__media-selector--desktop" hidden></div>
          </div>
        </div>
      </div>
      <div class="product-details__right-column">
        <div class="product-details__purchase-panel" id="${PDP_SECTION_IDS.PURCHASE}">
          <section class="product-details__intro-card">
            <p class="product-details__eyebrow">Product overview</p>
            <div class="product-details__header"></div>
            <ul class="product-details__state-badges" aria-label="Product status"></ul>
            <div class="product-details__price"></div>
            <div class="product-details__media-shell product-details__media-shell--mobile">
              <div class="product-details__media-card">
                <div class="product-details__media-corners" aria-hidden="true">
                  <span></span><span></span><span></span><span></span>
                </div>
                <div class="product-details__media-state-chips product-details__media-state-chips--mobile"></div>
                <div class="product-details__media-frame">
                  <div class="product-details__media-view product-details__media-view--photos">
                    <div class="product-details__gallery product-details__gallery--mobile"></div>
                  </div>
                  <div class="product-details__media-view product-details__media-view--technical" hidden>
                    <div class="product-details__svg-stage">
                      <img class="product-details__svg-image product-details__svg-image--mobile" alt="" loading="lazy">
                    </div>
                  </div>
                </div>
                <div class="product-details__media-selector product-details__media-selector--mobile" hidden></div>
              </div>
            </div>
            <div class="product-details__short-description"></div>
            <ul class="product-details__mini-specs" aria-label="Product quick facts"></ul>
          </section>
          <section class="product-details__configuration-card">
            <div class="product-details__gift-card-options"></div>
            <div class="product-details__configuration">
              <div class="product-details__options"></div>
              <div class="product-details__input-options"></div>
              <div class="product-details__fallback-options-shell" hidden></div>
              <div class="product-details__quantity"></div>
              <div class="product-details__buttons">
                <div class="product-details__buttons__add-to-cart"></div>
                <div class="product-details__buttons__add-to-wishlist"></div>
                <div class="product-details__buttons__add-to-req-list"></div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
    <nav class="product-details__tabs" aria-label="Product detail sections">
      <a class="product-details__tab-link is-active" href="#${PDP_SECTION_IDS.OVERVIEW}" data-target="${PDP_SECTION_IDS.OVERVIEW}" aria-current="true">Overview</a>
      ${config.configTableEnabled ? `<a class="product-details__tab-link" href="#${PDP_SECTION_IDS.CONFIG_TABLE}" data-target="${PDP_SECTION_IDS.CONFIG_TABLE}" aria-current="false">Config table</a>` : ''}
      <a class="product-details__tab-link" href="#${PDP_SECTION_IDS.FEATURES}" data-target="${PDP_SECTION_IDS.FEATURES}" aria-current="false">Features</a>
      <a class="product-details__tab-link" href="#${PDP_SECTION_IDS.SPECIFICATIONS}" data-target="${PDP_SECTION_IDS.SPECIFICATIONS}" aria-current="false">Specifications</a>
      <a class="product-details__tab-link" href="#${PDP_SECTION_IDS.RELATED}" data-target="${PDP_SECTION_IDS.RELATED}" aria-current="false">Related</a>
    </nav>
    ${config.configTableEnabled ? `<section class="product-details__config-table" id="${PDP_SECTION_IDS.CONFIG_TABLE}"></section>` : ''}
    <section class="product-details__feature-section" id="${PDP_SECTION_IDS.FEATURES}">
      <div class="product-details__section-intro">
        <p class="product-details__section-kicker">Product features</p>
        <h2 class="product-details__section-heading">Features</h2>
      </div>
      <div class="product-details__feature-pillars"></div>
    </section>
    <section class="product-details__specifications-section" id="${PDP_SECTION_IDS.SPECIFICATIONS}">
      <div class="product-details__section-intro">
        <p class="product-details__section-kicker">Live product details</p>
        <h2 class="product-details__section-heading">Specifications</h2>
      </div>
      <section class="product-details__details-card">
        <div class="product-details__description"></div>
      </section>
      <section class="product-details__attributes-card">
        <div class="product-details__attributes"></div>
      </section>
    </section>
    <section class="product-details__support-band">
      <div class="product-details__support-copy">
        <p class="product-details__section-kicker">Need a faster path?</p>
        <h2 class="product-details__section-heading">Move through the PDP with support-oriented shortcuts.</h2>
      </div>
      <div class="product-details__support-links"></div>
    </section>
    <div class="product-details__grid-ordering ${isGridOrderingView ? 'product-details__grid-ordering--enabled' : 'product-details__grid-ordering--disabled'}"></div>
  `);

  const $alert = fragment.querySelector('.product-details__alert');
  const $breadcrumbsCurrent = fragment.querySelector('.product-details__breadcrumb-current');
  const $gallery = fragment.querySelector('.product-details__gallery--desktop');
  const $header = fragment.querySelector('.product-details__header');
  const $stateBadges = fragment.querySelector('.product-details__state-badges');
  const $price = fragment.querySelector('.product-details__price');
  const $galleryMobile = fragment.querySelector('.product-details__gallery--mobile');
  const $shortDescription = fragment.querySelector('.product-details__short-description');
  const $miniSpecs = fragment.querySelector('.product-details__mini-specs');
  const $options = fragment.querySelector('.product-details__options');
  const $inputOptions = fragment.querySelector('.product-details__input-options');
  const $fallbackOptions = fragment.querySelector('.product-details__fallback-options-shell');
  const $quantity = fragment.querySelector('.product-details__quantity');
  const $giftCardOptions = fragment.querySelector('.product-details__gift-card-options');
  const $addToCart = fragment.querySelector('.product-details__buttons__add-to-cart');
  const $wishlistToggleBtn = fragment.querySelector('.product-details__buttons__add-to-wishlist');
  const $requisitionListSelector = fragment.querySelector('.product-details__buttons__add-to-req-list');
  const $description = fragment.querySelector('.product-details__description');
  const $attributes = fragment.querySelector('.product-details__attributes');
  const $gridOrderingContainer = fragment.querySelector('.product-details__grid-ordering');
  const $configTable = fragment.querySelector('.product-details__config-table');
  const $featureSection = fragment.querySelector('.product-details__feature-section');
  const $featureGrid = fragment.querySelector('.product-details__feature-pillars');
  const $specificationsSection = fragment.querySelector('.product-details__specifications-section');
  const $supportLinks = fragment.querySelector('.product-details__support-links');
  const $detailsCard = fragment.querySelector('.product-details__details-card');
  const $attributesCard = fragment.querySelector('.product-details__attributes-card');
  const $desktopPhotoView = fragment.querySelector('.product-details__left-column .product-details__media-view--photos');
  const $desktopTechnicalView = fragment.querySelector('.product-details__left-column .product-details__media-view--technical');
  const $mobilePhotoView = fragment.querySelector('.product-details__right-column .product-details__media-shell--mobile .product-details__media-view--photos');
  const $mobileTechnicalView = fragment.querySelector('.product-details__right-column .product-details__media-shell--mobile .product-details__media-view--technical');
  const $desktopSelector = fragment.querySelector('.product-details__media-selector--desktop');
  const $mobileSelector = fragment.querySelector('.product-details__media-selector--mobile');
  const $desktopSvgImage = fragment.querySelector('.product-details__svg-image--desktop');
  const $mobileSvgImage = fragment.querySelector('.product-details__svg-image--mobile');
  const $desktopMediaChips = fragment.querySelector('.product-details__media-state-chips--desktop');
  const $mobileMediaChips = fragment.querySelector('.product-details__media-state-chips--mobile');
  const $tabLinks = [...fragment.querySelectorAll('.product-details__tab-link')];

  block.replaceChildren(fragment);
  document.body.classList.add('page-product-details');
  block.classList.toggle(
    'product-details--presentation-auto-immersive',
    config.presentation === PRODUCT_DETAILS_PRESENTATIONS.AUTO_IMMERSIVE,
  );
  block.classList.toggle('product-details--config-table-enabled', config.configTableEnabled);
  block.dataset.presentation = config.presentation;
  block.dataset.mediaView = 'photos';

  const configTableData = config.configTableEnabled
    ? getProductDetailsConfigTableData(config.configTableFamily)
    : null;
  const buyBoxConfigTableData = getBuyBoxConfigTableData(product, config);
  const shouldLoadConfigTableCommerce = Boolean(
    (configTableData || buyBoxConfigTableData) && product?.sku,
  );
  const configTableCommerceContextPromise = shouldLoadConfigTableCommerce
    ? loadConfigTableCommerceContext(product.sku).catch((error) => {
      console.warn('product-details: unable to load backend options for shackle configuration.', error);
      return null;
    })
    : Promise.resolve(null);

  if (config.configTableEnabled) {
    renderProductDetailsConfigTable(
      $configTable,
      configTableData,
      product?.sku,
      configTableCommerceContextPromise,
    );
  }

  const mediaState = {
    currentView: 'photos',
    photoCount: product?.images?.length || 0,
    photoPreviewUrl: getPrimaryProductImageUrl(product),
    svgLabel: config.svgLabel,
    svgReady: false,
    svgUrl: '',
  };

  const mediaRefs = {
    selectors: [$desktopSelector, $mobileSelector],
    photoViews: [$desktopPhotoView, $mobilePhotoView],
    technicalViews: [$desktopTechnicalView, $mobileTechnicalView],
    svgImages: [$desktopSvgImage, $mobileSvgImage],
  };

  const supportCards = {
    purchase: createSupportCard({
      href: `#${PDP_SECTION_IDS.PURCHASE}`,
      target: PDP_SECTION_IDS.PURCHASE,
      title: 'Jump to purchase controls',
      description: 'Go straight to options, quantity, and cart actions.',
    }),
    specifications: createSupportCard({
      href: `#${PDP_SECTION_IDS.SPECIFICATIONS}`,
      target: PDP_SECTION_IDS.SPECIFICATIONS,
      title: 'Jump to specifications/details',
      description: 'Review the narrative details and structured attributes.',
    }),
    related: createSupportCard({
      href: `#${PDP_SECTION_IDS.RELATED}`,
      target: PDP_SECTION_IDS.RELATED,
      title: 'Jump to related products',
      description: 'Continue into adjacent recommendations from the same PDP.',
    }),
  };

  $supportLinks.append(
    supportCards.purchase,
    supportCards.specifications,
    supportCards.related,
  );
  bindSectionLinks($tabLinks);

  const featureTabLink = $tabLinks.find((link) => link.dataset.target === PDP_SECTION_IDS.FEATURES);
  const specificationsTabLink = $tabLinks.find(
    (link) => link.dataset.target === PDP_SECTION_IDS.SPECIFICATIONS,
  );
  const relatedTabLink = $tabLinks.find((link) => link.dataset.target === PDP_SECTION_IDS.RELATED);

  let relatedVisible = Boolean(document.querySelector('.product-recommendations'));

  const syncOptionalCards = () => {
    const hasDescription = hasRenderedContent($description);
    const hasAttributes = hasRenderedContent($attributes);
    const hasSpecifications = hasDescription || hasAttributes;

    $detailsCard.hidden = !hasDescription;
    $attributesCard.hidden = !hasAttributes;
    $specificationsSection.hidden = !hasSpecifications;
    setCollectionVisibility(specificationsTabLink, hasSpecifications);
    setCollectionVisibility(supportCards.specifications, hasSpecifications);
  };

  const updateRelatedTargets = (isVisible) => {
    relatedVisible = isVisible;
    setCollectionVisibility(relatedTabLink, relatedVisible);
    setCollectionVisibility(supportCards.related, relatedVisible);
    block.classList.toggle('product-details--related-hidden', !relatedVisible);
  };

  updateRelatedTargets(relatedVisible);

  const renderMediaSelectors = () => {
    if (!mediaState.svgReady && mediaState.currentView === 'technical') {
      mediaState.currentView = 'photos';
    }

    block.dataset.mediaView = mediaState.currentView;
    block.classList.toggle('product-details--svg-media-ready', mediaState.svgReady);

    mediaRefs.photoViews.forEach((node) => {
      node.hidden = mediaState.currentView !== 'photos';
    });

    mediaRefs.technicalViews.forEach((node) => {
      node.hidden = mediaState.currentView !== 'technical';
    });

    mediaRefs.selectors.forEach((selector) => {
      selector.hidden = !mediaState.svgReady;
      selector.replaceChildren();

      if (!mediaState.svgReady) {
        return;
      }

      const photoMeta = mediaState.photoCount > 0
        ? `${mediaState.photoCount} image${mediaState.photoCount === 1 ? '' : 's'}`
        : 'Gallery';

      selector.append(
        createMediaOptionButton({
          view: 'photos',
          label: 'Photos',
          meta: photoMeta,
          previewUrl: mediaState.photoPreviewUrl,
          isActive: mediaState.currentView === 'photos',
          onSelect: (nextView) => {
            mediaState.currentView = nextView;
            renderMediaSelectors();
          },
        }),
        createMediaOptionButton({
          view: 'technical',
          label: mediaState.svgLabel,
          meta: 'SVG',
          previewUrl: mediaState.svgUrl,
          isActive: mediaState.currentView === 'technical',
          onSelect: (nextView) => {
            mediaState.currentView = nextView;
            renderMediaSelectors();
          },
        }),
      );
    });
  };

  const syncProductMedia = (nextProduct = null) => {
    mediaState.photoCount = nextProduct?.images?.length || 0;
    mediaState.photoPreviewUrl = getPrimaryProductImageUrl(nextProduct);

    const altText = nextProduct?.name
      ? `${nextProduct.name} ${mediaState.svgLabel.toLowerCase()}`
      : mediaState.svgLabel;

    mediaRefs.svgImages.forEach((image) => {
      image.alt = altText;
    });

    renderMediaSelectors();
  };

  const configTableCommerceContext = await configTableCommerceContextPromise;
  const fallbackVariantRows = getBuyBoxConfigTableRows(
    buyBoxConfigTableData,
    configTableCommerceContext,
  );
  const fallbackOptionsUnavailableMessage = fallbackVariantRows.length > 0
    ? 'Commerce option mapping is not available yet, so this choice cannot be added to cart.'
    : '';

  const syncDerivedContent = (nextProduct = product) => {
    const productTitle = getProductTitle(nextProduct, $header);
    $breadcrumbsCurrent.textContent = productTitle;

    $stateBadges.replaceChildren();
    $stateBadges.append(
      createStateBadge(getStockLabel(nextProduct), nextProduct?.inStock ? 'success' : 'muted'),
      createStateBadge(`${getGalleryCount(nextProduct)} gallery image${getGalleryCount(nextProduct) === 1 ? '' : 's'}`),
    );

    if (mediaState.svgReady) {
      $stateBadges.append(createStateBadge(mediaState.svgLabel));
    }

    const optionCount = getOptionGroupCount(nextProduct) + (fallbackVariantRows.length > 0 ? 1 : 0);
    const viewsLabel = getViewsLabel(mediaState);

    $miniSpecs.replaceChildren(
      createMiniSpecCard('Gallery', `${getGalleryCount(nextProduct)}`),
      createMiniSpecCard('Availability', getStockLabel(nextProduct)),
      createMiniSpecCard('Views', viewsLabel),
    );

    if (optionCount > 0) {
      $miniSpecs.append(createMiniSpecCard('Options', `${optionCount}`));
    }

    const mediaChipText = [
      `${getGalleryCount(nextProduct)} photo${getGalleryCount(nextProduct) === 1 ? '' : 's'}`,
      mediaState.svgReady ? mediaState.svgLabel : '',
    ].filter(Boolean);

    [$desktopMediaChips, $mobileMediaChips].forEach((chipContainer) => {
      chipContainer.replaceChildren(...mediaChipText.map((text, index) => {
        const chip = document.createElement('span');
        chip.className = 'product-details__media-state-chip';
        if (index === 1) {
          chip.classList.add('product-details__media-state-chip--accent');
        }
        chip.textContent = text;
        return chip;
      }));
    });

    const featurePillars = collectFeaturePillars($description, $shortDescription);
    $featureGrid.replaceChildren(...featurePillars.map(createFeatureCard));

    const hasFeatures = featurePillars.length > 0;
    $featureSection.hidden = !hasFeatures;
    setCollectionVisibility(featureTabLink, hasFeatures);
    hidePdpCardsBlock(block, hasFeatures);
  };

  const scheduleDerivedContentSync = () => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        syncDerivedContent(product);
        syncOptionalCards();
      });
    });
  };

  const gallerySlots = {
    CarouselThumbnail: (ctx) => {
      if (ctx.mediaType === 'image') {
        tryRenderAemAssetsImage(ctx, {
          ...imageSlotConfig(ctx),
          wrapper: document.createElement('span'),
        });
      }
    },

    CarouselMainImage: (ctx) => {
      if (ctx.mediaType === 'image') {
        tryRenderAemAssetsImage(ctx, {
          ...imageSlotConfig(ctx),
        });
      }
    },
  };

  // Alert
  let inlineAlert = null;
  const routeToWishlist = rootLink('/wishlist');

  const [
    _galleryMobile,
    _gallery,
    _header,
    _price,
    _shortDescription,
    _options,
    _quantity,
    _giftCardOptions,
    _description,
    _attributes,
    _gridOrdering,
    wishlistToggleBtn,
    svgMediaAsset,
  ] = await Promise.all([
    // Gallery (Mobile)
    pdpRendered.render(ProductGallery, {
      controls: 'dots',
      arrows: true,
      peak: false,
      gap: 'small',
      loop: false,
      videos: true,
      imageParams: {
        ...IMAGES_SIZES,
      },
      slots: gallerySlots,
    })($galleryMobile),

    // Gallery (Desktop)
    pdpRendered.render(ProductGallery, {
      controls: 'thumbnailsColumn',
      arrows: true,
      peak: true,
      gap: 'small',
      loop: false,
      videos: true,
      imageParams: {
        ...IMAGES_SIZES,
      },
      slots: gallerySlots,
    })($gallery),

    pdpRendered.render(ProductHeader, {})($header),
    pdpRendered.render(ProductPrice, {})($price),
    pdpRendered.render(ProductShortDescription, {})($shortDescription),
    pdpRendered.render(ProductOptions, {
      hideSelectedValue: false,
      slots: {
        SwatchImage: (ctx) => {
          tryRenderAemAssetsImage(ctx, {
            ...imageSlotConfig(ctx),
            wrapper: document.createElement('span'),
          });
        },
      },
    })($options),
    mountProductInputOptions($inputOptions),
    pdpRendered.render(ProductQuantity, {})($quantity),
    pdpRendered.render(ProductGiftCardOptions, {})($giftCardOptions),
    pdpRendered.render(ProductDescription, {})($description),
    pdpRendered.render(ProductAttributes, {
      formatValue: formatNumericAttributeValue,
    })($attributes),
    isGridOrderingView && !isUpdateMode
      ? quickOrderProvider.render(QuickOrderVariantsGrid, {
        className: 'quick-order-variants-grid',
        columns: [
          { key: 'image', label: 'Image' },
          { key: 'variantOptionAttributes', label: 'Variant' },
          { key: 'sku', label: 'SKU' },
          { key: 'availability', label: 'Availability' },
          { key: 'price', label: 'Price' },
          { key: 'quantity', label: 'Quantity' },
          { key: 'subtotal', label: 'Subtotal' },
          ...(checkIsAuthenticated()
            ? [{ key: 'requisitionList', label: 'Action' }]
            : []),
        ],
        slots: {
          RequisitionListCell: async (ctx) => {
            const { variant } = ctx;

            const variantAlertContainer = document.createElement('div');
            variantAlertContainer.classList.add('variant-requisition-alert');

            const variantSelectorContainer = document.createElement('div');
            variantSelectorContainer.classList.add('variant-requisition-selector');

            ctx.appendChild(variantAlertContainer);
            ctx.appendChild(variantSelectorContainer);

            const matchedVariant = gridOrderingVariants.find(
              (variantMatch) => (
                variantMatch?.product?.sku?.toLowerCase() === variant.product.sku.toLowerCase()
              ),
            );

            const buildProductData = (quantity) => ({
              ...variant.product,
              sku: product.sku,
              quantity,
              optionUIDs: matchedVariant?.selections || [],
              options: product.options,
            });

            const renderFunction = createRequisitionListRenderer({
              $alert: variantAlertContainer,
              labels,
            });

            let currentProductData = buildProductData(variant.product.quantity || 1);
            await renderFunction(
              variantSelectorContainer,
              currentProductData,
              currentProductData.optionUIDs,
            );

            ctx.onChange(async (nextState) => {
              currentProductData = buildProductData(nextState.quantity);

              await renderFunction(
                variantSelectorContainer,
                currentProductData,
                currentProductData.optionUIDs,
              );
            });
          },
          VariantOptionAttributesCell: (ctx) => {
            const { variant } = ctx;
            const { variantOptionAttributes } = variant.product;

            const cellWrapper = document.createElement('div');

            variantOptionAttributes.forEach((attr) => {
              const attributeWrapper = document.createElement('div');
              attributeWrapper.classList.add('product-details__variants-grid-attribute');

              const label = document.createElement('strong');
              label.textContent = `${attr.label}:`;
              const value = document.createElement('span');
              value.textContent = attr.value;
              attributeWrapper.append(label, value);
              cellWrapper.append(attributeWrapper);
            });

            ctx.appendChild(cellWrapper);
          },
          Actions: async (ctx) => {
            const { isDisabled } = ctx;
            const buttonContainer = document.createElement('div');
            buttonContainer.classList.add('product-details__variants-grid-actions');

            gridOrderingAddToCartButton = await UI.render(Button, {
              children: labels.Global?.AddProductToCart,
              disabled: isDisabled,
              onClick: async () => {
                try {
                  if (gridOrderingAddToCartButton) {
                    gridOrderingAddToCartButton.setProps((prev) => ({
                      ...prev,
                      children: labels.Global?.AddingToCart,
                      disabled: true,
                    }));
                  }

                  const { addProductsToCart } = await import('@dropins/storefront-cart/api.js');
                  await addProductsToCart(gridOrderingSelectedVariants);

                  events.emit('quick-order/grid-ordering-reset-selected-variants');
                  gridOrderingSelectedVariants = [];
                  inlineAlert?.remove();
                } catch (error) {
                  inlineAlert = await renderInlineError(error, $alert);
                } finally {
                  gridOrderingAddToCartButton.setProps((prev) => ({
                    ...prev,
                    children: labels.Global?.AddProductToCart,
                    disabled: true,
                  }));
                }
              },
            })(buttonContainer);

            ctx.appendChild(buttonContainer);
          },
        },
      })($gridOrderingContainer)
      : null,
    wishlistRender.render(WishlistToggle, {
      product,
    })($wishlistToggleBtn),
    svgMediaPromise,
  ]);

  if (svgMediaAsset) {
    mediaState.svgReady = true;
    mediaState.svgUrl = svgMediaAsset.url;
    mediaRefs.svgImages.forEach((image) => {
      image.src = svgMediaAsset.url;
    });
  } else if (config.svgUrl) {
    console.warn('product-details: unable to load svg-url media, falling back to photos only.');
  }

  syncProductMedia(product);
  scheduleDerivedContentSync();
  hideRedundantShortDescription($header, $shortDescription);
  hideRedundantHeaderSku($header);

  const disableBaseAddToCart = shouldDisableBaseAddToCart(product, config);
  let addToCart = null;
  let fallbackSelectedRow = null;
  const fallbackSelector = renderFallbackVariantSelector(
    $fallbackOptions,
    fallbackVariantRows,
    {
      isRowCartReady: hasBackendMappedConfigTableRow,
      unavailableMessage: fallbackOptionsUnavailableMessage,
      onChange: (selectedRow) => {
        const selectedRowCartReady = hasBackendMappedConfigTableRow(selectedRow);

        fallbackSelectedRow = selectedRow;

        if (addToCart && fallbackVariantRows.length > 0) {
          addToCart.setProps((prev) => ({
            ...prev,
            disabled: !fallbackSelectedRow || !selectedRowCartReady,
          }));
        }
      },
    },
  );

  const isFallbackAddToCartDisabled = () => (
    fallbackSelector.hasOptions
    && (!fallbackSelectedRow || !hasBackendMappedConfigTableRow(fallbackSelectedRow))
  );

  addToCart = await UI.render(Button, {
    children: labels.Global?.AddProductToCart,
    icon: h(Icon, { source: 'Cart' }),
    disabled: disableBaseAddToCart || isFallbackAddToCartDisabled(),
    onClick: async () => {
      const buttonActionText = isUpdateMode
        ? labels.Global?.UpdatingInCart
        : labels.Global?.AddingToCart;
      try {
        addToCart.setProps((prev) => ({
          ...prev,
          children: buttonActionText,
          disabled: true,
        }));

        const values = pdpApi.getProductConfigurationValues();
        const valid = pdpApi.isProductConfigurationValid();

        if (valid) {
          if (fallbackSelector.hasOptions) {
            const selectedRow = fallbackSelectedRow || fallbackSelector.getSelectedRow();
            if (!selectedRow?.id) {
              throw new Error('Please select a shackle option before adding to cart.');
            }

            if (!hasBackendMappedConfigTableRow(selectedRow)) {
              throw new Error(fallbackOptionsUnavailableMessage);
            }

            if (!configTableCommerceContext) {
              throw new Error('The selected shackle option is not available from the backend for this product.');
            }

            const { addProductsToCart } = await import('@dropins/storefront-cart/api.js');
            await addProductsToCart([
              buildConfigTableCartItem(
                configTableCommerceContext,
                selectedRow,
                values.quantity || 1,
              ),
            ]);
            return;
          }

          if (isUpdateMode) {
            const { updateProductsFromCart } = await import('@dropins/storefront-cart/api.js');

            await updateProductsFromCart([{
              ...values,
              uid: itemUidFromUrl,
            }]);

            const updatedSku = values?.sku;
            if (updatedSku) {
              const cartRedirectUrl = new URL(
                rootLink('/cart'),
                window.location.origin,
              );
              cartRedirectUrl.searchParams.set('itemUid', itemUidFromUrl);
              window.location.href = cartRedirectUrl.toString();
            } else {
              console.warn(
                'Could not retrieve SKU for updated item. Redirecting to cart without parameter.',
              );
              window.location.href = rootLink('/cart');
            }
            return;
          }

          const { addProductsToCart } = await import('@dropins/storefront-cart/api.js');
          await addProductsToCart([{ ...values }]);
        }

        inlineAlert?.remove();
      } catch (error) {
        inlineAlert = await renderInlineError(error, $alert);
      } finally {
        updateAddToCartButtonText(addToCart, isUpdateMode, labels);
        addToCart.setProps((prev) => ({
          ...prev,
          disabled: disableBaseAddToCart || isFallbackAddToCartDisabled(),
        }));
      }
    },
  })($addToCart);

  events.on('pdp/valid', (valid) => {
    addToCart.setProps((prev) => ({
      ...prev,
      disabled: disableBaseAddToCart
        || !valid
        || isFallbackAddToCartDisabled(),
    }));
  }, { eager: true });

  events.on('quick-order/grid-ordering-selected-variants', (selectedVariants) => {
    if (!isGridOrderingView) return;

    gridOrderingSelectedVariants = selectedVariants.map((variant) => ({
      optionsUIDs: variant.optionsUIDs,
      quantity: variant.quantity,
      sku: product.sku,
    }));

    if (gridOrderingAddToCartButton) {
      const totalQuantity = selectedVariants.reduce(
        (acc, variant) => acc + (variant.quantity || 0),
        0,
      );
      const hasItems = totalQuantity > 0;

      gridOrderingAddToCartButton.setProps((prev) => ({
        ...prev,
        children: hasItems
          ? `${labels.Global?.AddProductToCart} (${totalQuantity})`
          : labels.Global?.AddProductToCart,
        disabled: !hasItems,
      }));
    }
  }, { eager: true });

  events.on('pdp/values', async () => {
    const configValues = pdpApi.getProductConfigurationValues();
    const urlOptionsUIDs = urlParams.get('optionsUIDs');

    let optionUIDs = null;
    const hasConfigOptions = configValues?.optionsUIDs
      && Array.isArray(configValues.optionsUIDs)
      && configValues.optionsUIDs.length > 0;

    if (hasConfigOptions) {
      optionUIDs = configValues.optionsUIDs;
    } else if (urlOptionsUIDs === '') {
      optionUIDs = null;
    }

    if (wishlistToggleBtn) {
      wishlistToggleBtn.setProps((prev) => ({
        ...prev,
        product: {
          ...product,
          optionUIDs,
        },
      }));
    }
  }, { eager: true });

  events.on('wishlist/alert', ({
    action,
    item,
  }) => {
    wishlistRender.render(WishlistAlert, {
      action,
      item,
      routeToWishlist,
    })($alert);

    setTimeout(() => {
      $alert.innerHTML = '';
    }, 5000);

    setTimeout(() => {
      scrollElementIntoView($alert);
    }, 0);
  });

  events.on('pdp/data', (nextProduct) => {
    product = nextProduct?.sku ? nextProduct : null;
    syncProductMedia(product);
    scheduleDerivedContentSync();
    hideRedundantShortDescription($header, $shortDescription);
    hideRedundantHeaderSku($header);

    if (wishlistToggleBtn && product) {
      wishlistToggleBtn.setProps((prev) => ({
        ...prev,
        product: {
          ...product,
          optionUIDs: prev?.product?.optionUIDs,
        },
      }));
    }
  }, { eager: true });

  await initializeRequisitionListForProduct({
    product,
    $alert,
    $requisitionListSelector,
    labels,
    urlParams,
  });

  events.on(
    'cart/data',
    (cartData) => {
      let itemIsInCart = false;
      if (itemUidFromUrl && cartData?.items) {
        itemIsInCart = cartData.items.some(
          (item) => item.uid === itemUidFromUrl,
        );
      }

      isUpdateMode = itemIsInCart;
      updateAddToCartButtonText(addToCart, itemIsInCart, labels);
    },
    { eager: true },
  );

  events.on('aem/lcp', async () => {
    if (!product) return;

    const isPrerendered = isProductPrerendered();

    if (isPrerendered) {
      if (!isGridOrderingView) return;

      const variants = await getProductVariants(product.sku);
      gridOrderingVariants = initQuickOrderGridOrdering(product, variants);
    } else {
      const variants = await getProductVariants(product.sku);

      if (isGridOrderingView) {
        gridOrderingVariants = initQuickOrderGridOrdering(product, variants);
      }

      setJsonLdProduct(product, variants);
      setMetaTags(product);
      document.title = product.name;
    }
  }, { eager: true });

  events.on('pdp/configurator-ready', (payload) => {
    block.classList.toggle(
      'product-details--configurator-active',
      shouldActivateConfigurator(payload)
        || block.classList.contains('product-details--configurator-active'),
    );
    block.classList.toggle(
      'product-details--immersive-active',
      shouldActivateImmersivePresentation(config.presentation, payload),
    );
  }, { eager: true });

  const contentObserver = new MutationObserver(() => {
    scheduleDerivedContentSync();
  });

  [$header, $shortDescription, $description, $attributes].forEach((node) => {
    contentObserver.observe(node, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  });

  document.addEventListener('product-recommendations:visibility', (event) => {
    updateRelatedTargets(Boolean(event.detail?.visible));
  });

  return Promise.resolve();
}

function setJsonLdProduct(product, variants) {
  const {
    name,
    inStock,
    description,
    sku,
    urlKey,
    price,
    priceRange,
    images,
    attributes,
  } = product;
  const amount = priceRange?.minimum?.final?.amount || price?.final?.amount;
  const brand = attributes?.find((attr) => attr.name === 'brand');

  const ldJson = {
    '@context': 'http://schema.org',
    '@type': 'Product',
    name,
    description,
    image: images[0]?.url,
    offers: [],
    productID: sku,
    brand: {
      '@type': 'Brand',
      name: brand?.value,
    },
    url: new URL(getProductLink(urlKey, sku), window.location),
    sku,
    '@id': new URL(getProductLink(urlKey, sku), window.location),
  };

  if (variants.length > 1) {
    ldJson.offers.push(...variants.map((variant) => ({
      '@type': 'Offer',
      name: variant.product.name,
      image: variant.product.images[0]?.url,
      price: variant.product.price.final.amount.value,
      priceCurrency: variant.product.price.final.amount.currency,
      availability: variant.product.inStock ? 'http://schema.org/InStock' : 'http://schema.org/OutOfStock',
      sku: variant.product.sku,
    })));
  } else {
    ldJson.offers.push({
      '@type': 'Offer',
      price: amount?.value,
      priceCurrency: amount?.currency,
      availability: inStock ? 'http://schema.org/InStock' : 'http://schema.org/OutOfStock',
    });
  }

  setJsonLd(ldJson, 'product');
}

function createMetaTag(property, content, type) {
  if (!property || !type) {
    return;
  }
  let meta = document.head.querySelector(`meta[${type}="${property}"]`);
  if (meta) {
    if (!content) {
      meta.remove();
      return;
    }
    meta.setAttribute(type, property);
    meta.setAttribute('content', content);
    return;
  }
  if (!content) {
    return;
  }
  meta = document.createElement('meta');
  meta.setAttribute(type, property);
  meta.setAttribute('content', content);
  document.head.appendChild(meta);
}

function setMetaTags(product) {
  if (!product?.sku) {
    return;
  }

  const price = product.prices.final.minimumAmount ?? product.prices.final.amount;

  createMetaTag('title', product.metaTitle || product.name, 'name');
  createMetaTag('description', product.metaDescription, 'name');
  createMetaTag('keywords', product.metaKeyword, 'name');

  createMetaTag('og:type', 'product', 'property');
  createMetaTag('og:description', product.shortDescription, 'property');
  createMetaTag('og:title', product.metaTitle || product.name, 'property');
  createMetaTag('og:url', window.location.href, 'property');
  const mainImage = product?.images?.filter((image) => image.roles.includes('thumbnail'))[0];
  const metaImage = mainImage?.url || product?.images[0]?.url;
  createMetaTag('og:image', metaImage, 'property');
  createMetaTag('og:image:secure_url', metaImage, 'property');
  createMetaTag('product:price:amount', price.value, 'property');
  createMetaTag('product:price:currency', price.currency, 'property');
}

/**
 * Returns the configuration for an image slot.
 * @param ctx - The context of the slot.
 * @returns The configuration for the image slot.
 */
function imageSlotConfig(ctx) {
  const {
    data,
    defaultImageProps,
  } = ctx;
  return {
    alias: data.sku,
    imageProps: defaultImageProps,

    params: {
      width: defaultImageProps.width,
      height: defaultImageProps.height,
    },
  };
}

/**
 * Fetches product variants with their attributes
 * @param {string} sku - Product SKU
 * @param {Object} fetcherApi - API fetcher instance
 * @returns {Promise<Array>} Array of product variants
 */
async function getProductVariants(sku) {
  const { data } = await pdpApi.fetchGraphQl(
    `
      query GET_PRODUCT_VARIANTS($sku: String!) {
        variants(sku: $sku) {
          variants {
            selections
            product {
              sku
              name
              inStock
              attributes {
                name
                label
                value
                roles
              }
              images(roles: ["image"]) {
                url
              }
              ...on SimpleProductView {
                price {
                  final { amount { currency value } }
                }
              }
            }
          }
        }
      }
    `,
    {
      method: 'GET',
      variables: { sku },
    },
  );

  return data?.variants?.variants ?? [];
}

// Grid Ordering feature initialization
function initQuickOrderGridOrdering(product, variants) {
  const productOptions = product.options;

  // Example of including and displaying additional fields in the variants grid
  const extendedVariants = variants
    .filter((variant) => variant.product)
    .map((variant) => {
      const variantOptionAttributes = variant.product.attributes.filter((variantAttribute) => {
        const isVariantAttribute = productOptions.some((productOption) => {
          const productOptionId = productOption.id;
          const variantAttributeName = variantAttribute.name;

          return productOptionId === variantAttributeName;
        });

        return isVariantAttribute;
      });

      return {
        ...variant,
        product: {
          ...variant.product,
          variantOptionAttributes,
        },
      };
    });

  events.emit('quick-order/grid-ordering-variants', extendedVariants);

  return extendedVariants;
}
