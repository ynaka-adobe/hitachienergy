/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns-media (.cmp-mediatext-large).
 * One row: [image | eyebrow paragraph, heading, paragraphs, CTA link].
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
            src = data.pattern.replace('{{width}}', 960).replace('{{height}}', 540);
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
  const media = element.querySelector('.cmp-mediatext-large__media') || element;
  const image = resolveImage(media, document);

  const content = element.querySelector('.cmp-mediatext-large__content') || element;
  const text = [];

  const preTitle = content.querySelector('.cmp-mediatext-large__content-pre-title');
  if (preTitle && preTitle.textContent.trim()) {
    const p = document.createElement('p');
    p.textContent = preTitle.textContent.trim();
    text.push(p);
  }

  const heading = content.querySelector('.cmp-mediatext-large__content-title h1, .cmp-mediatext-large__content-title h2, .cmp-mediatext-large__content-title h3, .cmp-mediatext-large__content-title h4, .cmp-mediatext-large__content-title h5, .cmp-mediatext-large__content-title h6');
  const titleWrap = content.querySelector('.cmp-mediatext-large__content-title');
  if (heading || (titleWrap && titleWrap.textContent.trim())) {
    const h = document.createElement('h2');
    h.textContent = (heading || titleWrap).textContent.trim();
    text.push(h);
  }

  const desc = content.querySelector('.cmp-mediatext-large__content-description');
  if (desc) {
    const paras = [...desc.querySelectorAll('p')];
    if (paras.length) {
      paras.forEach((p) => { if (p.textContent.trim()) text.push(p); });
    } else if (desc.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = desc.textContent.trim();
      text.push(p);
    }
  }

  const cta = content.querySelector('a.cmp-mediatext-large__content-link-button, .cmp-mediatext-large__content > a[href]');
  if (cta && cta.textContent.trim()) {
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.href = cta.getAttribute('href');
    a.textContent = cta.textContent.trim();
    p.append(a);
    text.push(p);
  }

  const cells = [[image || '', text]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-media', cells });
  element.replaceWith(block);
}
