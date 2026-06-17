export const PRODUCT_DETAILS_CONFIG_TABLE_PAGE_SIZE = 18;

const NUMERIC_SORT_KEYS = new Set(['wll', 'qty', 'lt', 'price']);
const FILTER_KEYS = ['desc', 'wll', 'size', 'pin', 'finish'];

function normalizeText(value = '') {
  return String(value || '').trim().toLowerCase();
}

function normalizeWllFilter(value = '') {
  return String(value || '').replace(/,/g, '').trim();
}

export function getProductDetailsConfigTableFilterOptions(rows = []) {
  return FILTER_KEYS.reduce((options, key) => {
    const values = rows
      .map((row) => row?.[key])
      .filter((value) => value !== undefined && value !== null && value !== '');

    const unique = [...new Set(values)];

    options[key] = key === 'wll'
      ? unique.sort((a, b) => Number(a) - Number(b))
      : unique.sort((a, b) => String(a).localeCompare(String(b)));

    return options;
  }, {});
}

export function filterProductDetailsConfigTableRows(rows = [], filters = {}) {
  const query = normalizeText(filters.query);
  const desc = String(filters.desc || '');
  const wll = normalizeWllFilter(filters.wll);
  const size = String(filters.size || '');
  const pin = String(filters.pin || '');
  const finish = String(filters.finish || '');

  return rows.filter((row) => {
    if (query) {
      const haystack = `${row.id || ''} ${row.desc || ''}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }

    if (desc && row.desc !== desc) return false;
    if (wll && String(row.wll) !== wll) return false;
    if (size && row.size !== size) return false;
    if (pin && row.pin !== pin) return false;
    if (finish && row.finish !== finish) return false;

    return true;
  });
}

export function sortProductDetailsConfigTableRows(rows = [], sort = {}) {
  const key = String(sort.key || '');
  const direction = sort.direction === 'desc' ? -1 : 1;

  if (!key) return [...rows];

  return [...rows].sort((a, b) => {
    const aValue = a?.[key];
    const bValue = b?.[key];

    if (NUMERIC_SORT_KEYS.has(key)) {
      return ((Number(aValue) || 0) - (Number(bValue) || 0)) * direction;
    }

    return String(aValue || '').localeCompare(String(bValue || '')) * direction;
  });
}

export function paginateProductDetailsConfigTableRows(
  rows = [],
  page = 1,
  pageSize = PRODUCT_DETAILS_CONFIG_TABLE_PAGE_SIZE,
) {
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(Math.max(Number(page) || 1, 1), totalPages);
  const start = (currentPage - 1) * pageSize;

  return {
    currentPage,
    pageSize,
    totalPages,
    totalItems: rows.length,
    startIndex: rows.length > 0 ? start + 1 : 0,
    endIndex: Math.min(start + pageSize, rows.length),
    rows: rows.slice(start, start + pageSize),
  };
}

export function applyProductDetailsConfigTableState(rows = [], state = {}) {
  const filtered = filterProductDetailsConfigTableRows(rows, state.filters);
  const sorted = sortProductDetailsConfigTableRows(filtered, state.sort);

  return paginateProductDetailsConfigTableRows(
    sorted,
    state.page,
    state.pageSize || PRODUCT_DETAILS_CONFIG_TABLE_PAGE_SIZE,
  );
}

export function normalizeProductDetailsConfigTableQuantity(value = 1) {
  const quantity = Math.floor(Number(value));
  return Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
}
