# CMCO Shared Utilities

## Overview

`cmco-shared` is a shared JavaScript module used by the CMCO homepage blocks. It provides DOM parsing helpers, link sanitization, scroll-reveal animation, and motion-preference utilities. It is not decorated as a page block; other `cmco-*` blocks import from `cmco-shared.js`.

## Exported Utilities

| Function | Purpose |
|---|---|
| `rows(block)` | Returns authored row elements from a block |
| `cell(row, index)` | Returns a cell element within a row |
| `cellText(row, index)` | Returns trimmed text from a cell |
| `richSource(row, index)` | Finds the rich-text source node (heading or paragraph) in a cell |
| `cloneRich(source, tagName, className)` | Clones rich-text child nodes into a new element |
| `sanitizeHref(value)` | Validates and normalizes link URLs |
| `authoredLinks(row, index)` | Extracts sanitized links from a cell |
| `createAuthoredLink(link, className)` | Builds an anchor element from a link object |
| `optionalLinkTag(link)` | Returns `'a'` when a link exists, otherwise `'article'` |
| `parseList(value)` | Splits comma- or newline-separated lists |
| `parseStat(value)` | Parses `value \| label` stat strings |
| `arrowSvg(className)` | Creates the standard CTA arrow SVG |
| `prefersReducedMotion()` | Detects `prefers-reduced-motion: reduce` |
| `canHoverPrecisely()` | Detects fine-pointer hover capability |
| `reveal(element, children)` | Applies intersection-based scroll reveal |
| `nextUniqueId(prefix)` | Generates unique IDs for inline SVG instances |

## Integration Details

- **URL parameters:** None. This module does not read query strings or hash values.
- **localStorage:** None.
- **Custom events:** None. Consumers attach their own listeners after decoration.

## Behavior Patterns

### Link Sanitization

`authoredLinks` and `sanitizeHref` accept only safe protocols: `http:`, `https:`, `mailto:`, `tel:`, and relative paths (`#`, `/`, `./`, `../`, `?`). Protocol-relative URLs (`//`) and unsupported schemes are dropped.

### Scroll Reveal

`reveal` adds the `cmco-reveal` class and staggered `--cmco-reveal-delay` custom properties. When `IntersectionObserver` is unavailable or reduced motion is preferred, items are shown immediately with `is-visible`.

### Stat Parsing

Stats use the format `value | label` (for example `50+ | Countries`). Numeric prefixes and currency symbols are split into `main` and `suffix` for display styling.

## Error Handling

- Missing rows, cells, or links return empty strings, empty arrays, or `null` instead of throwing.
- Invalid URLs are filtered out during link extraction.
- SVG IDs from `nextUniqueId` prevent duplicate gradient/filter references when multiple animated visuals render on one page.
