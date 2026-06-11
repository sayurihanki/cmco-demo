import {
  arrowSvg,
  authoredLinks,
  cellText,
  cloneRich,
  reveal,
  richSource,
  rows,
} from '../cmco-shared/cmco-shared.js';

export default function decorate(block) {
  const authoredRows = rows(block);
  const box = document.createElement('div');
  box.className = 'cmco-cta-box';
  const copy = document.createElement('div');
  copy.className = 'cmco-cta-copy';
  const eyebrow = document.createElement('p');
  eyebrow.className = 'cmco-cta-eyebrow';
  eyebrow.textContent = cellText(authoredRows[0]);
  const heading = cloneRich(richSource(authoredRows[1]), 'h2', 'cmco-cta-heading');
  copy.append(eyebrow, heading);
  const actions = document.createElement('div');
  actions.className = 'cmco-cta-actions';
  authoredLinks(authoredRows[2]).slice(0, 2).forEach((link, index) => {
    const action = document.createElement('a');
    action.className = `cmco-cta-button cmco-cta-button--${index ? 'ghost' : 'orange'}`;
    action.href = link.href;
    action.textContent = link.label;
    if (index === 0) action.append(arrowSvg());
    actions.append(action);
  });
  box.append(copy, actions);
  block.replaceChildren(box);
  reveal(box);
}
