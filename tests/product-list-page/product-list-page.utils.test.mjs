import test from 'node:test';
import assert from 'node:assert/strict';

/* eslint-disable import/extensions */
import {
  buildActiveFilterChips,
  buildFacetMetadataMap,
  getNextUserFiltersForChip,
  normalizeSearchRequest,
} from '../../blocks/product-list-page/product-list-page.utils.mjs';
/* eslint-enable import/extensions */

test('normalizeSearchRequest adds hidden catalog filters and category sort defaults', () => {
  assert.deepEqual(
    normalizeSearchRequest({
      request: {
        phrase: '',
        currentPage: 2,
        filter: [
          { attribute: 'voltage', in: ['120V'] },
          { attribute: 'visibility', in: ['Search'] },
        ],
      },
      urlpath: 'power-cooling',
      pageSize: 12,
    }),
    {
      phrase: '',
      currentPage: 2,
      pageSize: 12,
      sort: [{ attribute: 'position', direction: 'DESC' }],
      filter: [
        { attribute: 'categoryPath', eq: 'power-cooling' },
        { attribute: 'visibility', in: ['Search', 'Catalog, Search'] },
        { attribute: 'voltage', in: ['120V'] },
      ],
    },
  );
});

test('buildActiveFilterChips skips hidden filters and uses facet labels when available', () => {
  const facetMetadata = buildFacetMetadataMap([
    {
      attribute: 'rack_height',
      title: 'Rack Height',
      buckets: [
        {
          title: '42U',
          count: 4,
        },
        {
          title: '48U',
          count: 2,
        },
      ],
    },
    {
      attribute: 'price',
      title: 'Price',
      buckets: [
        {
          title: '0-100',
          from: 0,
          to: 100,
        },
      ],
    },
  ]);

  assert.deepEqual(
    buildActiveFilterChips([
      { attribute: 'categoryPath', eq: 'server-racks' },
      { attribute: 'visibility', in: ['Search', 'Catalog, Search'] },
      { attribute: 'rack_height', in: ['42U', '48U'] },
      { attribute: 'price', range: { from: 0, to: 100 } },
    ], facetMetadata),
    [
      {
        key: 'rack_height:in:42U',
        attribute: 'rack_height',
        type: 'in',
        value: '42U',
        label: 'Rack Height: 42U',
      },
      {
        key: 'rack_height:in:48U',
        attribute: 'rack_height',
        type: 'in',
        value: '48U',
        label: 'Rack Height: 48U',
      },
      {
        key: 'price:range:0-100',
        attribute: 'price',
        type: 'range',
        range: { from: 0, to: 100 },
        label: 'Price: $0 - $100',
      },
    ],
  );
});

test('getNextUserFiltersForChip removes one selection without disturbing other filters', () => {
  assert.deepEqual(
    getNextUserFiltersForChip([
      { attribute: 'visibility', in: ['Search', 'Catalog, Search'] },
      { attribute: 'rack_height', in: ['42U', '48U'] },
      { attribute: 'finish', in: ['Black'] },
    ], {
      attribute: 'rack_height',
      type: 'in',
      value: '42U',
    }),
    [
      { attribute: 'rack_height', in: ['48U'] },
      { attribute: 'finish', in: ['Black'] },
    ],
  );
});

test('getNextUserFiltersForChip removes matching range filters entirely', () => {
  assert.deepEqual(
    getNextUserFiltersForChip([
      { attribute: 'voltage', in: ['120V'] },
      { attribute: 'price', range: { from: 0, to: 100 } },
    ], {
      attribute: 'price',
      type: 'range',
      range: { from: 0, to: 100 },
    }),
    [
      { attribute: 'voltage', in: ['120V'] },
    ],
  );
});
