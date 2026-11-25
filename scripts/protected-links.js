/**
 * Adds a lock icon after links to pages under Page Access (CUG/ABAC) rules.
 * The Page Access tool publishes the restricted URL patterns (paths only, no
 * rules) to /protected-paths.json.
 */

const SOURCE = '/protected-paths.json';
const CACHE_KEY = 'protected-paths';
const SCOPE = 'header, nav, main, footer';
const ICON_CLASS = 'restricted-icon';
const LOCK_SVG = '<svg viewBox="0 0 16 16" width="1em" height="1em" fill="currentColor" focusable="false" aria-hidden="true"><path d="M8 1a3.5 3.5 0 0 0-3.5 3.5V7H4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1h-.5V4.5A3.5 3.5 0 0 0 8 1Zm-2 6V4.5a2 2 0 1 1 4 0V7H6Z"/></svg>';

/** Same shape the Page Access tool saves (see normalisePath in tools/cug/rules.js). */
function normalise(value) {
  let p = String(value || '').trim();
  if (!p) return '';
  if (!p.startsWith('/')) p = `/${p}`;
  return p.replace(/\/{2,}/g, '/').replace(/\.html$/, '');
}

/** `**` matches any depth (including the folder itself), `*` one segment. */
export function patternToRegExp(pattern) {
  const p = normalise(pattern);
  if (!p) return null;
  const escape = (s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
  let source = p.split('**').map((part) => part.split('*').map(escape).join('[^/]*')).join('.*');
  // `/partners/**` also covers `/partners` and `/partners/`.
  source = source.replace(/\/\.\*$/, '(?:/.*)?');
  return new RegExp(`^${source}/?$`);
}

async function loadPatterns() {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) return JSON.parse(cached);
  } catch { /* storage unavailable */ }
  let paths = [];
  try {
    const resp = await fetch(SOURCE);
    if (resp.ok) {
      const json = await resp.json();
      paths = (json.data || []).map((row) => row.path).filter(Boolean);
    }
  } catch { /* fail silently */ }
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(paths)); } catch { /* ignore */ }
  return paths;
}

function decorate(root, matchers) {
  root.querySelectorAll('a[href]').forEach((a) => {
    if (a.querySelector(`.${ICON_CLASS}`)) return;
    let url;
    try { url = new URL(a.href, window.location.href); } catch { return; }
    if (url.origin !== window.location.origin) return;
    const path = normalise(decodeURIComponent(url.pathname));
    if (!matchers.some((re) => re.test(path))) return;
    const icon = document.createElement('span');
    icon.className = ICON_CLASS;
    icon.setAttribute('role', 'img');
    icon.setAttribute('aria-label', 'Restricted');
    icon.title = 'Restricted';
    icon.innerHTML = LOCK_SVG;
    a.append(icon);
  });
}

export default async function decorateProtectedLinks() {
  const matchers = (await loadPatterns()).map(patternToRegExp).filter(Boolean);
  if (!matchers.length) return;
  const run = () => document.querySelectorAll(SCOPE).forEach((el) => decorate(el, matchers));
  run();
  // Header, fragments and auto-blocks such as anchor-nav can render later.
  let queued = false;
  new MutationObserver(() => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; run(); });
  }).observe(document.body, { childList: true, subtree: true });
}
