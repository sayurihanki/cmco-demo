import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeCompanyMenuData } from '../../blocks/header/companyToggleUtils.js';

test('normalizeCompanyMenuData maps switcher options into company choices', () => {
  assert.deepEqual(
    normalizeCompanyMenuData({
      currentCompany: { id: '6', name: 'Hanks Industrial Supply' },
      customerCompanies: [
        { value: '5', text: 'Cross' },
        { value: '8', text: 'Hanks Industrial East Region' },
        { value: '7', text: 'Hanks Industrial West Region' },
        { value: '6', text: 'Hanks Industrial Supply' },
      ],
    }),
    {
      currentCompany: { id: '6', name: 'Hanks Industrial Supply' },
      companies: [
        { id: '5', name: 'Cross' },
        { id: '8', name: 'Hanks Industrial East Region' },
        { id: '7', name: 'Hanks Industrial West Region' },
        { id: '6', name: 'Hanks Industrial Supply' },
      ],
    },
  );
});

test('normalizeCompanyMenuData keeps the current company visible when it is missing from options', () => {
  assert.deepEqual(
    normalizeCompanyMenuData({
      currentCompany: { id: '6', name: 'Hanks Industrial Supply' },
      customerCompanies: [],
    }),
    {
      currentCompany: { id: '6', name: 'Hanks Industrial Supply' },
      companies: [{ id: '6', name: 'Hanks Industrial Supply' }],
    },
  );
});
