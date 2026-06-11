import {
  arrowSvg,
  authoredLinks,
  cellText,
  cloneRich,
  nextUniqueId,
  parseStat,
  prefersReducedMotion,
  reveal,
  richSource,
  rows,
} from '../cmco-shared/cmco-shared.js';

const BACKGROUND_GEAR = '<svg class="cmco-purpose-background-gear" viewBox="0 0 400 400" fill="none" aria-hidden="true"><path d="M200 30L216 62L252 50L256 86L290 90L278 124L310 146L292 178L310 210L278 232L290 266L256 270L252 306L216 294L200 326L184 294L148 306L144 270L110 266L122 232L90 210L108 178L90 146L122 124L110 90L144 86L148 50L184 62Z" stroke="white"/><circle cx="200" cy="200" r="80" stroke="white"/></svg>';

const GLOBE_SVG = `<svg class="cmco-purpose-globe-svg" viewBox="0 0 440 440" xmlns="http://www.w3.org/2000/svg" fill="none" aria-hidden="true">
  <defs>
    <radialGradient id="__GLOW__" cx="50%" cy="42%" r="50%">
      <stop offset="0%" stop-color="#0066BD" stop-opacity=".28"/>
      <stop offset="100%" stop-color="#001A36" stop-opacity="0"/>
    </radialGradient>
    <filter id="__FILTER__" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <circle cx="220" cy="220" r="185" fill="url(#__GLOW__)" opacity=".65"/>
  <ellipse cx="220" cy="220" rx="178" ry="28" stroke="#0066BD" stroke-opacity=".16" stroke-dasharray="5 9">
    <animateTransform attributeName="transform" type="rotate" from="0 220 220" to="360 220 220" dur="22s" repeatCount="indefinite"/>
  </ellipse>
  <ellipse cx="220" cy="220" rx="165" ry="42" stroke="#F08A1C" stroke-opacity=".12" stroke-dasharray="4 8" transform="rotate(35 220 220)">
    <animateTransform attributeName="transform" type="rotate" from="35 220 220" to="395 220 220" dur="32s" repeatCount="indefinite"/>
  </ellipse>
  <circle cx="220" cy="220" r="152" stroke="#0066BD" stroke-opacity=".45" stroke-width="1.8"/>
  <ellipse cx="220" cy="172" rx="134" ry="18" stroke="#FFF" stroke-opacity=".09"/>
  <ellipse cx="220" cy="220" rx="152" ry="20" stroke="#0066BD" stroke-opacity=".24" stroke-width="1.2"/>
  <ellipse cx="220" cy="268" rx="134" ry="18" stroke="#FFF" stroke-opacity=".09"/>
  <ellipse cx="220" cy="132" rx="98" ry="13" stroke="#FFF" stroke-opacity=".06"/>
  <ellipse cx="220" cy="308" rx="98" ry="13" stroke="#FFF" stroke-opacity=".06"/>
  <line x1="220" y1="68" x2="220" y2="372" stroke="#0066BD" stroke-opacity=".15"/>
  <line x1="68" y1="220" x2="372" y2="220" stroke="#0066BD" stroke-opacity=".15"/>
  <ellipse cx="220" cy="220" ry="152" stroke="#0066BD" stroke-opacity=".45" stroke-width="1.3">
    <animate attributeName="rx" values="152;8;152" dur="9s" repeatCount="indefinite"/>
    <animate attributeName="opacity" values=".7;.08;.7" dur="9s" repeatCount="indefinite"/>
  </ellipse>
  <ellipse cx="220" cy="220" ry="152" stroke="#0066BD" stroke-opacity=".32" stroke-dasharray="4 7">
    <animate attributeName="rx" values="8;152;8" dur="9s" begin="-3s" repeatCount="indefinite"/>
    <animate attributeName="opacity" values=".08;.55;.08" dur="9s" begin="-3s" repeatCount="indefinite"/>
  </ellipse>
  <ellipse cx="220" cy="220" ry="152" stroke="#0050A0" stroke-opacity=".22">
    <animate attributeName="rx" values="95;152;95" dur="9s" begin="-6s" repeatCount="indefinite"/>
    <animate attributeName="opacity" values=".42;.12;.42" dur="9s" begin="-6s" repeatCount="indefinite"/>
  </ellipse>
  <path d="M128 128Q103 178 116 248Q126 196 148 164Q163 140 143 120Z" fill="#FFF" fill-opacity=".045"/>
  <g filter="url(#__FILTER__)">
    <circle cx="152" cy="186" r="5.5" fill="#F08A1C"><animate attributeName="opacity" values=".75;1;.75" dur="2.5s" repeatCount="indefinite"/></circle>
    <circle cx="152" cy="186" r="5.5" fill="#F08A1C" opacity=".3"><animate attributeName="r" from="5.5" to="18" dur="2.5s" repeatCount="indefinite"/><animate attributeName="opacity" from=".3" to="0" dur="2.5s" repeatCount="indefinite"/></circle>
  </g>
  <g filter="url(#__FILTER__)">
    <circle cx="238" cy="172" r="5" fill="#F08A1C"><animate attributeName="opacity" values=".7;1;.7" dur="3s" begin="-.8s" repeatCount="indefinite"/></circle>
    <circle cx="238" cy="172" r="5" fill="#F08A1C" opacity=".25"><animate attributeName="r" from="5" to="16" dur="3s" begin="-.8s" repeatCount="indefinite"/><animate attributeName="opacity" from=".25" to="0" dur="3s" begin="-.8s" repeatCount="indefinite"/></circle>
  </g>
  <circle cx="252" cy="163" r="3.5" fill="#F08A1C" filter="url(#__FILTER__)"><animate attributeName="opacity" values=".6;1;.6" dur="2.8s" begin="-1.4s" repeatCount="indefinite"/></circle>
  <g filter="url(#__FILTER__)">
    <circle cx="318" cy="188" r="5" fill="#F08A1C"><animate attributeName="opacity" values=".72;1;.72" dur="3.5s" begin="-1.1s" repeatCount="indefinite"/></circle>
    <circle cx="318" cy="188" r="5" fill="#F08A1C" opacity=".2"><animate attributeName="r" from="5" to="15" dur="3.5s" begin="-1.1s" repeatCount="indefinite"/><animate attributeName="opacity" from=".2" to="0" dur="3.5s" begin="-1.1s" repeatCount="indefinite"/></circle>
  </g>
  <circle cx="342" cy="183" r="4" fill="#F08A1C" filter="url(#__FILTER__)"><animate attributeName="opacity" values=".65;1;.65" dur="2.7s" begin="-1.8s" repeatCount="indefinite"/></circle>
  <circle cx="322" cy="270" r="4.5" fill="#F08A1C" filter="url(#__FILTER__)"><animate attributeName="opacity" values=".6;1;.6" dur="2.9s" begin="-2s" repeatCount="indefinite"/></circle>
  <circle cx="180" cy="275" r="4" fill="#F08A1C" filter="url(#__FILTER__)"><animate attributeName="opacity" values=".6;1;.6" dur="3.2s" begin="-.4s" repeatCount="indefinite"/></circle>
  <path d="M152 186Q192 138 238 172" stroke="#F08A1C" stroke-opacity=".32" stroke-width="1.6" stroke-dasharray="5 7"><animate attributeName="stroke-dashoffset" from="0" to="-60" dur="2s" repeatCount="indefinite"/></path>
  <circle r="3.5" fill="#F08A1C" filter="url(#__FILTER__)"><animateMotion dur="3s" repeatCount="indefinite" path="M152 186Q192 138 238 172"/><animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;.05;.1;.9;1" dur="3s" repeatCount="indefinite"/></circle>
  <path d="M252 163Q286 146 318 188" stroke="#F08A1C" stroke-opacity=".26" stroke-width="1.5" stroke-dasharray="5 7"><animate attributeName="stroke-dashoffset" from="0" to="-58" dur="2.2s" repeatCount="indefinite"/></path>
  <circle r="3" fill="#F08A1C" filter="url(#__FILTER__)"><animateMotion dur="4s" begin="-1s" repeatCount="indefinite" path="M252 163Q286 146 318 188"/><animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;.05;.1;.9;1" dur="4s" begin="-1s" repeatCount="indefinite"/></circle>
  <path d="M318 188Q330 185 342 183" stroke="#F08A1C" stroke-opacity=".2" stroke-width="1.2" stroke-dasharray="3 5"><animate attributeName="stroke-dashoffset" from="0" to="-28" dur="1.6s" repeatCount="indefinite"/></path>
  <path d="M152 186Q163 230 180 275" stroke="#F08A1C" stroke-opacity=".2" stroke-width="1.3" stroke-dasharray="4 8"><animate attributeName="stroke-dashoffset" from="0" to="-48" dur="2.8s" repeatCount="indefinite"/></path>
  <circle r="2.5" fill="#F08A1C" filter="url(#__FILTER__)"><animateMotion dur="3.5s" begin="-.6s" repeatCount="indefinite" path="M152 186Q163 230 180 275"/><animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;.05;.1;.9;1" dur="3.5s" begin="-.6s" repeatCount="indefinite"/></circle>
  <path d="M318 188Q320 228 322 270" stroke="#F08A1C" stroke-opacity=".2" stroke-width="1.2" stroke-dasharray="4 7"><animate attributeName="stroke-dashoffset" from="0" to="-44" dur="2.4s" repeatCount="indefinite"/></path>
  <circle r="2.5" fill="#F08A1C" filter="url(#__FILTER__)"><animateMotion dur="3.2s" begin="-1.5s" repeatCount="indefinite" path="M318 188Q320 228 322 270"/><animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;.05;.1;.9;1" dur="3.2s" begin="-1.5s" repeatCount="indefinite"/></circle>
  <text x="22" y="24" font-family="JetBrains Mono,monospace" font-size="9" fill="#FFF" fill-opacity=".28" letter-spacing="2">GLOBAL &#183; 50+ COUNTRIES</text>
  <text x="22" y="426" font-family="JetBrains Mono,monospace" font-size="8.5" fill="#FFF" fill-opacity=".16" letter-spacing="1">EST. 1875 - MOVING THE WORLD FORWARD</text>
</svg>`;

