const HEADING = /^H[1-6]$/;

/**
 * Split a meta line ("*Press Release* | 20.11.2026 | 4 min read") into the
 * tag chip and a wrapper of info parts; the "|" separators are drawn in CSS.
 * @param {Element} meta the meta paragraph
 */
function decorateMeta(meta) {
  const tag = meta.querySelector('em, strong, code');
  if (tag) tag.classList.add('cards-news-list-tag');
  const parts = [...meta.childNodes]
    .filter((node) => node !== tag)
    .map((node) => node.textContent)
    .join('')
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean);
  if (!parts.length) return;
  const info = document.createElement('span');
  info.className = 'cards-news-list-info';
  parts.forEach((part) => {
    const span = document.createElement('span');
    span.textContent = part;
    info.append(span);
  });
  meta.replaceChildren(...(tag ? [tag] : []), info);
}

/**
 * Text-only news list: one row per item. Cells hold the title (linked to the
 * detail page) and a meta line (tag | date | read time). The whole row is
 * clickable through the title link.
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'cards-news-list-item';
    const body = document.createElement('div');
    body.className = 'cards-news-list-item-body';
    [...row.children].forEach((cell) => {
      if (!cell.children.length && cell.textContent.trim()) {
        const p = document.createElement('p');
        p.textContent = cell.textContent.trim();
        body.append(p);
        return;
      }
      while (cell.firstElementChild) body.append(cell.firstElementChild);
    });

    const parts = [...body.children];
    const title = parts.find((el) => HEADING.test(el.tagName)) || parts[0];
    if (title) title.classList.add('cards-news-list-title');
    parts.filter((el) => el !== title).forEach((el) => {
      el.classList.add('cards-news-list-meta');
      decorateMeta(el);
    });

    const link = title?.querySelector('a') || body.querySelector('a');
    if (link) {
      link.classList.add('cards-news-list-link');
      link.classList.remove('button');
      link.closest('.button-container')?.classList.remove('button-container');
    }
    const arrow = document.createElement('span');
    arrow.className = 'cards-news-list-arrow';
    arrow.setAttribute('aria-hidden', 'true');

    li.append(body, arrow);
    ul.append(li);
  });
  block.replaceChildren(ul);
}
