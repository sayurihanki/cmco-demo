import { render as purchaseOrderRenderer } from '@dropins/storefront-purchase-order/render.js';
import { ApprovalRulesList } from '@dropins/storefront-purchase-order/containers/ApprovalRulesList.js';
import { PO_PERMISSIONS } from '@dropins/storefront-purchase-order/api.js';
import { events } from '@dropins/tools/event-bus.js';
import { getConfigValue } from '@dropins/tools/lib/aem/configs.js';
import {
  checkIsAuthenticated,
  CUSTOMER_LOGIN_PATH,
  CUSTOMER_ACCOUNT_PATH,
  CUSTOMER_PO_RULE_FORM_PATH,
  CUSTOMER_PO_RULE_DETAILS_PATH,
  rootLink,
  rootLinkWithParams,
  hasAuthPermissionsPayload,
} from '../../scripts/commerce.js';

// Initialize
import '../../scripts/initializers/purchase-order.js';

const redirectToLogin = () => {
  window.location.href = rootLink(CUSTOMER_LOGIN_PATH);
};

const redirectToAccountDashboard = () => {
  window.location.href = rootLink(CUSTOMER_ACCOUNT_PATH);
};

/**
 * Initializes and decorates the Purchase Order Approval Rules List block
 * Redirects unauthenticated users and handles permission updates
 */
const renderPurchaseOrderApprovalRulesList = async (
  blockElement,
  permissions = null,
) => {
  const isB2BEnabled = getConfigValue('commerce-b2b-enabled');

  if (!isB2BEnabled) {
    redirectToAccountDashboard();
    return;
  }

  if (!hasAuthPermissionsPayload(permissions)) {
    return;
  }

  const hasAccess = permissions.admin || permissions[PO_PERMISSIONS.VIEW_RULES];

  if (!hasAccess) {
    redirectToAccountDashboard();
    return;
  }

  await purchaseOrderRenderer.render(ApprovalRulesList, {
    skeletonRowCount: 5,
    withWrapper: false,
    routeCreateApprovalRule: () => rootLink(CUSTOMER_PO_RULE_FORM_PATH),
    routeEditApprovalRule: (ruleRef) => rootLinkWithParams(
      CUSTOMER_PO_RULE_FORM_PATH,
      { ruleRef },
    ),
    routeApprovalRuleDetails: (ruleRef) => rootLinkWithParams(
      CUSTOMER_PO_RULE_DETAILS_PATH,
      { ruleRef },
    ),
  })(blockElement);
};

export default async function decorate(block) {
  // Redirect guest users
  if (!checkIsAuthenticated()) {
    redirectToLogin();
    return;
  }

  // Initial permissions check
  const initialPermissions = events.lastPayload('auth/permissions');
  await renderPurchaseOrderApprovalRulesList(block, initialPermissions);

  // React to permission updates
  events.on('auth/permissions', async (updatedPermissions) => {
    await renderPurchaseOrderApprovalRulesList(block, updatedPermissions);
  });

  // Handle logout during interaction
  events.on('authenticated', (isAuthenticated) => {
    if (!isAuthenticated) redirectToLogin();
  });
}
