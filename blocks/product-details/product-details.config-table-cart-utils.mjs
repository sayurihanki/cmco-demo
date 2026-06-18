function normalizeSku(value = '') {
  return String(value || '').trim().toLowerCase();
}

function getRowOptionUid(row = {}) {
  return row.optionUID
    || row.optionUid
    || row.optionValueUID
    || row.optionValueUid
    || row.uid
    || '';
}

export function indexOptionValueUids(product = {}) {
  const map = new Map();

  (product?.options || []).forEach((option) => {
    (option?.values || []).forEach((value) => {
      if (!value?.uid) return;

      [value.sku, value.id, value.title, value.label].forEach((key) => {
        if (key) map.set(normalizeSku(key), value.uid);
      });
    });
  });

  return map;
}

export function indexCoreOptionValueUids(coreProduct = {}) {
  const map = new Map();

  (coreProduct?.options || []).forEach((option) => {
    (option?.values || []).forEach((value) => {
      if (!value?.uid) return;

      [value.sku, value.title].forEach((key) => {
        if (key) map.set(normalizeSku(key), value.uid);
      });
    });
  });

  return map;
}

export function indexVariantSelections(variants = [], parentSku = '') {
  const map = new Map();

  variants.forEach((variant) => {
    const variantSku = variant?.product?.sku;
    if (!variantSku || !Array.isArray(variant?.selections) || variant.selections.length === 0) {
      return;
    }

    map.set(normalizeSku(variantSku), {
      sku: parentSku,
      optionsUIDs: variant.selections,
    });
  });

  return map;
}

export function buildConfigTableCartItem(context, row, quantity = 1) {
  if (!context?.parentSku) {
    throw new Error('Configuration table commerce context is not ready.');
  }

  const rowKey = normalizeSku(row?.id);
  if (!rowKey) {
    throw new Error('Missing configuration row identifier.');
  }

  const qty = Math.max(1, Math.floor(Number(quantity) || 1));
  const variantPayload = context.variantMap.get(rowKey);

  if (variantPayload) {
    return {
      ...variantPayload,
      quantity: qty,
    };
  }

  const explicitUid = getRowOptionUid(row);
  if (explicitUid) {
    return {
      sku: context.parentSku,
      optionsUIDs: [explicitUid],
      quantity: qty,
    };
  }

  const optionUid = context.optionMap.get(rowKey);
  if (optionUid) {
    return {
      sku: context.parentSku,
      optionsUIDs: [optionUid],
      quantity: qty,
    };
  }

  return {
    sku: row.id,
    quantity: qty,
  };
}

export function buildMissingConfigTableOptionError(row = {}, context = {}) {
  const optionSku = row?.id ? ` "${row.id}"` : '';

  return new Error(
    `The selected shackle option${optionSku} is visible, but Adobe Commerce did not expose its option UID. `
    + `Configure commerce-core-endpoint for "${context.parentSku}" or add optionValueUid values to the `
    + 'configuration table data before add to cart.',
  );
}

export function canBuildConfigTableCartItem(context, row) {
  if (!context?.parentSku || !row?.id) {
    return false;
  }

  const rowKey = normalizeSku(row.id);
  if (context.variantMap.has(rowKey)) {
    return true;
  }

  if (getRowOptionUid(row)) {
    return true;
  }

  return context.optionMap.has(rowKey);
}
