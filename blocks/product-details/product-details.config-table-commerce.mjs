/* eslint-disable import/extensions */
import { addProductsToCart } from '@dropins/storefront-cart/api.js';
import {
  fetchGraphQl,
  fetchProductData,
  setEndpoint as setPdpEndpoint,
} from '@dropins/storefront-pdp/api.js';
import { CS_FETCH_GRAPHQL } from '../../scripts/commerce.js';
import { fetchCoreCustomizableCommerceProduct } from '../uniform-configurator/uniform-configurator.commerce-core.js';
import { mergeCommerceContractProduct } from '../uniform-configurator/uniform-configurator.commerce.js';
import {
  buildConfigTableCartItem,
  buildMissingConfigTableOptionError,
  canBuildConfigTableCartItem,
  indexCoreOptionValueUids,
  indexOptionValueUids,
  indexVariantSelections,
} from './product-details.config-table-cart-utils.mjs';

const PRODUCT_VARIANTS_QUERY = `
  query GET_PRODUCT_VARIANTS($sku: String!) {
    variants(sku: $sku) {
      variants {
        selections
        product {
          sku
        }
      }
    }
  }
`;

async function fetchConfigTableProductVariants(sku) {
  const { data } = await fetchGraphQl(PRODUCT_VARIANTS_QUERY, {
    method: 'GET',
    variables: { sku },
  });

  return data?.variants?.variants ?? [];
}

export async function loadConfigTableCommerceContext(parentSku) {
  const normalizedSku = String(parentSku || '').trim();
  if (!normalizedSku) {
    throw new Error('A parent product SKU is required to add configuration table items to cart.');
  }

  setPdpEndpoint(CS_FETCH_GRAPHQL);

  const [catalogProduct, coreResult] = await Promise.all([
    fetchProductData(normalizedSku).catch(() => null),
    fetchCoreCustomizableCommerceProduct(normalizedSku),
  ]);

  const product = coreResult?.product
    ? mergeCommerceContractProduct(catalogProduct || { sku: normalizedSku }, coreResult.product)
    : catalogProduct;

  let variants = [];
  try {
    variants = await fetchConfigTableProductVariants(normalizedSku);
  } catch (error) {
    console.warn('config-table: unable to load product variants', error);
  }

  const variantMap = indexVariantSelections(variants, normalizedSku);
  const optionMap = new Map([
    ...indexOptionValueUids(product),
    ...indexCoreOptionValueUids(coreResult?.product),
  ]);
  const parentSkuFallbackAllowed = Boolean(
    product?.sku
    && product?.addToCartAllowed !== false
    && variantMap.size === 0
    && optionMap.size === 0
    && (product?.__typename === 'SimpleProductView' || !product?.__typename)
    && (!Array.isArray(product?.options) || product.options.length === 0)
    && (!Array.isArray(product?.inputOptions) || product.inputOptions.length === 0),
  );

  return {
    parentSku: normalizedSku,
    product,
    variantMap,
    optionMap,
    parentSkuFallbackAllowed,
    coreError: coreResult?.error || null,
    coreStatus: coreResult?.status || '',
    coreMessage: coreResult?.message || '',
  };
}

export async function addConfigTableRowToCart(context, row, quantity = 1) {
  if (!canBuildConfigTableCartItem(context, row)) {
    throw buildMissingConfigTableOptionError(row, context);
  }

  const item = buildConfigTableCartItem(context, row, quantity);
  await addProductsToCart([item]);
  return item;
}

export {
  buildConfigTableCartItem,
  buildMissingConfigTableOptionError,
  canBuildConfigTableCartItem,
} from './product-details.config-table-cart-utils.mjs';
