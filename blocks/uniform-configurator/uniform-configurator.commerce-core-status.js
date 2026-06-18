export const CORE_CUSTOMIZABLE_STATUSES = Object.freeze({
  READY: 'ready',
  UNAVAILABLE: 'unavailable',
  UNSUPPORTED_ENDPOINT: 'unsupported-endpoint',
  ERROR: 'error',
});

const CATALOG_SERVICE_SCHEMA_PATTERNS = [
  /Unknown argument "filter" on field "Query\.products"/i,
  /Cannot query field "items" on type "ProductView"/i,
  /Field "products" of type "\[?ProductView/i,
];

export function normalizeCommerceEndpoint(value = '') {
  return String(value || '').trim().replace(/\/+$/, '');
}

export function isSameCommerceEndpoint(left = '', right = '') {
  const normalizedLeft = normalizeCommerceEndpoint(left);
  const normalizedRight = normalizeCommerceEndpoint(right);

  return Boolean(normalizedLeft && normalizedRight && normalizedLeft === normalizedRight);
}

export function isCatalogServiceSchemaError(message = '') {
  const normalized = String(message || '');
  return CATALOG_SERVICE_SCHEMA_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function classifyCoreCustomizableFailure(message = '') {
  if (isCatalogServiceSchemaError(message)) {
    return {
      status: CORE_CUSTOMIZABLE_STATUSES.UNSUPPORTED_ENDPOINT,
      message: 'Commerce option UIDs are not available because commerce-core-endpoint is using the Catalog Service schema.',
      error: null,
    };
  }

  return {
    status: CORE_CUSTOMIZABLE_STATUSES.ERROR,
    message: 'Unable to query the configured commerce-core-endpoint.',
    errorMessage: 'Unable to query the configured commerce-core-endpoint.',
  };
}

export function getCoreEndpointUnsupportedResult(endpoint = '') {
  return {
    product: null,
    error: null,
    status: CORE_CUSTOMIZABLE_STATUSES.UNSUPPORTED_ENDPOINT,
    message: endpoint
      ? `Commerce option UIDs are not available because commerce-core-endpoint points to Catalog Service (${endpoint}).`
      : 'Commerce option UIDs are not available because commerce-core-endpoint points to Catalog Service.',
  };
}
