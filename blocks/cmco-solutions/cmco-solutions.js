import {
  authoredLinks,
  cellText,
  cloneRich,
  optionalLinkTag,
  reveal,
  richSource,
  rows,
} from '../cmco-shared/cmco-shared.js';

const CODES = ['01 / AUTO', '02 / CONV', '03 / LIFT', '04 / LIN'];

const ICONS = [
  '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="4.5" stroke="currentColor" stroke-width="1.8"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M16.3 4.9l-2.8 2.8M7.7 16.3l-2.8 2.8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="5.5" cy="17" r="3" stroke="currentColor" stroke-width="1.8"/><circle cx="18.5" cy="17" r="3" stroke="currentColor" stroke-width="1.8"/><path d="M5.5 14h13M8 6h8l1.5 8h-11L8 6z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3v12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M8.5 15q3.5 7 7 0" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><rect x="4" y="3" width="16" height="4" rx="1.5" stroke="currentColor" stroke-width="1.8"/><path d="M6.5 20h11l-2 2h-7l-2-2z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="2" y="10" width="20" height="5" rx="2.5" stroke="currentColor" stroke-width="1.8"/><rect x="2" y="10" width="9" height="5" rx="2.5" fill="currentColor"/><path d="M12 7V3M12 21v-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
];

function buildPillar(row, index) {
  const link = authoredLinks(row, 2)[0];
  const pillar = document.createElement(optionalLinkTag(link));
  pillar.className = 'cmco-solutions-pillar';
  if (link) {
    pillar.href = link.href;
    pillar.setAttribute('aria-label', link.label || cellText(row, 0));
  }

  const glow = document.createElement('span');
  glow.className = 'cmco-solutions-glow';
  glow.setAttribute('aria-hidden', 'true');
  const code = document.createElement('span');
  code.className = 'cmco-solutions-code';
  code.textContent = CODES[index] || String(index + 1).padStart(2, '0');
  const icon = document.createElement('span');
  icon.className = 'cmco-solutions-icon';
  icon.innerHTML = ICONS[index] || ICONS[0];
  const title = document.createElement('h3');
  title.className = 'cmco-solutions-title';
  title.textContent = cellText(row, 0);
  const description = document.createElement('p');
  description.className = 'cmco-solutions-card-description';
  description.textContent = cellText(row, 1);
  const bar = document.createElement('span');
  bar.className = 'cmco-solutions-bar';
  bar.setAttribute('aria-hidden', 'true');
  pillar.append(glow, code, icon, title, description, bar);
  return pillar;
}

export default function decorate(block) {
  const authoredRows = rows(block);
  const inner = document.createElement('div');
  inner.className = 'cmco-solutions-inner';
  const header = document.createElement('header');
  header.className = 'cmco-solutions-header';
  const headingGroup = document.createElement('div');
  const eyebrow = document.createElement('p');
  eyebrow.className = 'cmco-solutions-eyebrow';
  eyebrow.textContent = cellText(authoredRows[0]);
  const heading = cloneRich(richSource(authoredRows[1]), 'h2', 'cmco-solutions-heading');
  headingGroup.append(eyebrow, heading);
  const description = document.createElement('p');
  description.className = 'cmco-solutions-description';
  description.textContent = cellText(authoredRows[2]);
  header.append(headingGroup, description);

  const grid = document.createElement('div');
  grid.className = 'cmco-solutions-grid';
  authoredRows.slice(3, 7).forEach((row, index) => grid.append(buildPillar(row, index)));
  inner.append(header, grid);
  block.replaceChildren(inner);
  reveal(header);
  reveal(grid, [...grid.children]);
}
