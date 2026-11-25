/* eslint-disable */
/* global WebImporter */

/**
 * Parser for hero-banner.
 * Instances:
 *  - .page-stagev2         : stage with background image, H1, subheading
 *  - .cmp-marketing-banner : image, H2 heading, text, CTA links
 * Target: row 1 = background image, row 2 = title + subheading + CTAs.
 */
export default function parse(element, { document }) {
  const cells = [];

  // Resolve the real Dynamic Media URL. Lazy images on the live page carry a
  // data: placeholder or blob: URL; the original is in the data-image-src pattern.
  const fromPattern = (holder) => {
    if (!holder) return null;
    try {
      const raw = holder.getAttribute('data-image-src') || holder.getAttribute('data-props:model-json');
      const data = JSON.parse(raw);
      if (!data || !data.pattern) return null;
      const crop = (data.pattern.match(/smartcrop=(\d+)-(\d+)/) || []);
      const w = 1920;
      const ratio = crop[1] ? (+crop[2] / +crop[1]) : ((data.originalHeight || 9) / (data.originalWidth || 16));
      const h = Math.round(w * ratio);
      return { src: data.pattern.replace('{{width}}', w).replace('{{height}}', h), alt: data.alt || '' };
    } catch (e) {
      return null;
    }
  };

  const pickImage = () => {
    const img = element.querySelector('.cmp-cta__image img, .cmp-marketing-banner-image img, picture img, img');
    let src = img ? (img.getAttribute('src') || '') : '';
    let alt = img ? (img.getAttribute('alt') || '') : '';
    if (!/^https?:/i.test(src)) {
      const srcset = img && img.closest('picture') && img.closest('picture').querySelector('source[srcset]');
      const fromSet = srcset ? srcset.getAttribute('srcset').split(',')[0].trim().split(/\s+/)[0] : '';
      if (/^https?:/i.test(fromSet)) {
        src = fromSet;
      } else {
        const holder = (img && img.closest('[data-image-src]')) || element.querySelector('[data-image-src], [data-props\\:model-json]');
        const resolved = fromPattern(holder);
        if (!resolved) return null;
        src = resolved.src;
        alt = alt || resolved.alt;
      }
    }
    if (!src) return null;
    const out = document.createElement('img');
    out.src = src;
    out.alt = alt;
    return out;
  };

  const image = pickImage();
  if (image) cells.push([image]);

  const content = [];

  const heading = element.querySelector('h1, h2, h3');
  if (heading) {
    const h = document.createElement(heading.tagName.toLowerCase());
    h.textContent = heading.textContent.trim();
    content.push(h);
  }

  // Subheading / description paragraphs
  const textRoot = element.querySelector('.cmp-banner-cta__text, .cmp-margeting-banner-content--text, .cmp-marketing-banner-content');
  const paras = textRoot ? [...textRoot.querySelectorAll('p')] : [];
  paras.forEach((p) => {
    const text = p.textContent.replace(/ /g, ' ').trim();
    if (!text) return;
    const np = document.createElement('p');
    np.textContent = text;
    content.push(np);
  });

  // CTA links (marketing banner buttons, or any CTA link in the stage)
  const ctaLinks = [...element.querySelectorAll('.cmp-marketing-banner-button a, .cmp-banner-cta__button a, a.cmp-button')];
  const seen = new Set();
  ctaLinks.forEach((a) => {
    if (seen.has(a)) return;
    seen.add(a);
    const text = a.textContent.trim();
    if (!text) return;
    const p = document.createElement('p');
    const link = document.createElement('a');
    link.href = a.getAttribute('href') || a.href;
    link.textContent = text;
    p.append(link);
    content.push(p);
  });

  if (content.length) cells.push([content]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-banner', cells });
  element.replaceWith(block);
}
