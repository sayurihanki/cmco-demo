import test from 'node:test';
import assert from 'node:assert/strict';

/* eslint-disable import/extensions */
import {
  PRODUCT_DETAILS_DEFAULT_SVG_LABEL,
  PRODUCT_DETAILS_PRESENTATIONS,
  normalizeProductDetailsConfig,
  normalizeProductDetailsPresentation,
  normalizeProductDetailsSvgLabel,
  normalizeProductDetailsSvgUrl,
  shouldActivateConfigurator,
  shouldActivateImmersivePresentation,
} from '../../blocks/product-details/product-details.utils.mjs';
/* eslint-enable import/extensions */

test('normalizeProductDetailsPresentation falls back to default', () => {
  assert.equal(
    normalizeProductDetailsPresentation('AUTO-IMMERSIVE'),
    PRODUCT_DETAILS_PRESENTATIONS.AUTO_IMMERSIVE,
  );
  assert.equal(
    normalizeProductDetailsPresentation('something-else'),
    PRODUCT_DETAILS_PRESENTATIONS.DEFAULT,
  );
});

test('shouldActivateConfigurator only responds to ready payloads', () => {
  assert.equal(shouldActivateConfigurator({ status: 'ready' }), true);
  assert.equal(shouldActivateConfigurator({ status: 'loading' }), false);
  assert.equal(shouldActivateConfigurator(null), false);
});

test('shouldActivateImmersivePresentation requires auto-immersive and rack payload', () => {
  assert.equal(
    shouldActivateImmersivePresentation('auto-immersive', {
      status: 'ready',
      presentation: 'rack-immersive',
    }),
    true,
  );

  assert.equal(
    shouldActivateImmersivePresentation('default', {
      status: 'ready',
      presentation: 'rack-immersive',
    }),
    false,
  );

  assert.equal(
    shouldActivateImmersivePresentation('auto-immersive', {
      status: 'ready',
      presentation: 'default',
    }),
    false,
  );
});

test('normalizeProductDetailsSvgUrl trims empty values to a blank string', () => {
  assert.equal(normalizeProductDetailsSvgUrl(' /media/rack.svg '), '/media/rack.svg');
  assert.equal(normalizeProductDetailsSvgUrl(null), '');
});

test('normalizeProductDetailsSvgLabel falls back to the default label', () => {
  assert.equal(normalizeProductDetailsSvgLabel(' Engineering view '), 'Engineering view');
  assert.equal(normalizeProductDetailsSvgLabel('  '), PRODUCT_DETAILS_DEFAULT_SVG_LABEL);
});

test('normalizeProductDetailsConfig returns normalized presentation and SVG metadata', () => {
  assert.deepEqual(
    normalizeProductDetailsConfig({
      presentation: 'AUTO-IMMERSIVE',
      'svg-url': ' /media/rack.svg ',
      'svg-label': ' Rack section ',
    }),
    {
      presentation: PRODUCT_DETAILS_PRESENTATIONS.AUTO_IMMERSIVE,
      svgUrl: '/media/rack.svg',
      svgLabel: 'Rack section',
    },
  );
});
