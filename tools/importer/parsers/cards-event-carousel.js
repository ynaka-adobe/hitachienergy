/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-event-carousel (.carousel.eventList).
 * Items are rendered client-side into a Splide carousel; loop clones
 * (.splide__slide--clone) are skipped so each event appears once.
 * One row per event: [image + location | linked title, description, date range].
 * Date range is written as "dd.mm.yyyy - dd.mm.yyyy".
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
            src = data.pattern.replace('{{width}}', 780).replace('{{height}}', 439);
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

function formatDates(text) {
  const dates = text.match(/\d{1,2}\.\d{1,2}\.\d{4}/g);
  if (!dates) return text;
  const pad = (d) => d.split('.').map((p, i) => (i < 2 ? p.padStart(2, '0') : p)).join('.');
  if (dates.length >= 2 && dates[0] !== dates[1]) return `${pad(dates[0])} - ${pad(dates[1])}`;
  return pad(dates[0]);
}

export default function parse(element, { document }) {
  const cells = [];

  const slides = [...element.querySelectorAll('.splide__slide:not(.splide__slide--clone)')];
  let cards = slides.map((s) => s.querySelector('.cmp-filterable-list__card')).filter(Boolean);
  if (!cards.length) {
    cards = [...element.querySelectorAll('.cmp-filterable-list__card')]
      .filter((c) => !c.closest('.splide__slide--clone'));
  }

  cards.forEach((card) => {
    // media cell: image + location
    const media = [];
    const imgScope = card.querySelector('.cmp-filterable-list__card-image-wrapper, .cmp-filterable-list__card-image') || card;
    const image = resolveImage(imgScope, document);
    if (image) media.push(image);
    const loc = card.querySelector('.cmp-filterable-list__card-event-location');
    if (loc) {
      const parts = [...loc.querySelectorAll('span')].map(clean).filter(Boolean);
      const locText = parts.length ? parts.join(', ') : clean(loc);
      if (locText) {
        const p = document.createElement('p');
        p.textContent = locText;
        media.push(p);
      }
    }

    // body cell
    const body = [];
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
    const date = clean(card.querySelector('.cmp-filterable-list__card-meta--date'));
    if (date) {
      const p = document.createElement('p');
      p.textContent = formatDates(date);
      body.push(p);
    }

    if (body.length || media.length) cells.push([media.length ? media : '', body]);
  });

  // "All events" link from the carousel header, kept as default content
  const allEvents = element.querySelector('.cmp-carousel__header a[href]');
  let after = null;
  if (allEvents && clean(allEvents)) {
    after = document.createElement('p');
    const a = document.createElement('a');
    a.href = allEvents.getAttribute('href');
    a.textContent = clean(allEvents);
    after.append(a);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-event-carousel', cells });
  element.replaceWith(block);
  if (after) block.after(after);
}
