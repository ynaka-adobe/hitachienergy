import { getMetadata } from './aem.js';

const LOCALES = ['en', 'jp'];

/**
 * Returns the current locale folder (e.g. "en") or '' when the page is not in one.
 * @returns {string}
 */
export function getLocale() {
  const first = window.location.pathname.split('/')[1];
  return LOCALES.includes(first) ? first : '';
}

/**
 * Fetches a site fragment (nav, footer) as .plain.html.
 * Order: page metadata path, then /<locale>/<name>, then /forms/nav (nav on /forms/ pages),
 * then /<name>.
 * @param {string} name fragment name, also the metadata key
 * @returns {Promise<{html: string, base: string}|null>}
 */
export async function fetchSiteFragment(name) {
  const candidates = [];
  const meta = getMetadata(name);
  if (meta) {
    try {
      candidates.push(new URL(meta, window.location).pathname);
    } catch { /* ignore malformed metadata */ }
  }
  const locale = getLocale();
  if (locale) candidates.push(`/${locale}/${name}`);
  if (name === 'nav' && window.location.pathname.startsWith('/forms/')) candidates.push('/forms/nav');
  candidates.push(`/${name}`);

  const paths = [...new Set(candidates.map((p) => p.replace(/(\.plain)?\.html$/, '')))];
  return paths.reduce(async (prev, path) => {
    const found = await prev;
    if (found) return found;
    const resp = await fetch(`${path}.plain.html`);
    return resp.ok ? { html: await resp.text(), base: resp.url } : null;
  }, Promise.resolve(null));
}

const LANGS = { en: 'en', jp: 'ja' };

/**
 * Returns the page language: `lang` metadata, else the locale folder's language, else "en".
 * @returns {string}
 */
export function getLanguage() {
  return getMetadata('lang') || LANGS[getLocale()] || 'en';
}