export function createGlobeMarkup(instanceId, reducedMotion = false) {
  const markup = GLOBE_SVG
    .replaceAll('__GLOW__', `${instanceId}-glow`)
    .replaceAll('__FILTER__', `${instanceId}-dot-glow`);
  if (!reducedMotion) return markup;
  return markup.replace(/<animate(?:Motion|Transform)?\b[^>]*\/>/g, '');
}

function buildGlobe(stats) {
  const wrapper = document.createElement('div');
  wrapper.className = 'cmco-purpose-globe';
  const instanceId = nextUniqueId('cmco-purpose-globe');
  wrapper.innerHTML = createGlobeMarkup(instanceId, prefersReducedMotion());
  stats.forEach((stat, index) => {
    const card = document.createElement('div');
    card.className = `cmco-purpose-stat cmco-purpose-stat--${index + 1}`;
    const label = document.createElement('span');
    label.className = 'cmco-purpose-stat-label';
    label.textContent = stat.label;
    const value = document.createElement('span');
    value.className = 'cmco-purpose-stat-value';
    value.append(stat.main);
    if (stat.suffix) {
      const suffix = document.createElement('span');
      suffix.textContent = stat.suffix;
      value.append(suffix);
    }
    card.append(label, value);
    wrapper.append(card);
  });
  return wrapper;
}

