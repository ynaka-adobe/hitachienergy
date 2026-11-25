/* eslint-disable */
/* global WebImporter */

import heroBannerParser from './parsers/hero-banner.js';
import cardsPeekabooParser from './parsers/cards-peekaboo.js';
import columnsMediaParser from './parsers/columns-media.js';
import cardsNewsListParser from './parsers/cards-news-list.js';
import cardsEventCarouselParser from './parsers/cards-event-carousel.js';
import cardsPromoParser from './parsers/cards-promo.js';
import cleanupTransformer from './transformers/hitachienergy-cleanup.js';
import sectionsTransformer from './transformers/hitachienergy-sections.js';
import dmImagesTransformer from './transformers/hitachienergy-dm-images.js';
import pageCorrectionsTransformer from './transformers/hitachienergy-page-corrections.js';

const PAGE_TEMPLATE = {
  "name": "home",
  "urls": [
    "https://powerportal.hitachienergy.com/"
  ],
  "representativeUrl": "https://powerportal.hitachienergy.com/",
  "description": "Power Portal homepage: hero stage, about teasers, partner program, news list, events carousel, webinars, feedback banner",
  "urlPattern": "/",
  "blocks": [
    {
      "name": "hero-banner",
      "instances": [
        ".page-stagev2",
        ".cmp-marketing-banner"
      ]
    },
    {
      "name": "cards-peekaboo",
      "instances": [
        ".cmp-peekaboo-video-teasers"
      ]
    },
    {
      "name": "columns-media",
      "instances": [
        ".cmp-mediatext-large"
      ]
    },
    {
      "name": "cards-news-list",
      "instances": [
        ".newslist"
      ]
    },
    {
      "name": "cards-event-carousel",
      "instances": [
        ".carousel.eventList"
      ]
    },
    {
      "name": "cards-promo",
      "instances": [
        ".filterablelist.eventlist"
      ]
    }
  ],
  "sections": [
    {
      "id": "s1",
      "name": "Hero stage",
      "selector": [
        ".page-stage"
      ],
      "style": null,
      "blocks": [
        "hero-banner"
      ],
      "defaultContent": [
        ".anchornavigation"
      ]
    },
    {
      "id": "s2",
      "name": "About the Power Portal",
      "selector": [
        ".page-stage + .container.responsivegrid"
      ],
      "style": null,
      "blocks": [
        "cards-peekaboo"
      ],
      "defaultContent": [
        ".title-v2",
        ".text"
      ]
    },
    {
      "id": "s3",
      "name": "Channel Partner Program",
      "selector": [
        ".mediatextlarge"
      ],
      "style": "pink-gradient",
      "blocks": [
        "columns-media"
      ],
      "defaultContent": []
    },
    {
      "id": "s4",
      "name": "News",
      "selector": [
        ".mediatextlarge + .title-v2",
        ".newslist"
      ],
      "style": null,
      "blocks": [
        "cards-news-list"
      ],
      "defaultContent": [
        ".mediatextlarge + .title-v2"
      ]
    },
    {
      "id": "s5",
      "name": "Events",
      "selector": [
        ".newslist + .title-v2",
        ".carousel.eventList"
      ],
      "style": "light-grey",
      "blocks": [
        "cards-event-carousel"
      ],
      "defaultContent": [
        ".newslist + .title-v2"
      ]
    },
    {
      "id": "s6",
      "name": "Webinars",
      "selector": [
        ".termsandconditions + .title-v2",
        ".filterablelist.eventlist"
      ],
      "style": null,
      "blocks": [
        "cards-promo"
      ],
      "defaultContent": [
        ".termsandconditions + .title-v2"
      ]
    },
    {
      "id": "s7",
      "name": "Your voice matters",
      "selector": [
        ".cmp-layoutcontainer"
      ],
      "style": null,
      "blocks": [
        "hero-banner"
      ],
      "defaultContent": []
    }
  ]
};

const parsers = {
  'hero-banner': heroBannerParser,
  'cards-peekaboo': cardsPeekabooParser,
  'columns-media': columnsMediaParser,
  'cards-news-list': cardsNewsListParser,
  'cards-event-carousel': cardsEventCarouselParser,
  'cards-promo': cardsPromoParser,
};
// Late transformers change the DOM (section <hr> markers, shared fragments), so their beforeTransform
// runs after block discovery.
const sectionTransformers = [sectionsTransformer];
const fragmentTransformers = [];
const lateTransformers = [...sectionTransformers, ...fragmentTransformers];
// Page corrections ({sitename}-page-corrections.js, when it exists) run last.
const correctionTransformers = [pageCorrectionsTransformer];
const transformers = [cleanupTransformer, dmImagesTransformer, ...lateTransformers, ...correctionTransformers];
const earlyTransformers = transformers.filter((fn) => !lateTransformers.includes(fn));
// Catalog selectors (pageInstances, pageCleanup) count the <script> and <hr> elements the importer
// removes before transform, so a catalog template finds its targets in preprocess.
const CATALOG = Boolean(PAGE_TEMPLATE.pageCleanup || PAGE_TEMPLATE.blocks.some((b) => b.pageInstances));

