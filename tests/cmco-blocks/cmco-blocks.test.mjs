/* global globalThis */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  authoredLinks,
  cell,
  cellText,
  cloneRich,
  optionalLinkTag,
  parseList,
  parseStat,
  richSource,
  sanitizeHref,
} from '../../blocks/cmco-shared/cmco-shared.js';
import { createGlobeMarkup } from '../../blocks/cmco-purpose/cmco-purpose.js';

test('parseList accepts comma and newline separated authoring', () => {
  assert.deepEqual(
    parseList('CM, Yale\nMagnetek,\nDorner'),
    ['CM', 'Yale', 'Magnetek', 'Dorner'],
  );
});

test('parseStat separates numeric value, suffix, and label', () => {
  assert.deepEqual(parseStat('$1B+ | Annual Revenue'), {
    value: '$1B+',
    main: '$1',
    suffix: 'B+',
    label: 'Annual Revenue',
  });
  assert.deepEqual(parseStat('150+ | Years of Motion'), {
    value: '150+',
    main: '150',
    suffix: '+',
    label: 'Years of Motion',
  });
});

test('row helpers tolerate missing authored content', () => {
  assert.equal(cell(null), null);
  assert.equal(cellText(null), '');
  assert.equal(cell({ children: [] }, 4), null);
});

test('rich heading helpers preserve authored child nodes', () => {
  const heading = { childNodes: [{ cloneNode: () => ({ type: 'emphasis' }) }] };
  const row = { children: [{ querySelector: () => heading }] };
  const previousDocument = globalThis.document;
  globalThis.document = {
    createElement: (tagName) => ({
      tagName,
      children: [],
      append(...nodes) {
        this.children.push(...nodes);
      },
    }),
  };

  assert.equal(richSource(row), heading);
  const clone = cloneRich(heading, 'h2', 'cmco-heading');
  assert.equal(clone.tagName, 'h2');
  assert.equal(clone.className, 'cmco-heading');
  assert.deepEqual(clone.children, [{ type: 'emphasis' }]);

  if (previousDocument) globalThis.document = previousDocument;
  else delete globalThis.document;
});

test('sanitizeHref accepts supported authored destinations', () => {
  globalThis.window = { location: { origin: 'https://example.com' } };
  assert.equal(sanitizeHref('#solutions'), '#solutions');
  assert.equal(sanitizeHref('/industries'), '/industries');
  assert.equal(sanitizeHref('https://cmco.com/news'), 'https://cmco.com/news');
  assert.equal(sanitizeHref('mailto:sales@example.com'), 'mailto:sales@example.com');
  assert.equal(sanitizeHref('data:text/plain,unsafe'), '');
  assert.equal(sanitizeHref('//unsafe.example.com'), '');
  delete globalThis.window;
});

test('optional authored links are filtered and use article fallbacks', () => {
  globalThis.window = { location: { origin: 'https://example.com' } };
  const anchors = [
    {
      textContent: 'Valid',
      getAttribute: (name) => ({ href: '/valid', target: '_blank', rel: 'noopener' }[name] || ''),
    },
    {
      textContent: 'Unsafe',
      getAttribute: (name) => (name === 'href' ? 'data:text/plain,unsafe' : ''),
    },
  ];
  const row = { children: [{ querySelectorAll: () => anchors }] };

  assert.deepEqual(authoredLinks(row), [{
    href: '/valid',
    label: 'Valid',
    target: '_blank',
    rel: 'noopener',
  }]);
  assert.equal(optionalLinkTag(authoredLinks(row)[0]), 'a');
  assert.equal(optionalLinkTag(null), 'article');
  delete globalThis.window;
});

test('globe markup creates collision-free IDs and a static reduced-motion variant', () => {
  const first = createGlobeMarkup('purpose-one');
  const second = createGlobeMarkup('purpose-two');
  const staticGlobe = createGlobeMarkup('purpose-static', true);
  assert.match(first, /id="purpose-one-glow"/);
  assert.match(first, /url\(#purpose-one-dot-glow\)/);
  assert.match(second, /id="purpose-two-glow"/);
  assert.doesNotMatch(second, /purpose-one/);
  assert.doesNotMatch(staticGlobe, /<animate/);
  assert.match(staticGlobe, /GLOBAL &#183; 50\+ COUNTRIES/);
});
