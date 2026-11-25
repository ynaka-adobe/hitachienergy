/* eslint-disable */
/* global WebImporter */

/**
 * Hitachi Energy Power Portal sections transformer.
 *
 * beforeTransform: inserts <hr> section breaks (reverse order) before every
 * non-first section while the parser target elements still exist. Styled
 * sections get a temporary data-excat-section-id marker on their <hr>; a
 * styled first section gets a temporary marked <hr> too.
 *
 * afterTransform: inserts Section Metadata blocks after each marker (or the
 * surviving section element), removes marker attributes and drops the first
 * section's temporary <hr>.
 */

const MARKER_ATTR = 'data-excat-section-id';

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

export default function transform(hookName, element, payload) {
  const template = payload && payload.template;
  const sections = template && Array.isArray(template.sections) ? template.sections : [];
  if (sections.length < 2) return;

  const document = element.ownerDocument;

  if (hookName === 'beforeTransform') {
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      const sectionEl = findSectionElement(element, section);
      if (!sectionEl) continue;

      const isFirst = i === 0;
      if (isFirst && !section.style) continue;

      const hr = document.createElement('hr');
      if (section.style) hr.setAttribute(MARKER_ATTR, section.id);
      sectionEl.parentNode.insertBefore(hr, sectionEl);
    }
  }

  if (hookName === 'afterTransform') {
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (!section.style) continue;

      const metadata = WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells: { style: section.style },
      });

      const marker = element.querySelector(`hr[${MARKER_ATTR}="${section.id}"]`);
      if (marker) {
        // Section Metadata goes at the end of its section: just before the
        // next section break, or at the end of the parent.
        let end = marker.nextElementSibling;
        while (end && end.tagName !== 'HR') end = end.nextElementSibling;
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
