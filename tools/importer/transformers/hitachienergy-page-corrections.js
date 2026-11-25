/* eslint-disable */
/* global WebImporter */
// Persisted content edits (excat-persist-content-edit). Page corrections run on the page body for
// their URL; fragment corrections run on a fragment the import splits out, whichever page writes it.
// Keep `export default` the only export: the transformer save hook loads this file as a classic script.

// Homepage image descriptions, keyed by Dynamic Media asset path.
const HOMEPAGE_ALT_TEXT = {
  "/adobe/assets/urn:aaid:aem:d04ffb1b-447d-4d40-af98-07a50218f440/as/adobestock_234921686.jpg": "Close-up of a wind turbine nacelle and blades against a bright sky, with more turbines on the hills behind",
  "/adobe/assets/urn:aaid:aem:47abd499-0af1-437b-a93b-faf4aa69e2e9/as/portal-image1a.jpg": "Rows of solar panels on a hillside next to a green forest",
  "/adobe/assets/urn:aaid:aem:8d1ad41f-0a78-4c32-b83f-226a4773984e/as/portal-image2a.jpg": "High-voltage transmission tower at sunset with a city skyline behind it",
  "/adobe/assets/urn:aaid:aem:f6cc9f31-9a31-4593-b8a5-c31c54513e53/as/portal-image3.jpg": "Engineers in hard hats and high-visibility jackets reviewing data on a tablet",
  "/adobe/assets/urn:aaid:aem:7ce1f2fd-aa21-4c89-b95d-20fe1b69cfa1/as/portal-image-hz-teaser.jpg": "Smiling business partners shaking hands at a networking event",
  "/adobe/assets/urn:aaid:aem:97cdc3ae-5617-42b4-9d18-6eae2c738d1a/as/GPG.jpg": "Large power transformer at an outdoor substation",
  "/adobe/assets/urn:aaid:aem:b05b35c9-f688-4ea8-8512-6a213377565a/as/hva-2025-banner.jpg": "Three colleagues talking beside transformer bushings in a factory hall",
  "/adobe/assets/urn:aaid:aem:ca122367-6cee-4a4e-888b-57b197524acc/as/uncovering-the-new-operating-reality-of-distribution-grids-1200x1200.png": "City skyline at night with streaks of colourful light across the water",
  "/adobe/assets/urn:aaid:aem:689a16bf-f869-4cb5-a827-f27a1c50be82/as/1_Virtuplan_cropped-photo_1200x1200_20260812_MP.png": "Hand reaching towards a glowing digital interface over a city at dusk",
  "/adobe/assets/urn:aaid:aem:19788a17-9e3e-4995-8d31-8ecd84f375ca/as/656_fy25_bu_page-banners_transformer-connect-11-945x945.jpg": "Collage of a glowing energy sphere, a city at night and a person looking out over it",
  "/adobe/assets/urn:aaid:aem:2077d9b8-98bd-455b-b509-cb4e97980175/as/HE_VR_Responsive_1200x1200.png": "Two distribution transformers in front of a compact substation building",
  "/adobe/assets/urn:aaid:aem:1b4c7a75-a044-4b28-a17e-26c0707a1c79/as/414-FY25-BU-Banners-Transformer-Connect-3840x1028.jpg": "Row of transformer components and bushings on a grey background",
  "/adobe/assets/urn:aaid:aem:d1472709-b087-4f19-a6e8-f3311f7163e9/as/GettyImages-2149037448.jpg": "Abstract swirl of blue and red light around a glowing sphere",
  "/adobe/assets/urn:aaid:aem:85bbafa5-7e0a-4211-ac68-9905f582dbd2/as/gettyimages-1178919282_original_flipped.jpg": "Wind turbine above a large solar farm at sunset",
  "/adobe/assets/urn:aaid:aem:0eccb390-69e4-472a-926f-9609241d270f/as/tc-events-page-banner-2880x1125px-copy.jpg": "Collage of two engineers in safety gear, a power transformer and an engineer in a blue hard hat",
  "/adobe/assets/urn:aaid:aem:21da7398-4b43-44be-96f6-43519450176b/as/trains-19-_original.jpg": "High speed intercity train traveling through autumn forest",
  "/adobe/assets/urn:aaid:aem:020df925-a66f-4fcd-adf7-a7eda9aee1f8/as/2024_tc-8_events-page-banner-2880x1125px_v2_withouttext.jpg": "Collage of a digital globe, two engineers with a tablet, and a hand holding a glowing light bulb",
  "/adobe/assets/urn:aaid:aem:86aac9f3-958e-4ca8-9765-606f15e1509c/as/gettyimages-490774222-1-.jpg": "View of a contemporary glass skyscraper reflecting the blue sky",
  "/adobe/assets/urn:aaid:aem:44ca04c2-a7fd-4ae6-9867-f3e8bd9a93cb/as/hvdc-future-station5.jpg": "Village surrounded by green countryside and hills under a blue sky",
  "/adobe/assets/urn:aaid:aem:95225e23-c48d-4666-bdb6-7333e95566d2/as/APM_banner.jpg": "Outdoor substation with transformers and switchgear",
  "/adobe/assets/urn:aaid:aem:e306d668-9fc3-45e5-b027-7ee6c853f2dc/as/SAM600_banner.jpg": "Engineer in an orange high-visibility vest working on substation equipment",
  "/adobe/assets/urn:aaid:aem:849f997c-a925-440b-af2f-3f6b95fa7e29/as/Beautiful-summer-wind-turbine-Colfax-Washington-United-States-USA.jpeg": "Wind turbines on rolling green hills",
  "/adobe/assets/urn:aaid:aem:c0bd3dbf-1ba5-4baf-86eb-026be5ae81a2/as/adobestock_120137915-original.jpeg": "Power station on blue sky at daytime",
  "/adobe/assets/urn:aaid:aem:0ee1964b-f8c0-448a-b800-55436512056f/as/transformer-connect-feb-2024-hero-image-new.jpg": "Row of wind turbines along a coastline at sunset",
  "/adobe/assets/urn:aaid:aem:51b401bc-2621-45ac-9d20-e227d393c66b/as/key-image-shutterstock-350398172_original.jpeg": "Aerial cityscape view of San Francisco, California, USA",
  "/adobe/assets/urn:aaid:aem:da179c56-bf91-4497-ba90-a784d1ce2311/as/electrical-engineers-with-high-voltage-in-the-background.jpg": "Two engineers walking along a boardwalk through a high-voltage substation",
  "/adobe/assets/urn:aaid:aem:34ac1c11-6e9d-409d-b192-ea9caff59d69/as/event-transformer-connet-2023.png": "Technicians working on top of a large power transformer",
  "/adobe/assets/urn:aaid:aem:af797104-28e0-40d5-8129-234f44ec1baa/as/email-i_registration-page_image-%E2%80%94-kopia.jpg": "Hiker standing on a mountain ridge at sunrise, surrounded by a glowing green ring",
  "/adobe/assets/urn:aaid:aem:7e46e7a8-8a74-4b8d-a123-ba7968caee4a/as/easydry-webinar-landing-page-banner.jpg": "Abstract lines of pink and red light on a dark background",
  "/adobe/assets/urn:aaid:aem:4983e961-e39b-46e3-90be-65822596c387/as/0494-utilities-01c-8k-final-transformer-connect-1.jpg": "Engineer with a tablet inspecting a transformer at an outdoor substation",
  "/adobe/assets/urn:aaid:aem:5e574a79-3279-4c03-817c-1cf1dd942a4d/as/Mining-roundtable-creative-mining-solar.jpg": "Red illustration of a sunny landscape with a mine, solar panels and wireless signals",
  "/adobe/assets/urn:aaid:aem:b0a00315-4185-4457-a351-f2391a97d27e/as/hitachi-energy-inflation-reduction-act.jpg": "City skyline at dusk behind a field of solar panels",
  "/adobe/assets/urn:aaid:aem:2a8ef7a0-c5b5-4147-91c4-63b5e32ca754/as/transformer-connect-2-banner-image.jpg": "Two workers in high-visibility clothing inside a substation",
  "/adobe/assets/urn:aaid:aem:8b6acef8-b4c2-465a-93e5-7b2261a5994e/as/hvdc-future-station5.jpg": "Village in a green valley with hills in the background",
  "/adobe/assets/urn:aaid:aem:5a091ca0-3a92-4784-965b-f482dbb463e8/as/hitachi-energy-data-centre-world-frankfurt-1363031090-2880x585.jpg": "Rows of server racks in a data centre lit in pink and blue",
  "/adobe/assets/urn:aaid:aem:a7f0c811-3e58-4a54-9af2-60f9416bde34/as/transformer-connect-banner-events-webinar.jpg": "Outdoor substation with transformers and steel structures",
  "/adobe/assets/urn:aaid:aem:3ea6a509-00b1-4eb4-aac8-1e3432a029d0/as/hitachi-energy-webinar-eshaping-the-role-of-distribution-utilities-2880x1125.png": "Aerial view of a neighbourhood with a large solar panel installation by the water",
  "/adobe/assets/urn:aaid:aem:b6c40407-318f-4627-90bb-647c47f1b1de/as/webinar-14-03-22-press-67-1920x1080-2.jpg": "Panel of speakers on stage in front of screens reading Powering the future of public transport",
  "/adobe/assets/urn:aaid:aem:43020b2a-1443-4ebd-8d80-233a865a729a/as/hitachi-energy-economist-impact-flexibility-and-resilience.png": "Green paper pinwheel on a pale yellow background",
  "/adobe/assets/urn:aaid:aem:34c0f587-30cf-4b68-86e2-82af98267d40/as/key-visual-airrip-flex-webinar-final-1920x540-002-.jpg": "Transformer bushing with grey ribbed insulator",
  "/adobe/assets/urn:aaid:aem:f2dab6c6-7c4b-447e-8820-deaaa0136560/as/pcm600-1920x664a-new.jpg": "Presenter seated with a laptop in front of protection and control cabinets",
  "/adobe/assets/urn:aaid:aem:1c85ab2a-f6e7-479c-87ad-93e55f9dd01f/as/control-center-scada.jpg": "Two operators analysing grid maps on large screens in a control room",
  "/adobe/assets/urn:aaid:aem:7b7cb6b1-c156-4482-9eb1-0f2b950d8430/as/image-based-inspections.jpg": "Worker in a hard hat watching a drone inspect a transmission tower at sunset",
  "/adobe/assets/urn:aaid:aem:2d10b2bf-ff01-4394-bc2b-bfe1a101fd84/as/data-centers-copy.jpg": "Data centre server racks opening onto a green mountain landscape",
  "/adobe/assets/urn:aaid:aem:4f93a20f-8bcd-4b90-a72f-9fadec145088/as/shutterstock-142414078.jpg": "Steel transmission tower and power lines seen from below against a sunset sky",
  "/adobe/assets/urn:aaid:aem:3b9ef639-22d5-4bfc-954c-1b85d0efefca/as/econiq-shutterstock-1170011566-copy.jpg": "Fjord with a small town between steep green mountains",
  "/adobe/assets/urn:aaid:aem:7f236ce6-d144-4ec9-ab3d-d591b741fd32/as/renewable-systems.jpg": "Wind turbines behind rows of solar panels at sunset",
  "/adobe/assets/urn:aaid:aem:1f7e621d-f3ed-44b2-9742-317a34c92231/as/skyline.jpg": "Illuminated city at night under a glowing grid of light",
  "/adobe/assets/urn:aaid:aem:150e4893-da93-45db-b84b-a4866fa317cd/as/grid-resilience-in-an-electrified-world.png": "Transmission towers silhouetted against an orange sky with a wildfire burning below",
  "/adobe/assets/urn:aaid:aem:37d99bbe-13a5-4689-a3bb-16c1c8561606/as/hitachi-power-grids-dam-1623x624.png": "Aerial view of a dam wall between a reservoir and forest",
  "/adobe/assets/urn:aaid:aem:4e05994f-f137-461f-a015-17162253f317/as/asset-management.jpg": "Hand holding a tablet surrounded by connected digital icons",
  "/adobe/assets/urn:aaid:aem:dcc317f5-c000-44d4-834d-65228f3e296c/as/hitachi-energy-1206996091-lowres.jpg": "Three colleagues smiling while looking at a laptop together"
};

