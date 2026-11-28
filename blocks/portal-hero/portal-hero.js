/*
 * Portal Hero: signed-in dashboard header (greeting, search, quicklinks, notice).
 *
 * Authoring (one row per part, first cell is the key):
 * | Portal Hero |                      |                        |
 * | greeting    | Hi, {name}           | Welcome, partner       |
 * | search      | How can we help you? | search URL with {q}    |
 * | quicklinks  | Quicklinks           | list of links          |
 * | notice      | No notifications at this time                 |
 * {name} is the signed-in user's first name from /auth/me; otherwise the
 * fallback greeting is shown.
 */

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
  node.append(...children);
  return node;
}

async function fetchSession() {
  try {
    const resp = await fetch('/auth/me', { credentials: 'same-origin', cache: 'no-store' });
    if (!resp.ok || !resp.headers.get('content-type')?.includes('json')) return null;
    return await resp.json();
  } catch {
    return null;
  }
}

function firstName(user) {
  if (!user?.authenticated) return '';
  const name = (user.given_name || user.firstName || user.name || '').trim();
  if (name) return name.split(/\s+/)[0];
  return (user.email || '').split('@')[0];
}

function buildGreeting(cells) {
  const template = cells[0]?.textContent.trim() || 'Hi, {name}';
  const fallback = cells[1]?.textContent.trim() || 'Welcome';
  const h1 = el('h1', { class: 'portal-hero-greeting' }, fallback);
  fetchSession().then((user) => {
    const name = firstName(user);
    if (name) h1.textContent = template.replace('{name}', name);
  });
  return h1;
}

/** Links on the page (quicklinks, panels) offered as search suggestions. */
function collectLinks() {
  const seen = new Set();
  return [...document.querySelectorAll('main a[href]')]
    .filter((a) => !a.closest('.portal-hero-search'))
    .map((a) => ({ text: a.textContent.trim(), href: a.href }))
    .filter(({ text, href }) => {
      if (!text || seen.has(href)) return false;
      seen.add(href);
      return true;
    });
}

function buildSearch(cells) {
  const placeholder = cells[0]?.textContent.trim() || 'How can we help you?';
  const target = cells[1]?.querySelector('a')?.href || cells[1]?.textContent.trim() || '';
  const id = 'portal-search-input';
  const listId = 'portal-search-suggestions';
  const input = el('input', {
    type: 'search',
    id,
    name: 'q',
    placeholder,
    autocomplete: 'off',
    role: 'combobox',
    'aria-expanded': 'false',
    'aria-controls': listId,
    'aria-autocomplete': 'list',
  });
  const label = el('label', { for: id, class: 'portal-hero-sr-only' }, placeholder);
  const button = el('button', { type: 'submit', 'aria-label': 'Search' });
  const list = el('ul', { id: listId, class: 'portal-hero-suggestions', role: 'listbox' });
  list.hidden = true;
  const form = el('form', { class: 'portal-hero-search', role: 'search' }, label, input, button, list);

  let matches = [];
  const close = () => {
    list.hidden = true;
    input.setAttribute('aria-expanded', 'false');
  };
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    matches = q
      ? collectLinks().filter(({ text }) => text.toLowerCase().includes(q)).slice(0, 6)
      : [];
    list.replaceChildren(...matches.map(({ text, href }) => el(
      'li',
      { role: 'option' },
      el('a', { href }, text),
    )));
    list.hidden = !matches.length;
    input.setAttribute('aria-expanded', String(!list.hidden));
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
  form.addEventListener('focusout', (e) => {
    if (!form.contains(e.relatedTarget)) close();
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q) return;
    if (matches.length) {
      window.location.href = matches[0].href;
    } else if (target) {
      const encoded = encodeURIComponent(q);
      window.location.href = target.includes('{q}')
        ? target.replace('{q}', encoded)
        : `${target}${target.includes('?') ? '&' : '?'}q=${encoded}`;
    }
  });
  return form;
}

function buildQuicklinks(cells) {
  const title = cells[0]?.textContent.trim() || 'Quicklinks';
  const source = cells[1] || cells[0];
  const links = [...source.querySelectorAll('a')].map((a) => {
    a.className = 'portal-hero-pill';
    return el('li', {}, a);
  });
  return el(
    'nav',
    { class: 'portal-hero-quicklinks', 'aria-label': title },
    el('p', { class: 'portal-hero-quicklinks-title' }, title),
    el('ul', {}, ...links),
  );
}

function buildNotice(cell) {
  return el(
    'div',
    { class: 'portal-hero-notice', role: 'status' },
    el('span', { class: 'portal-hero-notice-icon', 'aria-hidden': 'true' }),
    el('div', { class: 'portal-hero-notice-text' }, ...cell.childNodes),
  );
}

export default function decorate(block) {
  const parts = {};
  [...block.children].forEach((row) => {
    const [key, ...cells] = [...row.children];
    parts[key.textContent.trim().toLowerCase()] = cells;
  });

  const inner = el('div', { class: 'portal-hero-inner' });
  if (parts.greeting) inner.append(buildGreeting(parts.greeting));
  if (parts.search) inner.append(buildSearch(parts.search));
  if (parts.quicklinks) inner.append(buildQuicklinks(parts.quicklinks));
  block.replaceChildren(el('div', { class: 'portal-hero-band' }, inner));
  const notice = parts.notice?.find((c) => c.textContent.trim());
  if (notice) block.append(buildNotice(notice));
}
