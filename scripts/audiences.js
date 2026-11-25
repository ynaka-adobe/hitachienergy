/**
 * Audiences for the experimentation plugin (plugins/experimentation).
 *
 * Authors add rows to a section's metadata table, in priority order:
 *   Audience: jp        | /fragments/hero-japan
 *   Audience: partners  | /fragments/hero-partners
 * and the plugin swaps the section for the first matching variant.
 *
 * Signals come from the xsc-demo-cug edge function on the custom domain:
 *  - /auth/me: Okta session (authenticated, groups) for the group audiences;
 *  - /auth/geo: CDN country for the region audiences (the Okta profile
 *    country is deliberately ignored: region means where the visitor is).
 * Group variants live under CUG-protected paths; the plugin fetches them
 * same-origin with the session cookie, and a 401/403 keeps the default.
 * Neither route exists on aem.page/aem.live/localhost, so only the simulation
 * params work there: ?audience=<name> (plugin) and ?country=<code> (this file).
 */

const NA_COUNTRIES = ['US', 'CA', 'MX'];
const SIGNAL_WAIT_MS = 600; // sections wait at most this long, then show default content
const ME_KEY = 'he.audience.me';
const ME_TTL_MS = 5 * 60 * 1000;
const GEO_KEY = 'he.audience.geo';
const COUNTRY_KEY = 'he.audience.country.override';

const COUNTRY_NAMES = {
  'UNITED STATES': 'US', USA: 'US', CANADA: 'CA', MEXICO: 'MX', JAPAN: 'JP',
};

function read(key) {
  try { return JSON.parse(sessionStorage.getItem(key)); } catch { return null; }
}

function write(key, value) {
  try { sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
}

/** Sign in/out changes the session: header links call this before navigating. */
export function clearAudienceCache() {
  try { sessionStorage.removeItem(ME_KEY); } catch { /* ignore */ }
}

function withTimeout(promise) {
  return Promise.race([
    promise,
    new Promise((resolve) => { window.setTimeout(() => resolve(null), SIGNAL_WAIT_MS); }),
  ]);
}

async function getJson(path) {
  try {
    const resp = await fetch(path, { credentials: 'same-origin', cache: 'no-store' });
    if (!resp.ok || !resp.headers.get('content-type')?.includes('json')) return null;
    return await resp.json();
  } catch {
    return null;
  }
}

export function toCountryCode(value) {
  const v = String(value || '').trim().toUpperCase();
  if (/^[A-Z]{2}$/.test(v)) return v;
  return COUNTRY_NAMES[v] || null;
}

let mePromise;
/** Okta session, or { authenticated: false }. Cached briefly for this tab. */
function session() {
  if (!mePromise) {
    const cached = read(ME_KEY);
    mePromise = cached && Date.now() - cached.at < ME_TTL_MS
      ? Promise.resolve(cached.me)
      : withTimeout(getJson('/auth/me')).then((me) => {
        const value = me || { authenticated: false };
        if (me) write(ME_KEY, { at: Date.now(), me: value });
        return value;
      });
  }
  return mePromise;
}

let countryPromise;
/** ?country= override (remembered for the tab), else the CDN country. */
export function visitorCountry() {
  if (countryPromise) return countryPromise;
  const param = (new URLSearchParams(window.location.search).get('country') || '').toUpperCase();
  if (param === 'NONE') write(COUNTRY_KEY, null);
  else if (toCountryCode(param)) write(COUNTRY_KEY, toCountryCode(param));
  const override = read(COUNTRY_KEY);
  if (override) {
    countryPromise = Promise.resolve(override);
    return countryPromise;
  }
  countryPromise = (async () => {
    let geo = read(GEO_KEY);
    if (!geo) {
      geo = await withTimeout(getJson('/auth/geo'));
      if (geo) write(GEO_KEY, { countryCode: geo.countryCode || '' });
    }
    return toCountryCode(geo?.countryCode);
  })();
  return countryPromise;
}

async function inGroup(name) {
  const me = await session();
  return !!me?.authenticated && (me.groups || [])
    .some((g) => String(g).toLowerCase() === name);
}

export const AUDIENCES = {
  na: async () => NA_COUNTRIES.includes(await visitorCountry()),
  jp: async () => (await visitorCountry()) === 'JP',
  partners: () => inGroup('partners'),
  // signed-in users who are not partners
  employee: async () => !!(await session())?.authenticated && !(await inGroup('partners')),
};

/**
 * Some publish paths turn section-metadata rows into section attributes
 * ("Audience: jp" → data-audience:-jp="<url>"). The plugin reads
 * section-metadata blocks, so rebuild a temporary one from those attributes.
 */
function audienceNameFromAttribute(attribute) {
  const match = /^data-audience[:-]+([a-z0-9][a-z0-9-]*)$/i.exec(attribute);
  return match ? match[1].toLowerCase() : null;
}

function restoreAudienceBlocks(main) {
  main.querySelectorAll(':scope > div').forEach((section) => {
    const declared = section.getAttributeNames()
      .map((attribute) => [attribute, audienceNameFromAttribute(attribute)])
      .filter(([, name]) => name);
    if (!declared.length) return;
    const meta = document.createElement('div');
    meta.className = 'section-metadata';
    meta.dataset.synthetic = 'true';
    declared.forEach(([attribute, name]) => {
      const row = document.createElement('div');
      const key = document.createElement('div');
      key.textContent = `Audience ${name}`;
      const value = document.createElement('div');
      const link = document.createElement('a');
      link.href = section.getAttribute(attribute);
      link.textContent = link.href;
      value.append(link);
      row.append(key, value);
      meta.append(row);
    });
    section.append(meta);
  });
}

function hasAudienceRows(main) {
  return [...main.querySelectorAll('.section-metadata > div > div:first-child, .metadata > div > div:first-child')]
    .some((cell) => /^audience/i.test(cell.textContent.trim()));
}

/**
 * Runs the plugin only when the page declares audiences, before sections are
 * decorated so a swapped-in variant is decorated like any other content.
 * @param {HTMLElement} main
 */
export async function applyAudiences(main) {
  restoreAudienceBlocks(main);
  if (!hasAudienceRows(main)) return;
  try {
    // eslint-disable-next-line import/no-relative-packages
    const { loadEager } = await import('../plugins/experimentation/src/index.js');
    await loadEager(document, { audiences: AUDIENCES });
    // Sections that declare audiences but matched none keep their default content.
    main.querySelectorAll('.section-metadata').forEach((meta) => {
      const section = meta.parentElement;
      const declares = [...meta.querySelectorAll(':scope > div > div:first-child')]
        .some((cell) => /^audience/i.test(cell.textContent.trim()));
      if (declares && !section.dataset.audience) section.dataset.audience = 'default';
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('audiences: showing default content', e);
  } finally {
    main.querySelectorAll('.section-metadata[data-synthetic]').forEach((meta) => meta.remove());
  }
}
