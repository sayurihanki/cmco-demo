# CMCO Hero Block

## Overview

The `cmco-hero` block renders the homepage hero with eyebrow badge, multi-line heading, lead copy, CTA buttons, stat row, and an animated motion-system visual card. It is the primary above-the-fold section for the CMCO demo site.

## DA.live Integration and Content Structure

Author using a **1-column**, **8-row** `cmco-hero` table.

| Row | Field | Type | Effect |
|---|---|---|---|
| 1 | Badge | Text | Eyebrow with live indicator dot |
| 2 | Heading | Rich text | Main `h1`; use line breaks to control reveal lines |
| 3 | Lead | Rich text | Supporting paragraph below the heading |
| 4 | Actions | Rich text | Up to two links (primary + ghost button) |
| 5–8 | Stat 1–4 | Text | Stats in `value \| label` format |

### Heading Line Breaks

Line breaks in the heading cell create separate animated lines. The last line receives accent styling and an underline highlight. If the default copy `We engineer the way the world moves.` is authored as a single line, it is automatically split into three display lines.

## Configuration Options

| Option | Value | Effect |
|---|---|---|
| Stat format | `150+ \| Years Operating` | Value before `\|`, label after |
| Action links | Up to 2 anchors in row 4 | First = primary button with arrow; second = ghost button |
| Visual card | Built-in SVG | Motion illustration with status chips and global reach badge |

No section metadata keys are required. The motion visual, chips, and reach badge use fixed demo content.

## Behavior Patterns

### Pointer Interactions

On devices with fine-pointer hover and without reduced motion:
- The visual card tilts toward the cursor.
- A page-level cursor glow follows pointer movement while the hero is present.

### Motion and Accessibility

- Gear, piston, wheel, and belt animations respect `prefers-reduced-motion`.
- Decorative SVG elements use `aria-hidden="true"`.
- CTA links preserve authored `target` and `rel` attributes.

## Integration Details

- **URL parameters:** None.
- **localStorage:** None.
- **Custom events:** None.

## Error Handling

- Empty badge, lead, actions, or stats are omitted from the rendered output.
- Stats with empty values are skipped.
- Invalid link URLs are removed by `cmco-shared` sanitization.
- Cursor glow and tilt effects are disabled when reduced motion is preferred or hover is unavailable.
