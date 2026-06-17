import { provider as UI, Icon } from '@dropins/tools/components.js';
import { events } from '@dropins/tools/event-bus.js';

import '../../scripts/initializers/auth.js';

/**
 * Parse a permission string into normalized keys.
 * Supports comma- and newline-delimited ACL IDs.
 * @param {string | undefined} raw
 * @returns {string[]}
 */
function parsePermissionKeys(raw) {
  if (!raw) return [];

  return raw
    .split(/[\n,]+/)
    .map((value) => value.trim())
    .filter(Boolean);
}

/**
 * Build permission decision for one nav item.
 * @param {object} permissions
 * @param {string[]} keys
 * @returns {{ isGranted: boolean, isExplicitlyDisabled: boolean }}
 */
function evaluatePermissions(permissions, keys) {
  const safePermissions = permissions && typeof permissions === 'object' ? permissions : {};
  const normalizedKeys = keys.length > 0 ? keys : ['all'];
  const hasPermissionPayload = Object.keys(safePermissions).length > 0;
  const isAllItem = normalizedKeys.includes('all');
  const hasGrantedPermission = normalizedKeys.some((key) => safePermissions[key] === true);
  const disabledPermissionCount = normalizedKeys
    .filter((key) => safePermissions[key] === false)
    .length;

  const isExplicitlyDisabled = isAllItem
    ? safePermissions.all === false
    : !hasGrantedPermission && disabledPermissionCount === normalizedKeys.length;

  const isGranted = !hasPermissionPayload
    || isAllItem
    || safePermissions.admin
    || safePermissions.all
    || hasGrantedPermission
    || disabledPermissionCount < normalizedKeys.length;

  return { isGranted: Boolean(isGranted), isExplicitlyDisabled };
}

/**
 * Resolve a URL path without throwing on empty or malformed authoring.
 * @param {string | undefined} href
 * @returns {string}
 */
function getPathname(href) {
  if (!href) return '';

  try {
    return new URL(href, window.location.href).pathname;
  } catch {
    return '';
  }
}

export default async function decorate(block) {
  /** Get rows data */
  const [keys, ...$items] = [...block.children].map((child, index) => {
    if (index === 0) return [...child.children].map((c) => c.textContent.trim());
    return child;
  });

  /** Create nav */
  const $nav = document.createElement('div');
  $nav.classList.add('commerce-account-nav');

  /** Get rows indexes */
  const rows = {
    label: Math.max(0, keys.indexOf('label') + 1),
    icon: Math.max(0, keys.indexOf('icon') + 1),
    permission: Math.max(0, keys.indexOf('permission') + 1),
  };

  /**
   * Render nav links from the authored rows.
   * Permission data is used as a refinement: missing/incomplete payloads should
   * not make the entire B2B rail disappear.
   * @param {object} permissions
   */
  function renderNav(permissions) {
    /** Clear nav */
    $nav.innerHTML = '';

    /** Create items */
    $items.forEach(($item) => {
      /**
       * Permissions
       * Skip rendering if the user lacks permission for this item.
       * Default permission is 'all'.
       * Note: permissions can be explicitly set to false (disabled feature),
       * which should hide the item even for admins.
       */
      const permissionRaw = $item.querySelector(`:scope > div:nth-child(${rows.permission})`)?.textContent?.trim() || 'all';
      const permissionKeys = parsePermissionKeys(permissionRaw);
      const { isGranted, isExplicitlyDisabled } = evaluatePermissions(permissions, permissionKeys);

      // Skip if permission is explicitly disabled (false)
      if (isExplicitlyDisabled) {
        return;
      }

      // Skip if permission is not granted
      if (!isGranted) {
        return;
      }

      /** Template */
      const template = document.createRange().createContextualFragment(`
        <a class="commerce-account-nav__item">
          <span class="commerce-account-nav__item__icon"></span>
          <span class="commerce-account-nav__item__title"></span>
          <span class="commerce-account-nav__item__description"></span>
          <span class="commerce-account-nav__item__chevron" aria-hidden="true"></span>
        </a>
      `);

      const $link = template.querySelector('.commerce-account-nav__item');
      const $icon = template.querySelector('.commerce-account-nav__item__icon');
      const $title = template.querySelector('.commerce-account-nav__item__title');
      const $description = template.querySelector('.commerce-account-nav__item__description');
      $icon.hidden = true;

      /** Content */
      const $content = $item.querySelector(`:scope > div:nth-child(${rows.label})`)?.children;
      const $titleContent = $content?.[0];
      const $descriptionContent = $content?.[1];

      /** Link */
      const authoredLink = $titleContent?.querySelector('a')?.href;
      const link = authoredLink || '#';
      const isActive = Boolean(authoredLink) && getPathname(link) === window.location.pathname;
      $link.classList.toggle('commerce-account-nav__item--active', isActive);
      $link.href = link;

      /** Icon */
      const icon = $item.querySelector(`:scope > div:nth-child(${rows.icon})`)?.textContent?.trim();

      if (icon) {
        $link.classList.add('commerce-account-nav__item--has-icon');
        try {
          UI.render(Icon, { source: icon, size: 24 })($icon);
          $icon.hidden = false;
        } catch {
          $link.classList.remove('commerce-account-nav__item--has-icon');
        }
      }

      /** Title */
      $title.textContent = $titleContent?.textContent || '';

      /** Description */
      $description.textContent = $descriptionContent?.textContent || '';

      /** Add link to nav */
      $nav.appendChild($link);
    });

    if (!$nav.children.length && permissions !== null) {
      renderNav(null);
    }
  }

  renderNav(events.lastPayload('auth/permissions') || null);

  /** Get permissions */
  events.on('auth/permissions', (permissions) => {
    renderNav(permissions || null);
  }, { eager: true });

  block.replaceWith($nav);
}
