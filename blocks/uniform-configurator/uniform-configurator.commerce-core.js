import { getConfigValue, getHeaders } from '@dropins/tools/lib/aem/configs.js';
import { CORE_FETCH_GRAPHQL } from '../../scripts/commerce.js';
import { normalizeCoreCustomizableProduct } from './uniform-configurator.commerce.js';
import {
  CORE_CUSTOMIZABLE_STATUSES,
  classifyCoreCustomizableFailure,
  getCoreEndpointUnsupportedResult,
  isSameCommerceEndpoint,
} from './uniform-configurator.commerce-core-status.js';

const CORE_CUSTOMIZABLE_PRODUCT_QUERY = `
  query UniformConfiguratorCoreProduct($sku: String!) {
    products(filter: { sku: { eq: $sku } }) {
      items {
        __typename
        sku
        name
        ... on CustomizableProductInterface {
          options {
            __typename
            uid
            title
            required
            sort_order
            ... on CustomizableDropDownOption {
              value {
                uid
                title
                sort_order
                price
                price_type
                sku
              }
            }
            ... on CustomizableCheckboxOption {
              value {
                uid
                title
                sort_order
                price
                price_type
                sku
              }
            }
            ... on CustomizableMultipleOption {
              value {
                uid
                title
                sort_order
                price
                price_type
                sku
              }
            }
            ... on CustomizableRadioOption {
              value {
                uid
                title
                sort_order
                price
                price_type
                sku
              }
            }
            ... on CustomizableFieldOption {
              value {
                uid
                price
                price_type
                max_characters
                sku
              }
            }
            ... on CustomizableAreaOption {
              value {
                uid
                price
                price_type
                max_characters
                sku
              }
            }
          }
        }
      }
    }
  }
`;

function buildCoreCustomizableError(message, endpoint = '') {
  const suffix = endpoint ? ` Endpoint: ${endpoint}` : '';
  return new Error(`${message}${suffix}`);
}

function getErrorMessage(errors = []) {
  return errors
    .map((error) => error?.message)
    .filter(Boolean)
    .join('; ');
}

export async function fetchCoreCustomizableCommerceProduct(sku) {
  const coreEndpoint = String(await getConfigValue('commerce-core-endpoint') || '').trim();
  const commerceEndpoint = String(await getConfigValue('commerce-endpoint') || '').trim();

  if (!coreEndpoint) {
    return {
      product: null,
      error: null,
      status: CORE_CUSTOMIZABLE_STATUSES.UNAVAILABLE,
      message: `Commerce option UIDs are not available for "${sku}" because commerce-core-endpoint is not configured.`,
    };
  }

  if (isSameCommerceEndpoint(coreEndpoint, commerceEndpoint)) {
    return getCoreEndpointUnsupportedResult(coreEndpoint);
  }

  CORE_FETCH_GRAPHQL.setEndpoint(coreEndpoint);
  CORE_FETCH_GRAPHQL.setFetchGraphQlHeaders((prev) => ({
    ...prev,
    ...getHeaders('all'),
  }));

  let payload;
  try {
    payload = await CORE_FETCH_GRAPHQL.fetchGraphQl(CORE_CUSTOMIZABLE_PRODUCT_QUERY, {
      method: 'GET',
      cache: 'no-cache',
      variables: { sku },
    });
  } catch (error) {
    const classification = classifyCoreCustomizableFailure(error?.message, coreEndpoint);
    if (classification.status !== CORE_CUSTOMIZABLE_STATUSES.ERROR) {
      return {
        product: null,
        error: null,
        status: classification.status,
        message: classification.message,
      };
    }

    return {
      product: null,
      error: buildCoreCustomizableError(
        classification.errorMessage || error?.message || 'Unable to query the configured commerce-core-endpoint.',
        coreEndpoint,
      ),
      status: CORE_CUSTOMIZABLE_STATUSES.ERROR,
      message: 'Unable to query the configured commerce-core-endpoint.',
    };
  }

  if (Array.isArray(payload?.errors) && payload.errors.length > 0) {
    const errorMessage = getErrorMessage(payload.errors);
    const classification = classifyCoreCustomizableFailure(errorMessage, coreEndpoint);
    if (classification.status !== CORE_CUSTOMIZABLE_STATUSES.ERROR) {
      return {
        product: null,
        error: null,
        status: classification.status,
        message: classification.message,
      };
    }

    return {
      product: null,
      error: buildCoreCustomizableError(
        errorMessage || 'The configured commerce-core-endpoint rejected the customizable options query.',
        coreEndpoint,
      ),
      status: CORE_CUSTOMIZABLE_STATUSES.ERROR,
      message: 'The configured commerce-core-endpoint rejected the customizable options query.',
    };
  }

  const product = payload?.data?.products?.items?.[0];

  if (!product?.sku) {
    return {
      product: null,
      error: buildCoreCustomizableError(
        `The commerce-core-endpoint did not return a customizable product payload for SKU "${sku}".`,
        coreEndpoint,
      ),
      status: CORE_CUSTOMIZABLE_STATUSES.ERROR,
      message: `The commerce-core-endpoint did not return a customizable product payload for SKU "${sku}".`,
    };
  }

  return {
    product: normalizeCoreCustomizableProduct(product),
    error: null,
    status: CORE_CUSTOMIZABLE_STATUSES.READY,
    message: '',
  };
}
