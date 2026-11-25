/*
 * Footer block.
 * Reads the footer fragment (content/footer.plain.html) and renders each
 * top-level section as a full-width band with a centred content column.
 * All copy, links and images come from the fragment; this file only adds
 * layout classes and behaviour (back to top, new-tab external links).
 */

/**
 * Fetches the footer fragment. Metadata-independent dual fetch:
 * /content first (local preview), then the site root (DA / Edge Delivery).
 * @returns {Promise<{html: string, base: string}|null>}
 */
async function fetchFooter() {
  let resp = await fetch('/content/footer.plain.html');
  if (!resp.ok) resp = await fetch('/footer.plain.html');
  if (!resp.ok) return null;
  return { html: await resp.text(), base: resp.url };
}

function resolveImages(root, base) {
  root.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src');
    if (src && !/^(https?:)?\/\//.test(src) && !src.startsWith('/')) {
      img.src = new URL(src, base).pathname;
    }
    img.loading = 'lazy';
  });
}

function decorateLinks(root) {
  root.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href');
    if (href === '#' || a.classList.contains('footer-back-to-top')) {
      a.classList.add('footer-back-to-top');
      a.setAttribute('aria-label', a.querySelector('img')?.alt || 'Back to top');
      a.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      return;
    }
    const url = new URL(a.href, window.location.href);
    if (url.hostname !== window.location.hostname) {
      a.target = '_blank';
      a.rel = 'noopener';
    }
    const img = a.querySelector('img');
    if (img && !a.textContent.trim()) {
      a.setAttribute('aria-label', img.alt);
      img.alt = '';
    }
  });
}

/**
 * Tags lists: lists of image-only links become icon rows, others link lists.
 * @param {Element} section
 */
function decorateLists(section) {
  section.querySelectorAll('ul').forEach((ul) => {
    const items = [...ul.children];
    const iconsOnly = items.length > 0
      && items.every((li) => li.querySelector('img') && !li.textContent.trim());
    ul.classList.add(iconsOnly ? 'footer-icons' : 'footer-list');
  });
  // text links get their label wrapped so decorations can sit beside it
  section.querySelectorAll('a').forEach((a) => {
    if (a.querySelector('img') || !a.textContent.trim()) return;
    const label = document.createElement('span');
    label.className = 'footer-link-label';
    label.append(...a.childNodes);
    // keep the last word in its own non-wrapping span, so a trailing icon
    // (drawn after it) wraps together with that word
    const textNode = [...label.childNodes].reverse()
      .find((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
    if (textNode) {
      const text = textNode.textContent.replace(/\s+$/, '');
      const cut = text.lastIndexOf(' ') + 1;
      const tail = document.createElement('span');
      tail.className = 'footer-link-tail';
      tail.textContent = text.slice(cut);
      textNode.textContent = text.slice(0, cut);
      textNode.after(tail);
    }
    a.append(label);
  });
}

/**
 * Splits a section into a start group (headings / paragraphs / icon rows)
 * and an end group (trailing link list), so bands can align them apart.
 * @param {Element} inner
 */
function groupContent(inner) {
  const lists = [...inner.querySelectorAll(':scope > ul.footer-list')];
  const last = lists[lists.length - 1];
  const hasStart = [...inner.children].some((el) => el !== last);
  if (!last || !hasStart) return;
  const start = document.createElement('div');
  start.className = 'footer-start';
  [...inner.children].filter((el) => el !== last).forEach((el) => start.append(el));
  last.classList.add('footer-end');
  inner.prepend(start);
}

/**
 * @param {Element} block the footer block
 */
export default async function decorate(block) {
  const footer = await fetchFooter();
  block.textContent = '';
  if (!footer) return;

  const fragment = document.createElement('div');
  fragment.innerHTML = footer.html;
  resolveImages(fragment, footer.base);
  // a section holding nothing but one image link is the back-to-top button
  // (authoring tools may rewrite its "#" link to "/")
  [...fragment.children].forEach((section) => {
    const links = section.querySelectorAll('a');
    if (links.length === 1 && links[0].querySelector('img') && !section.textContent.trim()) {
      links[0].classList.add('footer-back-to-top');
    }
  });
  decorateLinks(fragment);

  const wrapper = document.createElement('div');
  wrapper.className = 'footer-wrapper';

  [...fragment.children].filter((el) => el.tagName === 'DIV').forEach((section, i) => {
    const band = document.createElement('div');
    band.className = `footer-band footer-band-${i + 1}`;
    if (section.querySelector('.footer-back-to-top') && !section.textContent.trim()) {
      band.classList.add('footer-band-top');
    }
    const inner = document.createElement('div');
    inner.className = 'footer-band-inner';
    decorateLists(section);
    // paragraphs holding a link vs plain text (e.g. copyright)
    section.querySelectorAll(':scope > p').forEach((p) => {
      p.classList.add(p.querySelector('a') ? 'footer-link-para' : 'footer-text');
    });
    inner.append(...section.childNodes);
    [...inner.childNodes].forEach((n) => {
      if (n.nodeType === Node.TEXT_NODE && !n.textContent.trim()) n.remove();
    });
    groupContent(inner);
    band.append(inner);
    wrapper.append(band);
  });

  block.append(wrapper);
}
