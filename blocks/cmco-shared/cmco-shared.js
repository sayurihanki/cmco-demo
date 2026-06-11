let uniqueId = 0;

export function rows(block) {
  return [...(block?.children || [])];
}

export function cell(row, index = 0) {
  return row?.children?.[index] || null;
}

export function cellText(row, index = 0) {
  return cell(row, index)?.textContent?.trim() || '';
}

export function richSource(row, index = 0) {
  const sourceCell = cell(row, index);
  if (!sourceCell) return null;
  return sourceCell.querySelector('h1, h2, h3, h4, h5, h6, p') || sourceCell;
}

export function cloneRich(source, tagName, className) {
  const element = document.createElement(tagName);
  element.className = className;
  if (!source) return element;
  [...source.childNodes].forEach((node) => element.append(node.cloneNode(true)));
  return element;
}

export function sanitizeHref(value) {
  const href = String(value || '').trim();
  if (!href || href.startsWith('//')) return '';
  if (['#', '/', './', '../', '?'].some((prefix) => href.startsWith(prefix))) return href;

  try {
    const url = new URL(href, window.location.origin);
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol) ? href : '';
  } catch {
    return '';
  }
}

export function authoredLinks(row, index = 0) {
  const source = cell(row, index) || row;
  if (!source) return [];

  return [...source.querySelectorAll('a[href]')]
    .map((anchor) => ({
      href: sanitizeHref(anchor.getAttribute('href')),
      label: anchor.textContent.trim(),
      target: anchor.getAttribute('target') || '',
      rel: anchor.getAttribute('rel') || '',
    }))
    .filter(({ href, label }) => href && label);
}

export function createAuthoredLink(link, className) {
  if (!link?.href) return null;
  const anchor = document.createElement('a');
  anchor.className = className;
  anchor.href = link.href;
  anchor.textContent = link.label;
  if (link.target) anchor.target = link.target;
  if (link.rel) anchor.rel = link.rel;
  return anchor;
}

export function optionalLinkTag(link) {
  return link?.href ? 'a' : 'article';
}

export function parseList(value) {
  return String(value || '')
    .split(/[,\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseStat(value) {
  const [rawValue = '', ...labelParts] = String(value || '').split('|');
  const displayValue = rawValue.trim();
  const match = displayValue.match(/^([$€£]?\d[\d.,]*)(.*)$/);
  return {
    value: displayValue,
    main: match?.[1] || displayValue,
    suffix: match?.[2]?.trim() || '',
    label: labelParts.join('|').trim(),
  };
}

export function arrowSvg(className = '') {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.setAttribute('width', '15');
  svg.setAttribute('height', '15');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('aria-hidden', 'true');
  if (className) svg.setAttribute('class', className);

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M2 8h11M9 4l4 4-4 4');
  path.setAttribute('stroke', 'currentColor');
  path.setAttribute('stroke-width', '1.8');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');
  svg.append(path);
  return svg;
}

export function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;
}

export function canHoverPrecisely() {
  return window.matchMedia?.('(hover: hover) and (pointer: fine)').matches || false;
}

export function reveal(element, children = []) {
  const items = children.length ? children : [element];
  items.forEach((item, index) => {
    item.classList.add('cmco-reveal');
    item.style.setProperty('--cmco-reveal-delay', `${index * 70}ms`);
  });

  if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
    items.forEach((item) => item.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      items.forEach((item) => item.classList.add('is-visible'));
      observer.disconnect();
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px' });
  observer.observe(element);
}

export function nextUniqueId(prefix) {
  uniqueId += 1;
  return `${prefix}-${uniqueId}`;
}
