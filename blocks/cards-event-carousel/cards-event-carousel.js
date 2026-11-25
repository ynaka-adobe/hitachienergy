import { createOptimizedPicture } from '../../scripts/aem.js';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December'];
// dd.mm.yyyy (optionally followed by " - dd.mm.yyyy")
const DATE_RANGE = /^\s*(\d{1,2})\.(\d{1,2})\.(\d{4})(\s*[-–]\s*\d{1,2}\.\d{1,2}\.\d{4})?\s*$/;
// number of cards kept to the left of the active one (loop carousel)
const MAX_BEFORE = 2;
const SWIPE_THRESHOLD = 40;

function optimizeImages(root) {
  root.querySelectorAll('picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]));
  });
}

/**
 * Calendar pictogram: start date of the event, stacked when the event spans
 * several days, or an "on demand" card when the event has no date.
 */
function buildBadge(match) {
  const badge = document.createElement('div');
  badge.className = 'cards-event-carousel-badge';
  badge.setAttribute('aria-hidden', 'true');
  if (!match) {
    badge.classList.add('cards-event-carousel-badge-ondemand');
    const span = document.createElement('span');
    span.className = 'cards-event-carousel-badge-label';
    span.textContent = 'on demand';
    badge.append(span);
    return badge;
  }
  const [, day, month, year, range] = match;
  if (range) badge.classList.add('cards-event-carousel-badge-multiple');
  [['month', MONTHS[Number(month) - 1] || month], ['day', day], ['year', year]].forEach(([k, v]) => {
    const span = document.createElement('span');
    span.className = `cards-event-carousel-badge-${k}`;
    span.textContent = v;
    badge.append(span);
  });
  return badge;
}

function decorateCard(row) {
  const li = document.createElement('li');
  li.className = 'cards-event-carousel-card';
  while (row.firstElementChild) li.append(row.firstElementChild);

  let media;
  let body;
  [...li.children].forEach((div) => {
    if (!media && div.querySelector('picture')) {
      div.className = 'cards-event-carousel-card-image';
      media = div;
    } else {
      div.className = 'cards-event-carousel-card-body';
      body = body || div;
    }
  });

  // overlay on the image: calendar badge (top) and location (bottom)
  let overlay;
  if (media) {
    overlay = document.createElement('div');
    overlay.className = 'cards-event-carousel-overlay';
    // any text next to the picture is the location (it may end up nested in the picture's <p>)
    [...media.querySelectorAll('p')]
      .filter((p) => !p.querySelector('picture') && p.textContent.trim())
      .forEach((p) => {
        p.className = 'cards-event-carousel-location';
        overlay.append(p);
      });
    media.append(overlay);
  }

  if (body) {
    const title = body.querySelector('h1, h2, h3, h4, h5, h6');
    if (title) title.classList.add('cards-event-carousel-title');
    let dateMatch;
    let dates;
    [...body.querySelectorAll(':scope > p')].forEach((p) => {
      const m = p.textContent.match(DATE_RANGE);
      if (m && !dateMatch) {
        dateMatch = m;
        dates = p;
        p.classList.add('cards-event-carousel-dates');
      } else if (p.querySelector('a') && p.textContent.trim() === p.querySelector('a').textContent.trim()) {
        p.classList.add('cards-event-carousel-cta');
      } else if (!p.className) {
        p.classList.add('cards-event-carousel-description');
      }
    });
    const link = (title && title.querySelector('a')) || body.querySelector('a');
    if (link) {
      link.classList.add('cards-event-carousel-link');
      link.classList.remove('button');
    }

    // footer row: date range + read-more arrow
    const info = document.createElement('div');
    info.className = 'cards-event-carousel-info';
    if (dates) info.append(dates);
    const arrow = document.createElement('span');
    arrow.className = 'cards-event-carousel-arrow';
    arrow.setAttribute('aria-hidden', 'true');
    info.append(arrow);
    body.append(info);

    if (overlay) overlay.prepend(buildBadge(dateMatch));
  }
  return li;
}

