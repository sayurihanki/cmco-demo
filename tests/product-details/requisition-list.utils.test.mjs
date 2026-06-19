import test from 'node:test';
import assert from 'node:assert/strict';

/* eslint-disable import/extensions */
import {
  buildRequisitionListSelectorProps,
  validateRequiredRequisitionListOptions,
} from '../../blocks/product-details/requisition-list.utils.mjs';
/* eslint-enable import/extensions */

test('validateRequiredRequisitionListOptions requires selectable and entered options', () => {
  const product = {
    options: [{ id: 'size' }],
    inputOptions: [
      { id: 'engraving', required: true },
      { id: 'note', required: false },
    ],
  };

  assert.equal(validateRequiredRequisitionListOptions(product, {
    optionsUIDs: ['size-medium'],
    enteredOptions: [{ uid: 'engraving', value: 'Rack A' }],
  }), true);

  assert.equal(validateRequiredRequisitionListOptions(product, {
    optionsUIDs: ['size-medium'],
    enteredOptions: [{ uid: 'engraving', value: '   ' }],
  }), false);

  assert.equal(validateRequiredRequisitionListOptions(product, {
    optionsUIDs: [],
    enteredOptions: [{ uid: 'engraving', value: 'Rack A' }],
  }), false);
});

test('validateRequiredRequisitionListOptions only requires required bundle selections', () => {
  const product = {
    isBundle: true,
    options: [
      { id: 'required-option', required: true },
      { id: 'optional-option', required: false },
    ],
  };

  assert.equal(validateRequiredRequisitionListOptions(product, {
    optionsUIDs: ['required-option-value'],
  }), true);
});

test('buildRequisitionListSelectorProps normalizes selected and entered options', () => {
  assert.deepEqual(buildRequisitionListSelectorProps(
    { quantity: 3 },
    {
      quantity: 5,
      optionsUIDs: ['option-a'],
      enteredOptions: [
        { uid: 'text-option', value: '  Cut to length  ' },
        { uid: 'blank-option', value: '   ' },
        { id: 'legacy-option', value: 42 },
      ],
    },
  ), {
    quantity: 3,
    selectedOptions: ['option-a'],
    enteredOptions: [
      { uid: 'text-option', value: 'Cut to length' },
      { uid: 'legacy-option', value: '42' },
    ],
  });
});

test('buildRequisitionListSelectorProps omits empty option arrays', () => {
  assert.deepEqual(buildRequisitionListSelectorProps({}, {
    quantity: 2,
    optionsUIDs: [],
    enteredOptions: [],
  }), {
    quantity: 2,
    selectedOptions: null,
    enteredOptions: undefined,
  });
});
