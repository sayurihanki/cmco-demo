export const PRODUCT_DETAILS_PRESENTATIONS = Object.freeze({
  DEFAULT: 'default',
  AUTO_IMMERSIVE: 'auto-immersive',
});

export const PRODUCT_DETAILS_DEFAULT_SVG_LABEL = 'Technical view';
export const PRODUCT_DETAILS_DEFAULT_CONFIG_TABLE_FAMILY = 'cm-anchor-shackles';

export function normalizeProductDetailsPresentation(value = '') {
  const normalized = String(value || '').trim().toLowerCase();

  if (normalized === PRODUCT_DETAILS_PRESENTATIONS.AUTO_IMMERSIVE) {
    return PRODUCT_DETAILS_PRESENTATIONS.AUTO_IMMERSIVE;
  }

  return PRODUCT_DETAILS_PRESENTATIONS.DEFAULT;
}

export function shouldActivateConfigurator(payload = {}) {
  return payload?.status === 'ready';
}

export function shouldActivateImmersivePresentation(
  presentation = PRODUCT_DETAILS_PRESENTATIONS.DEFAULT,
  payload = {},
) {
  return (
    normalizeProductDetailsPresentation(presentation)
      === PRODUCT_DETAILS_PRESENTATIONS.AUTO_IMMERSIVE
    && payload?.status === 'ready'
    && payload?.presentation === 'rack-immersive'
  );
}

export function normalizeProductDetailsSvgUrl(value = '') {
  return String(value || '').trim();
}

export function normalizeProductDetailsSvgLabel(value = '') {
  return String(value || '').trim() || PRODUCT_DETAILS_DEFAULT_SVG_LABEL;
}

export function normalizeProductDetailsBooleanFlag(value = '') {
  return String(value || '').trim().toLowerCase() === 'true';
}

export function normalizeProductDetailsConfigTableFamily(value = '') {
  return String(value || '').trim().toLowerCase() || PRODUCT_DETAILS_DEFAULT_CONFIG_TABLE_FAMILY;
}

export function normalizeProductDetailsConfig(config = {}) {
  return {
    presentation: normalizeProductDetailsPresentation(config.presentation),
    svgUrl: normalizeProductDetailsSvgUrl(config['svg-url']),
    svgLabel: normalizeProductDetailsSvgLabel(config['svg-label']),
    configTableEnabled: normalizeProductDetailsBooleanFlag(config['config-table-enabled']),
    configTableFamily: normalizeProductDetailsConfigTableFamily(config['config-table-family']),
  };
}
