/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-news-list (.newslist).
 * One row per item (single cell): linked title heading + meta line
 * "*tag* | date | read time". A trailing "See all" button is kept as
 * default content after the block.
 */
export default function parse(element, { document }) {
  const cells = [];
  // Anchor on the title of each item; the card wrapper is the nearest container.
  const titles = [...element.querySelectorAll('.cmp-filterable-list__card-title')];

  titles.forEach((titleEl) => {
    const card = titleEl.closest('.cmp-filterable-list__card') || titleEl.closest('a') || titleEl.parentElement;
    const linkEl = titleEl.closest('a[href]') || card.querySelector('a[href]');
    const href = linkEl ? linkEl.getAttribute('href') : '';
    const content = [];

    if (titleEl) {
      const tag = /^H[1-6]$/.test(titleEl.tagName) ? titleEl.tagName.toLowerCase() : 'h3';
      const h = document.createElement(tag);
      const title = titleEl.textContent.replace(/\s+/g, ' ').trim();
      if (href) {
        const a = document.createElement('a');
        a.href = href;
        a.textContent = title;
        h.append(a);
      } else {
        h.textContent = title;
      }
      content.push(h);
    }

    const clean = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');
    const tagText = clean(card.querySelector('.cmp-filterable-list__card-meta--tag'));
    const dateText = clean(card.querySelector('.cmp-filterable-list__card-meta--date'));
    const readText = clean(card.querySelector('.cmp-filterable-list__card-meta--time-to-read'));

    if (tagText || dateText || readText) {
      const p = document.createElement('p');
      const parts = [];
      if (tagText) {
        const em = document.createElement('em');
        em.textContent = tagText;
        parts.push(em);
      }
      if (dateText) parts.push(document.createTextNode(dateText));
      if (readText) parts.push(document.createTextNode(readText));
      parts.forEach((part, i) => {
        if (i > 0) p.append(document.createTextNode(' | '));
        p.append(part);
      });
      content.push(p);
    }

    if (content.length) cells.push([content]);
  });

  // "See all" link below the list
  const seeAll = element.querySelector('.cmp-filterable-list__buttons-wrapper a[href]');
  let after = null;
  if (seeAll && seeAll.textContent.trim()) {
    after = document.createElement('p');
    const a = document.createElement('a');
    a.href = seeAll.getAttribute('href');
    a.textContent = seeAll.textContent.trim();
    after.append(a);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-news-list', cells });
  element.replaceWith(block);
  if (after) block.after(after);
}
