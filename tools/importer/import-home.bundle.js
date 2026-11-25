/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
  var __async = (__this, __arguments, generator) => {
    return new Promise((resolve, reject) => {
      var fulfilled = (value) => {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      };
      var rejected = (value) => {
        try {
          step(generator.throw(value));
        } catch (e) {
          reject(e);
        }
      };
      var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
      step((generator = generator.apply(__this, __arguments)).next());
    });
  };

  // tools/importer/import-home.js
  var import_home_exports = {};
  __export(import_home_exports, {
    default: () => import_home_default
  });

  // tools/importer/parsers/hero-banner.js
  function parse(element, { document }) {
    const cells = [];
    const fromPattern = (holder) => {
      if (!holder) return null;
      try {
        const raw = holder.getAttribute("data-image-src") || holder.getAttribute("data-props:model-json");
        const data = JSON.parse(raw);
        if (!data || !data.pattern) return null;
        const crop = data.pattern.match(/smartcrop=(\d+)-(\d+)/) || [];
        const w = 1920;
        const ratio = crop[1] ? +crop[2] / +crop[1] : (data.originalHeight || 9) / (data.originalWidth || 16);
        const h = Math.round(w * ratio);
        return { src: data.pattern.replace("{{width}}", w).replace("{{height}}", h), alt: data.alt || "" };
      } catch (e) {
        return null;
      }
    };
    const pickImage = () => {
      const img = element.querySelector(".cmp-cta__image img, .cmp-marketing-banner-image img, picture img, img");
      let src = img ? img.getAttribute("src") || "" : "";
      let alt = img ? img.getAttribute("alt") || "" : "";
      if (!/^https?:/i.test(src)) {
        const srcset = img && img.closest("picture") && img.closest("picture").querySelector("source[srcset]");
        const fromSet = srcset ? srcset.getAttribute("srcset").split(",")[0].trim().split(/\s+/)[0] : "";
        if (/^https?:/i.test(fromSet)) {
          src = fromSet;
        } else {
          const holder = img && img.closest("[data-image-src]") || element.querySelector("[data-image-src], [data-props\\:model-json]");
          const resolved = fromPattern(holder);
          if (!resolved) return null;
          src = resolved.src;
          alt = alt || resolved.alt;
        }
      }
      if (!src) return null;
      const out = document.createElement("img");
      out.src = src;
      out.alt = alt;
      return out;
    };
    const image = pickImage();
    if (image) cells.push([image]);
    const content = [];
    const heading = element.querySelector("h1, h2, h3");
    if (heading) {
      const h = document.createElement(heading.tagName.toLowerCase());
      h.textContent = heading.textContent.trim();
      content.push(h);
    }
    const textRoot = element.querySelector(".cmp-banner-cta__text, .cmp-margeting-banner-content--text, .cmp-marketing-banner-content");
    const paras = textRoot ? [...textRoot.querySelectorAll("p")] : [];
    paras.forEach((p) => {
      const text = p.textContent.replace(/ /g, " ").trim();
      if (!text) return;
      const np = document.createElement("p");
      np.textContent = text;
      content.push(np);
    });
    const ctaLinks = [...element.querySelectorAll(".cmp-marketing-banner-button a, .cmp-banner-cta__button a, a.cmp-button")];
    const seen = /* @__PURE__ */ new Set();
    ctaLinks.forEach((a) => {
      if (seen.has(a)) return;
      seen.add(a);
      const text = a.textContent.trim();
      if (!text) return;
      const p = document.createElement("p");
      const link = document.createElement("a");
      link.href = a.getAttribute("href") || a.href;
      link.textContent = text;
      p.append(link);
      content.push(p);
    });
    if (content.length) cells.push([content]);
    const block = WebImporter.Blocks.createBlock(document, { name: "hero-banner", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-peekaboo.js
  function resolveImage(scope, document) {
    const img = scope.querySelector("picture img, img");
    let src = img ? img.getAttribute("src") || "" : "";
    let alt = img ? img.getAttribute("alt") || "" : "";
    if (!/^https?:/i.test(src)) {
      const source = img && img.closest("picture") && img.closest("picture").querySelector("source[srcset]");
      const fromSet = source ? source.getAttribute("srcset").split(",")[0].trim().split(/\s+/)[0] : "";
      if (/^https?:/i.test(fromSet)) {
        src = fromSet;
      } else {
        const holder = img && img.closest("[data-image-src]") || scope.querySelector("[data-image-src]");
        src = "";
        if (holder) {
          try {
            const data = JSON.parse(holder.getAttribute("data-image-src"));
            if (data && data.pattern) {
              const w = 480;
              const h = Math.round(w * ((data.originalHeight || 752) / (data.originalWidth || 480)));
              src = data.pattern.replace("{{width}}", w).replace("{{height}}", h);
              alt = alt || data.alt || "";
            }
          } catch (e) {
          }
        }
      }
    }
    if (!src) return null;
    const out = document.createElement("img");
    out.src = src;
    out.alt = alt;
    return out;
  }
  function parse2(element, { document }) {
    const cells = [];
    const tiles = [...element.querySelectorAll(":scope > .cmp-peekaboo-video-teaser")];
    const items = tiles.length ? tiles : [...element.querySelectorAll(".cmp-peekaboo-video-teaser")];
    items.forEach((tile) => {
      const imgWrap = tile.querySelector(".cmp-peekaboo-video-teaser__img") || tile;
      const image = resolveImage(imgWrap, document);
      const body = [];
      const title = tile.querySelector(".cmp-peekaboo-video-teaser__content--title");
      if (title) {
        const h = document.createElement(/^H[1-6]$/.test(title.tagName) ? title.tagName.toLowerCase() : "h3");
        h.textContent = title.textContent.trim();
        body.push(h);
      }
      const text = tile.querySelector(".cmp-peekaboo-video-teaser__content--text");
      if (text && text.textContent.trim()) {
        const p = document.createElement("p");
        p.textContent = text.textContent.trim();
        body.push(p);
      }
      const link = tile.querySelector("a[href]");
      if (link && link.textContent.trim()) {
        const p = document.createElement("p");
        const a = document.createElement("a");
        a.href = link.getAttribute("href");
        a.textContent = link.textContent.trim();
        p.append(a);
        body.push(p);
      }
      cells.push([image || "", body]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-peekaboo", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-media.js
  function resolveImage2(scope, document) {
    const img = scope.querySelector("picture img, img");
    let src = img ? img.getAttribute("src") || "" : "";
    let alt = img ? img.getAttribute("alt") || "" : "";
    if (!/^https?:/i.test(src)) {
      const source = img && img.closest("picture") && img.closest("picture").querySelector("source[srcset]");
      const fromSet = source ? source.getAttribute("srcset").split(",")[0].trim().split(/\s+/)[0] : "";
      if (/^https?:/i.test(fromSet)) {
        src = fromSet;
      } else {
        const holder = img && img.closest("[data-image-src]") || scope.querySelector("[data-image-src]");
        src = "";
        if (holder) {
          try {
            const data = JSON.parse(holder.getAttribute("data-image-src"));
            if (data && data.pattern) {
              src = data.pattern.replace("{{width}}", 960).replace("{{height}}", 540);
              alt = alt || data.alt || "";
            }
          } catch (e) {
          }
        }
      }
    }
    if (!src) return null;
    const out = document.createElement("img");
    out.src = src;
    out.alt = alt;
    return out;
  }
  function parse3(element, { document }) {
    const media = element.querySelector(".cmp-mediatext-large__media") || element;
    const image = resolveImage2(media, document);
    const content = element.querySelector(".cmp-mediatext-large__content") || element;
    const text = [];
    const preTitle = content.querySelector(".cmp-mediatext-large__content-pre-title");
    if (preTitle && preTitle.textContent.trim()) {
      const p = document.createElement("p");
      p.textContent = preTitle.textContent.trim();
      text.push(p);
    }
    const heading = content.querySelector(".cmp-mediatext-large__content-title h1, .cmp-mediatext-large__content-title h2, .cmp-mediatext-large__content-title h3, .cmp-mediatext-large__content-title h4, .cmp-mediatext-large__content-title h5, .cmp-mediatext-large__content-title h6");
    const titleWrap = content.querySelector(".cmp-mediatext-large__content-title");
    if (heading || titleWrap && titleWrap.textContent.trim()) {
      const h = document.createElement("h2");
      h.textContent = (heading || titleWrap).textContent.trim();
      text.push(h);
    }
    const desc = content.querySelector(".cmp-mediatext-large__content-description");
    if (desc) {
      const paras = [...desc.querySelectorAll("p")];
      if (paras.length) {
        paras.forEach((p) => {
          if (p.textContent.trim()) text.push(p);
        });
      } else if (desc.textContent.trim()) {
        const p = document.createElement("p");
        p.textContent = desc.textContent.trim();
        text.push(p);
      }
    }
    const cta = content.querySelector("a.cmp-mediatext-large__content-link-button, .cmp-mediatext-large__content > a[href]");
    if (cta && cta.textContent.trim()) {
      const p = document.createElement("p");
      const a = document.createElement("a");
      a.href = cta.getAttribute("href");
      a.textContent = cta.textContent.trim();
      p.append(a);
      text.push(p);
    }
    const cells = [[image || "", text]];
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-media", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-news-list.js
  function parse4(element, { document }) {
    const cells = [];
    const titles = [...element.querySelectorAll(".cmp-filterable-list__card-title")];
    titles.forEach((titleEl) => {
      const card = titleEl.closest(".cmp-filterable-list__card") || titleEl.closest("a") || titleEl.parentElement;
      const linkEl = titleEl.closest("a[href]") || card.querySelector("a[href]");
      const href = linkEl ? linkEl.getAttribute("href") : "";
      const content = [];
      if (titleEl) {
        const tag = /^H[1-6]$/.test(titleEl.tagName) ? titleEl.tagName.toLowerCase() : "h3";
        const h = document.createElement(tag);
        const title = titleEl.textContent.replace(/\s+/g, " ").trim();
        if (href) {
          const a = document.createElement("a");
          a.href = href;
          a.textContent = title;
          h.append(a);
        } else {
          h.textContent = title;
        }
        content.push(h);
      }
      const clean3 = (el) => el ? el.textContent.replace(/\s+/g, " ").trim() : "";
      const tagText = clean3(card.querySelector(".cmp-filterable-list__card-meta--tag"));
      const dateText = clean3(card.querySelector(".cmp-filterable-list__card-meta--date"));
      const readText = clean3(card.querySelector(".cmp-filterable-list__card-meta--time-to-read"));
      if (tagText || dateText || readText) {
        const p = document.createElement("p");
        const parts = [];
        if (tagText) {
          const em = document.createElement("em");
          em.textContent = tagText;
          parts.push(em);
        }
        if (dateText) parts.push(document.createTextNode(dateText));
        if (readText) parts.push(document.createTextNode(readText));
        parts.forEach((part, i) => {
          if (i > 0) p.append(document.createTextNode(" | "));
          p.append(part);
        });
        content.push(p);
      }
      if (content.length) cells.push([content]);
    });
    const seeAll = element.querySelector(".cmp-filterable-list__buttons-wrapper a[href]");
    let after = null;
    if (seeAll && seeAll.textContent.trim()) {
      after = document.createElement("p");
      const a = document.createElement("a");
      a.href = seeAll.getAttribute("href");
      a.textContent = seeAll.textContent.trim();
      after.append(a);
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-news-list", cells });
    element.replaceWith(block);
    if (after) block.after(after);
  }

  // tools/importer/parsers/cards-event-carousel.js
  function resolveImage3(scope, document) {
    const img = scope.querySelector("picture img, img");
    let src = img ? img.getAttribute("src") || "" : "";
    let alt = img ? img.getAttribute("alt") || "" : "";
    if (!/^https?:/i.test(src)) {
      const source = img && img.closest("picture") && img.closest("picture").querySelector("source[srcset]");
      const fromSet = source ? source.getAttribute("srcset").split(",")[0].trim().split(/\s+/)[0] : "";
      if (/^https?:/i.test(fromSet)) {
        src = fromSet;
      } else {
        const holder = img && img.closest("[data-image-src]") || scope.querySelector("[data-image-src]");
        src = "";
        if (holder) {
          try {
            const data = JSON.parse(holder.getAttribute("data-image-src"));
            if (data && data.pattern) {
              src = data.pattern.replace("{{width}}", 780).replace("{{height}}", 439);
              alt = alt || data.alt || "";
            }
          } catch (e) {
          }
        }
      }
    }
    if (!src) return null;
    const out = document.createElement("img");
    out.src = src;
    out.alt = alt;
    return out;
  }
  var clean = (el) => el ? el.textContent.replace(/\s+/g, " ").trim() : "";
  function formatDates(text) {
    const dates = text.match(/\d{1,2}\.\d{1,2}\.\d{4}/g);
    if (!dates) return text;
    const pad = (d) => d.split(".").map((p, i) => i < 2 ? p.padStart(2, "0") : p).join(".");
    if (dates.length >= 2 && dates[0] !== dates[1]) return `${pad(dates[0])} - ${pad(dates[1])}`;
    return pad(dates[0]);
  }
  function parse5(element, { document }) {
    const cells = [];
    const slides = [...element.querySelectorAll(".splide__slide:not(.splide__slide--clone)")];
    let cards = slides.map((s) => s.querySelector(".cmp-filterable-list__card")).filter(Boolean);
    if (!cards.length) {
      cards = [...element.querySelectorAll(".cmp-filterable-list__card")].filter((c) => !c.closest(".splide__slide--clone"));
    }
    cards.forEach((card) => {
      const media = [];
      const imgScope = card.querySelector(".cmp-filterable-list__card-image-wrapper, .cmp-filterable-list__card-image") || card;
      const image = resolveImage3(imgScope, document);
      if (image) media.push(image);
      const loc = card.querySelector(".cmp-filterable-list__card-event-location");
      if (loc) {
        const parts = [...loc.querySelectorAll("span")].map(clean).filter(Boolean);
        const locText = parts.length ? parts.join(", ") : clean(loc);
        if (locText) {
          const p = document.createElement("p");
          p.textContent = locText;
          media.push(p);
        }
      }
      const body = [];
      const linkEl = card.querySelector("a.cmp-filterable-list__card-link") || card.querySelector("a[href]");
      const href = linkEl ? linkEl.getAttribute("href") : "";
      const titleEl = card.querySelector(".cmp-filterable-list__card-title");
      if (titleEl) {
        const h = document.createElement("h3");
        const title = clean(titleEl);
        if (href) {
          const a = document.createElement("a");
          a.href = href;
          a.textContent = title;
          h.append(a);
        } else {
          h.textContent = title;
        }
        body.push(h);
      }
      const desc = clean(card.querySelector(".cmp-filterable-list__card-description"));
      if (desc) {
        const p = document.createElement("p");
        p.textContent = desc;
        body.push(p);
      }
      const date = clean(card.querySelector(".cmp-filterable-list__card-meta--date"));
      if (date) {
        const p = document.createElement("p");
        p.textContent = formatDates(date);
        body.push(p);
      }
      if (body.length || media.length) cells.push([media.length ? media : "", body]);
    });
    const allEvents = element.querySelector(".cmp-carousel__header a[href]");
    let after = null;
    if (allEvents && clean(allEvents)) {
      after = document.createElement("p");
      const a = document.createElement("a");
      a.href = allEvents.getAttribute("href");
      a.textContent = clean(allEvents);
      after.append(a);
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-event-carousel", cells });
    element.replaceWith(block);
    if (after) block.after(after);
  }

  // tools/importer/parsers/cards-promo.js
  function resolveImage4(scope, document) {
    const img = scope.querySelector("picture img, img");
    let src = img ? img.getAttribute("src") || "" : "";
    let alt = img ? img.getAttribute("alt") || "" : "";
    if (!/^https?:/i.test(src)) {
      const source = img && img.closest("picture") && img.closest("picture").querySelector("source[srcset]");
      const fromSet = source ? source.getAttribute("srcset").split(",")[0].trim().split(/\s+/)[0] : "";
      if (/^https?:/i.test(fromSet)) {
        src = fromSet;
      } else {
        const holder = img && img.closest("[data-image-src]") || scope.querySelector("[data-image-src]");
        src = "";
        if (holder) {
          try {
            const data = JSON.parse(holder.getAttribute("data-image-src"));
            if (data && data.pattern) {
              src = data.pattern.replace("{{width}}", 960).replace("{{height}}", 540);
              alt = alt || data.alt || "";
            }
          } catch (e) {
          }
        }
      }
    }
    if (!src) return null;
    const out = document.createElement("img");
    out.src = src;
    out.alt = alt;
    return out;
  }
  var clean2 = (el) => el ? el.textContent.replace(/\s+/g, " ").trim() : "";
  function parse6(element, { document }) {
    const cells = [];
    const cards = [...element.querySelectorAll(".cmp-filterable-list__card")];
    cards.forEach((card) => {
      const imgScope = card.querySelector(".cmp-filterable-list__card-image") || card;
      const image = resolveImage4(imgScope, document);
      const body = [];
      const tags = [...card.querySelectorAll(".cmp-filterable-list__card-tags--item")].map(clean2).filter(Boolean);
      if (tags.length) {
        const p = document.createElement("p");
        p.textContent = tags.join(" | ");
        body.push(p);
      }
      const linkEl = card.querySelector("a.cmp-filterable-list__card-link") || card.querySelector("a[href]");
      const href = linkEl ? linkEl.getAttribute("href") : "";
      const titleEl = card.querySelector(".cmp-filterable-list__card-title");
      if (titleEl) {
        const h = document.createElement("h3");
        const title = clean2(titleEl);
        if (href) {
          const a = document.createElement("a");
          a.href = href;
          a.textContent = title;
          h.append(a);
        } else {
          h.textContent = title;
        }
        body.push(h);
      }
      const desc = clean2(card.querySelector(".cmp-filterable-list__card-description"));
      if (desc) {
        const p = document.createElement("p");
        p.textContent = desc;
        body.push(p);
      }
      const readMore = card.querySelector(".cmp-filterable-list__card-read-more--icon[aria-label], .cmp-filterable-list__card-read-more [aria-label]");
      const ctaLabel = readMore ? readMore.getAttribute("aria-label").trim() : "";
      if (href && ctaLabel) {
        const p = document.createElement("p");
        const a = document.createElement("a");
        a.href = href;
        a.textContent = ctaLabel;
        p.append(a);
        body.push(p);
      }
      if (body.length || image) cells.push([image || "", body]);
    });
    const seeAll = element.querySelector(".cmp-filterable-list__buttons-wrapper a[href]");
    let after = null;
    if (seeAll && clean2(seeAll)) {
      after = document.createElement("p");
      const a = document.createElement("a");
      a.href = seeAll.getAttribute("href");
      a.textContent = clean2(seeAll);
      after.append(a);
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-promo", cells });
    element.replaceWith(block);
    if (after) block.after(after);
  }

  // tools/importer/transformers/hitachienergy-cleanup.js
  function removeAll(root, selectors) {
    selectors.forEach((sel) => {
      root.querySelectorAll(sel).forEach((el) => el.remove());
    });
  }
  function isEmptyElement(el) {
    return el.children.length === 0 && el.textContent.trim() === "";
  }
  function transform(hookName, element, payload) {
    if (hookName === "beforeTransform") {
      element.querySelectorAll(".cmp-experiencefragment--header, .cmp-header.cmp-header--web").forEach((el) => {
        const xf = el.closest(".experiencefragment") || el;
        xf.remove();
      });
      element.querySelectorAll(".cmp-experiencefragment.cmp-experiencefragment--footer").forEach((el) => {
        const xf = el.closest(".experiencefragment") || el;
        xf.remove();
      });
      removeAll(element, [
        "#onetrust-consent-sdk",
        "#onetrust-banner-sdk",
        "#onetrust-pc-sdk",
        '[class^="ot-"]',
        '[class*=" ot-"]',
        "script",
        "style",
        "noscript",
        "link",
        "iframe"
      ]);
      removeAll(element, [
        ".cmp-spacer",
        ".cmp-anchor-navigation__toggle",
        ".cmp-anchor-navigation__toggle-span",
        "#cmp-anchor-navigation__mobile"
      ]);
      removeAll(element, [".lightbox__overlay", ".analyticscontainer"]);
      element.querySelectorAll(".calltoaction.cmp-calltoaction").forEach((el) => {
        if (isEmptyElement(el)) el.remove();
      });
      element.querySelectorAll('div[class*="cmp-button--"], div.button').forEach((el) => {
        if (isEmptyElement(el)) el.remove();
      });
    }
    if (hookName === "afterTransform") {
      removeAll(element, [".termsandconditions", ".termsandconditions-modal", ".terms-overlay"]);
      removeAll(element, [".cmp-filterbar__loading-spinner"]);
      removeAll(element, [
        ".cmp-experiencefragment--header",
        ".cmp-experiencefragment--footer",
        "#onetrust-consent-sdk",
        "header",
        "footer",
        "script",
        "style",
        "noscript",
        "link",
        "iframe"
      ]);
      element.querySelectorAll('[style*="etc.clientlibs/"]').forEach((el) => {
        el.style.removeProperty("background-image");
        el.style.removeProperty("background");
      });
      element.querySelectorAll("*").forEach((el) => {
        [...el.attributes].forEach((attr) => {
          const n = attr.name;
          if (n.startsWith("data-analytics") || n.startsWith("data-track") || n.startsWith("data-cmp") || n.startsWith("data-gtm") || n === "onclick" || n === "onload") {
            el.removeAttribute(n);
          }
        });
      });
    }
  }

  // tools/importer/transformers/hitachienergy-sections.js
  var MARKER_ATTR = "data-excat-section-id";
  function findSectionElement(root, section) {
    const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
    for (const sel of selectors) {
      if (!sel) continue;
      let el = null;
      try {
        el = root.querySelector(sel);
      } catch (e) {
        el = null;
      }
      if (el) return el;
    }
    return null;
  }
  function transform2(hookName, element, payload) {
    const template = payload && payload.template;
    const sections = template && Array.isArray(template.sections) ? template.sections : [];
    if (sections.length < 2) return;
    const document = element.ownerDocument;
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        const sectionEl = findSectionElement(element, section);
        if (!sectionEl) continue;
        const isFirst = i === 0;
        if (isFirst && !section.style) continue;
        const hr = document.createElement("hr");
        if (section.style) hr.setAttribute(MARKER_ATTR, section.id);
        sectionEl.parentNode.insertBefore(hr, sectionEl);
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        const metadata = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        const marker = element.querySelector(`hr[${MARKER_ATTR}="${section.id}"]`);
        if (marker) {
          let end = marker.nextElementSibling;
          while (end && end.tagName !== "HR") end = end.nextElementSibling;
          if (end) end.before(metadata);
          else marker.parentNode.append(metadata);
          if (i === 0) {
            marker.remove();
          } else {
            marker.removeAttribute(MARKER_ATTR);
          }
          continue;
        }
        const sectionEl = findSectionElement(element, section);
        if (sectionEl) sectionEl.after(metadata);
      }
    }
  }

  // tools/importer/transformers/hitachienergy-dm-images.js
  var EMPTY_ALT_SENTINEL = "Image without alt text";
  var DM_VANITY_HOSTS = ["dynamicassets.hitachienergy.com"];
  function detectDynamicMediaUrl(urlStr) {
    if (!urlStr || !/^(https?:\/\/|\/\/)/i.test(urlStr)) return false;
    let u;
    try {
      u = new URL(urlStr, "https://x/");
    } catch (e) {
      return false;
    }
    if (u.pathname.startsWith("/is/image/")) return "scene7";
    if ((/^delivery-p\d+-e\d+\.adobeaemcloud\.com$/.test(u.hostname) || DM_VANITY_HOSTS.includes(u.hostname)) && u.pathname.startsWith("/adobe/assets/urn:")) {
      return "dm-openapi";
    }
    return false;
  }
  function absolutize(src) {
    if (src && src.startsWith("//")) return `https:${src}`;
    return src;
  }
  function isSoleImageAnchor(anchor, img) {
    if (anchor.textContent.trim() !== "") return false;
    const others = [...anchor.querySelectorAll("*")].filter((el) => {
      if (el === img || el.contains(img)) return false;
      const tag = el.tagName.toLowerCase();
      return tag !== "source" && tag !== "br";
    });
    return others.length === 0;
  }
  function transform3(hookName, element, payload) {
    if (hookName !== "afterTransform") return;
    const document = element.ownerDocument;
    element.querySelectorAll("img").forEach((img) => {
      const src = absolutize(img.getAttribute("src") || "");
      if (!detectDynamicMediaUrl(src)) return;
      const alt = (img.getAttribute("alt") || "").trim() || EMPTY_ALT_SENTINEL;
      const anchor = img.closest("a");
      if (anchor) {
        if (!isSoleImageAnchor(anchor, img)) {
          console.warn(`[hitachienergy-dm-images] skipping DM image inside mixed-content link: ${src}`);
          return;
        }
        anchor.setAttribute("title", src);
        anchor.textContent = alt;
        return;
      }
      const a = document.createElement("a");
      a.setAttribute("href", src);
      a.textContent = alt;
      const picture = img.parentElement && img.parentElement.closest("picture");
      const target = picture && picture.querySelectorAll("img").length === 1 ? picture : img;
      target.replaceWith(a);
    });
  }

  // tools/importer/transformers/hitachienergy-page-corrections.js
  var CORRECTIONS = {
    // '<page URL: origin and path, no trailing slash, query or hash>': [(main, document) => { ... }],
    "https://powerportal.hitachienergy.com": [
      // Accessible heading order: "Ready to Access Everything You Need?" is a level-3 heading, not level 4.
      (main, document) => main.querySelectorAll("h4").forEach((h) => {
        if (h.textContent.trim() !== "Ready to Access Everything You Need?") return;
        const h3 = document.createElement("h3");
        [...h.attributes].forEach(({ name, value }) => h3.setAttribute(name, value));
        h3.append(...h.childNodes);
        h.replaceWith(h3);
      })
    ]
  };
  var FRAGMENT_CORRECTIONS = {
    // '<fragment document path, e.g. fragments/authors/jane-doe>': [(fragment, document) => { ... }],
  };
  var pageKey = (u) => {
    try {
      const { origin, pathname } = new URL(u);
      return `${origin}${pathname.replace(/\/$/, "")}`;
    } catch (e) {
      return u;
    }
  };
  var fragmentKey = (p) => String(p).replace(/\\/g, "/").replace(/\.plain\.html$/, "").split("/").reduce((parts, part) => {
    if (part === "..") parts.pop();
    else if (part && part !== ".") parts.push(part);
    return parts;
  }, []).join("/");
  function applyCorrections(element, payload, pageCorrections, fragmentCorrections) {
    const { document, params } = payload || {};
    if (!document || !params) return;
    if (element === document.body) {
      if (!params.originalURL) return;
      (pageCorrections[pageKey(params.originalURL)] || []).forEach((fix) => fix(element, document));
      return;
    }
    const fragment = (params.fragments || []).find((f) => f.element === element);
    if (!fragment || typeof fragment.path !== "string") return;
    (fragmentCorrections[fragmentKey(fragment.path)] || []).forEach((fix) => fix(element, document));
  }
  function transform4(hookName, element, payload) {
    if (hookName !== "afterTransform") return;
    applyCorrections(element, payload, CORRECTIONS, FRAGMENT_CORRECTIONS);
  }

  // tools/importer/import-home.js
  var PAGE_TEMPLATE = {
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
  var parsers = {
    "hero-banner": parse,
    "cards-peekaboo": parse2,
    "columns-media": parse3,
    "cards-news-list": parse4,
    "cards-event-carousel": parse5,
    "cards-promo": parse6
  };
  var sectionTransformers = [transform2];
  var fragmentTransformers = [];
  var lateTransformers = [...sectionTransformers, ...fragmentTransformers];
  var correctionTransformers = [transform4];
  var transformers = [transform, transform3, ...lateTransformers, ...correctionTransformers];
  var earlyTransformers = transformers.filter((fn) => !lateTransformers.includes(fn));
  var CATALOG = Boolean(PAGE_TEMPLATE.pageCleanup || PAGE_TEMPLATE.blocks.some((b) => b.pageInstances));
  function executeTransformers(hookName, element, payload, list = transformers) {
    var _a, _b;
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: ((_b = (_a = payload.params) == null ? void 0 : _a.targets) == null ? void 0 : _b.template) || PAGE_TEMPLATE });
    list.forEach((fn) => {
      try {
        fn(hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document, template, url) {
    const pageBlocks = [];
    const pageKey2 = (u) => {
      try {
        const { origin, pathname } = new URL(u);
        return `${origin}${pathname.replace(/\/$/, "")}`;
      } catch (e) {
        return u;
      }
    };
    const key = pageKey2(url);
    const claim = (blockDef, selector) => {
      let matches = [];
      try {
        matches = document.querySelectorAll(selector);
      } catch (e) {
        return;
      }
      matches.forEach((element) => {
        if (pageBlocks.some((b) => b.element === element || b.element.contains(element) || element.contains(b.element))) return;
        pageBlocks.push({ name: blockDef.name, selector, element });
      });
    };
    template.blocks.forEach((blockDef) => {
      const entry = Object.entries(blockDef.pageInstances || {}).find(([u]) => pageKey2(u) === key);
      (entry ? entry[1] : []).forEach((selector) => claim(blockDef, selector));
    });
    template.blocks.forEach((blockDef) => (blockDef.instances || []).forEach((selector) => claim(blockDef, selector)));
    return pageBlocks;
  }
  function markPageTargets(payload) {
    const { document, params } = payload;
    executeTransformers("beforeTransform", document.body, payload, earlyTransformers);
    const blocks = findBlocksOnPage(document, PAGE_TEMPLATE, params.originalURL).map(({ name, selector, element }, i) => {
      element.setAttribute("data-excat-block", String(i));
      return { name, selector };
    });
    const sections = (PAGE_TEMPLATE.sections || []).map((section, i) => {
      const target = (section.selector || []).map((s) => {
        try {
          return document.querySelector(s);
        } catch (e) {
          return null;
        }
      }).find(Boolean);
      if (!target) return section;
      target.setAttribute("data-excat-section", String(i));
      return __spreadProps(__spreadValues({}, section), { selector: [`[data-excat-section="${i}"]`] });
    });
    params.targets = { blocks, template: __spreadProps(__spreadValues({}, PAGE_TEMPLATE), { sections }) };
  }
  var LAZY_LISTS = [
    ".newslist .cmp-filterable-list__card",
    ".carousel.eventList .cmp-filterable-list__card",
    ".filterablelist.eventlist .cmp-filterable-list__card"
  ];
  var wait = (ms) => new Promise((r) => {
    setTimeout(r, ms);
  });
  function loadLazyLists(document) {
    return __async(this, null, function* () {
      const win = document.defaultView || window;
      for (let y = 0; y < document.body.scrollHeight; y += 400) {
        win.scrollTo(0, y);
        yield wait(250);
      }
      for (const selector of LAZY_LISTS) {
        const host = document.querySelector(selector.split(" ")[0]);
        if (host) {
          host.scrollIntoView();
          const start = Date.now();
          while (!document.querySelector(selector) && Date.now() - start < 15e3) yield wait(250);
          if (!document.querySelector(selector)) console.warn(`Lazy list did not load: ${selector}`);
        }
      }
      yield wait(2e3);
      win.scrollTo(0, 0);
    });
  }
  var import_home_default = {
    onLoad: (_0) => __async(null, [_0], function* ({ document }) {
      yield loadLazyLists(document);
    }),
    preprocess: (payload) => {
      if (CATALOG) markPageTargets(payload);
    },
    transform: (payload) => {
      const { document, url, params } = payload;
      const main = document.body;
      params.fragments = [];
      if (!params.targets) markPageTargets(payload);
      const pageBlocks = params.targets.blocks.map((block, i) => __spreadProps(__spreadValues({}, block), { element: document.querySelector(`[data-excat-block="${i}"]`) })).filter((block) => block.element);
      executeTransformers("beforeTransform", main, __spreadProps(__spreadValues({}, payload), { pageBlocks }), lateTransformers);
      pageBlocks.forEach((block) => {
        if (!main.contains(block.element)) return;
        const parser = parsers[block.name];
        if (!parser) return;
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      });
      executeTransformers("afterTransform", main, payload);
      main.appendChild(document.createElement("hr"));
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      params.fragments.forEach(({ element }) => {
        executeTransformers("afterTransform", element, payload, earlyTransformers);
        WebImporter.rules.transformBackgroundImages(element, document);
        WebImporter.rules.adjustImageUrls(element, url, params.originalURL);
      });
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) }
      }, ...params.fragments];
    }
  };
  return __toCommonJS(import_home_exports);
})();
