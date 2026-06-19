/**
 * Normalize company switcher API data for the header menu.
 * @param {object} data
 * @returns {{currentCompany: object, companies: object[]}}
 */
export function normalizeCompanyMenuData(data = {}) {
  const currentCompany = data.currentCompany || {};
  const currentId = currentCompany.id || '';
  const companiesById = new Map();
  const seenCompanyNames = new Map();

  const normalizeName = (name = '') => name.trim().replace(/\s+/g, ' ').toLowerCase();
  const addCompany = (company) => {
    if (!company?.id) return;

    const normalizedName = normalizeName(company.name || company.id);
    const existingId = seenCompanyNames.get(normalizedName);

    if (existingId && company.id !== currentId) return;
    if (existingId) {
      companiesById.delete(existingId);
    }

    seenCompanyNames.set(normalizedName, company.id);
    companiesById.set(company.id, company);
  };

  (data.customerCompanies || []).forEach((company) => {
    if (!company?.value) return;
    addCompany({
      id: company.value,
      name: company.text || company.value,
    });
  });

  if (currentId && !companiesById.has(currentId)) {
    addCompany({
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
