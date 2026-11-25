/*
 * Anchor nav: in-page links ("on this page").
 * Built automatically from a default-content list whose links all point to
 * anchors on the page (see buildAutoBlocks in scripts.js).
 * - desktop: horizontal bar of links
 * - mobile: a dropdown showing the current section, expanding to all links
 * - both: sticks under the fixed header once scrolled past, and tracks the
 *   section in view
 */

function headerHeight() {
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 0;
}

/**
 * @param {Element} block the anchor-nav block
 */
export default function decorate(block) {
  const list = block.querySelector('ul');
  if (!list) return;
  const links = [...list.querySelectorAll('a[href^="#"]')];
  if (!links.length) return;

  const listId = `anchor-nav-list-${Math.random().toString(36).slice(2, 8)}`;
  list.id = listId;
  list.className = 'anchor-nav-list';

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'anchor-nav-toggle';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', listId);
  const current = document.createElement('span');
  current.className = 'anchor-nav-current';
  const icon = document.createElement('span');
  icon.className = 'anchor-nav-icon';
  icon.setAttribute('aria-hidden', 'true');
  toggle.append(current, icon);

  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'On this page');
  nav.append(toggle, list);

  const bar = document.createElement('div');
  bar.className = 'anchor-nav-bar';
  bar.append(nav);
  block.textContent = '';
  block.append(bar);

  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    block.classList.toggle('is-open', open);
  };
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  links.forEach((a) => a.addEventListener('click', () => setOpen(false)));
  nav.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      toggle.focus();
    }
  });

  // section tracking: the label shows the section in view
  const targets = links
    .map((a) => ({ a, el: document.getElementById(decodeURIComponent(a.hash.slice(1))) }))
    .filter(({ el }) => el);
  // the label falls back to the first link; a link is only marked current
  // once its section has been scrolled into view
  const setCurrent = (link, inView) => {
    links.forEach((l) => l.removeAttribute('aria-current'));
    if (inView) link.setAttribute('aria-current', 'location');
    current.textContent = link.textContent.trim();
  };
  setCurrent(links[0], false);

  let placeholderHeight = 0;
  let closedHeight = 0;
  const update = () => {
    // not laid out yet (section still hidden while the page loads)
    if (!block.isConnected || !block.offsetParent) return;
    const offset = headerHeight();
    // sticky: fix the bar under the header once its slot scrolls past it
    const slotTop = block.getBoundingClientRect().top;
    const stuck = slotTop < offset;
    if (stuck && !bar.classList.contains('is-stuck')) {
      placeholderHeight = bar.offsetHeight;
      block.style.minHeight = `${placeholderHeight}px`;
      bar.classList.add('is-stuck');
    } else if (!stuck && bar.classList.contains('is-stuck')) {
      bar.classList.remove('is-stuck');
      block.style.minHeight = '';
    }
    // targets land below the header and the (closed) bar
    if (!block.classList.contains('is-open')) closedHeight = bar.offsetHeight;
    const line = offset + closedHeight + 8;
    targets.forEach(({ el }) => { el.style.scrollMarginTop = `${line + 8}px`; });
    // sections still loading (hidden) report a zero-size box: skip them
    const inView = targets.filter(({ el }) => {
      const r = el.getBoundingClientRect();
      return r.height > 0 && r.top <= line + 16;
    }).pop();
    setCurrent(inView ? inView.a : links[0], Boolean(inView));
  };

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      update();
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  // re-check once the section becomes visible and whenever the layout shifts
  new ResizeObserver(onScroll).observe(block);
  update();
}
