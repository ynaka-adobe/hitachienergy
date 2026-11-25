/*
 * Okta sign-in (OIDC Authorization Code + PKCE) for header personalization.
 * Browser-only: no client secret. This is NOT content security — pages are
 * public; the signed-in state is only used to personalize the UI.
 */

export const OKTA_CONFIG = {
  issuer: 'https://trial-5076725.okta.com',
  clientId: '0oa18l1budg5m7Fnh698',
  scopes: 'openid profile email',
  redirectPath: '/auth/callback',
};

const SESSION_KEY = 'okta-session';
const TX_KEY = 'okta-tx';

const endpoint = (name) => `${OKTA_CONFIG.issuer}/oauth2/v1/${name}`;
const redirectUri = () => `${window.location.origin}${OKTA_CONFIG.redirectPath}`;

export function isCallback() {
  return window.location.pathname === OKTA_CONFIG.redirectPath;
}

function base64Url(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function randomString(size = 32) {
  return base64Url(crypto.getRandomValues(new Uint8Array(size)));
}

function decodeJwtPayload(jwt) {
  const payload = jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  const json = decodeURIComponent(atob(payload).split('')
    .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`).join(''));
  return JSON.parse(json);
}

function safeReturnPath(path) {
  return typeof path === 'string' && path.startsWith('/') && !path.startsWith('//') ? path : '/';
}

/**
 * Builds the Okta authorize URL and stores the PKCE transaction.
 * @returns {Promise<string>}
 */
export async function buildAuthorizeUrl() {
  const verifier = randomString(48);
  const challenge = base64Url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
  const state = randomString();
  const nonce = randomString();
  const { pathname, search, hash } = window.location;
  sessionStorage.setItem(TX_KEY, JSON.stringify({
    verifier, state, nonce, returnTo: `${pathname}${search}${hash}`,
  }));
  const params = new URLSearchParams({
    client_id: OKTA_CONFIG.clientId,
    response_type: 'code',
    scope: OKTA_CONFIG.scopes,
    redirect_uri: redirectUri(),
    state,
    nonce,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });
  return `${endpoint('authorize')}?${params}`;
}

export async function signIn() {
  window.location.assign(await buildAuthorizeUrl());
}

/**
 * @returns {object|null} ID token claims of the signed-in user
 */
export function getUser() {
  try {
    const session = JSON.parse(sessionStorage.getItem(SESSION_KEY));
    if (session?.claims && session.claims.exp * 1000 > Date.now()) return session.claims;
  } catch (e) { /* fall through */ }
  sessionStorage.removeItem(SESSION_KEY);
  return null;
}

export function signOut() {
  let idToken;
  try {
    idToken = JSON.parse(sessionStorage.getItem(SESSION_KEY))?.idToken;
  } catch (e) { /* noop */ }
  sessionStorage.removeItem(SESSION_KEY);
  if (!idToken) {
    window.location.reload();
    return;
  }
  const params = new URLSearchParams({
    id_token_hint: idToken,
    post_logout_redirect_uri: `${window.location.origin}/`,
  });
  window.location.assign(`${endpoint('logout')}?${params}`);
}

/**
 * Completes the redirect from Okta: validates state, exchanges the code
 * (PKCE), validates the ID token claims, stores the session and returns
 * the user to the page where sign-in started.
 */
export async function handleCallback() {
  const query = new URLSearchParams(window.location.search);
  let tx = {};
  try {
    tx = JSON.parse(sessionStorage.getItem(TX_KEY)) || {};
  } catch (e) { /* noop */ }
  sessionStorage.removeItem(TX_KEY);
  const returnTo = safeReturnPath(tx.returnTo);

  try {
    if (query.get('error')) throw new Error(`${query.get('error')}: ${query.get('error_description') || ''}`);
    if (!query.get('code') || !tx.state || query.get('state') !== tx.state) throw new Error('Invalid state');

    const resp = await fetch(endpoint('token'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: OKTA_CONFIG.clientId,
        redirect_uri: redirectUri(),
        code: query.get('code'),
        code_verifier: tx.verifier,
      }),
    });
    const tokens = await resp.json();
    if (!resp.ok || !tokens.id_token) throw new Error(tokens.error_description || 'Token exchange failed');

    const claims = decodeJwtPayload(tokens.id_token);
    if (claims.nonce !== tx.nonce) throw new Error('Invalid nonce');
    if (claims.iss !== OKTA_CONFIG.issuer) throw new Error('Invalid issuer');
    if (claims.aud !== OKTA_CONFIG.clientId) throw new Error('Invalid audience');
    if (claims.exp * 1000 <= Date.now()) throw new Error('Token expired');

    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      idToken: tokens.id_token, accessToken: tokens.access_token, claims,
    }));
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Okta sign-in failed', e);
  }
  window.location.replace(returnTo);
}
