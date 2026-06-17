import test from 'node:test';
import assert from 'node:assert/strict';

/* eslint-disable import/extensions */
import { getProductDetailsConfigTableData } from '../../blocks/product-details/product-details.config-table-data.mjs';
import {
  applyProductDetailsConfigTableState,
  filterProductDetailsConfigTableRows,
  getProductDetailsConfigTableFilterOptions,
  normalizeProductDetailsConfigTableQuantity,
  paginateProductDetailsConfigTableRows,
  sortProductDetailsConfigTableRows,
} from '../../blocks/product-details/product-details.config-table-utils.mjs';
/* eslint-enable import/extensions */

const { rows } = getProductDetailsConfigTableData('cm-anchor-shackles');

test('filterProductDetailsConfigTableRows searches item number and description', () => {
  assert.deepEqual(
    filterProductDetailsConfigTableRows(rows, { query: 'm345' }).map((row) => row.id),
    ['M345G'],
  );

  assert.equal(
    filterProductDetailsConfigTableRows(rows, { query: 'anchor shackle' }).length,
    24,
  );
});

test('filterProductDetailsConfigTableRows supports numeric WLL values with commas', () => {
  assert.deepEqual(
    filterProductDetailsConfigTableRows(rows, { wll: '1,500' }).map((row) => row.id),
    ['M346', 'M346G', 'M346P'],
  );
});

test('filterProductDetailsConfigTableRows combines select filters', () => {
  assert.deepEqual(
    filterProductDetailsConfigTableRows(rows, {
      finish: 'Orange Powder Coated',
      size: '7/8',
    }).map((row) => row.id),
    ['M324P'],
  );
});

test('sortProductDetailsConfigTableRows sorts string and numeric columns', () => {
  assert.equal(sortProductDetailsConfigTableRows(rows, { key: 'price', direction: 'desc' })[0].id, 'M324P');
  assert.equal(sortProductDetailsConfigTableRows(rows, { key: 'id', direction: 'asc' })[0].id, 'M322');
});

test('paginateProductDetailsConfigTableRows returns bounded pages', () => {
  const page = paginateProductDetailsConfigTableRows(rows, 2, 18);

  assert.equal(page.currentPage, 2);
  assert.equal(page.totalPages, 2);
  assert.equal(page.startIndex, 19);
  assert.equal(page.endIndex, 24);
  assert.equal(page.rows.length, 6);

  assert.equal(paginateProductDetailsConfigTableRows(rows, 99, 18).currentPage, 2);
});

test('applyProductDetailsConfigTableState handles empty filtered results', () => {
  const state = applyProductDetailsConfigTableState(rows, {
    filters: { query: 'not-a-real-item' },
    sort: { key: 'price', direction: 'asc' },
    page: 1,
  });

  assert.equal(state.totalItems, 0);
  assert.equal(state.startIndex, 0);
  assert.equal(state.rows.length, 0);
});

test('normalizeProductDetailsConfigTableQuantity accepts positive integers only', () => {
  assert.equal(normalizeProductDetailsConfigTableQuantity('3'), 3);
  assert.equal(normalizeProductDetailsConfigTableQuantity('3.9'), 3);
  assert.equal(normalizeProductDetailsConfigTableQuantity('0'), 1);
  assert.equal(normalizeProductDetailsConfigTableQuantity('abc'), 1);
});

test('getProductDetailsConfigTableFilterOptions returns unique sorted filters', () => {
  const options = getProductDetailsConfigTableFilterOptions(rows);

  assert.deepEqual(options.wll.slice(0, 3), [1000, 1500, 2000]);
  assert.ok(options.finish.includes('Galvanized'));
  assert.ok(options.size.includes('7/8'));
});
