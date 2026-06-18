import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  CORE_CUSTOMIZABLE_STATUSES,
  classifyCoreCustomizableFailure,
  getCoreEndpointUnsupportedResult,
  isCatalogServiceSchemaError,
  isSameCommerceEndpoint,
} from '../../blocks/uniform-configurator/uniform-configurator.commerce-core-status.js';

test('isSameCommerceEndpoint ignores trailing slashes', () => {
  assert.equal(
    isSameCommerceEndpoint(
      'https://na1.api.commerce.adobe.com/R2BTcyPc7knfUJMozF1oQQ/graphql/',
      'https://na1.api.commerce.adobe.com/R2BTcyPc7knfUJMozF1oQQ/graphql',
    ),
    true,
  );
  assert.equal(
    isSameCommerceEndpoint(
      'https://www.aemshop.net/graphql',
      'https://www.aemshop.net/cs-graphql',
    ),
    false,
  );
});

test('classifyCoreCustomizableFailure treats Catalog Service schema errors as unsupported endpoints', () => {
  const message = [
    'Field "products" of type "[ProductView]" must have a selection of subfields.',
    'Unknown argument "filter" on field "Query.products".',
    'Cannot query field "items" on type "ProductView".',
  ].join('; ');

  assert.equal(isCatalogServiceSchemaError(message), true);

  const result = classifyCoreCustomizableFailure(
    message,
    'https://na1.api.commerce.adobe.com/R2BTcyPc7knfUJMozF1oQQ/graphql',
  );

  assert.equal(result.status, CORE_CUSTOMIZABLE_STATUSES.UNSUPPORTED_ENDPOINT);
  assert.equal(result.error, null);
  assert.match(result.message, /Commerce option UIDs are not available/);
});

test('getCoreEndpointUnsupportedResult returns a non-fatal fallback result', () => {
  const result = getCoreEndpointUnsupportedResult('https://example.test/graphql');

  assert.deepEqual(result, {
    product: null,
    error: null,
    status: CORE_CUSTOMIZABLE_STATUSES.UNSUPPORTED_ENDPOINT,
    message: 'Commerce option UIDs are not available because commerce-core-endpoint points to Catalog Service (https://example.test/graphql).',
  });
});

test('classifyCoreCustomizableFailure preserves unexpected failures as errors', () => {
  const result = classifyCoreCustomizableFailure('Network request failed');

  assert.equal(result.status, CORE_CUSTOMIZABLE_STATUSES.ERROR);
  assert.equal(result.message, 'Unable to query the configured commerce-core-endpoint.');
  assert.equal(result.errorMessage, 'Unable to query the configured commerce-core-endpoint.');
});