export default function decorate(block) {
  const authoredRows = rows(block);
  const backgroundGear = document.createElement('div');
  backgroundGear.innerHTML = BACKGROUND_GEAR;
  const inner = document.createElement('div');
  inner.className = 'cmco-purpose-inner';
  const copy = document.createElement('div');
  copy.className = 'cmco-purpose-copy';
  const eyebrow = document.createElement('p');
  eyebrow.className = 'cmco-purpose-eyebrow';
  eyebrow.textContent = cellText(authoredRows[0]);
  const heading = cloneRich(richSource(authoredRows[1]), 'h2', 'cmco-purpose-heading');
  const body = document.createElement('p');
  body.className = 'cmco-purpose-body';
  body.textContent = cellText(authoredRows[2]);
  copy.append(eyebrow, heading, body);

  const links = authoredLinks(authoredRows[3]);
  if (links.length) {
    const actions = document.createElement('div');
    actions.className = 'cmco-purpose-actions';
    links.slice(0, 2).forEach((link, index) => {
      const action = document.createElement('a');
      action.className = `cmco-purpose-button cmco-purpose-button--${index ? 'ghost' : 'orange'}`;
      action.href = link.href;
      action.textContent = link.label;
      if (index === 0) action.append(arrowSvg());
      actions.append(action);
    });
    copy.append(actions);
  }

  const defaults = ['50+ | Countries', '150+ | Years Operating'];
  const stats = defaults.map((fallback, index) => (
    parseStat(cellText(authoredRows[index + 4]) || fallback)
  ));
  const visual = buildGlobe(stats);
  inner.append(copy, visual);
  block.replaceChildren(...backgroundGear.children, inner);
  reveal(copy);
  reveal(visual);
}
