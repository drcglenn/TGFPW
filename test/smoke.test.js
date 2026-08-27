// Run with: npm test
// Covers the logic that runs without calling Google or Claude.

import test from 'node:test';
import assert from 'node:assert/strict';

process.env.OWNER_EMAIL ||= 'cg@peakwellnesshtx.com';
process.env.ALLOWED_EMAILS ||= 'cg@peakwellnesshtx.com, mariana@peakwellnesshtx.com';
process.env.GOOGLE_CLIENT_ID ||= 'test-client-id.apps.googleusercontent.com';
process.env.GOOGLE_CLIENT_SECRET ||= 'test-secret';
process.env.ANTHROPIC_API_KEY ||= 'sk-ant-test';
process.env.SESSION_SECRET ||= 'test-secret-that-is-at-least-32-characters-long';

const { findRepeatedClinicalContent, htmlToText } = await import('../lib/claude.js');
const { isAllowedEmail, isOwner } = await import('../lib/config.js');

// --- allowlist ---------------------------------------------------------------

test('allowlist accepts staff and rejects everyone else', () => {
  assert.equal(isAllowedEmail('cg@peakwellnesshtx.com'), true);
  assert.equal(isAllowedEmail('CG@PeakWellnessHTX.com'), true, 'must be case insensitive');
  assert.equal(isAllowedEmail('mariana@peakwellnesshtx.com'), true);
  assert.equal(isAllowedEmail('stranger@gmail.com'), false);
  assert.equal(isAllowedEmail(''), false);
  assert.equal(isAllowedEmail(null), false);
});

test('only the owner is the owner', () => {
  assert.equal(isOwner('cg@peakwellnesshtx.com'), true);
  assert.equal(isOwner('mariana@peakwellnesshtx.com'), false);
});

// --- html to text ------------------------------------------------------------

test('htmlToText strips tags and keeps the words', () => {
  const text = htmlToText('<p>Pain rated <b>4</b>/10.</p><p>Adjusted C T L.</p>');
  assert.match(text, /Pain rated 4\/10\./);
  assert.match(text, /Adjusted C T L\./);
  assert.ok(!text.includes('<'), 'no tags should survive');
});

// --- the duplication check ---------------------------------------------------

const CPT_BOILERPLATE = `
10 minutes of manual therapy performed to a separate anatomical region to address soft tissue restriction and improve mobility. Skilled application of myofascial and/or joint mobilization techniques provided.
15 minutes of one-on-one therapeutic exercise per unit performed to improve strength, stability, and functional movement deficits. Skilled instruction provided with correction of form and progression as tolerated.
Supervised heat therapy applied to reduce muscle tension and improve tissue extensibility prior to active treatment.
Performed to address documented segmental dysfunction and restricted joint mobility affecting functional movement.
Increase ROM; Improve ADLs, Improve function.
Adjusting Techniques: Diversified
`;

test('template and CPT language repeating is NOT flagged', () => {
  const prior = `Peak Wellness Sports Chiropractic\n${CPT_BOILERPLATE}`;
  const next = `<p>Peak Wellness Sports Chiropractic</p><p>${CPT_BOILERPLATE}</p>`;
  const flags = findRepeatedClinicalContent(prior, next);
  assert.deepEqual(flags, [], `boilerplate must never be flagged, got: ${JSON.stringify(flags)}`);
});

test('identical restrictions in identical order IS flagged', () => {
  const restrictions = `
Patient is restricted from lifting greater than fifteen pounds at this time.
Patient should avoid prolonged overhead reaching for more than ten minutes.
Patient may return to light duty work with the restrictions listed above.
`;
  const prior = CPT_BOILERPLATE + restrictions;
  const next = `<p>${CPT_BOILERPLATE}</p><p>${restrictions.split('\n').join('</p><p>')}</p>`;

  const flags = findRepeatedClinicalContent(prior, next);
  assert.ok(flags.length > 0, 'repeated restrictions must be flagged');
  assert.equal(flags[0].kind, 'restriction-sequence', 'the sequence flag must sort first');
  assert.match(flags[0].text, /identical to the last visit/);
});

test('restrictions that actually changed are not flagged as a sequence', () => {
  const prior = `
Patient is restricted from lifting greater than fifteen pounds at this time.
Patient should avoid prolonged overhead reaching for more than ten minutes.
`;
  const next = `
<p>Patient is restricted from lifting greater than thirty pounds at this time.</p>
<p>Patient may resume overhead reaching as tolerated without a time limit.</p>
`;
  const flags = findRepeatedClinicalContent(prior, next);
  assert.equal(
    flags.filter((f) => f.kind === 'restriction-sequence').length,
    0,
    'updated restrictions must not trigger the sequence flag',
  );
});

