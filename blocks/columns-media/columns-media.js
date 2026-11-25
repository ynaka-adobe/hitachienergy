/**
 * Media/text split: one row, [image | eyebrow + heading + paragraphs + CTA].
 * Cells may be in either order; the image cell is detected and tagged.
 */
export default function decorate(block) {
  const cols = [...(block.firstElementChild?.children || [])];
  block.classList.add(`columns-media-${cols.length}-cols`);

  [...block.children].forEach((row) => {
    row.classList.add('columns-media-row');
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic && col.children.length === 1) {
        col.classList.add('columns-media-img-col');
        return;
      }
      col.classList.add('columns-media-text-col');
      // a short paragraph directly before the first heading is the eyebrow
      const heading = col.querySelector('h1, h2, h3, h4, h5, h6');
      const prev = heading?.previousElementSibling;
      if (prev && prev.tagName === 'P' && !prev.querySelector('a, picture')) {
        prev.classList.add('columns-media-eyebrow');
      }
    });
  });
}
