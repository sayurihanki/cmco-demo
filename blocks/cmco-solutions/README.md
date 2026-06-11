# CMCO Solutions Block

## Overview

The `cmco-solutions` block displays four solution pillars in a grid: Automation, Conveyance, Lifting, and Linear Motion. Each pillar includes a code label, icon, title, description, and optional link.

## DA.live Integration and Content Structure

Author using a **3-column** table with header rows plus pillar rows.

### Header Rows (rows 1–3)

| Row | Column 1 | Effect |
|---|---|---|
| 1 | Eyebrow | Section label |
| 2 | Heading | Rich-text `h2` |
| 3 | Description | Supporting paragraph |

### Pillar Rows (rows 4–7)

| Column 1 | Column 2 | Column 3 | Effect |
|---|---|---|---|
| Title | Description | Link | Pillar card content |

## Configuration Options

| Option | Effect |
|---|---|
| Pillar codes | Fixed labels: `01 / AUTO`, `02 / CONV`, `03 / LIFT`, `04 / LIN` |
| Icons | Assigned by pillar index from a built-in SVG set |
| Links | Optional; linked pillars render as `<a>`, otherwise `<article>` |

## Behavior Patterns

- Header and pillar grid use staggered `reveal` on scroll.
- Each pillar includes a decorative glow and bottom accent bar.
- Linked pillars set `aria-label` from the link label or title.

## Integration Details

- **URL parameters:** None.
- **localStorage:** None.
- **Custom events:** None.

## Error Handling

- Only rows 4–7 are used for pillars; extra rows are ignored.
- Invalid links render non-clickable pillar cards.
- Missing title or description render empty elements within the card shell.
