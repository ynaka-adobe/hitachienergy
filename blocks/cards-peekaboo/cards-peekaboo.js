import { createOptimizedPicture } from '../../scripts/aem.js';

function optimizeImages(root) {
  root.querySelectorAll('picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]));
  });
}

/**
 * Peekaboo tiles: one row per tile, [image | title + text].
 * The body is overlaid on the image; the text is revealed on hover/focus.
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'cards-peekaboo-tile';
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) {
        div.className = 'cards-peekaboo-tile-image';
      } else {
        div.className = 'cards-peekaboo-tile-body';
        const title = div.querySelector('h1, h2, h3, h4, h5, h6') || div.firstElementChild;
        if (title) title.classList.add('cards-peekaboo-tile-title');
        [...div.children]
          .filter((el) => el !== title)
          .forEach((el) => el.classList.add('cards-peekaboo-tile-text'));
      }
    });
    // keyboard users can reveal the text too
    if (!li.querySelector('a')) li.tabIndex = 0;
    ul.append(li);
  });
  optimizeImages(ul);
  block.replaceChildren(ul);
}
