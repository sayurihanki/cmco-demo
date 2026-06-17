# Customer Account Dashboard Authoring Runbook

## Scope

This runbook defines the required DA composition for `/customer/account` and the canonical left navigation rows for B2B account pages.

## `/customer/account` Composition

Use page metadata:

| key | value |
| --- | --- |
| `Title` | `My Account` |
| `Template` | `My Account, Columns` |
| `Robots` | `noindex, nofollow` |

`Template=My Account, Columns` is required because it adds `body.my-account.columns`. The `columns` class activates the two-column layout, and `my-account` scopes the CMCO account-dashboard card styling.

Use a two-column layout:

Left column:

| key | value |
| --- | --- |
| `Column Width` | `30%` |
| `Gap` | `Small` |

Left-column block:

1. `/customer/nav` fragment

Right column:

| key | value |
| --- | --- |
| `Column Width` | `70%` |
| `Gap` | `Big` |

Right-column block order:

1. `commerce-account-header`
   - `Title` = `My account`
2. `commerce-orders-list`
   - `Minified view` = `true`
3. `commerce-addresses`
   - `Minified view` = `true`
4. `commerce-customer-information`
5. `commerce-customer-company`
6. Optional purchase-order approval summary block if available in the content environment
7. `commerce-returns-list`
   - `Minified view` = `true`

Do not add the legacy visible `commerce-account-hub` card or the literal `Hub config` / `Orders config` headings when matching the CMCO B2B account-page screenshots.

## Canonical `commerce-account-nav` Rows

Author nav as table rows using columns: `label`, `icon`, `permission`.

| Label (title + subtitle) | Icon | Permission |
| --- | --- | --- |
| `My account` / `Account details` | `user` | `all` |
| `Orders` / `Track, manage, and return` | `cube` | `all` |
| `Addresses` / `Manage your locations` | `address-book` | `all` |
| `Returns` / `Manage your returns` | `box` | `all` |
| `Requisition Lists` / `Manage your requisition lists` | `list` | `Magento_RequisitionList::requisition_list,Magento_RequisitionList::view` |
| `Company Profile` / `Manage company` | `briefcase` | `Magento_Company::view` |
| `Company Structure` / `Manage company structure` | `align-left` | `Magento_Company::view` |
| `Company Users` / `Manage company users` | `users` | `Magento_Company::users_view` |
| `Roles and Permissions` / `Manage roles and permissions` | `lock` | `Magento_Company::roles_view` |
| `Company Credit` / `View company credit history` | `credit-card` | `Magento_CompanyCredit::view` |
| `Quotes` / `Manage negotiable quotes` | `quote` | `Magento_NegotiableQuote::all,Magento_NegotiableQuote::view_quotes` |
| `Quote Templates` / `Manage negotiable quote templates` | `copy` | `Magento_NegotiableQuoteTemplate::all,Magento_NegotiableQuoteTemplate::view_template` |
| `Purchase Orders` / `Manage purchase orders` | `purchase` | `Magento_PurchaseOrder::view_purchase_orders` |
| `Approval Rules` / `Manage approval rules` | `check-with-circle` | `Magento_PurchaseOrderRule::view_approval_rules` |

## Permission Parsing Contract

`commerce-account-nav` supports:

- Single permission key
- Comma-separated permission keys
- Newline-separated permission keys

Grant semantics are OR across keys. Explicit disable semantics always win:

- `isExplicitlyDisabled = any key with value === false`
- Item renders only when `!isExplicitlyDisabled && isGranted`

## Route Safety

Do not change these route contracts:

- `/customer/account`
- `/customer/orders`
- `/customer/address`
- `/customer/company`
- `/customer/company/structure`
- `/customer/company/users`
- `/customer/company/roles`
- `/customer/company/credit`
- `/customer/negotiable-quote`
- `/customer/negotiable-quote-template`
- `/customer/requisition-lists`
- `/customer/purchase-orders`
- `/customer/approval-rules`

Each module route should keep the page composition pattern:

1. `commerce-account-header`
2. `commerce-account-nav`
3. Route module block (single module)

## DA Execution Notes

The local repository does not currently include a tracked `/customer/account` source document. Apply the composition and metadata above in DA/AEM content before publishing.

If the DA environment does not provide a `commerce-approval-rules` dashboard block, omit that optional empty dashboard block from `/customer/account`; the dedicated approval-rules page should use the existing `commerce-b2b-po-approval-rules-list` implementation.
