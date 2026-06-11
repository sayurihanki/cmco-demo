# CMCO Industries Block

## Overview

The `cmco-industries` block presents a grid of industry cards with icons, optional links, a section header, description, and optional "view all" link. It highlights the industries CMCO serves.

## DA.live Integration and Content Structure

Author using a **2-column** table with header rows plus industry item rows.

### Header Rows (rows 1–4)

| Row | Column 1 | Column 2 | Effect |
|---|---|---|---|
| 1 | Eyebrow | — | Small section label |
| 2 | Heading | — | Rich-text `h2` |
| 3 | Description | — | Supporting copy |
| 4 | View All link | — | Optional header CTA with arrow |

### Industry Item Rows (rows 5+)

| Column 1 | Column 2 | Effect |
|---|---|---|
| Industry name | Optional link | Card title; link makes the card clickable |

### Compact Authoring Mode

If a single item row contains comma-separated names in column 1, the block parses them as unlinked industry cards. This supports quick demo authoring without per-industry rows.

## Configuration Options

| Option | Effect |
|---|---|
| Industry links | Cards with links render as `<a>`; without links as `<article>` |
| Icons | Assigned by card index from a built-in icon set (cycles for overflow) |
| Card numbers | Zero-padded index labels (`01`, `02`, …) |

## Behavior Patterns

- Header and grid use staggered `reveal` animation on scroll.
- Linked cards expose `aria-label` from the link label or industry name.
- Icons are decorative SVGs marked `aria-hidden="true"`.

## Integration Details

- **URL parameters:** None.
- **localStorage:** None.
- **Custom events:** None.

## Error Handling

- Industry rows with empty names are filtered out.
- Invalid link URLs are dropped; the card falls back to a non-linked `<article>`.
- Missing header fields render empty elements without breaking the grid.
