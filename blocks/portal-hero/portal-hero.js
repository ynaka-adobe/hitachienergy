/*
 * Portal Hero: signed-in dashboard header (greeting, search, quicklinks, notice).
 *
 * Authoring (one row per part, first cell is the key):
 * | Portal Hero |                      |                        |
 * | greeting    | Hi, {name}           | Welcome, partner       |
 * | search      | How can we help you? | search URL with {q}    |
 * | prompts     | Try asking           | list of questions      |
 * | quicklinks  | Quicklinks           | list of links          |
 * | notice      | No notifications at this time                 |
 * {name} is the signed-in user's first name from /auth/me; otherwise the
 * fallback greeting is shown.
 *
 * Chat mode: when page metadata `chatbot-script` is set to the Guides
 * Knowledge AI widget loader URL (…/flameback-widget-loader.js?apiKey=…), the
 * search row becomes a chat box that asks the widget via `fb-widget-ask`. The
 * key lives in DA metadata, not in code. Optional `chatbot-theme` sets
 * data-fb-theme. The search row's third cell is the disclaimer.
 *
 * Prompts render as suggested-question chips under the search/chat box;
 * clicking one fills the box and submits it. In chat mode the chips come from
 * live Knowledge AI suggestions (GET /kai/suggestions, proxied by the edge
 * function); the authored prompts are the fallback. Quicklinks render in a light
 * strip below the dark band so they don't read as prompts.
 */
import { getMetadata } from '../../scripts/aem.js';

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

let widgetPromise;
/** Loads the widget loader once; resolves when its iframe reports fb-ready. */
function loadChatWidget(src) {
  if (!widgetPromise) {
    widgetPromise = new Promise((resolve, reject) => {
      const { origin } = new URL(src, window.location.href);
      const timer = setTimeout(() => reject(new Error('chat widget timeout')), 15000);
      window.addEventListener('message', (e) => {
        if (e.origin !== origin || !e.data || typeof e.data !== 'object') return;
        if (e.data.type === 'fb-ready') {
          clearTimeout(timer);
          resolve();
        } else if (e.data.type === 'fb-denied') {
          clearTimeout(timer);
          reject(new Error('chat widget denied'));
        }
      });
      const script = el('script', { src });
      const theme = getMetadata('chatbot-theme');
      if (theme) script.dataset.fbTheme = theme;
      script.onerror = () => {
        clearTimeout(timer);
        reject(new Error('chat widget failed to load'));
      };
      document.body.append(script);
    });
  }
  return widgetPromise;
}

function buildChat(cells, src) {
  const placeholder = cells[0]?.textContent.trim() || 'Ask me anything';
  const disclaimer = cells[2]?.textContent.trim()
    ? [...cells[2].childNodes]
    : ['Be sure to double-check responses as they may be inaccurate.'];
  const id = 'portal-chat-input';
  const input = el('textarea', {
    id, name: 'question', rows: '2', placeholder,
  });
  const label = el('label', { for: id, class: 'portal-hero-sr-only' }, placeholder);
  const button = el('button', { type: 'submit', 'aria-label': 'Send', disabled: '' });
  const status = el('p', { class: 'portal-hero-sr-only', role: 'status' });
  const form = el(
    'form',
    { class: 'portal-hero-search portal-hero-chat' },
    label,
    input,
    button,
    status,
  );

  const warm = () => loadChatWidget(src).catch(() => {});
  input.addEventListener('focus', warm, { once: true });
  setTimeout(warm, 3000);
  input.addEventListener('input', () => {
    button.disabled = !input.value.trim();
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      form.requestSubmit();
    }
  });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const question = input.value.trim();
    if (!question) return;
    try {
      await loadChatWidget(src);
      document.dispatchEvent(new CustomEvent('fb-widget-ask', { detail: { question } }));
      input.value = '';
      button.disabled = true;
      status.textContent = '';
    } catch {
      status.textContent = 'The assistant is unavailable right now. Please try again later.';
      status.className = 'portal-hero-chat-error';
    }
  });
  return [form, el('p', { class: 'portal-hero-disclaimer' }, ...disclaimer)];
}

