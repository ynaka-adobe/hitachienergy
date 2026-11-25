# cards-promo

Custom **cards** block. Purpose: promo.

## Authoring (Document Authoring)

Model: `collection`

Repeating rows — one row per item. Each item: per card: feature image + title + body + CTA.

Body cell decoration:
- A paragraph before the title with `|`-separated text (e.g. `Webinar | Rail | Digitalization`) renders as tag chips (max two rows).
- The title link covers the whole card (card is clickable; hover turns the title and arrow red).
- A trailing standalone link (e.g. `Watch now`) renders as a dark 24px arrow square at the bottom right; its text stays as an accessible label.

Layout: 1 column, 2 columns from 600px, 3 columns from 960px (source breakpoints).

## Supported variations

No variations.

## Universal Editor fields

N/A (Document Authoring project)
