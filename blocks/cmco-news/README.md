# CMCO News Block

## Overview

The `cmco-news` block displays a news section with a featured article and two secondary articles. Each card supports tag, metadata, title, optional excerpt, and link.

## DA.live Integration and Content Structure

Author using a **5-column** table.

### Header Rows (rows 1–3)

| Row | Columns | Effect |
|---|---|---|
| 1 | Eyebrow (col 1) | Section label |
| 2 | Heading (col 1) | Rich-text `h2` |
| 3 | View All link (col 1) | Optional header CTA |

### Article Rows (rows 4–6)

| Column | Field | Effect |
|---|---|---|
| 1 | Tag | Category badge on the artwork |
| 2 | Meta | Date and category line |
| 3 | Title | Article `h3` |
| 4 | Excerpt | Shown only on the featured (first) article |
| 5 | Link | Makes the card clickable; renders "read more" on featured card |

Row 4 is the featured article (`cmco-news-card--featured`). Rows 5–6 are compact secondary cards.

## Configuration Options

| Option | Effect |
|---|---|
| Featured article | First article row (row 4) gets larger layout and excerpt |
| Placeholder artwork | Built-in SVG illustrations assigned by card index |
| Excerpt visibility | Only the featured card displays the excerpt field |

## Behavior Patterns

- Header and grid animate in with staggered `reveal`.
- Linked cards use `optionalLinkTag` (`<a>` vs `<article>`).
- Read-more text reuses the link label with an arrow icon on the featured card.

## Integration Details

- **URL parameters:** None.
- **localStorage:** None.
- **Custom events:** None.

## Error Handling

- Missing tag, meta, or title fields are omitted from the card body.
- Invalid links render non-clickable article cards.
- Only rows 4–6 are consumed; additional rows are ignored.
