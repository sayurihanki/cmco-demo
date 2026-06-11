import {
  arrowSvg,
  authoredLinks,
  canHoverPrecisely,
  cellText,
  parseStat,
  prefersReducedMotion,
  richSource,
  rows,
} from '../cmco-shared/cmco-shared.js';

const MOTION_SVG = `<svg class="cmco-hero-motion-svg" viewBox="0 0 480 490" xmlns="http://www.w3.org/2000/svg" fill="none" aria-hidden="true">
  <path d="M22 46V22H46 M458 46V22H434 M22 444V468H46 M458 444V468H434" stroke="#C4D7EE" stroke-width="1.3"/>
  <text x="26" y="16" font-family="JetBrains Mono,monospace" font-size="8" fill="#8BA3B8" letter-spacing="2">SYS.MOTION / REV 1875</text>
  <text x="392" y="16" font-family="JetBrains Mono,monospace" font-size="8" fill="#F08A1C" letter-spacing="2">&#9679; LIVE</text>
  <rect x="55" y="82" width="290" height="12" rx="6" fill="#003E78" opacity=".92"/>
  <rect x="49" y="78" width="11" height="20" rx="2.5" fill="#00284F"/>
  <rect x="320" y="78" width="11" height="20" rx="2.5" fill="#00284F"/>
  <g class="cmco-hero-hook">
    <rect x="176" y="76" width="46" height="22" rx="5" fill="#00529B"/>
    <circle cx="184" cy="76" r="5" fill="#00284F" stroke="#1A6AB5" stroke-width="1.2"/>
    <circle cx="214" cy="76" r="5" fill="#00284F" stroke="#1A6AB5" stroke-width="1.2"/>
    <line x1="200" y1="98" x2="200" y2="168" stroke="#6B9CC8" stroke-width="2.2"/>
    <rect x="185" y="168" width="30" height="18" rx="4" fill="#00284F" stroke="#0066BD" stroke-width="1.2"/>
    <path d="M194 186L194 204Q194 218 208 218Q222 218 222 207Q222 197 211 197" stroke="#F08A1C" stroke-width="4.5" stroke-linecap="round"/>
  </g>
  <g transform="translate(356 188)">
    <g class="cmco-hero-gear cmco-hero-gear--large">
      <path d="M0-56 5.2-44 17.5-50 15.5-36 28.5-29.5 24-18 34.5-8.5 27 2 34.5 13 24 22 28.5 33 15.5 37 17.5 51 5.2 46 0 60-5.2 46-17.5 51-15.5 37-28.5 33-24 22-34.5 13-27 2-34.5-8.5-24-18-28.5-29.5-15.5-36-17.5-50-5.2-44Z" fill="#EDF4FC" stroke="#C4D7EE" stroke-width="1.2"/>
      <circle r="19.5" fill="#E2EDF9" stroke="#BAD0E8" stroke-width="1.3"/>
      <circle cy="-35" r="4" fill="#F4F7FB"/><circle cx="30" cy="-17" r="4" fill="#F4F7FB"/>
      <circle cx="30" cy="17" r="4" fill="#F4F7FB"/><circle cy="35" r="4" fill="#F4F7FB"/>
      <circle cx="-30" cy="17" r="4" fill="#F4F7FB"/><circle cx="-30" cy="-17" r="4" fill="#F4F7FB"/>
      <circle r="8" fill="#00529B"/><circle r="3.5" fill="#F08A1C"/>
    </g>
  </g>
  <g transform="translate(412 242)">
    <g class="cmco-hero-gear cmco-hero-gear--medium">
      <path d="M0-34 3.8-25.5 12.5-29.5 11.5-19 21-13 17-4.5 25 2 18 8.5 21 18 11.5 19.5 12.5 30 3.8 27 0 36-3.8 27-12.5 30-11.5 19.5-21 18-17 8.5-25 2-18-4.5-21-13-11.5-19-12.5-29.5-3.8-25.5Z" fill="#E5EFF9" stroke="#C4D7EE" stroke-width="1.1"/>
      <circle r="11.5" fill="#ECF3FB" stroke="#BAD0E8" stroke-width="1.2"/>
      <circle r="4.5" fill="#0066BD"/>
    </g>
  </g>
  <g transform="translate(298 230)">
    <g class="cmco-hero-gear cmco-hero-gear--small">
      <path d="M0-22 3-15.5 9.5-19 9-11.5 15.5-7.5 12.5-1.5 18 2 13 7 15 13.5 8.5 14 9 22 3 18.5 0 24-3 18.5-9 22-8.5 14-15 13.5-13 7-18 2-12.5-1.5-15.5-7.5-9-11.5-9.5-19-3-15.5Z" fill="#EAF2FC" stroke="#C4D7EE"/>
      <circle r="7.5" fill="#E5EFF9"/><circle r="3" fill="#003E78"/>
    </g>
  </g>
  <circle cx="296" cy="185" r="3.5" fill="#00529B" stroke="#FFF" stroke-width="1.4"/>
  <circle cx="354" cy="246" r="3.5" fill="#F08A1C" stroke="#FFF" stroke-width="1.4"/>
  <line x1="298" y1="186" x2="298" y2="218" stroke="#C4D7EE" stroke-dasharray="3 4" opacity=".6"/>
  <line x1="354" y1="246" x2="290" y2="286" stroke="#C4D7EE" stroke-dasharray="3 4" opacity=".5"/>
  <text x="55" y="289" font-family="JetBrains Mono,monospace" font-size="8" fill="#8BA3B8" letter-spacing="2">LINEAR &#183; ACT-04</text>
  <rect x="55" y="296" width="175" height="13" rx="6.5" fill="#EAF2FC" stroke="#C4D7EE" stroke-width="1.3"/>
  <g class="cmco-hero-piston"><rect x="55" y="296" width="56" height="13" rx="6.5" fill="#00529B" opacity=".88"/></g>
  <text x="235" y="306" font-family="JetBrains Mono,monospace" font-size="8" fill="#F08A1C" letter-spacing="1">&#177;0.01mm</text>
  <rect x="55" y="370" width="290" height="42" rx="21" fill="#EAF2FC" stroke="#C4D7EE" stroke-width="1.3"/>
  <g class="cmco-hero-wheel"><circle cx="76" cy="391" r="15.5" stroke="#B8CDE3" stroke-width="1.7" fill="#FFF"/><circle cx="76" cy="391" r="6" fill="#00529B"/></g>
  <g class="cmco-hero-wheel"><circle cx="324" cy="391" r="15.5" stroke="#B8CDE3" stroke-width="1.7" fill="#FFF"/><circle cx="324" cy="391" r="6" fill="#00529B"/></g>
  <line x1="76" y1="378" x2="324" y2="378" stroke="#F08A1C" stroke-width="2.3" stroke-dasharray="7 11" class="cmco-hero-belt"/>
  <rect x="114" y="350" width="30" height="21" rx="3" fill="#00529B" opacity=".85"/>
  <rect x="210" y="350" width="30" height="21" rx="3" fill="#003E78" opacity=".8"/>
  <text x="58" y="428" font-family="JetBrains Mono,monospace" font-size="8" fill="#8BA3B8" letter-spacing="2">CONVEYANCE &#183; 0.8 m/s</text>
</svg>`;

