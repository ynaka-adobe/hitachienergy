/*
 * Header block.
 * Reads the nav fragment (content/nav.plain.html) and renders:
 *   - top bar: first section (brand/logo) + second section (tool links with icons)
 *   - site bar: remaining sections (site name link, optional nav lists)
 * All copy, links and images come from the fragment; this file only builds
 * layout and behaviour.
 */

const isDesktop = window.matchMedia('(width >= 900px)');

/**
 * Fetches the nav fragment. Metadata-independent dual fetch:
 * /content first (local preview), then the site root (DA / Edge Delivery).
 * @returns {Promise<{html: string, base: string}|null>}
 */
async function fetchNav() {
  let resp = await fetch('/content/nav.plain.html');
  if (!resp.ok) resp = await fetch('/nav.plain.html');
  if (!resp.ok) return null;
  return { html: await resp.text(), base: resp.url };
}

/**
 * Resolves fragment-relative image paths against the fragment URL.
 * @param {Element} root fragment root
 * @param {string} base fragment URL
 */
function resolveImages(root, base) {
  root.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src');
    if (src && !/^(https?:)?\/\//.test(src) && !src.startsWith('/')) {
      img.src = new URL(src, base).pathname;
    }
    img.loading = 'eager';
  });
}

/**
 * Links to another host open in a new tab, like the source header.
 * @param {Element} root
 */
function decorateLinks(root) {
  root.querySelectorAll('a[href]').forEach((a) => {
    const url = new URL(a.href, window.location.href);
    if (url.hostname !== window.location.hostname) {
      a.target = '_blank';
      a.rel = 'noopener';
    }
  });
}

/**
 * Builds a list of links. Links holding an image + text become icon links.
 * @param {Element} section
 * @param {string} className
 * @returns {HTMLUListElement}
 */
function buildLinkList(section, className) {
  const list = document.createElement('ul');
  list.className = className;
  section.querySelectorAll('a').forEach((a) => {
    const li = document.createElement('li');
    const img = a.querySelector('img');
    if (img) {
      // the icon may arrive wrapped in a <picture> (Edge Delivery media)
      const icon = img.closest('picture') || img;
      img.classList.add('nav-icon');
      icon.setAttribute('aria-hidden', 'true');
      const label = document.createElement('span');
      label.className = 'nav-label';
      [...a.childNodes].filter((n) => n !== icon).forEach((n) => label.append(n));
      // DA may author the label as a sibling paragraph of the icon link
      const item = a.closest('li');
      if (!label.textContent.trim() && item?.querySelectorAll('a').length === 1) {
        label.textContent = item.textContent.trim();
      }
      a.append(label);
    }
    li.append(a);
    list.append(li);
  });
  return list;
}

/**
 * Reads the Okta session from the edge function (/auth/me).
 * Returns null where the function isn't routed (aem.page, aem.live, localhost).
 * @returns {Promise<object|null>}
 */
async function fetchSession() {
  try {
    const resp = await fetch('/auth/me', { credentials: 'same-origin', cache: 'no-store' });
    if (!resp.ok || !resp.headers.get('content-type')?.includes('json')) return null;
    return await resp.json();
  } catch {
    return null;
  }
}

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
  node.append(...children);
  return node;
}

function initials(user) {
  const source = (user.name || user.email || '?').trim();
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?';
}

/**
 * Profile flyout for a signed-in user: identity, profile fields, groups, Sign out.
 * Empty profile fields are left out.
 * @param {object} user /auth/me session
 * @param {Element} trigger the button that opens the panel
 * @returns {HTMLDivElement}
 */
function buildProfilePanel(user, trigger) {
  const panel = el(
    'div',
    { id: 'nav-profile-panel', class: 'nav-profile-panel', hidden: '' },
    el(
      'div',
      { class: 'nav-profile-identity' },
      el('span', { class: 'nav-avatar large', 'aria-hidden': 'true' }, initials(user)),
      el(
        'div',
        {},
        el('p', { class: 'nav-profile-name' }, user.name || 'Signed in'),
        user.email ? el('p', { class: 'nav-profile-email' }, user.email) : '',
      ),
    ),
  );

  const fields = [['City', user.city], ['State', user.state], ['Country', user.country], ['Company', user.company]]
    .filter(([, value]) => typeof value === 'string' && value.trim());
  if (fields.length) {
    const dl = el('dl', { class: 'nav-profile-fields' });
    fields.forEach(([term, value]) => dl.append(el('dt', {}, term), el('dd', {}, value.trim())));
    panel.append(el('p', { class: 'nav-profile-label' }, 'Profile'), dl);
  }

  const groups = el('ul', { class: 'nav-profile-groups', 'aria-label': 'Groups' });
  (Array.isArray(user.groups) ? user.groups : [])
    .filter(Boolean)
    .forEach((g) => groups.append(el('li', {}, g)));
  if (!groups.children.length) groups.append(el('li', { class: 'empty' }, 'No groups'));
  panel.append(el('p', { class: 'nav-profile-label' }, 'Groups'), groups);

  panel.append(el(
    'div',
    { class: 'nav-profile-links' },
    el('a', { href: '/auth/logout', class: 'nav-profile-signout' }, 'Sign out'),
  ));

  trigger.setAttribute('aria-haspopup', 'true');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-controls', panel.id);
  return panel;
}

/**
 * Okta sign-in control backed by the edge function's /auth/* routes.
 * Takes over an authored "Login"/"Sign in" tool link (keeping its icon) or
 * prepends a new item to the tools list. Signed in, it becomes a profile
 * flyout. Pages stay public either way.
 * @param {HTMLUListElement} list the tools list
 */