function executeTransformers(hookName, element, payload, list = transformers) {
  const enhancedPayload = { ...payload, template: payload.params?.targets?.template || PAGE_TEMPLATE };
  list.forEach((fn) => {
    try { fn(hookName, element, enhancedPayload); }
    catch (e) { console.error(`Transformer failed at ${hookName}:`, e); }
  });
}

function findBlocksOnPage(document, template, url) {
  const pageBlocks = [];
  const pageKey = (u) => {
    try { const { origin, pathname } = new URL(u); return `${origin}${pathname.replace(/\/$/, '')}`; }
    catch { return u; }
  };
  const key = pageKey(url);
  const claim = (blockDef, selector) => {
    let matches = [];
    try { matches = document.querySelectorAll(selector); } catch { return; }
    matches.forEach((element) => {
      if (pageBlocks.some((b) => b.element === element || b.element.contains(element) || element.contains(b.element))) return;
      pageBlocks.push({ name: blockDef.name, selector, element });
    });
  };
  template.blocks.forEach((blockDef) => {
    const entry = Object.entries(blockDef.pageInstances || {}).find(([u]) => pageKey(u) === key);
    (entry ? entry[1] : []).forEach((selector) => claim(blockDef, selector));
  });
  template.blocks.forEach((blockDef) => (blockDef.instances || []).forEach((selector) => claim(blockDef, selector)));
  return pageBlocks;
}

// Runs the early transformers, then marks each block and section target with an attribute: the
// importer re-creates the body before transform, so only attributes survive, not element references.
function markPageTargets(payload) {
  const { document, params } = payload;
  executeTransformers('beforeTransform', document.body, payload, earlyTransformers);
  const blocks = findBlocksOnPage(document, PAGE_TEMPLATE, params.originalURL).map(({ name, selector, element }, i) => {
    element.setAttribute('data-excat-block', String(i));
    return { name, selector };
  });
  const sections = (PAGE_TEMPLATE.sections || []).map((section, i) => {
    const target = (section.selector || []).map((s) => { try { return document.querySelector(s); } catch { return null; } }).find(Boolean);
    if (!target) return section;
    target.setAttribute('data-excat-section', String(i));
    return { ...section, selector: [`[data-excat-section="${i}"]`] };
  });
  params.targets = { blocks, template: { ...PAGE_TEMPLATE, sections } };
}

// The news list, events carousel and webinar list are filled by the site's own scripts only when
// they scroll into view. Scroll through the whole page, then wait until each list has items.
const LAZY_LISTS = [
  '.newslist .cmp-filterable-list__card',
  '.carousel.eventList .cmp-filterable-list__card',
  '.filterablelist.eventlist .cmp-filterable-list__card',
];
const wait = (ms) => new Promise((r) => { setTimeout(r, ms); });

async function loadLazyLists(document) {
  const win = document.defaultView || window;
  for (let y = 0; y < document.body.scrollHeight; y += 400) {
    win.scrollTo(0, y);
    // eslint-disable-next-line no-await-in-loop
    await wait(250);
  }
  for (const selector of LAZY_LISTS) {
    const host = document.querySelector(selector.split(' ')[0]);
    if (host) {
      host.scrollIntoView();
      const start = Date.now();
      // eslint-disable-next-line no-await-in-loop
      while (!document.querySelector(selector) && Date.now() - start < 15000) await wait(250);
      if (!document.querySelector(selector)) console.warn(`Lazy list did not load: ${selector}`);
    }
  }
  // Let images inside the lists resolve their real URLs.
  await wait(2000);
  win.scrollTo(0, 0);
}

export default {
  onLoad: async ({ document }) => {
    await loadLazyLists(document);
  },
  preprocess: (payload) => {
    if (CATALOG) markPageTargets(payload);
  },
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;
    params.fragments = [];

    if (!params.targets) markPageTargets(payload);
    const pageBlocks = params.targets.blocks
      .map((block, i) => ({ ...block, element: document.querySelector(`[data-excat-block="${i}"]`) }))
      .filter((block) => block.element);
    executeTransformers('beforeTransform', main, { ...payload, pageBlocks }, lateTransformers);

    pageBlocks.forEach((block) => {
      if (!main.contains(block.element)) return;
      const parser = parsers[block.name];
      if (!parser) return;
      try { parser(block.element, { document, url, params }); }
      catch (e) { console.error(`Failed to parse ${block.name} (${block.selector}):`, e); }
    });

    executeTransformers('afterTransform', main, payload);

    main.appendChild(document.createElement('hr'));
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // A fragment's nodes left `main` before afterTransform: finalize it the same way, without the
    // page-only section breaks and metadata.
    params.fragments.forEach(({ element }) => {
      executeTransformers('afterTransform', element, payload, earlyTransformers);
      WebImporter.rules.transformBackgroundImages(element, document);
      WebImporter.rules.adjustImageUrls(element, url, params.originalURL);
    });

    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) },
    }, ...params.fragments];
  },
};
