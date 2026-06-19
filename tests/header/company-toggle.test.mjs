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

test('normalizeCompanyMenuData removes duplicated company names from Commerce options', () => {
  assert.deepEqual(
    normalizeCompanyMenuData({
      currentCompany: { id: 'west-active', name: 'Hanks Industrial West Region' },
      customerCompanies: [
        { value: 'supply-a', text: 'Hanks Industrial Supply' },
        { value: 'west-a', text: 'Hanks Industrial West Region' },
        { value: 'east-a', text: 'Hanks Industrial East Region' },
        { value: 'supply-b', text: 'Hanks Industrial Supply' },
        { value: 'west-active', text: 'Hanks Industrial West Region' },
        { value: 'east-b', text: 'Hanks Industrial East Region' },
      ],
    }),
    {
      currentCompany: { id: 'west-active', name: 'Hanks Industrial West Region' },
      companies: [
        { id: 'supply-a', name: 'Hanks Industrial Supply' },
        { id: 'east-a', name: 'Hanks Industrial East Region' },
        { id: 'west-active', name: 'Hanks Industrial West Region' },
      ],
    },
  );
});
