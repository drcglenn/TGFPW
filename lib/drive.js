// Google Drive. This is the ONLY place patient information is stored.
//
// The app connects to Drive as Dr. Glenn, using a refresh token he grants once
// during setup. That means every note is created by, and owned by, his account
// and lands in his existing folders exactly as if he had made it by hand.
//
// Layout, unchanged from the existing practice workflow:
//   PW Patient Resources / Documentation / "Lastname, Firstname" / <notes>

import { OAuth2Client } from 'google-auth-library';
import { config } from './config.js';

const DRIVE_FILES = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files';
const FOLDER_MIME = 'application/vnd.google-apps.folder';
const DOC_MIME = 'application/vnd.google-apps.document';

// This app asks for one scope, and it is the broad one: read/write across the
// whole Drive.
//
// The narrower `drive.file` scope only reaches files an app created itself. The
// Documentation folder and every existing patient folder pre-date this app, so
// `drive.file` cannot even list them. There is no middle scope that grants
// "this folder and its contents".
//
// So this is a real tradeoff, stated plainly rather than buried: the refresh
// token from setup can reach the entire Drive of the account that granted it.
// The app itself only ever touches the Documentation folder, but the permission
// is broader than what the app uses. Guard the token accordingly.
export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive';

let cachedClient = null;

function driveClient() {
  if (!config.driveRefreshToken) {
    const err = new Error(
      'Google Drive is not connected yet. Sign in as the owner and click "Connect Google Drive".',
    );
    err.status = 503;
    throw err;
  }
  if (!cachedClient) {
    cachedClient = new OAuth2Client({
      clientId: config.googleClientId,
      clientSecret: config.googleClientSecret,
    });
    cachedClient.setCredentials({ refresh_token: config.driveRefreshToken });
  }
  return cachedClient;
}

async function accessToken() {
  const { token } = await driveClient().getAccessToken();
  if (!token) throw new Error('Could not get a Google Drive access token. Reconnect Drive.');
  return token;
}

async function driveFetch(url, options = {}) {
  const token = await accessToken();
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    // Never echo the request body back - it may contain note content.
    const err = new Error(`Google Drive returned ${res.status}. ${summarizeDriveError(detail)}`);
    err.status = res.status === 401 || res.status === 403 ? 502 : 502;
    throw err;
  }
  return res;
}

function summarizeDriveError(raw) {
  try {
    const parsed = JSON.parse(raw);
    return parsed?.error?.message || 'No further detail.';
  } catch {
    return 'No further detail.';
  }
}

// Drive query strings are single-quoted, so a name containing an apostrophe
// (O'Brien) breaks the query unless the apostrophe is escaped.
function escapeQuery(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

/** Every patient folder inside Documentation, alphabetical. */
export async function listPatients() {
  const query = [
    `'${escapeQuery(config.documentationFolderId)}' in parents`,
    `mimeType = '${FOLDER_MIME}'`,
    'trashed = false',
  ].join(' and ');

  const patients = [];
  let pageToken = '';

  do {
    const url = new URL(DRIVE_FILES);
    url.searchParams.set('q', query);
    url.searchParams.set('fields', 'nextPageToken, files(id, name)');
    url.searchParams.set('pageSize', '1000');
    url.searchParams.set('orderBy', 'name');
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    const res = await driveFetch(url);
    const data = await res.json();
    for (const f of data.files || []) patients.push({ id: f.id, name: f.name });
    pageToken = data.nextPageToken || '';
  } while (pageToken);

  return patients;
}

/**
 * Finds a patient folder by exact name, or creates it. Names follow the
 * practice convention "Lastname, Firstname".
 */
export async function findOrCreatePatientFolder(folderName) {
  const name = folderName.trim();
  if (!name) throw new Error('A patient name is required.');

  const query = [
    `'${escapeQuery(config.documentationFolderId)}' in parents`,
    `mimeType = '${FOLDER_MIME}'`,
    `name = '${escapeQuery(name)}'`,
    'trashed = false',
  ].join(' and ');

  const url = new URL(DRIVE_FILES);
  url.searchParams.set('q', query);
  url.searchParams.set('fields', 'files(id, name)');
  url.searchParams.set('pageSize', '10');

  const existing = await (await driveFetch(url)).json();
  if (existing.files?.length) {
    return { id: existing.files[0].id, name: existing.files[0].name, created: false };
  }

  // No exact match. Before creating anything, check case-insensitively for a
  // folder that is really the same patient. Creating "Boyd, Michelle" next to an
  // existing "BOYD, MICHELLE" would split one chart across two folders, and
  // nobody would notice until they went looking for a note that isn't there.
  const near = (await listPatients()).find(
    (p) => p.name.toLowerCase() === name.toLowerCase(),
  );
  if (near) {
    return { id: near.id, name: near.name, created: false, matchedExisting: true };
  }

  const res = await driveFetch(DRIVE_FILES + '?fields=id,name', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      mimeType: FOLDER_MIME,
      parents: [config.documentationFolderId],
    }),
  });
  const created = await res.json();
  return { id: created.id, name: created.name, created: true };
}