const CORRECTIONS = {
  // '<page URL: origin and path, no trailing slash, query or hash>': [(main, document) => { ... }],
  'https://powerportal.hitachienergy.com': [
    // Accessible heading order: "Ready to Access Everything You Need?" is a level-3 heading, not level 4.
    (main, document) => main.querySelectorAll('h4').forEach((h) => {
      if (h.textContent.trim() !== 'Ready to Access Everything You Need?') return;
      const h3 = document.createElement('h3');
      [...h.attributes].forEach(({ name, value }) => h3.setAttribute(name, value));
      h3.append(...h.childNodes);
      h.replaceWith(h3);
    }),
    // Image descriptions: Dynamic Media images become <a href="DM-URL">alt</a> before this runs.
    (main) => main.querySelectorAll('a[href*="/adobe/assets/urn:"]').forEach((a) => {
      let path;
      try { path = new URL(a.getAttribute('href')).pathname; } catch { return; }
      const text = HOMEPAGE_ALT_TEXT[path];
      if (text && a.textContent.trim() !== text) a.textContent = text;
    }),
  ],
};

const FRAGMENT_CORRECTIONS = {
  // '<fragment document path, e.g. fragments/authors/jane-doe>': [(fragment, document) => { ... }],
};

const pageKey = (u) => {
  try { const { origin, pathname } = new URL(u); return `${origin}${pathname.replace(/\/$/, '')}`; }
  catch { return u; }
};

// The fragment's document path as the import saves it: no `.`, empty or trailing segments.
const fragmentKey = (p) => String(p).replace(/\\/g, '/').replace(/\.plain\.html$/, '').split('/')
  .reduce((parts, part) => {
    if (part === '..') parts.pop();
    else if (part && part !== '.') parts.push(part);
    return parts;
  }, [])
  .join('/');

function applyCorrections(element, payload, pageCorrections, fragmentCorrections) {
  const { document, params } = payload || {};
  if (!document || !params) return;
  if (element === document.body) {
    if (!params.originalURL) return;
    (pageCorrections[pageKey(params.originalURL)] || []).forEach((fix) => fix(element, document));
    return;
  }
  const fragment = (params.fragments || []).find((f) => f.element === element);
  if (!fragment || typeof fragment.path !== 'string') return;
  (fragmentCorrections[fragmentKey(fragment.path)] || []).forEach((fix) => fix(element, document));
}

export default function transform(hookName, element, payload) {
  if (hookName !== 'afterTransform') return;
  applyCorrections(element, payload, CORRECTIONS, FRAGMENT_CORRECTIONS);
}
