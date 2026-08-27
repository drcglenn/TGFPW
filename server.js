// Peak Wellness SOAP note app.
//
// Flow: sign in -> pick a patient -> paste the dictation -> answer the gap
// questions -> review -> save into that patient's Google Drive folder.
//
// PHI handling, stated plainly:
//   - There is no database. None. Patient names come from Drive folder names,
//     read live on every request.
//   - Note content lives in memory only for the length of one request, then in
//     Google Drive. It is never written to disk and never written to logs.
//   - The only thing persisted outside Drive is a login cookie containing a
//     staff email address.

import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { OAuth2Client } from 'google-auth-library';

import { config, isOwner, driveIsConnected } from './lib/config.js';
import {
  verifyGoogleIdToken,
  createSessionCookie,
  clearSessionCookie,
  readSession,
  requireLogin,
} from './lib/auth.js';
import {
  listPatients,
  findOrCreatePatientFolder,
  getMostRecentNote,
  saveNote,
  checkDriveConnection,
  DRIVE_SCOPE,
} from './lib/drive.js';
import { analyzeDictation, generateNote, findRepeatedClinicalContent } from './lib/claude.js';
import { normalizePatientName, buildFileName } from './lib/naming.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.disable('x-powered-by');

// Cloud Run terminates TLS in front of us, so trust its forwarded headers when
// deciding whether the connection was secure.
app.set('trust proxy', true);

// --- Logging -----------------------------------------------------------------
// Method, path, status, duration. Deliberately never the body, the query, or
// any patient identifier, because Cloud Run logs are not a place PHI belongs.
app.use((req, res, next) => {
  const started = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${req.path} ${res.statusCode} ${Date.now() - started}ms`);
  });
  next();
});

app.use(express.static(path.join(here, 'public'), { maxAge: '1h' }));

// ---------------------------------------------------------------------------
// Health and identity
// ---------------------------------------------------------------------------

app.get('/healthz', (_req, res) => res.json({ ok: true }));

app.get('/api/config', (_req, res) => {
  res.json({ googleClientId: config.googleClientId });
});

app.get('/api/me', (req, res) => {
  const session = readSession(req);
  if (!session) return res.json({ signedIn: false });
  res.json({
    signedIn: true,
    email: session.email,
    name: session.name,
    isOwner: isOwner(session.email),
    driveConnected: driveIsConnected(),
  });
});

app.post('/api/auth/google', async (req, res) => {
  try {
    const user = await verifyGoogleIdToken(req.body?.credential);
    createSessionCookie(res, user);
    res.json({
      signedIn: true,
      email: user.email,
      name: user.name,
      isOwner: isOwner(user.email),
      driveConnected: driveIsConnected(),
    });
  } catch (err) {
    console.warn(`sign-in rejected: ${err.message}`);
    res.status(err.status || 401).json({ error: err.message });
  }
});

app.post('/api/auth/logout', (_req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// One-time Google Drive connection. Owner only.
//
// Google will only hand out a refresh token during an interactive consent, so
// this cannot be done from a config file. Sign in as the owner, click the
// button, approve, and paste the resulting token into Cloud Run.
// ---------------------------------------------------------------------------

function redirectUri(req) {
  const base = config.publicUrl || `${req.protocol}://${req.get('host')}`;
  return `${base.replace(/\/$/, '')}/setup/drive/callback`;
}

function requireOwner(req, res, next) {
  const session = readSession(req);
  if (!session) return res.status(401).send('Sign in first.');
  if (!isOwner(session.email)) {
    return res.status(403).send('Only the practice owner can connect Google Drive.');
  }
  req.user = session;
  next();
}

app.get('/setup/drive', requireOwner, (req, res) => {
  const oauth = new OAuth2Client({
    clientId: config.googleClientId,
    clientSecret: config.googleClientSecret,
    redirectUri: redirectUri(req),
  });
  const url = oauth.generateAuthUrl({
    access_type: 'offline', // this is what produces a refresh token
    prompt: 'consent', // force it, so re-running always yields a fresh one
    scope: [DRIVE_SCOPE],
    login_hint: config.ownerEmail,
  });
  res.redirect(url);
});

app.get('/setup/drive/callback', requireOwner, async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send(page('No authorization code came back from Google.'));

  try {
    const oauth = new OAuth2Client({
      clientId: config.googleClientId,
      clientSecret: config.googleClientSecret,
      redirectUri: redirectUri(req),
    });
    const { tokens } = await oauth.getToken(String(code));

    if (!tokens.refresh_token) {
      return res.status(400).send(
        page(
          'Google did not send a refresh token.',
          'This usually means the app was already authorized once. Go to ' +
            'myaccount.google.com/permissions, remove this app, then try again.',
        ),
      );
    }

    res.send(
      page(
        'Drive connected. One step left.',
        'Copy the value below into Cloud Run as an environment variable named ' +
          'DRIVE_REFRESH_TOKEN, then deploy. Treat it like a password: anyone ' +
          'holding it can reach your Drive. It is shown once and never stored by this app.',
        String(tokens.refresh_token),
      ),
    );
  } catch (err) {
    console.error(`drive connect failed: ${err.message}`);
    res.status(500).send(page('Could not finish connecting Drive.', err.message));
  }
});