/**
 * Event carousel: one row per event, [image (+ optional location) | title,
 * description, date range "dd.mm.yyyy - dd.mm.yyyy", link]. The start date is
 * rendered as a calendar badge on the image. Like the source (splide, loop
 * mode) the active card is centred with its neighbours peeking in, and the
 * prev/next buttons wrap around with a "current/total" counter.
 */
export default function decorate(block) {
  const track = document.createElement('ul');
  track.className = 'cards-event-carousel-track';
  [...block.children].forEach((row) => track.append(decorateCard(row)));
  optimizeImages(track);

  const viewport = document.createElement('div');
  viewport.className = 'cards-event-carousel-viewport';
  viewport.append(track);

  const cards = [...track.children];
  const n = cards.length;
  const before = Math.min(MAX_BEFORE, Math.floor((n - 1) / 2));

  const nav = document.createElement('div');
  nav.className = 'cards-event-carousel-nav';
  const prev = document.createElement('button');
  prev.type = 'button';
  prev.className = 'cards-event-carousel-prev';
  prev.setAttribute('aria-label', 'Previous event');
  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'cards-event-carousel-next';
  next.setAttribute('aria-label', 'Next event');
  const counter = document.createElement('span');
  counter.className = 'cards-event-carousel-counter';
  counter.setAttribute('aria-live', 'polite');
  nav.append(prev, counter, next);

  let current = 0;

  const step = () => {
    const card = cards[current];
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    return card.offsetWidth + gap;
  };

  // translate so the active card (always at flex position `before`) is centred
  const baseOffset = () => {
    const card = cards[current];
    const pad = parseFloat(getComputedStyle(viewport).paddingLeft) || 0;
    return (viewport.clientWidth - card.offsetWidth) / 2 - pad - before * step();
  };

  const setOffset = (x, animate) => {
    track.classList.toggle('is-animating', animate);
    track.style.transform = `translateX(${x}px)`;
  };

  const render = () => {
    cards.forEach((c, i) => {
      const active = i === current;
      c.style.order = (i - current + before + n) % n;
      c.classList.toggle('active', active);
      c.setAttribute('aria-hidden', active ? 'false' : 'true');
      c.querySelectorAll('a').forEach((a) => {
        if (active) a.removeAttribute('tabindex');
        else a.setAttribute('tabindex', '-1');
      });
    });
    counter.textContent = `${current + 1}/${n}`;
  };

  const goTo = (i, delta = 0) => {
    current = ((i % n) + n) % n;
    render();
    if (Math.abs(delta) === 1) {
      // keep the previous visual position, then slide to the new one
      setOffset(baseOffset() + delta * step(), false);
      // eslint-disable-next-line no-unused-expressions
      track.offsetWidth; // force reflow before animating
      setOffset(baseOffset(), true);
    } else {
      setOffset(baseOffset(), false);
    }
  };

  prev.addEventListener('click', () => goTo(current - 1, -1));
  next.addEventListener('click', () => goTo(current + 1, 1));

  // swipe / drag support
  let startX = null;
  let dragged = false;
  viewport.addEventListener('pointerdown', (e) => {
    startX = e.clientX;
    dragged = false;
  });
  viewport.addEventListener('pointerup', (e) => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    startX = null;
    if (Math.abs(dx) > SWIPE_THRESHOLD) {
      dragged = true;
      if (dx < 0) goTo(current + 1, 1);
      else goTo(current - 1, -1);
    }
  });
  viewport.addEventListener('pointercancel', () => { startX = null; });
  viewport.addEventListener('click', (e) => {
    if (dragged) {
      e.preventDefault();
      dragged = false;
    }
  }, true);

  block.replaceChildren(viewport);
  if (n > 1) block.append(nav);
  render();

  // position once laid out and whenever the width changes
  const relayout = () => setOffset(baseOffset(), false);
  if (window.ResizeObserver) new ResizeObserver(relayout).observe(viewport);
  else window.addEventListener('resize', relayout);
  requestAnimationFrame(relayout);
}