function headingLines(source) {
  if (!source) return [];
  const fragments = [[]];
  [...source.childNodes].forEach((node) => {
    if (node.nodeName === 'BR') fragments.push([]);
    else fragments[fragments.length - 1].push(node.cloneNode(true));
  });
  const populated = fragments.filter(
    (fragment) => fragment.some((node) => node.textContent?.trim()),
  );
  const text = source.textContent.trim().replace(/\s+/g, ' ');
  if (populated.length === 1 && text === 'We engineer the way the world moves.') {
    return ['We engineer', 'the way the', 'world moves.'].map((line) => [document.createTextNode(line)]);
  }
  return populated;
}

function buildHeading(source) {
  const heading = document.createElement('h1');
  heading.className = 'cmco-hero-heading';
  const lines = headingLines(source);
  lines.forEach((nodes, index) => {
    const line = document.createElement('span');
    line.className = 'cmco-hero-line';
    const content = document.createElement('span');
    if (index === lines.length - 1) content.classList.add('cmco-hero-accent');
    nodes.forEach((node) => content.append(node));
    if (index === lines.length - 1) {
      const highlight = document.createElement('span');
      highlight.className = 'cmco-hero-highlight';
      highlight.setAttribute('aria-hidden', 'true');
      content.append(highlight);
    }
    line.append(content);
    heading.append(line);
  });
  return heading;
}

function buildChip(modifier, label, value) {
  const chip = document.createElement('div');
  chip.className = `cmco-hero-chip cmco-hero-chip--${modifier}`;
  const dot = document.createElement('span');
  dot.className = `cmco-hero-chip-dot cmco-hero-chip-dot--${modifier}`;
  dot.setAttribute('aria-hidden', 'true');
  const copy = document.createElement('span');
  const labelElement = document.createElement('span');
  labelElement.className = 'cmco-hero-chip-label';
  labelElement.textContent = label;
  const valueElement = document.createElement('span');
  valueElement.className = 'cmco-hero-chip-value';
  valueElement.textContent = value;
  copy.append(labelElement, valueElement);
  chip.append(dot, copy);
  return chip;
}

function buildVisual() {
  const visual = document.createElement('div');
  visual.className = 'cmco-hero-visual';
  const card = document.createElement('div');
  card.className = 'cmco-hero-card';
  card.innerHTML = MOTION_SVG;
  card.append(
    buildChip('status', 'System Status', 'All Online'),
    buildChip('load', 'Load Capacity', '2.5 Tons'),
    buildChip('uptime', 'Uptime', '99.97%'),
  );

  const badge = document.createElement('div');
  badge.className = 'cmco-hero-reach';
  const label = document.createElement('span');
  label.className = 'cmco-hero-reach-label';
  label.textContent = 'Global Reach';
  const value = document.createElement('span');
  value.className = 'cmco-hero-reach-value';
  value.append('50');
  const suffix = document.createElement('span');
  suffix.className = 'cmco-hero-reach-suffix';
  suffix.textContent = '+';
  value.append(suffix);
  const description = document.createElement('p');
  description.textContent = 'Countries powered by intelligent motion';
  badge.append(label, value, description);
  card.append(badge);
  visual.append(card);

  if (canHoverPrecisely() && !prefersReducedMotion()) {
    visual.addEventListener('pointermove', (event) => {
      const rect = visual.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.setProperty('--cmco-hero-tilt-y', `${x * 10}deg`);
      card.style.setProperty('--cmco-hero-tilt-x', `${y * -7}deg`);
      card.classList.add('is-tilting');
    });
    visual.addEventListener('pointerleave', () => {
      card.classList.remove('is-tilting');
      card.style.removeProperty('--cmco-hero-tilt-x');
      card.style.removeProperty('--cmco-hero-tilt-y');
    });
  }
  return visual;
}

