import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Turns a "Tag | Tag | Tag" paragraph that precedes the card title into chips.
 * @param {Element} body the card body cell
 */
function decorateTags(body) {
  const heading = body.querySelector('h1, h2, h3, h4, h5, h6');
  if (!heading) return;
  const tagsP = [...body.querySelectorAll(':scope > p')].find((p) => (
    // eslint-disable-next-line no-bitwise
    (p.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING)
    && !p.querySelector('a, picture')
    && p.textContent.includes('|')
  ));
  if (!tagsP) return;
  const tags = document.createElement('ul');
  tags.className = 'cards-promo-card-tags';
  moveInstrumentation(tagsP, tags);
  tagsP.textContent.split('|').map((t) => t.trim()).filter(Boolean).forEach((t) => {
    const li = document.createElement('li');
    li.textContent = t;
    tags.append(li);
  });
  tagsP.replaceWith(tags);
}

/**
 * Marks the trailing standalone link of the card body as the card's arrow CTA.
 * @param {Element} body the card body cell
 */
function decorateCta(body) {
  const last = body.lastElementChild;
  if (!last || last.tagName !== 'P') return;
  const link = last.querySelector(':scope > a:only-child');
  if (!link || last.textContent.trim() !== link.textContent.trim()) return;
  last.className = 'cards-promo-card-cta';
  link.classList.remove('button');
  const label = document.createElement('span');
  label.className = 'cards-promo-card-cta-label';
  label.append(...link.childNodes);
  link.append(label);
}

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-promo-card-image';
      else {
        div.className = 'cards-promo-card-body';
        decorateTags(div);
        decorateCta(div);
      }
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });
  block.textContent = '';
  block.append(ul);
}