async function decorateAuth(list) {
  const authored = [...list.querySelectorAll('li')]
    .find((li) => /^(log ?in|sign ?in)$/i.test(li.textContent.trim()));
  const li = authored || document.createElement('li');
  const icon = li.querySelector('.nav-icon')?.closest('picture') || li.querySelector('.nav-icon');
  li.textContent = '';
  li.classList.add('nav-auth');

  const returnTo = `${window.location.pathname}${window.location.search}`;
  const link = el(
    'a',
    { class: 'nav-auth-button', href: `/auth/login?returnTo=${encodeURIComponent(returnTo)}` },
    ...(icon ? [icon] : []),
    el('span', { class: 'nav-label' }, 'Sign in'),
  );
  li.append(link);
  if (!authored) list.prepend(li);

  const user = await fetchSession();
  if (!user?.authenticated) return;

  const trigger = el(
    'button',
    { type: 'button', class: 'nav-auth-button nav-profile-trigger' },
    el('span', { class: 'nav-avatar', 'aria-hidden': 'true' }, initials(user)),
    el('span', { class: 'nav-label' }, user.name || user.email || 'Account'),
  );
  trigger.setAttribute('aria-label', `Account: ${user.name || user.email || 'signed in'}`);
  const panel = buildProfilePanel(user, trigger);
  link.replaceWith(trigger, panel);

  const setOpen = (open) => {
    trigger.setAttribute('aria-expanded', String(open));
    panel.hidden = !open;
  };
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    setOpen(panel.hidden);
  });
  document.addEventListener('click', (e) => {
    if (!li.contains(e.target)) setOpen(false);
  });
  li.addEventListener('keydown', (e) => {
    if (e.code === 'Escape' && !panel.hidden) {
      e.stopPropagation();
      setOpen(false);
      trigger.focus();
    }
  });
}

function toggleMenu(header, forceOpen) {
  const open = forceOpen ?? header.getAttribute('aria-expanded') !== 'true';
  header.setAttribute('aria-expanded', open ? 'true' : 'false');
  const button = header.querySelector('.nav-hamburger button');
  if (button) {
    button.setAttribute('aria-expanded', open ? 'true' : 'false');
    button.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  }
  document.body.style.overflowY = open && !isDesktop.matches ? 'hidden' : '';
}

/**
 * @param {Element} block the header block
 */
export default async function decorate(block) {
  const nav = await fetchNav();
  block.textContent = '';
  if (!nav) return;

  const fragment = document.createElement('div');
  fragment.innerHTML = nav.html;
  resolveImages(fragment, nav.base);
  decorateLinks(fragment);

  const sections = [...fragment.children].filter((child) => child.tagName === 'DIV');
  const [brandSection, toolsSection, ...barSections] = sections;

  const navEl = document.createElement('nav');
  navEl.id = 'nav';
  navEl.setAttribute('aria-label', 'Main navigation');

  // top bar: brand + tools
  const top = document.createElement('div');
  top.className = 'nav-top';
  const topInner = document.createElement('div');
  topInner.className = 'nav-top-inner';
  if (brandSection) {
    const brand = document.createElement('div');
    brand.className = 'nav-brand';
    const link = brandSection.querySelector('a');
    if (link) {
      const img = link.querySelector('img');
      if (img && !link.getAttribute('aria-label')) link.setAttribute('aria-label', img.alt || link.textContent.trim());
      brand.append(link);
    } else {
      brand.append(...brandSection.childNodes);
    }
    topInner.append(brand);
  }
  const tools = document.createElement('div');
  tools.className = 'nav-tools';
  const toolsList = toolsSection
    ? buildLinkList(toolsSection, 'nav-tools-list')
    : Object.assign(document.createElement('ul'), { className: 'nav-tools-list' });
  tools.append(toolsList);
  topInner.append(tools);
  decorateAuth(toolsList).catch((e) => {
    // eslint-disable-next-line no-console
    console.error('Okta sign-in control failed to load', e);
  });
  top.append(topInner);

  // site bar: site name + any further sections
  const bar = document.createElement('div');
  bar.className = 'nav-bar';
  const barInner = document.createElement('div');
  barInner.className = 'nav-bar-inner';
  barSections.forEach((section, i) => {
    const wrap = document.createElement('div');
    wrap.className = i === 0 ? 'nav-site' : 'nav-sections';
    if (i === 0) {
      const link = section.querySelector('a');
      wrap.append(link || section);
    } else {
      wrap.append(buildLinkList(section, 'nav-sections-list'));
    }
    barInner.append(wrap);
  });
  bar.append(barInner);

  navEl.append(top, bar);

  // hamburger (mobile only): reveals the tool links in a drawer
  const hamburger = document.createElement('div');
  hamburger.className = 'nav-hamburger';
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-expanded="false" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  topInner.append(hamburger);

  const wrapper = document.createElement('div');
  wrapper.className = 'nav-wrapper';
  wrapper.append(navEl);

  // skip link for keyboard users: jumps past the header to the main content
  const main = document.querySelector('main');
  if (main) {
    if (!main.id) main.id = 'main';
    main.tabIndex = -1;
    const skip = document.createElement('a');
    skip.className = 'nav-skip-link';
    skip.href = `#${main.id}`;
    skip.textContent = 'Skip to main content';
    block.append(skip);
  }
  block.append(wrapper);

  const header = block.closest('header') || block;
  hamburger.querySelector('button').addEventListener('click', () => toggleMenu(header));
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape' && header.getAttribute('aria-expanded') === 'true') {
      toggleMenu(header, false);
      hamburger.querySelector('button').focus();
    }
  });
  // crossing the breakpoint closes the mobile menu and resets the icon
  isDesktop.addEventListener('change', () => toggleMenu(header, false));
  toggleMenu(header, false);
}
