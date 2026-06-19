/**
 * Normalize company switcher API data for the header menu.
 * @param {object} data
 * @returns {{currentCompany: object, companies: object[]}}
 */
export function normalizeCompanyMenuData(data = {}) {
  const currentCompany = data.currentCompany || {};
  const currentId = currentCompany.id || '';
  const companiesById = new Map();

  (data.customerCompanies || []).forEach((company) => {
    if (!company?.value) return;
    companiesById.set(company.value, {
      id: company.value,
      name: company.text || company.value,
    });
  });

  if (currentId && !companiesById.has(currentId)) {
    companiesById.set(currentId, {
      id: currentId,
      name: currentCompany.name || currentId,
    });
  }

  return {
    currentCompany: {
      id: currentId,
      name: currentCompany.name || companiesById.get(currentId)?.name || '',
    },
    companies: [...companiesById.values()],
  };
}
