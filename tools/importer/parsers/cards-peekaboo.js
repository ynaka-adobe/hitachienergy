/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-peekaboo (.cmp-peekaboo-video-teasers).
 * One row per tile: [image | title (h2) + text].
 */
function resolveImage(scope, document) {
  const img = scope.querySelector('picture img, img');
  let src = img ? (img.getAttribute('src') || '') : '';
  let alt = img ? (img.getAttribute('alt') || '') : '';
  if (!/^https?:/i.test(src)) {
    const source = img && img.closest('picture') && img.closest('picture').querySelector('source[srcset]');
    const fromSet = source ? source.getAttribute('srcset').split(',')[0].trim().split(/\s+/)[0] : '';
    if (/^https?:/i.test(fromSet)) {
      src = fromSet;
    } else {
      const holder = (img && img.closest('[data-image-src]')) || scope.querySelector('[data-image-src]');
      src = '';
      if (holder) {
        try {
          const data = JSON.parse(holder.getAttribute('data-image-src'));
          if (data && data.pattern) {
            const w = 480;
            const h = Math.round(w * ((data.originalHeight || 752) / (data.originalWidth || 480)));
            src = data.pattern.replace('{{width}}', w).replace('{{height}}', h);
            alt = alt || data.alt || '';
          }
        } catch (e) { /* ignore */ }
      }
    }
  }
  if (!src) return null;
  const out = document.createElement('img');
  out.src = src;
  out.alt = alt;
  return out;
}

export default function parse(element, { document }) {
  const cells = [];
  const tiles = [...element.querySelectorAll(':scope > .cmp-peekaboo-video-teaser')];
  const items = tiles.length ? tiles : [...element.querySelectorAll('.cmp-peekaboo-video-teaser')];

  items.forEach((tile) => {
    const imgWrap = tile.querySelector('.cmp-peekaboo-video-teaser__img') || tile;
    const image = resolveImage(imgWrap, document);

    const body = [];
    const title = tile.querySelector('.cmp-peekaboo-video-teaser__content--title');
    if (title) {
      const h = document.createElement(/^H[1-6]$/.test(title.tagName) ? title.tagName.toLowerCase() : 'h3');
      h.textContent = title.textContent.trim();
      body.push(h);
    }
    const text = tile.querySelector('.cmp-peekaboo-video-teaser__content--text');
    if (text && text.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = text.textContent.trim();
      body.push(p);
    }
    const link = tile.querySelector('a[href]');
    if (link && link.textContent.trim()) {
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.href = link.getAttribute('href');
      a.textContent = link.textContent.trim();
      p.append(a);
      body.push(p);
    }

    cells.push([image || '', body]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-peekaboo', cells });
  element.replaceWith(block);
}
