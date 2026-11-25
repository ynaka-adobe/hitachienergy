/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-promo (.filterablelist.eventlist) - on-demand webinar teasers
 * rendered client-side. One row per card:
 * [image | tags, linked title, description, CTA].
 * The "See all" button is kept as default content after the block.
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

const clean = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');

export default function parse(element, { document }) {
  const cells = [];
  const cards = [...element.querySelectorAll('.cmp-filterable-list__card')];

  cards.forEach((card) => {
    const imgScope = card.querySelector('.cmp-filterable-list__card-image') || card;
    const image = resolveImage(imgScope, document);

    const body = [];
    const tags = [...card.querySelectorAll('.cmp-filterable-list__card-tags--item')].map(clean).filter(Boolean);
    if (tags.length) {
      const p = document.createElement('p');
      p.textContent = tags.join(' | ');
      body.push(p);
    }

    const linkEl = card.querySelector('a.cmp-filterable-list__card-link') || card.querySelector('a[href]');
    const href = linkEl ? linkEl.getAttribute('href') : '';
    const titleEl = card.querySelector('.cmp-filterable-list__card-title');
    if (titleEl) {
      const h = document.createElement('h3');
      const title = clean(titleEl);
      if (href) {
        const a = document.createElement('a');
        a.href = href;
        a.textContent = title;
        h.append(a);
      } else {
        h.textContent = title;
      }
      body.push(h);
    }

    const desc = clean(card.querySelector('.cmp-filterable-list__card-description'));
    if (desc) {
      const p = document.createElement('p');
      p.textContent = desc;
      body.push(p);
    }

    // CTA label comes from the read-more icon's aria-label (e.g. "Watch now")
    const readMore = card.querySelector('.cmp-filterable-list__card-read-more--icon[aria-label], .cmp-filterable-list__card-read-more [aria-label]');
    const ctaLabel = readMore ? readMore.getAttribute('aria-label').trim() : '';
    if (href && ctaLabel) {
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.href = href;
      a.textContent = ctaLabel;
      p.append(a);
      body.push(p);
    }

    if (body.length || image) cells.push([image || '', body]);
  });

  const seeAll = element.querySelector('.cmp-filterable-list__buttons-wrapper a[href]');
  let after = null;
  if (seeAll && clean(seeAll)) {
    after = document.createElement('p');
    const a = document.createElement('a');
    a.href = seeAll.getAttribute('href');
    a.textContent = clean(seeAll);
    after.append(a);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-promo', cells });
  element.replaceWith(block);
  if (after) block.after(after);
}