function page(title, body = '', secret = '') {
  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
  return `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:44rem;margin:3rem auto;padding:0 1.25rem;line-height:1.6;color:#111">
<h1 style="font-size:1.35rem">${esc(title)}</h1>
${body ? `<p>${esc(body)}</p>` : ''}
${secret ? `<textarea readonly rows="4" style="width:100%;font-family:ui-monospace,Menlo,monospace;font-size:.85rem;padding:.75rem;border:1px solid #ccc;border-radius:6px">${esc(secret)}</textarea>` : ''}
<p><a href="/">Back to the app</a></p>`;
}

// ---------------------------------------------------------------------------
// Patients. Read straight from Drive folder names - there is no patient list
// stored anywhere in this app.
// ---------------------------------------------------------------------------

app.get('/api/patients', requireLogin, async (_req, res, next) => {
  try {
    res.json({ patients: await listPatients() });
  } catch (err) {
    next(err);
  }
});

app.post('/api/patients', requireLogin, async (req, res, next) => {
  try {
    const name = normalizePatientName(req.body?.name);
    const folder = await findOrCreatePatientFolder(name);
    res.json(folder);
  } catch (err) {
    next(err);
  }
});

app.get('/api/drive/status', requireLogin, async (_req, res) => {
  if (!driveIsConnected()) return res.json({ connected: false });
  try {
    const folder = await checkDriveConnection();
    res.json({ connected: true, folder });
  } catch (err) {
    res.json({ connected: false, error: err.message });
  }
});

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

// ---------------------------------------------------------------------------
// The note itself
// ---------------------------------------------------------------------------

app.post('/api/analyze', requireLogin, async (req, res, next) => {
  try {
    const { patientFolderId, patientName, dictation, visitDate, visitTime } = readNoteInput(req.body);

    const priorNote = await getMostRecentNote(patientFolderId);
    const analysis = await analyzeDictation({
      dictation,
      priorNote,
      patientName,
      visitDate,
      visitTime,
    });

    res.json({
      ...analysis,
      priorNote: priorNote
        ? { name: priorNote.name, createdTime: priorNote.createdTime }
        : null,
    });
  } catch (err) {
    next(err);
  }
});

app.post('/api/generate', requireLogin, async (req, res, next) => {
  try {
    const { patientFolderId, patientName, dictation, visitDate, visitTime } = readNoteInput(req.body);
    const answers = Array.isArray(req.body?.answers)
      ? req.body.answers
          .filter((a) => a && String(a.answer || '').trim())
          .map((a) => ({
            question: String(a.question || '').slice(0, 500),
            answer: String(a.answer || '').slice(0, 2000),
          }))
      : [];

    const priorNote = await getMostRecentNote(patientFolderId);
    const note = await generateNote({
      dictation,
      answers,
      priorNote,
      patientName,
      visitDate,
      visitTime,
    });

    const repeats = findRepeatedClinicalContent(priorNote?.text, note.html);

    res.json({
      html: note.html,
      complianceFlags: note.complianceFlags || [],
      repeatedContent: repeats,
      fileName: buildFileName(patientName, visitDate),
    });
  } catch (err) {
    next(err);
  }
});

app.post('/api/save', requireLogin, async (req, res, next) => {
  try {
    const patientFolderId = String(req.body?.patientFolderId || '').trim();
    const patientName = String(req.body?.patientName || '').trim();
    const visitDate = String(req.body?.visitDate || '').trim();
    const html = String(req.body?.html || '');

    if (!patientFolderId) throw badRequest('Pick a patient first.');
    if (!html.includes('<')) throw badRequest('There is no note to save yet.');

    const saved = await saveNote({
      patientFolderId,
      fileName: buildFileName(patientName, visitDate),
      html,
    });

    // Who saved what, and when. No clinical content.
    console.log(`note saved by ${req.user.email} -> file ${saved.id}`);

    res.json(saved);
  } catch (err) {
    next(err);
  }
});

function readNoteInput(body) {
  const patientFolderId = String(body?.patientFolderId || '').trim();
  const patientName = String(body?.patientName || '').trim();
  const dictation = String(body?.dictation || '').trim();
  const visitDate = String(body?.visitDate || '').trim();
  const visitTime = String(body?.visitTime || '').trim();

  if (!patientFolderId || !patientName) throw badRequest('Pick a patient first.');
  if (!dictation) throw badRequest('Type or paste the visit notes first.');
  if (dictation.length > 30000) throw badRequest('That dictation is too long. Split it up.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(visitDate)) throw badRequest('Pick a valid visit date.');

  return { patientFolderId, patientName, dictation, visitDate, visitTime };
}

// ---------------------------------------------------------------------------

app.use((err, _req, res, _next) => {
  // The message is safe to show; the stack is not logged with any request body.
  console.error(`error: ${err.message}`);
  res.status(err.status || 500).json({ error: err.message || 'Something went wrong.' });
});

app.listen(config.port, () => {
  console.log(`PW SOAP notes listening on ${config.port}`);
  console.log(`Drive connected: ${driveIsConnected() ? 'yes' : 'no - visit /setup/drive as the owner'}`);
});
