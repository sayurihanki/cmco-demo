/* eslint-disable import/extensions, import/no-unresolved */
import { getProductDetailsConfigTableData } from '../../blocks/product-details/product-details.config-table-data.mjs';
import {
  applyProductDetailsConfigTableState,
  getProductDetailsConfigTableFilterOptions,
  normalizeProductDetailsConfigTableQuantity,
  PRODUCT_DETAILS_CONFIG_TABLE_PAGE_SIZE,
} from '../../blocks/product-details/product-details.config-table-utils.mjs';
import {
  addConfigTableRowToCart,
  loadConfigTableCommerceContext,
} from '../../blocks/product-details/product-details.config-table-commerce.mjs';
import { getCompassConfigTableBinding } from './compass.config.mjs';
/* eslint-enable import/extensions, import/no-unresolved */

const CONFIG_COLUMNS = Object.freeze([
  {
    key: 'id', label: 'Long Item #', sortable: true,
  },
  {
    key: 'desc', label: 'Description', sortable: true,
  },
  {
    key: 'wll', label: 'WLL (lbs)', sortable: true, align: 'right',
  },
  {
    key: 'size', label: 'Size (in)', sortable: true,
  },
  {
    key: 'pin', label: 'Pin Type', sortable: true,
  },
  {
    key: 'finish', label: 'Finish', sortable: true,
  },
  {
    key: 'qty', label: 'Qty. in Stock', align: 'right',
  },
  {
    key: 'lt', label: 'Lead Time', align: 'center',
  },
  {
    key: 'price', label: 'List Price', sortable: true, align: 'right',
  },
  {
    key: 'actions', label: 'Actions', align: 'right',
  },
]);

const PRODUCT_META = Object.freeze({
  'CM-LVS-2T-20': {
    family: ['Hoists'],
    brand: ['CM'],
    application: ['Manufacturing'],
    detail: 'Recommended for variable-speed production lifting with pendant controls and trolley travel.',
  },
  'CM-H360-1T-15': {
    family: ['Hoists'],
    brand: ['CM'],
    application: ['Manufacturing', 'Utilities'],
    detail: 'Best fit for maintenance cells where low headroom and 360-degree hand-chain access matter.',
  },
  'COF-JLC-500-10': {
    family: ['Hoists'],
    brand: ['Coffing'],
    application: ['Manufacturing'],
    detail: 'Compact electric hoist assembly for workstation lifting and repeat light-duty cycles.',
  },
  'YA-CK-3T-KIT': {
    family: ['Utility products'],
    brand: ['Yale'],
    application: ['Utilities'],
    detail: 'Utility puller bundle staged for field crews that need hooks, spare pins, and a carry case.',
  },
  'CM-BAN-1500-10': {
    family: ['Hoists'],
    brand: ['CM'],
    application: ['Manufacturing', 'Utilities'],
    detail: 'Portable lever hoist package for field service, rigging, and repair crews.',
  },
  'CM Anchor Shackles': {
    family: ['Rigging attachments'],
    brand: ['CM'],
    application: ['Manufacturing'],
    detail: 'Configure CM Anchor Shackles by working load limit, size, pin type, finish, stock, and lead time.',
    configTableKey: 'cm-anchor-shackles',
  },
  'CM-FOR-CHK-78': {
    family: ['Rigging attachments'],
    brand: ['CM'],
    application: ['Forestry'],
    detail: 'Heavy-duty chain assembly configured for forestry dragging, bundling, and lift support.',
  },
  'CM-LIT-LEGACY': {
    family: ['Legacy literature'],
    brand: ['CM'],
    application: ['Manufacturing', 'Utilities'],
    detail: 'Digital manuals and diagrams for archived equipment support and replacement-part lookup.',
  },
});

function normalize(value = '') {
  return String(value).trim().toLowerCase();
}

function formatMoney(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(value);
}

function getFinishClass(finish) {
  if (finish === 'Galvanized') return 'galvanized';
  if (finish === 'Orange Powder Coated') return 'orange';
  return 'self';
}

function getStockClass(qty) {
  if (!qty) return 'none';
  return qty < 10 ? 'low' : 'in';
}

function getLeadClass(days) {
  if (days <= 5) return 'fast';
  if (days <= 14) return 'mid';
  return 'slow';
}

function getCellText(row, index) {
  return row.cells[index]?.textContent.trim() || '';
}

