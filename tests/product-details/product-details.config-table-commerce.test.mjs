import { test } from 'node:test';
import assert from 'node:assert/strict';
/* eslint-disable import/extensions */
import {
  buildConfigTableCartItem,
  canBuildConfigTableCartItem,
} from '../../blocks/product-details/product-details.config-table-cart-utils.mjs';
import { getProductDetailsConfigTableData } from '../../blocks/product-details/product-details.config-table-data.mjs';
/* eslint-enable import/extensions */

test('buildConfigTableCartItem uses variant selections when available', () => {
  const context = {
    parentSku: 'CM Anchor Shackles',
    variantMap: new Map([
      ['m347p', { sku: 'CM Anchor Shackles', optionsUIDs: ['option-uid-347p'] }],
    ]),
    optionMap: new Map(),
  };

  const item = buildConfigTableCartItem(context, { id: 'M347P' }, 2);

  assert.deepEqual(item, {
    sku: 'CM Anchor Shackles',
    optionsUIDs: ['option-uid-347p'],
    quantity: 2,
  });
});

test('buildConfigTableCartItem uses core option uid mapping when variants are unavailable', () => {
  const context = {
    parentSku: 'CM Anchor Shackles',
    variantMap: new Map(),
    optionMap: new Map([
      ['m346g', 'option-uid-346g'],
    ]),
  };

  const item = buildConfigTableCartItem(context, { id: 'M346G' }, 1);

  assert.deepEqual(item, {
    sku: 'CM Anchor Shackles',
    optionsUIDs: ['option-uid-346g'],
    quantity: 1,
  });
});

test('buildConfigTableCartItem rejects rows without backend option UIDs', () => {
  const context = {
    parentSku: 'CM Anchor Shackles',
    variantMap: new Map(),
    optionMap: new Map(),
  };

  assert.throws(
    () => buildConfigTableCartItem(context, { id: 'M345G' }, 3),
    /did not expose its option UID/,
  );
  assert.equal(canBuildConfigTableCartItem(context, { id: 'M345G' }), false);
  assert.equal(canBuildConfigTableCartItem(context, { id: 'M345G', optionValueUid: 'uid-345g' }), false);
});

test('buildConfigTableCartItem can fall back to the parent simple product SKU', () => {
  const context = {
    parentSku: 'CM Anchor Shackles',
    variantMap: new Map(),
    optionMap: new Map(),
    parentSkuFallbackAllowed: true,
  };

  const item = buildConfigTableCartItem(context, { id: 'M345G' }, 4);

  assert.deepEqual(item, {
    sku: 'CM Anchor Shackles',
    quantity: 4,
  });
  assert.equal(canBuildConfigTableCartItem(context, { id: 'M345G' }), true);
});

test('CM Anchor Shackles table data keeps all visible variants independent of commerce mapping', () => {
  const tableData = getProductDetailsConfigTableData('cm-anchor-shackles');
  const context = {
    parentSku: 'CM Anchor Shackles',
    variantMap: new Map(),
    optionMap: new Map(),
    coreStatus: 'unsupported-endpoint',
    coreMessage: 'Commerce option UIDs are not available.',
    parentSkuFallbackAllowed: true,
  };

  assert.equal(tableData.rows.length, 24);
  assert.equal(
    tableData.rows.filter((row) => canBuildConfigTableCartItem(context, row)).length,
    24,
  );
});
