/*
 * Warranty Submissions — DA app that lists warranty / complaint / return
 * form submissions stored by the per-user-metadata "warranty-list" App Builder
 * action. The action requires an Adobe IMS token, so this uses the DA SDK token.
 */
// eslint-disable-next-line import/no-unresolved
import DA_SDK from 'https://da.live/nx/utils/sdk.js';

const LIST_URL = 'https://332794-perusermetadata.adobeioruntime.net/api/v1/web/per-user-metadata/warranty-list';
// IMS org of the App Builder project; required by require-adobe-auth.
const IMS_ORG = '21BD487E5F2280130A495ECC@AdobeOrg';
const COLUMNS = [
  ['timestamp', 'Submitted'],
  ['caseId', 'Case ID'],
  ['requestType', 'Type'],
  ['company', 'Company'],
  ['country', 'Country'],
  ['customerType', 'Customer type'],
];

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (value === false || value == null) return;
    if (key === 'class') node.className = value;
    else if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
    else node.setAttribute(key, value === true ? '' : value);
  });
  node.append(...children.filter((c) => c != null));
  return node;
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? (value || '') : date.toLocaleString();
}

function cellValue(record, key) {
  if (key === 'timestamp') return formatDate(record.timestamp);
  const value = record[key];
  return value == null ? '—' : String(value);
}

// Detail view groups; any unlisted form field is shown in the "fallback" group.
const DETAIL_GROUPS = [
  {
    title: 'Request info',
    fields: [
      ['request_type', 'Request type'],
      ['reference_number', 'Reference number'],
      ['product_type', 'Product type'],
      ['serial_number', 'Serial number'],
      ['quantity', 'Quantity'],
      ['delivery_date', 'Delivery date'],
      ['incident_date', 'Incident date'],
    ],
    fallback: true,
  },
  {
    title: 'User info',
    fields: [
      ['company_name', 'Company'],
      ['country', 'Country'],
      ['customer_type', 'Customer type'],
      ['contact_name', 'Contact name'],
      ['email', 'Email'],
      ['phone', 'Phone'],
    ],
  },
  {
    title: 'Summary',
    fields: [
      ['caseId', 'Case ID'],
      ['timestamp', 'Submitted'],
      ['consent', 'Consent'],
    ],
  },
  {
    title: 'Message',
    fields: [
      ['subject', 'Subject'],
      ['description', 'Description'],
      ['attachments', 'Attachments'],
    ],
  },
];

const VALUE_LABELS = {
  request_type: { warranty: 'Warranty claim', complaint: 'Complaint', return: 'Return' },
  customer_type: {
    internal_hitachi: 'Internal (Hitachi)',
    external_oem: 'External – OEM',
    external_other: 'External – other',
  },
  consent: { yes: 'Given', true: 'Given' },
};

let regionNames;
function countryName(code) {
  if (!/^[a-z]{2}$/i.test(code)) return humanize(code);
  try {
    regionNames ??= new Intl.DisplayNames(['en'], { type: 'region' });
    return `${regionNames.of(code.toUpperCase())} (${code.toUpperCase()})`;
  } catch {
    return code.toUpperCase();
  }
}