/**
 * The patient's most recent note, as plain text. This is what gives the new
 * note continuity: diagnoses carry forward, today's pain rating can be compared
 * against the last one, and we can tell whether restrictions are about to be
 * repeated verbatim. Returns null when the patient has no notes yet.
 */
export async function getMostRecentNote(patientFolderId) {
  const query = [
    `'${escapeQuery(patientFolderId)}' in parents`,
    `mimeType = '${DOC_MIME}'`,
    'trashed = false',
  ].join(' and ');

  const url = new URL(DRIVE_FILES);
  url.searchParams.set('q', query);
  url.searchParams.set('fields', 'files(id, name, createdTime, modifiedTime)');
  url.searchParams.set('orderBy', 'createdTime desc');
  url.searchParams.set('pageSize', '1');

  const list = await (await driveFetch(url)).json();
  const newest = list.files?.[0];
  if (!newest) return null;

  const exportUrl = new URL(`${DRIVE_FILES}/${newest.id}/export`);
  exportUrl.searchParams.set('mimeType', 'text/plain');

  const text = await (await driveFetch(exportUrl)).text();

  return {
    id: newest.id,
    name: newest.name,
    createdTime: newest.createdTime,
    text: text.slice(0, 20000), // one note; guards against a runaway document
  };
}

/**
 * Assembles the two-part upload body Drive expects: a JSON metadata part, then
 * the note itself as HTML. Exported so it can be tested without calling Google,
 * because a malformed boundary here yields a broken Doc rather than an error.
 */
export function buildMultipartBody(metadata, html, boundary) {
  return (
    `--${boundary}\r\n` +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    'Content-Type: text/html; charset=UTF-8\r\n\r\n' +
    `${html}\r\n` +
    `--${boundary}--`
  );
}

/**
 * Uploads the finished note as HTML and lets Google convert it into a native,
 * editable Google Doc with real tables and shading.
 */
export async function saveNote({ patientFolderId, fileName, html }) {
  const metadata = {
    name: fileName,
    parents: [patientFolderId],
    mimeType: DOC_MIME, // asks Drive to convert the uploaded HTML into a Doc
  };

  const boundary = `pwsoap${Date.now().toString(36)}`;
  const body = buildMultipartBody(metadata, html, boundary);

  const res = await driveFetch(`${DRIVE_UPLOAD}?uploadType=multipart&fields=id,name,webViewLink`, {
    method: 'POST',
    headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
    body,
  });

  const file = await res.json();
  return {
    id: file.id,
    name: file.name,
    url: file.webViewLink || `https://docs.google.com/document/d/${file.id}/edit`,
  };
}

/** Confirms the configured Documentation folder is reachable. */
export async function checkDriveConnection() {
  const url = new URL(`${DRIVE_FILES}/${config.documentationFolderId}`);
  url.searchParams.set('fields', 'id, name, mimeType');
  const info = await (await driveFetch(url)).json();
  if (info.mimeType !== FOLDER_MIME) {
    throw new Error('DOCUMENTATION_FOLDER_ID does not point at a folder.');
  }
  return { id: info.id, name: info.name };
}