function enableCursorGlow() {
  if (!canHoverPrecisely() || prefersReducedMotion()) return;
  if (document.querySelector('.cmco-cursor-glow')) return;
  const glow = document.createElement('div');
  glow.className = 'cmco-cursor-glow';
  glow.setAttribute('aria-hidden', 'true');
  document.body.append(glow);

  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let currentX = targetX;
  let currentY = targetY;
  const updateTarget = (event) => {
    targetX = event.clientX;
    targetY = event.clientY;
  };
  document.addEventListener('pointermove', updateTarget, { passive: true });

  const animate = () => {
    if (!document.querySelector('.cmco-hero')) {
      document.removeEventListener('pointermove', updateTarget);
      glow.remove();
      return;
    }
    currentX += (targetX - currentX) * 0.09;
    currentY += (targetY - currentY) * 0.09;
    glow.style.translate = `${currentX}px ${currentY}px`;
    window.requestAnimationFrame(animate);
  };
  window.requestAnimationFrame(animate);
}

export default function decorate(block) {
  const authoredRows = rows(block);
  const badgeText = cellText(authoredRows[0]);
  const leadText = cellText(authoredRows[2]);
  const links = authoredLinks(authoredRows[3]);

  const surface = document.createElement('div');
  surface.className = 'cmco-hero-surface';
  const dotGrid = document.createElement('div');
  dotGrid.className = 'cmco-hero-dot-grid';
  dotGrid.setAttribute('aria-hidden', 'true');
  const blobs = document.createElement('div');
  blobs.className = 'cmco-hero-blobs';
  blobs.setAttribute('aria-hidden', 'true');
  ['one', 'two', 'three'].forEach((name) => {
    const blob = document.createElement('span');
    blob.className = `cmco-hero-blob cmco-hero-blob--${name}`;
    blobs.append(blob);
  });

  const inner = document.createElement('div');
  inner.className = 'cmco-hero-inner';
  const copy = document.createElement('div');
  copy.className = 'cmco-hero-copy';

  if (badgeText) {
    const badge = document.createElement('div');
    badge.className = 'cmco-hero-eyebrow';
    const liveDot = document.createElement('span');
    liveDot.className = 'cmco-hero-live-dot';
    liveDot.setAttribute('aria-hidden', 'true');
    const text = document.createElement('span');
    text.textContent = badgeText;
    badge.append(liveDot, text);
    copy.append(badge);
  }

  copy.append(buildHeading(richSource(authoredRows[1])));
  if (leadText) {
    const lead = document.createElement('p');
    lead.className = 'cmco-hero-lead';
    lead.textContent = leadText;
    copy.append(lead);
  }

  if (links.length) {
    const actions = document.createElement('div');
    actions.className = 'cmco-hero-actions';
    links.slice(0, 2).forEach((link, index) => {
      const action = document.createElement('a');
      action.className = `cmco-hero-button cmco-hero-button--${index ? 'ghost' : 'primary'}`;
      action.href = link.href;
      action.textContent = link.label;
      if (link.target) action.target = link.target;
      if (link.rel) action.rel = link.rel;
      if (index === 0) action.append(arrowSvg('cmco-hero-button-arrow'));
      actions.append(action);
    });
    copy.append(actions);
  }

  const stats = authoredRows.slice(4, 8).map((row) => parseStat(cellText(row)));
  if (stats.some(({ value }) => value)) {
    const statsElement = document.createElement('div');
    statsElement.className = 'cmco-hero-stats';
    stats.forEach((stat) => {
      if (!stat.value) return;
      const item = document.createElement('div');
      item.className = 'cmco-hero-stat';
      const value = document.createElement('div');
      value.className = 'cmco-hero-stat-value';
      value.append(stat.main);
      if (stat.suffix) {
        const suffix = document.createElement('span');
        suffix.className = 'cmco-hero-stat-suffix';
        suffix.textContent = stat.suffix;
        value.append(suffix);
      }
      const label = document.createElement('div');
      label.className = 'cmco-hero-stat-label';
      label.textContent = stat.label;
      item.append(value, label);
      statsElement.append(item);
    });
    copy.append(statsElement);
  }

  inner.append(copy, buildVisual());
  surface.append(dotGrid, blobs, inner);
  block.replaceChildren(surface);
  enableCursorGlow();
}