test('repeated clinical findings are flagged as clinical, not restriction', () => {
  const line =
    'Palpation reveals taut and tender bands of the bilateral upper trapezius with moderate tenderness.';
  const flags = findRepeatedClinicalContent(line, `<p>${line}</p>`);
  assert.equal(flags.length, 1);
  assert.equal(flags[0].kind, 'clinical');
});

test('short lines are ignored so headers and labels do not trip it', () => {
  const flags = findRepeatedClinicalContent('SUBJECTIVE\nOBJECTIVE\nPLAN', '<p>SUBJECTIVE</p><p>PLAN</p>');
  assert.deepEqual(flags, []);
});

test('a first visit with no prior note produces no flags', () => {
  assert.deepEqual(findRepeatedClinicalContent(null, '<p>anything at all goes here</p>'), []);
  assert.deepEqual(findRepeatedClinicalContent('', '<p>anything at all goes here</p>'), []);
});

test('punctuation and casing differences still count as the same sentence', () => {
  const prior = 'Patient reports continued difficulty with prolonged sitting at work.';
  const next = '<p>patient reports continued difficulty with prolonged sitting at work</p>';
  const flags = findRepeatedClinicalContent(prior, next);
  assert.equal(flags.length, 1, 'normalization should catch a reformatted repeat');
});

// --- Drive upload body -------------------------------------------------------

const { buildMultipartBody } = await import('../lib/drive.js');

test('multipart upload body is well formed', () => {
  const metadata = { name: 'Boyd_Michelle_SOAP_082726', parents: ['abc'], mimeType: 'application/vnd.google-apps.document' };
  const html = '<html><body><p>Note body</p></body></html>';
  const body = buildMultipartBody(metadata, html, 'BOUND');

  const parts = body.split('--BOUND');
  assert.equal(parts.length, 4, 'opening part, two content parts, closing part');
  assert.ok(body.startsWith('--BOUND\r\n'), 'must open with the boundary');
  assert.ok(body.endsWith('--BOUND--'), 'must close with the terminating boundary');
  assert.match(body, /Content-Type: application\/json; charset=UTF-8\r\n\r\n\{/);
  assert.match(body, /Content-Type: text\/html; charset=UTF-8\r\n\r\n<html>/);
  assert.ok(body.includes(JSON.stringify(metadata)), 'metadata must survive intact');
  assert.ok(body.includes(html), 'the note html must survive intact');
});

test('upload asks Drive to convert the html into a native Google Doc', () => {
  const body = buildMultipartBody(
    { name: 'x', parents: ['p'], mimeType: 'application/vnd.google-apps.document' },
    '<p>hi</p>',
    'B',
  );
  assert.match(body, /"mimeType":"application\/vnd\.google-apps\.document"/);
});

// --- naming conventions ------------------------------------------------------

const { normalizePatientName, buildFileName } = await import('../lib/naming.js');

test('patient names land on the "Lastname, Firstname" convention', () => {
  assert.equal(normalizePatientName('michelle boyd'), 'Boyd, Michelle');
  assert.equal(normalizePatientName('Boyd, Michelle'), 'Boyd, Michelle');
  assert.equal(normalizePatientName('  MICHELLE   BOYD  '), 'Boyd, Michelle');
  assert.equal(normalizePatientName('mary jo smith'), 'Smith, Mary Jo');
  assert.equal(normalizePatientName("sean o'brien"), "O'Brien, Sean");
  assert.equal(normalizePatientName('ana smith-jones'), 'Smith-Jones, Ana');
});

test('patient names that would break a Drive query are rejected', () => {
  assert.throws(() => normalizePatientName(''), /Enter the patient name/);
  assert.throws(() => normalizePatientName('Michelle'), /first and last name/);
  assert.throws(() => normalizePatientName('Boyd,'), /first and last name/);
  assert.throws(() => normalizePatientName('Boyd/Michelle'), /Remove any of/);
  assert.throws(() => normalizePatientName('x'.repeat(200)), /too long/);
});

test('file names follow Lastname_Firstname_SOAP_MMDDYY', () => {
  assert.equal(buildFileName('Boyd, Michelle', '2026-08-27'), 'Boyd_Michelle_SOAP_082726');
  assert.equal(buildFileName('Humphrey, Jaeden', '2026-07-23'), 'Humphrey_Jaeden_SOAP_072326');
  assert.equal(buildFileName("O'Brien, Sean", '2026-01-05'), "O'Brien_Sean_SOAP_010526");
});

test('a missing date does not produce a broken file name', () => {
  assert.equal(buildFileName('Boyd, Michelle', ''), 'Boyd_Michelle_SOAP_nodate');
});
