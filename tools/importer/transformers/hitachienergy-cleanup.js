/* eslint-disable */
/* global WebImporter */

/**
 * Hitachi Energy Power Portal cleanup transformer.
 *
 * Removes non-authorable chrome: global header XF, footer XF, OneTrust consent
 * SDK, Terms & Conditions modal, spacers, empty button wrappers, lightbox
 * overlays, loading spinners and stray resource tags.
 *
 * NOTE: .carousel.eventList and .filterablelist.eventlist are intentionally
 * kept - their items are filled client-side and the parsers target them.
 */

function removeAll(root, selectors) {
  selectors.forEach((sel) => {
    root.querySelectorAll(sel).forEach((el) => el.remove());
  });
}

function isEmptyElement(el) {
  return el.children.length === 0 && el.textContent.trim() === '';
}

export default function transform(hookName, element, payload) {
  if (hookName === 'beforeTransform') {
    // Global header: remove the whole experiencefragment wrapper that holds it.
    element.querySelectorAll('.cmp-experiencefragment--header, .cmp-header.cmp-header--web').forEach((el) => {
      const xf = el.closest('.experiencefragment') || el;
      xf.remove();
    });

    // Footer experience fragment (and its wrapper).
    element.querySelectorAll('.cmp-experiencefragment.cmp-experiencefragment--footer').forEach((el) => {
      const xf = el.closest('.experiencefragment') || el;
      xf.remove();
    });

    // Cookie banner / OneTrust, scripts, styles and other non-content tags.
    removeAll(element, [
      '#onetrust-consent-sdk',
      '#onetrust-banner-sdk',
      '#onetrust-pc-sdk',
      '[class^="ot-"]',
      '[class*=" ot-"]',
      'script',
      'style',
      'noscript',
      'link',
      'iframe',
    ]);

    // Spacers (empty layout helpers) and the anchor-navigation mobile toggle
    // (it repeats the active link label plus a "[ ]" icon placeholder).
    removeAll(element, [
      '.cmp-spacer',
      '.cmp-anchor-navigation__toggle',
      '.cmp-anchor-navigation__toggle-span',
      '#cmp-anchor-navigation__mobile',
    ]);

    // Lightbox overlay, analytics and empty call-to-action placeholders.
    removeAll(element, ['.lightbox__overlay', '.analyticscontainer']);
    element.querySelectorAll('.calltoaction.cmp-calltoaction').forEach((el) => {
      if (isEmptyElement(el)) el.remove();
    });

    // Empty button wrappers (e.g. <div class="cmp-button--primary-positive"></div>).
    element.querySelectorAll('div[class*="cmp-button--"], div.button').forEach((el) => {
      if (isEmptyElement(el)) el.remove();
    });
  }

  if (hookName === 'afterTransform') {
    // Terms & Conditions modal. Removed after parsing (not before) so the
    // section selector ".termsandconditions + .title-v2" still resolves.
    removeAll(element, ['.termsandconditions', '.termsandconditions-modal', '.terms-overlay']);

    // Client-side loading spinners (base64 SVG images) left in list containers.
    removeAll(element, ['.cmp-filterbar__loading-spinner']);

    // Any leftover header/footer/consent chrome.
    removeAll(element, [
      '.cmp-experiencefragment--header',
      '.cmp-experiencefragment--footer',
      '#onetrust-consent-sdk',
      'header',
      'footer',
      'script',
      'style',
      'noscript',
      'link',
      'iframe',
    ]);

    // Decorative theme backgrounds from the site's clientlib (e.g. the pink
    // diagonal pattern behind the partner program) are carried by the
    // section style, not authored as images.
    element.querySelectorAll('[style*="etc.clientlibs/"]').forEach((el) => {
      el.style.removeProperty('background-image');
      el.style.removeProperty('background');
    });

    // Strip tracking / interaction attributes.
    element.querySelectorAll('*').forEach((el) => {
      [...el.attributes].forEach((attr) => {
        const n = attr.name;
        if (n.startsWith('data-analytics') || n.startsWith('data-track') || n.startsWith('data-cmp')
          || n.startsWith('data-gtm') || n === 'onclick' || n === 'onload') {
          el.removeAttribute(n);
        }
      });
    });
  }
}
