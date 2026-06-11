import {
  arrowSvg,
  authoredLinks,
  cellText,
  cloneRich,
  optionalLinkTag,
  reveal,
  richSource,
  rows,
} from '../cmco-shared/cmco-shared.js';

const PLACEHOLDERS = [
  '<svg viewBox="0 0 130 130" fill="none" aria-hidden="true"><circle cx="65" cy="65" r="52" stroke="#00529B" stroke-width="2"/><circle cx="65" cy="65" r="30" stroke="#8BA3B8" stroke-width="1.5"/><path d="M65 13v104M13 65h104" stroke="#C4D7EE"/><circle cx="65" cy="65" r="8" fill="#F08A1C"/></svg>',
  '<svg viewBox="0 0 80 80" fill="none" aria-hidden="true"><rect x="18" y="18" width="44" height="44" rx="8" stroke="#00529B" stroke-width="2"/><path d="M32 40h16M40 32v16" stroke="#8BA3B8" stroke-width="2" stroke-linecap="round"/></svg>',
  '<svg viewBox="0 0 80 80" fill="none" aria-hidden="true"><path d="M40 10l8 22h22L52 46l7 22-19-14-19 14 7-22-18-14h22l8-22z" stroke="#F08A1C" stroke-width="2" stroke-linejoin="round"/></svg>',
];

function buildArticle(row, index) {
  const link = authoredLinks(row, 4)[0];
  const card = document.createElement(optionalLinkTag(link));
  card.className = `cmco-news-card${index === 0 ? ' cmco-news-card--featured' : ''}`;
  if (link) {
    card.href = link.href;
    card.setAttribute('aria-label', link.label || cellText(row, 2));
  }

  const image = document.createElement('div');
  image.className = 'cmco-news-image';
  const artwork = document.createElement('div');
  artwork.className = 'cmco-news-artwork';
  artwork.innerHTML = PLACEHOLDERS[index] || PLACEHOLDERS[0];
  image.append(artwork);
  const tagText = cellText(row, 0);
  if (tagText) {
    const tag = document.createElement('span');
    tag.className = 'cmco-news-tag';
    tag.textContent = tagText;
    image.append(tag);
  }

  const body = document.createElement('div');
  body.className = 'cmco-news-body';
  const meta = document.createElement('span');
  meta.className = 'cmco-news-meta';
  meta.textContent = cellText(row, 1);
  const title = document.createElement('h3');
  title.className = 'cmco-news-title';
  title.textContent = cellText(row, 2);
  body.append(meta, title);
  const excerptText = cellText(row, 3);
  if (index === 0 && excerptText) {
    const excerpt = document.createElement('p');
    excerpt.className = 'cmco-news-excerpt';
    excerpt.textContent = excerptText;
    body.append(excerpt);
  }
  if (link) {
    const readMore = document.createElement('span');
    readMore.className = 'cmco-news-read-more';
    readMore.textContent = link.label;
    readMore.append(arrowSvg());
    body.append(readMore);
  }
  card.append(image, body);
  return card;
}

export default function decorate(block) {
  const authoredRows = rows(block);
  const inner = document.createElement('div');
  inner.className = 'cmco-news-inner';
  const header = document.createElement('header');
  header.className = 'cmco-news-header';
  const headingGroup = document.createElement('div');
  const eyebrow = document.createElement('p');
  eyebrow.className = 'cmco-news-eyebrow';
  eyebrow.textContent = cellText(authoredRows[0]);
  const heading = cloneRich(richSource(authoredRows[1]), 'h2', 'cmco-news-heading');
  headingGroup.append(eyebrow, heading);
  header.append(headingGroup);
  const viewAll = authoredLinks(authoredRows[2])[0];
  if (viewAll) {
    const link = document.createElement('a');
    link.className = 'cmco-news-view-all';
    link.href = viewAll.href;
    link.textContent = viewAll.label;
    link.append(arrowSvg());
    header.append(link);
  }
  const grid = document.createElement('div');
  grid.className = 'cmco-news-grid';
  authoredRows.slice(3, 6).forEach((row, index) => grid.append(buildArticle(row, index)));
  inner.append(header, grid);
  block.replaceChildren(inner);
  reveal(header);
  reveal(grid, [...grid.children]);
}