function getProductName(row) {
  return row.querySelector('.compass-product strong')?.textContent.trim() || '';
}

function getProductDescription(row) {
  return row.querySelector('.compass-product span')?.textContent.trim() || '';
}

function getSku(row) {
  return row.querySelector('.compass-sku')?.textContent.trim() || '';
}

function getConfigTableKey(row) {
  return row.dataset.compassConfigTable || '';
}

function initCompassPage(page) {
  const table = page.querySelector('.compass-table');
  const rows = Array.from(table?.querySelectorAll('tbody tr') || []);
  const searchInput = page.querySelector('#compass-search-input');
  const checkboxes = Array.from(page.querySelectorAll('.compass-filter-option input[type="checkbox"]') || []);
  const resetButton = page.querySelector('.compass-reset');
  const countLabel = page.querySelector('.compass-count');
  const summaryNumber = page.querySelector('.compass-summary strong');
  const chipRow = page.querySelector('.compass-chip-row');
  const detailPanel = page.querySelector('.compass-detail');
  const configTablePanel = page.querySelector('.compass-config-table');
  const configControls = page.querySelector('.compass-config-controls');
  const configTable = page.querySelector('.compass-config-grid');
  const configCount = page.querySelector('.compass-config-count');
  const configMessage = page.querySelector('.compass-config-message');
  const configTitle = page.querySelector('#compass-config-title');
  const configDescription = configTablePanel?.querySelector('.compass-config-head p');

  if (!table || !searchInput || !countLabel || !summaryNumber || !chipRow || !detailPanel
    || !configTablePanel || !configControls || !configTable || !configCount || !configMessage) {
    return;
  }

  let activeConfigRecord = null;
  let activeTableData = null;
  let activeCommerceContext = null;
  let activeCommerceContextPromise = null;

  const configState = {
    filters: {},
    page: 1,
    pageSize: PRODUCT_DETAILS_CONFIG_TABLE_PAGE_SIZE,
    quantities: {},
    selectedId: '',
    sort: { key: '', direction: 'asc' },
  };

  function hideConfigTable() {
    configTablePanel.hidden = true;
    configMessage.textContent = '';
    configMessage.removeAttribute('data-status');
    activeConfigRecord = null;
    activeTableData = null;
    activeCommerceContext = null;
    activeCommerceContextPromise = null;
  }

  const ensureCommerceContext = async (record) => {
    const binding = record?.configBinding;
    if (!binding?.commerceSku) {
      throw new Error('This product is not linked to a Commerce configuration table.');
    }

    if (activeCommerceContext?.parentSku === binding.commerceSku) {
      return activeCommerceContext;
    }

    if (!activeCommerceContextPromise || activeConfigRecord?.sku !== record.sku) {
      activeCommerceContextPromise = loadConfigTableCommerceContext(binding.commerceSku)
        .then((context) => {
          activeCommerceContext = context;
          return context;
        });
    }

    return activeCommerceContextPromise;
  };

  function renderConfigTable() {
    if (!activeTableData?.rows?.length) {
      return;
    }

    const tableState = applyProductDetailsConfigTableState(activeTableData.rows, configState);
    configCount.textContent = `${formatNumber(tableState.totalItems)} item${tableState.totalItems === 1 ? '' : 's'}`;

    const headerRow = document.createElement('tr');
    CONFIG_COLUMNS.forEach((column) => {
      const th = document.createElement('th');
      if (column.align) th.className = `compass-config-${column.align}`;

      if (column.sortable) {
        const button = document.createElement('button');
        button.className = 'compass-config-sort';
        button.type = 'button';
        button.textContent = column.label;
        button.dataset.direction = configState.sort.key === column.key ? configState.sort.direction : '';
        button.addEventListener('click', () => {
          configState.sort = {
            key: column.key,
            direction: configState.sort.key === column.key && configState.sort.direction === 'asc'
              ? 'desc'
              : 'asc',
          };
          configState.page = 1;
          renderConfigTable();
        });
        th.append(button);
      } else {
        th.textContent = column.label;
      }

      headerRow.append(th);
    });
    configTable.tHead.replaceChildren(headerRow);

    if (tableState.rows.length === 0) {
      configTable.tBodies[0].replaceChildren();
      const empty = document.createElement('tr');
      empty.innerHTML = '<td colspan="10"><div class="compass-empty">No shackle variants match the current filters.</div></td>';
      configTable.tBodies[0].append(empty);
      return;
    }

    configTable.tBodies[0].replaceChildren(...tableState.rows.map((row) => {
      const tr = document.createElement('tr');
      tr.className = configState.selectedId === row.id ? 'selected' : '';
      tr.addEventListener('click', () => {
        configState.selectedId = configState.selectedId === row.id ? '' : row.id;
        renderConfigTable();
      });

      const finishLabel = row.finish === 'Orange Powder Coated' ? 'Orange P.C.' : row.finish;
      tr.innerHTML = `
        <td><span class="compass-config-item">${row.id}</span></td>
        <td>${row.desc}</td>
        <td class="compass-config-right">${formatNumber(row.wll)} lbs</td>
        <td>${row.size}"</td>
        <td>${row.pin}</td>
        <td><span class="compass-config-badge ${getFinishClass(row.finish)}">${finishLabel}</span></td>
        <td class="compass-config-right"><span class="compass-config-stock ${getStockClass(row.qty)}">${row.qty || '-'}</span></td>
        <td class="compass-config-center"><span class="compass-config-lead ${getLeadClass(row.lt)}">${row.lt}d</span></td>
        <td class="compass-config-right">${formatMoney(row.price)}</td>
        <td class="compass-config-right"><span class="compass-config-actions"><input class="compass-config-qty" type="number" min="1" value="${configState.quantities[row.id] || 1}" aria-label="Quantity for ${row.id}"><button class="compass-config-add" type="button">Add to cart</button></span></td>
      `;

      const quantityInput = tr.querySelector('.compass-config-qty');
      quantityInput.addEventListener('click', (event) => event.stopPropagation());
      quantityInput.addEventListener('change', () => {
        configState.quantities[row.id] = normalizeProductDetailsConfigTableQuantity(
          quantityInput.value,
        );
        quantityInput.value = String(configState.quantities[row.id]);
      });

      const addButton = tr.querySelector('.compass-config-add');
      addButton.addEventListener('click', async (event) => {
        event.stopPropagation();
        addButton.disabled = true;
        addButton.textContent = 'Adding';
        configMessage.dataset.status = 'info';

        try {
          const quantity = normalizeProductDetailsConfigTableQuantity(quantityInput.value);
          configState.quantities[row.id] = quantity;
          quantityInput.value = String(quantity);

          const context = await ensureCommerceContext(activeConfigRecord);
          await addConfigTableRowToCart(context, row, quantity);
          configMessage.textContent = `${row.id} added to cart.`;
          configMessage.dataset.status = 'success';
        } catch (error) {
          configMessage.textContent = error?.message || `Unable to add ${row.id} to cart.`;
          configMessage.dataset.status = 'error';
        } finally {
          addButton.disabled = false;
          addButton.textContent = 'Add to cart';
        }
      });

      return tr;
    }));
  }

  const renderConfigControls = (tableRows) => {
    const filterOptions = getProductDetailsConfigTableFilterOptions(tableRows);

    const makeSelect = (key, label, formatter = String) => {
      const field = document.createElement('label');
      field.className = 'compass-config-field';
      field.innerHTML = `<span>${label}</span>`;
      const select = document.createElement('select');
      select.className = 'compass-config-select';
      select.innerHTML = '<option value="">All</option>';
      filterOptions[key].forEach((value) => {
        const option = document.createElement('option');
        option.value = String(value);
        option.textContent = formatter(value);
        select.append(option);
      });
      select.addEventListener('change', () => {
        configState.filters[key] = select.value;
        configState.page = 1;
        renderConfigTable();
      });
      field.append(select);
      return field;
    };

    const search = document.createElement('label');
    search.className = 'compass-config-field search';
    search.innerHTML = '<span>Search</span><input class="compass-config-input" type="search" placeholder="Search item or description">';
    search.querySelector('input').addEventListener('input', (event) => {
      configState.filters.query = event.target.value;
      configState.page = 1;
      renderConfigTable();
    });

    configControls.replaceChildren(
      search,
      makeSelect('desc', 'Description'),
      makeSelect('wll', 'WLL', formatNumber),
      makeSelect('size', 'Size'),
      makeSelect('pin', 'Pin Type'),
      makeSelect('finish', 'Finish'),
    );
  };

  async function showConfigTable(record) {
    const binding = record.configBinding;
    if (!binding) {
      hideConfigTable();
      return;
    }

    activeConfigRecord = record;
    activeTableData = getProductDetailsConfigTableData(binding.configTableFamily);
    activeCommerceContext = null;
    activeCommerceContextPromise = null;

    if (configTitle) configTitle.textContent = activeTableData.title;
    if (configDescription) configDescription.textContent = activeTableData.description;

    configTablePanel.hidden = false;
    renderConfigControls(activeTableData.rows);
    renderConfigTable();
    configTablePanel.scrollIntoView({ behavior: 'smooth', block: 'start' });

    configMessage.textContent = 'Loading Commerce options…';
    configMessage.dataset.status = 'info';

    try {
      const context = await ensureCommerceContext(record);
      const mappedCount = activeTableData.rows.filter((row) => (
        context.variantMap.has(String(row.id || '').trim().toLowerCase())
        || context.optionMap.has(String(row.id || '').trim().toLowerCase())
      )).length;

      if (mappedCount === 0 && context.coreError) {
        configMessage.textContent = `Commerce options are not fully mapped yet. ${context.coreError.message}`;
        configMessage.dataset.status = 'error';
      } else {
        configMessage.textContent = mappedCount > 0
          ? `${mappedCount} shackle options are linked to Commerce and ready for cart.`
          : 'Configuration rows are visible, but Commerce option UIDs still need to be mapped.';
        configMessage.dataset.status = mappedCount > 0 ? 'success' : 'error';
      }
    } catch (error) {
      configMessage.textContent = error?.message || 'Unable to load Commerce configuration options.';
      configMessage.dataset.status = 'error';
    }
  }

  function markQuoted(record) {
    const status = record.row.querySelector('.compass-status');
    const quoteButton = record.row.querySelector('.compass-action.primary');
    if (status) {
      status.className = 'compass-status quote';
      status.textContent = 'Quote Ready';
    }
    if (quoteButton) {
      quoteButton.textContent = 'Quoted';
      quoteButton.setAttribute('aria-label', `Quote prepared for ${record.name}`);
    }
    record.status = 'Quote Ready';
    setDetail(record, 'quote');
  }

  function setDetail(record, mode) {
    detailPanel.hidden = false;

    if (record.configBinding && mode !== 'quote') {
      showConfigTable(record);
    } else {
      hideConfigTable();
    }

    const productLink = record.configBinding?.productUrl
      ? `<p><a href="${record.configBinding.productUrl}">Open product configuration table</a></p>`
      : '';

    detailPanel.innerHTML = `
      <h3>${mode === 'quote' ? 'Quote prepared for' : 'Viewing'} ${record.name}</h3>
      <p><strong>${record.sku}</strong> - ${record.familyLabel} - ${record.rating} - ${record.availability} - ${record.price}</p>
      <p>${mode === 'quote' ? 'This assembly has been marked for quote follow-up.' : record.detail}</p>
      ${productLink}
      <div class="compass-detail-actions">
        <button class="compass-action secondary" type="button" data-detail-action="clear">Close</button>
        <button class="compass-action primary" type="button" data-detail-action="quote" data-sku="${record.sku}">Prepare quote</button>
      </div>
    `;

    detailPanel.querySelector('[data-detail-action="clear"]')?.addEventListener('click', () => {
      detailPanel.hidden = true;
      detailPanel.replaceChildren();
      hideConfigTable();
    });
    detailPanel.querySelector('[data-detail-action="quote"]')?.addEventListener('click', () => markQuoted(record));
  }

  const getActiveFilters = () => checkboxes.reduce((filters, checkbox) => {
    if (checkbox.checked) {
      const group = checkbox.dataset.filterGroup;
      filters[group] = filters[group] || [];
      filters[group].push(checkbox.value);
    }
    return filters;
  }, {});

  const rowData = rows.map((row) => {
    const sku = getSku(row);
    const meta = PRODUCT_META[sku] || {};
    const availability = getCellText(row, 5);
    const configTableKey = meta.configTableKey || getConfigTableKey(row);
    const configBinding = getCompassConfigTableBinding(configTableKey);
    const record = {
      row,
      sku,
      name: getProductName(row),
      description: getProductDescription(row),
      familyLabel: getCellText(row, 2),
      rating: getCellText(row, 3),
      status: getCellText(row, 4),
      availability,
      price: getCellText(row, 6),
      configTableKey,
      configBinding,
      filters: {
        family: meta.family || [],
        brand: meta.brand || [],
        availability: availability === 'Available' ? ['Quote required'] : [availability],
        application: meta.application || [],
      },
      detail: meta.detail || getProductDescription(row),
    };

    row.dataset.searchText = normalize([
      record.name,
      record.description,
      record.sku,
      record.familyLabel,
      record.rating,
      record.status,
      record.availability,
      record.price,
      Object.values(record.filters).flat().join(' '),
    ].join(' '));

    row.querySelectorAll('.compass-action').forEach((button) => {
      button.dataset.sku = sku;
      button.setAttribute('aria-label', `${button.textContent.trim()} ${record.name}`);
    });

    return record;
  });

  const emptyRow = document.createElement('tr');
  emptyRow.hidden = true;
  emptyRow.innerHTML = '<td colspan="8"><div class="compass-empty">No product assemblies match the current search and filters.</div></td>';
  table.tBodies[0].append(emptyRow);

  const matchesFilters = (record, filters) => Object.entries(filters).every(([group, selected]) => {
    const values = record.filters[group] || [];
    return selected.length === 0 || selected.some((value) => values.includes(value));
  });

  const updateFilterCounts = () => {
    checkboxes.forEach((checkbox) => {
      const count = rowData.filter((record) => (
        record.filters[checkbox.dataset.filterGroup] || []
      ).includes(checkbox.value)).length;
      const countNode = checkbox.closest('.compass-filter-option')?.querySelector('em');
      if (countNode) countNode.textContent = count;
    });
  };

  const renderChips = (filters) => {
    chipRow.replaceChildren();
    const selected = Object.entries(filters).flatMap(([group, values]) => (
      values.map((value) => ({ group, value }))
    ));

    if (selected.length === 0) {
      const chip = document.createElement('button');
      chip.className = 'compass-chip';
      chip.type = 'button';
      chip.textContent = 'All products';
      chip.disabled = true;
      chipRow.append(chip);
      return;
    }

    selected.forEach(({ group, value }) => {
      const chip = document.createElement('button');
      chip.className = 'compass-chip';
      chip.type = 'button';
      chip.textContent = `${value} x`;
      chip.setAttribute('aria-label', `Remove ${value} filter`);
      chip.addEventListener('click', () => {
        const checkbox = checkboxes.find((item) => (
          item.dataset.filterGroup === group && item.value === value
        ));
        if (checkbox) {
          checkbox.checked = false;
          applyFilters();
        }
      });
      chipRow.append(chip);
    });
  };

  function applyFilters() {
    const query = normalize(searchInput.value);
    const filters = getActiveFilters();
    let visibleCount = 0;

    rowData.forEach((record) => {
      const matchesSearch = !query || record.row.dataset.searchText.includes(query);
      const isVisible = matchesSearch && matchesFilters(record, filters);
      record.row.hidden = !isVisible;
      if (isVisible) visibleCount += 1;
    });

    emptyRow.hidden = visibleCount !== 0;
    countLabel.innerHTML = `<b>${visibleCount}</b> ${visibleCount === 1 ? 'product' : 'products'} shown`;
    summaryNumber.textContent = visibleCount;
    renderChips(filters);
  }

  searchInput.addEventListener('input', applyFilters);
  checkboxes.forEach((checkbox) => checkbox.addEventListener('change', applyFilters));
  resetButton?.addEventListener('click', () => {
    searchInput.value = '';
    checkboxes.forEach((checkbox) => {
      checkbox.checked = false;
    });
    detailPanel.hidden = true;
    detailPanel.replaceChildren();
    hideConfigTable();
    applyFilters();
    searchInput.focus();
  });

  page.addEventListener('click', (event) => {
    const button = event.target.closest('.compass-action');
    if (!button || !button.dataset.sku) return;
    const record = rowData.find((item) => item.sku === button.dataset.sku);
    if (!record) return;

    if (button.classList.contains('primary')) {
      markQuoted(record);
      return;
    }

    setDetail(record, 'view');
  });

  updateFilterCounts();
  applyFilters();
}

async function bootstrapCompass() {
  await import('../initializers/cart.js');

  const page = document.querySelector('.compass-page');
  if (page) {
    initCompassPage(page);
  }
}

bootstrapCompass();
