import {
  arrowSvg,
  authoredLinks,
  cellText,
  cloneRich,
  optionalLinkTag,
  parseList,
  reveal,
  richSource,
  rows,
} from '../cmco-shared/cmco-shared.js';

const ICONS = [
  '<svg viewBox="0 0 30 30" fill="none" aria-hidden="true"><path d="M15 4l2 6h6l-5 4 2 7-5-4-5 4 2-7-5-4h6l2-6z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  '<svg viewBox="0 0 30 30" fill="none" aria-hidden="true"><rect x="4" y="13" width="22" height="9" rx="3" stroke="currentColor" stroke-width="1.8"/><circle cx="9" cy="25" r="2.5" stroke="currentColor" stroke-width="1.8"/><circle cx="21" cy="25" r="2.5" stroke="currentColor" stroke-width="1.8"/><path d="M7 13l2.5-5h11l2.5 5" stroke="currentColor" stroke-width="1.8"/></svg>',
  '<svg viewBox="0 0 30 30" fill="none" aria-hidden="true"><path d="M15 3l3 7h7l-6 5 2 8-6-4-6 4 2-8-6-5h7l3-7z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  '<svg viewBox="0 0 30 30" fill="none" aria-hidden="true"><path d="M6 24V10l9-5 9 5v14" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M11 24v-7h8v7" stroke="currentColor" stroke-width="1.8"/></svg>',
  '<svg viewBox="0 0 30 30" fill="none" aria-hidden="true"><rect x="4" y="11" width="22" height="13" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M9 11V7h12v4M11 18h8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  '<svg viewBox="0 0 30 30" fill="none" aria-hidden="true"><path d="M4 26l6-14 5 6 5-10 6 18" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  '<svg viewBox="0 0 30 30" fill="none" aria-hidden="true"><path d="M15 5v10M15 15l-7 4v8h14v-8l-7-4z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  '<svg viewBox="0 0 30 30" fill="none" aria-hidden="true"><rect x="9" y="6" width="12" height="18" rx="6" stroke="currentColor" stroke-width="1.8"/><path d="M15 11v8M12 15h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  '<svg viewBox="0 0 30 30" fill="none" aria-hidden="true"><path d="M16 4L7 17h7l-1 10 11-16h-8l1-11z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  '<svg viewBox="0 0 30 30" fill="none" aria-hidden="true"><rect x="3" y="10" width="24" height="14" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M3 15h24M10 10V6h10v4" stroke="currentColor" stroke-width="1.8"/></svg>',
  '<svg viewBox="0 0 30 30" fill="none" aria-hidden="true"><path d="M5 22c5-4 15-4 20 0M15 6v10M10 16h10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  '<svg viewBox="0 0 30 30" fill="none" aria-hidden="true"><path d="M6 26V14l9-7 9 7v12" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><rect x="12" y="18" width="6" height="8" stroke="currentColor" stroke-width="1.8"/></svg>',
];

function industryData(authoredRows) {
  const itemRows = authoredRows.slice(4);
  if (itemRows.length === 1 && cellText(itemRows[0]).includes(',')) {
    return parseList(cellText(itemRows[0])).map((name) => ({ name, link: null }));
  }
  return itemRows.map((row) => ({
    name: cellText(row),
    link: authoredLinks(row, 1)[0] || authoredLinks(row, 0)[0] || null,
  })).filter(({ name }) => name);
}

function buildCard(item, index) {
  const card = document.createElement(optionalLinkTag(item.link));
  card.className = 'cmco-industries-card';
  if (item.link) {
    card.href = item.link.href;
    card.setAttribute('aria-label', item.link.label || item.name);
  }
  const number = document.createElement('span');
  number.className = 'cmco-industries-number';
  number.textContent = String(index + 1).padStart(2, '0');
  const icon = document.createElement('span');
  icon.className = 'cmco-industries-icon';
  icon.innerHTML = ICONS[index] || ICONS[0];
  const label = document.createElement('span');
  label.className = 'cmco-industries-name';
  label.textContent = item.name;
  card.append(number, icon, label);
  return card;
}

export default function decorate(block) {
  const authoredRows = rows(block);
  const inner = document.createElement('div');
  inner.className = 'cmco-industries-inner';
  const header = document.createElement('header');
  header.className = 'cmco-industries-header';
  const headingGroup = document.createElement('div');
  const eyebrow = document.createElement('p');
  eyebrow.className = 'cmco-industries-eyebrow';
  eyebrow.textContent = cellText(authoredRows[0]);
  const heading = cloneRich(richSource(authoredRows[1]), 'h2', 'cmco-industries-heading');
  headingGroup.append(eyebrow, heading);
  const side = document.createElement('div');
  const description = document.createElement('p');
  description.className = 'cmco-industries-description';
  description.textContent = cellText(authoredRows[2]);
  side.append(description);
  const viewAll = authoredLinks(authoredRows[3])[0];
  if (viewAll) {
    const link = document.createElement('a');
    link.className = 'cmco-industries-view-all';
    link.href = viewAll.href;
    link.textContent = viewAll.label;
    link.append(arrowSvg());
    side.append(link);
  }
  header.append(headingGroup, side);
  const grid = document.createElement('div');
  grid.className = 'cmco-industries-grid';
  industryData(authoredRows).forEach((item, index) => grid.append(buildCard(item, index)));
  inner.append(header, grid);
  block.replaceChildren(inner);
  reveal(header);
  reveal(grid, [...grid.children]);
}
