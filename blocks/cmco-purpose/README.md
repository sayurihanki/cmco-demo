# CMCO Purpose Block

## Overview

The `cmco-purpose` block presents the company purpose narrative with copy, CTA buttons, and an animated globe visual with floating stat cards. It uses a dark branded background with decorative gear artwork.

## DA.live Integration and Content Structure

Author using a **1-column**, **6-row** `cmco-purpose` table.

| Row | Field | Type | Effect |
|---|---|---|---|
| 1 | Eyebrow | Text | Section label |
| 2 | Heading | Rich text | Section `h2` |
| 3 | Body | Rich text | Supporting paragraph |
| 4 | Actions | Rich text | Up to two CTA links |
| 5 | Stat 1 | Text | Globe stat in `value \| label` format (default: `50+ \| Countries`) |
| 6 | Stat 2 | Text | Globe stat in `value \| label` format (default: `150+ \| Years Operating`) |

### Action Buttons

- First link = orange primary button with arrow.
- Second link = ghost button.

## Configuration Options

| Option | Effect |
|---|---|
| Globe animation | SVG rings, pulses, and motion paths animate when reduced motion is off |
| Stat defaults | Empty stat rows fall back to `50+ \| Countries` and `150+ \| Years Operating` |
| `createGlobeMarkup` | Exported helper for tests or reuse; accepts instance ID and reduced-motion flag |

## Behavior Patterns

### Globe Visual

- Stats render as positioned cards around the animated globe SVG.
- Unique gradient and filter IDs are generated per block instance to avoid SVG collisions.
- When `prefers-reduced-motion: reduce` is set, SMIL animations are stripped from the globe markup.

### Scroll Reveal

Copy and globe visual reveal independently on scroll into view.

## Integration Details

- **URL parameters:** None.
- **localStorage:** None.
- **Custom events:** None.

## Error Handling

- Missing eyebrow, heading, or body render empty elements.
- Invalid CTA links are filtered out.
- Stat parsing tolerates partial or empty values via shared `parseStat` defaults.
