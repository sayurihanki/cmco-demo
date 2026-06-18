export const COMPASS_CONFIG_TABLE_BINDINGS = Object.freeze({
  'cm-anchor-shackles': {
    commerceSku: 'CM Anchor Shackles',
    configTableFamily: 'cm-anchor-shackles',
    productUrl: '/products/cmlodestar-1/sku-434d20416e63686f7220536861636b6c6573#pdp-config-table',
  },
});

export function getCompassConfigTableBinding(key = '') {
  const normalized = String(key || '').trim().toLowerCase();
  return COMPASS_CONFIG_TABLE_BINDINGS[normalized] || null;
}
