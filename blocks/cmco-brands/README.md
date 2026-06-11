# CMCO Brands Block

## Overview

The `cmco-brands` block displays a horizontally scrolling marquee of brand names. It reinforces the CMCO family of brands on the homepage.

## DA.live Integration and Content Structure

Author using a **1-column**, **1-row** `cmco-brands` table.

| Row | Field | Type | Effect |
|---|---|---|---|
| 1 | Brands | Rich text | Comma- or line-separated brand names |

### Default Brands

The model ships with: CM, Yale, Magnetek, Dorner, Duff-Norton, Stahl, Garvey, Pfaff-Silberblau, Camlok, Coffing, Shaw-Box, Montratec.

## Configuration Options

No section metadata is required. Scroll speed and styling are defined in `cmco-brands.css`.

## Behavior Patterns

### Marquee Animation

- Brand names render in a horizontal track.
- When reduced motion is **not** preferred, a duplicate group is appended for seamless infinite scroll.
- When `prefers-reduced-motion: reduce` is set, only one group renders (no duplicate, static display).

## Integration Details

- **URL parameters:** None.
- **localStorage:** None.
- **Custom events:** None.

## Error Handling

- Empty or whitespace-only entries are removed during list parsing.
- An empty brand list still renders the track structure without items.
