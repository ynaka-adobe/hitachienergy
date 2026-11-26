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

function detailsTable(data) {
  const rows = Object.entries(data || {}).map(([key, value]) => el(
    'tr',
    {},
    el('th', {}, key),
    el('td', {}, value == null ? '' : String(value)),
  ));
  return el('table', { class: 'details' }, el('tbody', {}, ...rows));
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
      el('td', { colspan: String(COLUMNS.length + 1) }, detailsTable(record.data)),
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
