/* eslint-disable */
/* global WebImporter */

/**
 * Hitachi Energy Dynamic Media image transformer (afterTransform only).
 *
 * Rewrites Dynamic Media / Scene7 <img> elements into anchors that survive the
 * markdown round-trip; scripts/scripts.js (buildDynamicMediaImages) rebuilds
 * them into <picture> elements at render time.
 *
 * - Unlinked image: <img src=DM alt=X>  ->  <a href="DM-URL">X</a>
 * - Linked image (img is the sole meaningful content of its <a>):
 *   keep the navigation href, set title="DM-URL", replace content with alt text.
 * - Mixed-content anchors are skipped (with a warning).
 * - Empty alt becomes the visible sentinel "Image without alt text".
 *
 * Detection accepts Scene7 /is/image/ paths (any host), DM Open API on
 * delivery-p*-e*.adobeaemcloud.com, and the vanity host
 * dynamicassets.hitachienergy.com serving /adobe/assets/urn:...
 */

const EMPTY_ALT_SENTINEL = 'Image without alt text';
const DM_VANITY_HOSTS = ['dynamicassets.hitachienergy.com'];

function detectDynamicMediaUrl(urlStr) {
  if (!urlStr || !/^(https?:\/\/|\/\/)/i.test(urlStr)) return false;
  let u;
  try { u = new URL(urlStr, 'https://x/'); } catch (e) { return false; }
  if (u.pathname.startsWith('/is/image/')) return 'scene7';
  if ((/^delivery-p\d+-e\d+\.adobeaemcloud\.com$/.test(u.hostname)
      || DM_VANITY_HOSTS.includes(u.hostname))
      && u.pathname.startsWith('/adobe/assets/urn:')) {
    return 'dm-openapi';
  }
  return false;
}

function absolutize(src) {
  if (src && src.startsWith('//')) return `https:${src}`;
  return src;
}

// True when the anchor contains nothing meaningful besides the image
// (and its <picture>/<source> wrappers / whitespace).
function isSoleImageAnchor(anchor, img) {
  if (anchor.textContent.trim() !== '') return false;
  // Ignore the image itself, its wrapper chain, and <source>/<br> noise.
  const others = [...anchor.querySelectorAll('*')].filter((el) => {
    if (el === img || el.contains(img)) return false;
    const tag = el.tagName.toLowerCase();
    return tag !== 'source' && tag !== 'br';
  });
  return others.length === 0;
}

export default function transform(hookName, element, payload) {
  if (hookName !== 'afterTransform') return;

  const document = element.ownerDocument;

  element.querySelectorAll('img').forEach((img) => {
    const src = absolutize(img.getAttribute('src') || '');
    if (!detectDynamicMediaUrl(src)) return;

    const alt = (img.getAttribute('alt') || '').trim() || EMPTY_ALT_SENTINEL;
    const anchor = img.closest('a');

    if (anchor) {
      if (!isSoleImageAnchor(anchor, img)) {
        console.warn(`[hitachienergy-dm-images] skipping DM image inside mixed-content link: ${src}`);
        return;
      }
      anchor.setAttribute('title', src);
      anchor.textContent = alt;
      return;
    }

    const a = document.createElement('a');
    a.setAttribute('href', src);
    a.textContent = alt;

    // Replace the surrounding <picture> wrapper too, so no empty <picture>/<source> remains.
    const picture = img.parentElement && img.parentElement.closest('picture');
    const target = picture && picture.querySelectorAll('img').length === 1 ? picture : img;
    target.replaceWith(a);
  });
}
