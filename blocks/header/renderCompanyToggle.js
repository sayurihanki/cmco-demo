import { events } from '@dropins/tools/event-bus.js';
import {
  config as companySwitcherConfig,
  getCompanyHeaderManager,
  getCustomerCompanyInfo,
  getGroupHeaderManager,
  updateCustomerGroup,
} from '@dropins/storefront-company-switcher/api.js';
import '../../scripts/initializers/company-switcher.js';
import {
  CUSTOMER_NEGOTIABLE_QUOTE_PATH,
  CUSTOMER_NEGOTIABLE_QUOTE_TEMPLATE_PATH,
  CUSTOMER_ORDERS_PATH,
  CUSTOMER_PO_LIST_PATH,
  rootLink,
} from '../../scripts/commerce.js';
import { normalizeCompanyMenuData } from './companyToggleUtils.js';

const redirections = {
  '/customer/order-details?orderRef=': rootLink(CUSTOMER_ORDERS_PATH),
  '/customer/purchase-order-details?poRef=': rootLink(CUSTOMER_PO_LIST_PATH),
  '/customer/negotiable-quote?quoteid=': rootLink(CUSTOMER_NEGOTIABLE_QUOTE_PATH),
  '/customer/negotiable-quote-template?quoteTemplateId=': rootLink(CUSTOMER_NEGOTIABLE_QUOTE_TEMPLATE_PATH),
};

function redirectAfterCompanyChange() {
  const redirect = Object.entries(redirections).find(([pattern]) => {
    const [pathname, search] = pattern.split('?');
    return window.location.pathname.includes(pathname)
      && (!search || window.location.search.includes(search));
  });

  if (redirect) {
    const [, redirectUrl] = redirect;
    window.location.href = redirectUrl;
  } else {
    window.location.reload();
  }
}

async function switchCompany(company) {
  const switcherConfig = companySwitcherConfig.getConfig();

  getCompanyHeaderManager().setCompanyHeaders(company.id);
  sessionStorage.setItem(switcherConfig.companySessionStorageKey, company.id);

  const groupId = await updateCustomerGroup();
  getGroupHeaderManager().setGroupHeaders(groupId);
  if (groupId) {
    sessionStorage.setItem(switcherConfig.groupSessionStorageKey, groupId);
  } else {
    sessionStorage.removeItem(switcherConfig.groupSessionStorageKey);
  }

  events.emit('companyContext/changed', company.id);
  redirectAfterCompanyChange();
}

function setExpanded(button, list, expanded) {
  button.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  list.hidden = !expanded;
}

/**
 * Adds a visible company toggle to the signed-in account dropdown.
 * @param {HTMLUListElement} menuList
 * @returns {Promise<void>}
 */
export default async function renderCompanyToggle(menuList) {
  if (!menuList) return;

  let item = menuList.querySelector('.company-toggle-menu-item');

  if (!item) {
    item = document.createElement('li');
    item.className = 'company-toggle-menu-item';
    item.innerHTML = `
      <button
        type="button"
        class="company-toggle-button"
        aria-expanded="false"
        aria-controls="company-toggle-list"
      >
        <span class="company-toggle-label">Company</span>
        <span class="company-toggle-current">Loading...</span>
        <span class="company-toggle-caret" aria-hidden="true"></span>
      </button>
      <ul id="company-toggle-list" class="company-toggle-list" hidden></ul>
    `;

    menuList.insertBefore(item, menuList.firstElementChild?.nextElementSibling || null);
  }

  const button = item.querySelector('.company-toggle-button');
  const currentLabel = item.querySelector('.company-toggle-current');
  const list = item.querySelector('.company-toggle-list');

  if (!button.dataset.companyToggleBound) {
    button.dataset.companyToggleBound = 'true';
    button.addEventListener('click', () => {
      setExpanded(button, list, button.getAttribute('aria-expanded') !== 'true');
    });
  }

  currentLabel.textContent = 'Loading...';
  list.innerHTML = '';

  const data = normalizeCompanyMenuData(await getCustomerCompanyInfo());

  if (data.companies.length === 0) {
    currentLabel.textContent = 'No company choices found';
    const option = document.createElement('li');
    option.className = 'company-toggle-empty';
    option.textContent = 'No assigned companies are available for this session.';
    list.append(option);
    return;
  }

  currentLabel.textContent = data.currentCompany.name || 'Select company';

  data.companies.forEach((company) => {
    const option = document.createElement('li');
    const optionButton = document.createElement('button');
    const isCurrent = company.id === data.currentCompany.id;

    optionButton.type = 'button';
    optionButton.className = 'company-toggle-option';
    optionButton.textContent = company.name;
    if (isCurrent) {
      optionButton.classList.add('company-toggle-option--current');
      optionButton.setAttribute('aria-current', 'true');
    }

    optionButton.addEventListener('click', async () => {
      if (isCurrent) {
        setExpanded(button, list, false);
        return;
      }

      optionButton.disabled = true;
      await switchCompany(company);
    });

    option.append(optionButton);
    list.append(option);
  });
}
