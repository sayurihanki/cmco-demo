/* eslint-disable object-curly-newline */

export const PRODUCT_DETAILS_CONFIG_TABLE_FAMILIES = Object.freeze({
  CM_ANCHOR_SHACKLES: 'cm-anchor-shackles',
});

export const PRODUCT_DETAILS_CONFIG_TABLE_DATA = Object.freeze({
  [PRODUCT_DETAILS_CONFIG_TABLE_FAMILIES.CM_ANCHOR_SHACKLES]: {
    title: 'CM Anchor Shackles',
    eyebrow: 'Config table',
    description: 'Select shackle variants by working load limit, size, pin type, finish, stock, and lead time.',
    rows: Object.freeze([
      { id: 'M345G', desc: 'Super Strong Anchor Shackle', wll: 1000, size: '3/16', pin: 'Round Pin', finish: 'Galvanized', qty: null, lt: 11, price: 14.34 },
      { id: 'M346', desc: 'Super Strong Anchor Shackle', wll: 1500, size: '1/4', pin: 'Round Pin', finish: 'Self Colored', qty: null, lt: 11, price: 14.02 },
      { id: 'M346G', desc: 'Super Strong Anchor Shackle', wll: 1500, size: '1/4', pin: 'Round Pin', finish: 'Galvanized', qty: 14, lt: 3, price: 13.54 },
      { id: 'M346P', desc: 'Super Strong Anchor Shackle', wll: 1500, size: '1/4', pin: 'Round Pin', finish: 'Orange Powder Coated', qty: null, lt: 11, price: 13.21 },
      { id: 'M347', desc: 'Super Strong Anchor Shackle', wll: 2000, size: '5/16', pin: 'Round Pin', finish: 'Self Colored', qty: null, lt: 41, price: 21.55 },
      { id: 'M347G', desc: 'Super Strong Anchor Shackle', wll: 2000, size: '5/16', pin: 'Round Pin', finish: 'Galvanized', qty: null, lt: 11, price: 19.38 },
      { id: 'M347P', desc: 'Super Strong Anchor Shackle', wll: 2000, size: '5/16', pin: 'Round Pin', finish: 'Orange Powder Coated', qty: 142, lt: 3, price: 18.87 },
      { id: 'M348G', desc: 'Super Strong Anchor Shackle', wll: 3000, size: '3/8', pin: 'Round Pin', finish: 'Galvanized', qty: 7, lt: 3, price: 17.22 },
      { id: 'M348P', desc: 'Super Strong Anchor Shackle', wll: 3000, size: '3/8', pin: 'Round Pin', finish: 'Orange Powder Coated', qty: 193, lt: 3, price: 19.94 },
      { id: 'M349', desc: 'Super Strong Anchor Shackle', wll: 4000, size: '7/16', pin: 'Round Pin', finish: 'Self Colored', qty: null, lt: 56, price: 17.39 },
      { id: 'M349G', desc: 'Super Strong Anchor Shackle', wll: 4000, size: '7/16', pin: 'Round Pin', finish: 'Galvanized', qty: 19, lt: 3, price: 19.03 },
      { id: 'M349P', desc: 'Super Strong Anchor Shackle', wll: 4000, size: '7/16', pin: 'Round Pin', finish: 'Orange Powder Coated', qty: 92, lt: 3, price: 19.31 },
      { id: 'M350', desc: 'Super Strong Anchor Shackle', wll: 6000, size: '1/2', pin: 'Round Pin', finish: 'Self Colored', qty: null, lt: 11, price: 20.93 },
      { id: 'M350G', desc: 'Super Strong Anchor Shackle', wll: 6000, size: '1/2', pin: 'Round Pin', finish: 'Galvanized', qty: 44, lt: 3, price: 22.41 },
      { id: 'M350P', desc: 'Super Strong Anchor Shackle', wll: 6000, size: '1/2', pin: 'Round Pin', finish: 'Orange Powder Coated', qty: null, lt: 11, price: 21.88 },
      { id: 'M322', desc: 'Super Strong Anchor Shackle', wll: 8500, size: '5/8', pin: 'Round Pin', finish: 'Self Colored', qty: 8, lt: 3, price: 28.14 },
      { id: 'M322G', desc: 'Super Strong Anchor Shackle', wll: 8500, size: '5/8', pin: 'Round Pin', finish: 'Galvanized', qty: null, lt: 11, price: 30.62 },
      { id: 'M322P', desc: 'Super Strong Anchor Shackle', wll: 8500, size: '5/8', pin: 'Round Pin', finish: 'Orange Powder Coated', qty: 67, lt: 3, price: 31.14 },
      { id: 'M323', desc: 'Super Strong Anchor Shackle', wll: 9500, size: '3/4', pin: 'Round Pin', finish: 'Self Colored', qty: null, lt: 11, price: 38.21 },
      { id: 'M323G', desc: 'Super Strong Anchor Shackle', wll: 9500, size: '3/4', pin: 'Round Pin', finish: 'Galvanized', qty: 22, lt: 3, price: 41.58 },
      { id: 'M323P', desc: 'Super Strong Anchor Shackle', wll: 9500, size: '3/4', pin: 'Round Pin', finish: 'Orange Powder Coated', qty: null, lt: 11, price: 42.14 },
      { id: 'M324', desc: 'Super Strong Anchor Shackle', wll: 13500, size: '7/8', pin: 'Round Pin', finish: 'Self Colored', qty: null, lt: 11, price: 52.87 },
      { id: 'M324G', desc: 'Super Strong Anchor Shackle', wll: 13500, size: '7/8', pin: 'Round Pin', finish: 'Galvanized', qty: 5, lt: 3, price: 57.44 },
      { id: 'M324P', desc: 'Super Strong Anchor Shackle', wll: 13500, size: '7/8', pin: 'Round Pin', finish: 'Orange Powder Coated', qty: 31, lt: 3, price: 59.12 },
    ]),
  },
});

export function getProductDetailsConfigTableFamily(family = '') {
  const normalized = String(family || '').trim().toLowerCase();

  return PRODUCT_DETAILS_CONFIG_TABLE_DATA[normalized]
    ? normalized
    : PRODUCT_DETAILS_CONFIG_TABLE_FAMILIES.CM_ANCHOR_SHACKLES;
}

export function getProductDetailsConfigTableData(family = '') {
  return PRODUCT_DETAILS_CONFIG_TABLE_DATA[getProductDetailsConfigTableFamily(family)];
}
