# CMCO CTA Block

## Overview

The `cmco-cta` block renders a compact call-to-action band with eyebrow text, heading, and up to two action buttons. It is used mid-page to drive conversions after content sections.

## DA.live Integration and Content Structure

Author using a **1-column**, **3-row** `cmco-cta` table.

| Row | Field | Type | Effect |
|---|---|---|---|
| 1 | Eyebrow | Text | Small label above the heading |
| 2 | Heading | Rich text | Section `h2` |
| 3 | Actions | Rich text | Up to two links |

### Action Buttons

- First link renders as the orange primary button with arrow icon.
- Second link renders as the ghost secondary button.

## Configuration Options

No section metadata is required. Button styling is fixed in `cmco-cta.css`.

## Behavior Patterns

- The CTA box uses the shared `reveal` animation on scroll into view.
- Staggered reveal delay is applied through `cmco-shared`.

## Integration Details

- **URL parameters:** None.
- **localStorage:** None.
- **Custom events:** None.

## Error Handling

- Missing eyebrow or heading cells render empty elements; layout remains stable.
- Links without valid `href` values are filtered out.
- Only the first two authored links are rendered.
