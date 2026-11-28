/*
 * Portal Panels: white cards on a grey band. Each row is one panel.
 * First cell = panel title; every other non-empty cell is a slide.
 * More than one slide renders a carousel with dot navigation.
 * A slide whose heading is a link renders as an article tile
 * (image with dark overlay: <em> tag chip, title, date paragraph).
 */

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
  node.append(...children);
  return node;
}

function decorateSlide(cell) {
  const slide = el('div', { class: 'portal-panels-slide' }, ...cell.childNodes);
  const heading = slide.querySelector('h2, h3, h4, h5, h6');
  if (heading?.querySelector('a')) {
    slide.classList.add('portal-panels-article');
    const picture = slide.querySelector('picture');
    const overlay = el('div', { class: 'portal-panels-overlay' });
    [...slide.children].forEach((child) => {
      if (picture && child.contains(picture)) return;
      overlay.append(child);
    });
    const tag = overlay.querySelector('em');
    if (tag) {
      tag.closest('p')?.classList.add('portal-panels-tag');
    }
    slide.append(overlay);
  }
  return slide;
}

let carouselId = 0;

function buildCarousel(slides, title) {
  carouselId += 1;
  const id = `portal-panels-track-${carouselId}`;
  const track = el('div', { class: 'portal-panels-track', id }, ...slides);
  slides.forEach((s, i) => {
    s.setAttribute('role', 'group');
    s.setAttribute('aria-roledescription', 'slide');
    s.setAttribute('aria-label', `${i + 1} of ${slides.length}`);
  });
  const dots = slides.map((s, i) => {
    const b = el('button', {
      type: 'button',
      'aria-controls': id,
      'aria-label': `Show slide ${i + 1}`,
    });
    b.addEventListener('click', () => {
      track.scrollTo({ left: s.offsetLeft - track.offsetLeft, behavior: 'smooth' });
    });
    return b;
  });
  const setActive = (index) => dots.forEach((d, i) => {
    d.setAttribute('aria-current', String(i === index));
  });
  setActive(0);
  track.addEventListener('scroll', () => {
    const index = Math.round(track.scrollLeft / (track.clientWidth || 1));
    setActive(Math.min(Math.max(index, 0), slides.length - 1));
  }, { passive: true });
  return el(
    'div',
    { class: 'portal-panels-carousel', 'aria-roledescription': 'carousel', 'aria-label': title },
    track,
    el('div', { class: 'portal-panels-dots' }, ...dots),
  );
}

export default function decorate(block) {
  const panels = [...block.children].map((row) => {
    const [titleCell, ...cells] = [...row.children];
    const title = titleCell?.textContent.trim() || '';
    const panel = el('section', { class: 'portal-panels-panel' });
    if (title) panel.append(el('h2', { class: 'portal-panels-title' }, title));
    const slides = cells.filter((c) => c.textContent.trim() || c.querySelector('picture'))
      .map(decorateSlide);
    if (slides.length > 1) {
      panel.classList.add('portal-panels-has-carousel');
      panel.append(buildCarousel(slides, title));
    } else if (slides.length) {
      panel.append(slides[0]);
    }
    return panel;
  });
  block.replaceChildren(...panels);
}
