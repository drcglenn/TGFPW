// Login. Staff sign in with their existing Google account; only addresses on
// the allowlist get through. There are no passwords in this app to leak.
//
// The session is a small signed cookie holding an email address and an expiry.
// It holds NO patient information of any kind.

import crypto from 'node:crypto';
import { OAuth2Client } from 'google-auth-library';
import { config, isAllowedEmail } from './config.js';

const COOKIE_NAME = 'pw_session';
const SESSION_HOURS = 12;

const verifier = new OAuth2Client(config.googleClientId);

/**
 * Checks a "Sign in with Google" token and returns the person's identity,
 * but only if their address is on the allowlist.
 */
export async function verifyGoogleIdToken(idToken) {
  const ticket = await verifier.verifyIdToken({
    idToken,
    audience: config.googleClientId,
  });
  const payload = ticket.getPayload();

  if (!payload?.email) {
    throw new Error('Google did not return an email address for that account.');
  }
  if (!payload.email_verified) {
    throw new Error('That Google account does not have a verified email address.');
  }

  const email = payload.email.toLowerCase();
  if (!isAllowedEmail(email)) {
    // Deliberately vague to the browser; the real reason is logged server-side.
    const err = new Error('That account is not authorized to use this app.');
    err.status = 403;
    throw err;
  }

  return { email, name: payload.name || email, picture: payload.picture || '' };
}

// --- Signed cookie -----------------------------------------------------------

function sign(value) {
  return crypto.createHmac('sha256', config.sessionSecret).update(value).digest('base64url');
}

// Compares two strings without leaking, through timing, how much of the
// signature was correct.
function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function createSessionCookie(res, user) {
  const session = {
    email: user.email,
    name: user.name,
    exp: Date.now() + SESSION_HOURS * 60 * 60 * 1000,
  };
  const body = Buffer.from(JSON.stringify(session)).toString('base64url');
  const token = `${body}.${sign(body)}`;

  res.cookie(COOKIE_NAME, token, {
    httpOnly: true, // JavaScript on the page cannot read it
    secure: !config.insecureCookies, // only sent over https
    sameSite: 'lax',
    maxAge: SESSION_HOURS * 60 * 60 * 1000,
    path: '/',
  });
}

export function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME, { path: '/' });
}

export function readSession(req) {
  const raw = req.cookies?.[COOKIE_NAME];
  if (!raw) return null;

  const [body, signature] = raw.split('.');
  if (!body || !signature) return null;
  if (!safeEqual(signature, sign(body))) return null;

  let session;
  try {
    session = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch {
    return null;
  }

  if (!session.exp || session.exp < Date.now()) return null;

  // Re-check the allowlist on every request, so removing someone from
  // ALLOWED_EMAILS locks them out immediately instead of at cookie expiry.
  if (!isAllowedEmail(session.email)) return null;

  return session;
}

/** Express middleware: blocks anything that is not a signed-in staff member. */
export function requireLogin(req, res, next) {
  const session = readSession(req);
  if (!session) {
    return res.status(401).json({ error: 'Please sign in again.' });
  }
  req.user = session;
  next();
}
