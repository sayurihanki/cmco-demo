function normalizeEnteredOptions(entries = []) {
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries
    .map((entry) => {
      const uid = entry?.uid || entry?.id || '';
      const value = entry?.value == null ? '' : String(entry.value).trim();

      if (!uid || !value) {
        return null;
      }

      return {
        uid,
        value,
      };
    })
    .filter(Boolean);
}

function getInputOptions(product) {
  return Array.isArray(product?.inputOptions) ? product.inputOptions : [];
}

export function validateRequiredRequisitionListOptions(product, values = {}) {
  const productOptions = product?.options || [];
  const selectedOptions = Array.isArray(values?.optionsUIDs) ? values.optionsUIDs : [];
  const isBundle = product?.isBundle || false;

  const optionsToValidate = isBundle
    ? productOptions.filter((opt) => opt.required)
    : productOptions;

  const selectableOptionsAreValid = optionsToValidate.length === 0
    || selectedOptions.length >= optionsToValidate.length;

  if (!selectableOptionsAreValid) {
    return false;
  }

  const enteredValues = new Map(
    normalizeEnteredOptions(values?.enteredOptions).map((entry) => [entry.uid, entry.value]),
  );

  return getInputOptions(product).every((option) => {
    if (!option?.required) {
      return true;
    }

    return Boolean(enteredValues.get(option.id));
  });
}

export function buildRequisitionListSelectorProps(product, values = {}) {
  const selectedOptions = Array.isArray(values?.optionsUIDs) && values.optionsUIDs.length > 0
    ? values.optionsUIDs
    : null;
  const enteredOptions = normalizeEnteredOptions(values?.enteredOptions);

  return {
    quantity: product?.quantity || values?.quantity || 1,
    selectedOptions,
    enteredOptions: enteredOptions.length > 0 ? enteredOptions : undefined,
  };
}
