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

const ARTICLE_IMAGES = [
  {
    src: 'https://www.cmco.com/contentassets/bb2c80ef0e69475da697a94abf4eb1fc/kc-closing-website-graphic.png',
    alt: 'Columbus McKinnon and Kito Crosby acquisition graphic',
  },
  {
    src: 'https://www.cmco.com/globalassets/newsroom-articles/cmco-introduces-flex-pro2/flex-pro2-teaser-image.png',
    alt: 'Magnetek Flex Pro 2 wireless crane controls',
  },
  {
    src: 'https://www.cmco.com/contentassets/fef77bf5d4f54d3bb57092c9c61b7a14/newsroom-thumbnail.png',
    alt: 'Forbes recognition for CMCO engineering employer award',
  },
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
  const imageConfig = ARTICLE_IMAGES[index] || ARTICLE_IMAGES[0];
  if (imageConfig?.src) {
    const artworkImage = document.createElement('img');
    artworkImage.className = 'cmco-news-artwork-image';
    artworkImage.src = imageConfig.src;
    artworkImage.alt = imageConfig.alt || cellText(row, 2);
    artworkImage.loading = 'lazy';
    artworkImage.decoding = 'async';
    artwork.append(artworkImage);
  }
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
