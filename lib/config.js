// Central place for every setting the app reads from its environment.
//
// Nothing in here is a secret by itself - the actual secret VALUES live in
// Cloud Run's environment variables, never in this repository.

function required(name, humanExplanation) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(
      `Missing setting: ${name}\n\n${humanExplanation}\n\n` +
        `Set it in Cloud Run under "Edit & deploy new revision" > Variables & Secrets, ` +
        `or in your .env file if you are running locally. See SETUP.md.`,
    );
  }
  return value.trim();
}

function optional(name, fallback = '') {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : fallback;
}

// Splits "a@x.com, b@x.com" into a lowercase list. Email comparison is always
// lowercase because Google may hand us a differently-cased address.
function emailList(raw) {
  return raw
    .split(/[,\s]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export const config = {
  port: Number(optional('PORT', '8080')),

  // --- Who is allowed in -------------------------------------------------
  // The doctor. Only this address can run the one-time Drive connection.
  ownerEmail: required(
    'OWNER_EMAIL',
    'Your own Google account address, e.g. cg@peakwellnesshtx.com. This is the ' +
      'account whose Google Drive the notes get saved into, and the only account ' +
      'allowed to run the one-time Drive connection step.',
  ).toLowerCase(),

  // Everyone allowed to sign in, including the owner.
  allowedEmails: emailList(
    required(
      'ALLOWED_EMAILS',
      'A comma-separated list of the Google accounts allowed to use this app, ' +
        'e.g. "cg@peakwellnesshtx.com, mariana@peakwellnesshtx.com". Anyone not ' +
        'on this list is turned away at the login screen.',
    ),
  ),

  // --- Google sign-in and Google Drive ------------------------------------
  googleClientId: required(
    'GOOGLE_CLIENT_ID',
    'The Client ID from the OAuth client you create in Google Cloud. It looks ' +
      'like 1234567890-abcdefg.apps.googleusercontent.com. See SETUP.md Step 4.',
  ),
  googleClientSecret: required(
    'GOOGLE_CLIENT_SECRET',
    'The Client Secret that Google shows you next to the Client ID. See SETUP.md Step 4.',
  ),

  // Blank until the one-time Drive connection is done. The app still starts
  // without it so you can sign in and click the "Connect Google Drive" button.
  driveRefreshToken: optional('DRIVE_REFRESH_TOKEN'),

  // The "Documentation" folder inside "PW Patient Resources". Every patient
  // folder lives directly inside this one.
  documentationFolderId: optional(
    'DOCUMENTATION_FOLDER_ID',
    '1hh0SXMeAXutj3WibGtGptkmGkDVgt90a',
  ),

  // --- Claude --------------------------------------------------------------
  anthropicApiKey: required(
    'ANTHROPIC_API_KEY',
    'Your API key from console.anthropic.com. It starts with sk-ant-. This is ' +
      'what lets the app ask Claude to write the note. See SETUP.md Step 5.',
  ),

  // --- Session cookie ------------------------------------------------------
  // Used to sign the login cookie so nobody can forge one. Any long random
  // string. Changing it just signs everyone out.
  sessionSecret: required(
    'SESSION_SECRET',
    'Any long random string, at least 32 characters. It is used to sign the ' +
      'login cookie so nobody can fake being signed in. SETUP.md Step 6 shows ' +
      'you how to generate one.',
  ),

  // Public https URL of the deployed app, e.g. https://pw-soap-notes-xxxx.run.app
  // Needed so Google knows where to send you back after the Drive consent screen.
  publicUrl: optional('PUBLIC_URL'),

  // Set to "1" to allow http cookies for local testing on your own computer.
  insecureCookies: optional('INSECURE_COOKIES') === '1',
};

export function isAllowedEmail(email) {
  if (!email) return false;
  return config.allowedEmails.includes(String(email).toLowerCase());
}

export function isOwner(email) {
  return String(email || '').toLowerCase() === config.ownerEmail;
}

export function driveIsConnected() {
  return Boolean(config.driveRefreshToken);
}