function humanize(value) {
  const text = String(value).replace(/_/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function displayValue(key, value) {
  if (value == null || value === '') return null;
  if (key === 'timestamp') return formatDate(value);
  if (key === 'country') return countryName(String(value));
  const labels = VALUE_LABELS[key];
  if (labels) return labels[String(value).toLowerCase()] || humanize(value);
  return String(value);
}

function valueNode(key, text) {
  if (key === 'email') return el('a', { href: `mailto:${text}` }, text);
  if (key === 'phone') return el('a', { href: `tel:${text.replace(/[^\d+]/g, '')}` }, text);
  return text;
}

function detailsView(record) {
  const data = { ...(record.data || {}), caseId: record.caseId, timestamp: record.timestamp };
  const known = new Set(DETAIL_GROUPS.flatMap((g) => g.fields.map(([key]) => key)));
  const extras = Object.keys(data)
    .filter((key) => !known.has(key) && !key.startsWith('__'))
    .map((key) => [key, humanize(key)]);
  const requestType = displayValue('request_type', data.request_type);

  const columns = DETAIL_GROUPS.map((group) => {
    const fields = group.fallback ? [...group.fields, ...extras] : group.fields;
    const items = fields.flatMap(([key, label]) => {
      const text = displayValue(key, data[key]);
      if (text == null) return [];
      return [el('dt', {}, label), el('dd', { class: `field-${key}` }, valueNode(key, text))];
    });
    return el(
      'section',
      { class: 'detail-col' },
      el('h3', {}, group.title),
      items.length ? el('dl', {}, ...items) : el('p', { class: 'none' }, 'No details'),
    );
  });
  // Show the request type as a badge on the summary column instead of repeating the field.
  if (requestType) {
    columns[2].querySelector('h3').append(' ', el('span', { class: `badge badge-${String(data.request_type).toLowerCase()}` }, requestType));
  }
  return el('div', { class: 'details' }, ...columns);
}

function renderTable(container, submissions, filter) {
  const term = filter.trim().toLowerCase();
  const matches = submissions.filter((s) => !term
    || JSON.stringify(s).toLowerCase().includes(term));
  const body = el('tbody');
  matches.forEach((record) => {
    const detailRow = el(
      'tr',
      { class: 'detail-row', hidden: true },
      el('td', { colspan: String(COLUMNS.length + 1) }, detailsView(record)),
    );
    const toggle = el('button', {
      type: 'button',
      class: 'toggle',
      'aria-expanded': 'false',
      onclick: () => {
        detailRow.hidden = !detailRow.hidden;
        toggle.setAttribute('aria-expanded', String(!detailRow.hidden));
        toggle.textContent = detailRow.hidden ? 'View' : 'Hide';
      },
    }, 'View');
    body.append(
      el('tr', {}, ...COLUMNS.map(([key]) => el('td', {}, cellValue(record, key))), el('td', {}, toggle)),
      detailRow,
    );
  });
  const head = el('thead', {}, el('tr', {}, ...COLUMNS.map(([, label]) => el('th', {}, label)), el('th', {}, 'Details')));
  container.replaceChildren(matches.length
    ? el('table', { class: 'submissions' }, head, body)
    : el('p', { class: 'empty' }, submissions.length ? 'No submissions match the filter.' : 'No submissions yet.'));
}

async function fetchSubmissions(token, limit) {
  const resp = await fetch(`${LIST_URL}?limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}`, 'x-gw-ims-org-id': IMS_ORG },
  });
  const body = await resp.json().catch(() => ({}));
  if (!resp.ok || body.success === false) {
    throw new Error(body.error || body.message || `HTTP ${resp.status}`);
  }
  return body.submissions || [];
}

async function init() {
  const { token } = await DA_SDK;
  const status = el('p', { class: 'status', role: 'status' });
  const results = el('div', { class: 'results' });
  const filter = el('input', { type: 'search', placeholder: 'Filter (case ID, company, email…)', 'aria-label': 'Filter submissions' });
  const limit = el('select', { 'aria-label': 'Number of submissions' }, ...[25, 50, 100].map((n) => el('option', { value: String(n) }, `Last ${n}`)));
  limit.value = '50';
  let submissions = [];

  const load = async () => {
    status.textContent = 'Loading…';
    status.classList.remove('error');
    try {
      submissions = await fetchSubmissions(token, limit.value);
      status.textContent = `${submissions.length} submission${submissions.length === 1 ? '' : 's'}`;
      renderTable(results, submissions, filter.value);
    } catch (err) {
      status.textContent = `Could not load submissions: ${err.message}`;
      status.classList.add('error');
    }
  };

  filter.addEventListener('input', () => renderTable(results, submissions, filter.value));
  limit.addEventListener('change', load);

  document.body.append(
    el('h2', {}, 'Warranty Submissions'),
    el('p', { class: 'description' }, 'Warranty claims, complaints and returns submitted through the Warranty & Returns form. Contains customer data — handle accordingly.'),
    el('div', { class: 'toolbar' }, filter, limit, el('button', { type: 'button', class: 'primary', onclick: load }, 'Refresh')),
    status,
    results,
  );
  load();
}

init();