const MAX_PROMPTS = 4;

function dedupe(questions) {
  const seen = new Set();
  return questions.filter((q) => {
    const k = q.toLowerCase().replace(/[\s?.!。？！]+$/u, '').replace(/\s+/g, ' ').trim();
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  }).slice(0, MAX_PROMPTS);
}

/* Live Knowledge AI suggestions via the same-origin edge-function proxy. */
async function fetchSuggestions(chatSrc) {
  let apiKey;
  try {
    apiKey = new URL(chatSrc, window.location.href).searchParams.get('apiKey');
  } catch { /* invalid URL */ }
  if (!apiKey) return [];
  try {
    const resp = await fetch('/kai/suggestions?limit=5', {
      headers: { 'x-api-key': apiKey },
      cache: 'no-store',
      signal: AbortSignal.timeout(4000),
    });
    if (!resp.ok) return [];
    const json = await resp.json();
    return dedupe((json.suggestions || [])
      .map((s) => (typeof s === 'string' ? s : s?.question || '').trim()));
  } catch {
    return [];
  }
}

function renderChips(list, questions, form) {
  const field = form.querySelector('textarea, input');
  list.replaceChildren(...questions.map((question) => {
    const chip = el('button', { type: 'button', class: 'portal-hero-prompt' }, question);
    chip.addEventListener('click', () => {
      field.value = question;
      field.dispatchEvent(new Event('input'));
      form.requestSubmit();
    });
    return el('li', {}, chip);
  }));
}

/* Authored prompts are the fallback; live suggestions replace them when available. */
function buildPrompts(cells, form, chatSrc) {
  if (!form) return null;
  const title = cells?.[0]?.textContent.trim() || 'Try asking';
  const source = cells?.[1] || cells?.[0];
  const items = source
    ? [...source.querySelectorAll(source.querySelector('li') ? 'li' : 'p')]
    : [];
  const authored = dedupe(items.map((i) => i.textContent.trim()));
  if (!authored.length && !chatSrc) return null;
  const list = el('ul');
  const wrap = el(
    'div',
    { class: 'portal-hero-prompts' },
    el('p', { class: 'portal-hero-prompts-title' }, title),
    list,
  );
  if (!chatSrc) {
    renderChips(list, authored, form);
    return wrap;
  }
  wrap.classList.add('is-loading');
  wrap.setAttribute('aria-busy', 'true');
  fetchSuggestions(chatSrc).then((live) => {
    const questions = live.length ? live : authored;
    wrap.classList.remove('is-loading');
    wrap.removeAttribute('aria-busy');
    if (!questions.length) {
      wrap.remove();
      return;
    }
    wrap.dataset.source = live.length ? 'live' : 'authored';
    renderChips(list, questions, form);
  });
  return wrap;
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
  const chatSrc = getMetadata('chatbot-script');
  let form;
  if (parts.search) {
    if (chatSrc) {
      const chat = buildChat(parts.search, chatSrc);
      [form] = chat;
      inner.append(...chat);
    } else {
      form = buildSearch(parts.search);
      inner.append(form);
    }
  }
  const prompts = (parts.prompts || chatSrc)
    && buildPrompts(parts.prompts, form, chatSrc);
  if (prompts) inner.append(prompts);
  block.replaceChildren(el('div', { class: 'portal-hero-band' }, inner));
  if (parts.quicklinks) {
    block.append(el(
      'div',
      { class: 'portal-hero-links' },
      el('div', { class: 'portal-hero-links-inner' }, buildQuicklinks(parts.quicklinks)),
    ));
  }
  const notice = parts.notice?.find((c) => c.textContent.trim());
  if (notice) block.append(buildNotice(notice));
}
