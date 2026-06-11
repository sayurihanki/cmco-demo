import {
  cellText,
  parseList,
  prefersReducedMotion,
  rows,
} from '../cmco-shared/cmco-shared.js';

function buildGroup(brands, duplicate = false) {
  const group = document.createElement('div');
  group.className = 'cmco-brands-group';
  if (duplicate) group.setAttribute('aria-hidden', 'true');
  brands.forEach((brand) => {
    const item = document.createElement('span');
    item.className = 'cmco-brands-name';
    item.textContent = brand;
    group.append(item);
  });
  return group;
}

export default function decorate(block) {
  const brands = parseList(rows(block).map((row) => cellText(row)).join('\n'));
  const wrap = document.createElement('div');
  wrap.className = 'cmco-brands-wrap';
  const track = document.createElement('div');
  track.className = 'cmco-brands-track';
  track.append(buildGroup(brands));
  if (!prefersReducedMotion()) track.append(buildGroup(brands, true));
  wrap.append(track);
  block.replaceChildren(wrap);
}
