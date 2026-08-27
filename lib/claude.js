// The two calls to Claude, plus a deterministic duplication check that runs
// afterward on our own machine.
//
// Call 1 (analyzeDictation): read the rough dictation, work out what is
//   missing, hand back a short list of questions.
// Call 2 (generateNote): write the finished note.
//
// Note content is never logged. Only durations, token counts, and error types.

import Anthropic from '@anthropic-ai/sdk';
// The SDK's schema helper is built on zod v4, which zod 3.25+ ships at this
// subpath. Importing plain 'zod' here gives v3 objects and the helper throws.
import { z } from 'zod/v4';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { config } from './config.js';
import { CLINICAL_STANDARD, HTML_FORMAT_SPEC, BOILERPLATE_MARKERS } from './soap-standard.js';

const MODEL = 'claude-opus-5';

const client = new Anthropic({ apiKey: config.anthropicApiKey });

// ---------------------------------------------------------------------------
// Call 1: what did the dictation forget?
// ---------------------------------------------------------------------------

const GapAnalysisSchema = z.object({
  region: z
    .string()
    .describe('Body region of the chief complaint, e.g. "Cervical". Empty string if not stated.'),
  isPersonalInjury: z
    .boolean()
    .describe('True if this reads as a personal injury or workers compensation patient.'),
  summary: z
    .string()
    .describe('One plain sentence describing what was dictated, for the doctor to confirm at a glance.'),
  gaps: z
    .array(
      z.object({
        id: z.string().describe('Short stable identifier, e.g. "pain_today".'),
        question: z
          .string()
          .describe('Plain, fast to answer, e.g. "Cervical ROM?" or "Pain today 0-10?"'),
        why: z
          .string()
          .describe('One short clause on why the note needs it, e.g. "required on every note".'),
        suggestion: z
          .string()
          .describe(
            'A value carried forward from the prior note that the doctor can accept or overwrite. ' +
              'Empty string if there is nothing to carry forward. NEVER a clinical finding you made up.',
          ),
      }),
    )
    .describe('Only genuinely missing items. An empty list is correct when the dictation is complete.'),
});

export async function analyzeDictation({ dictation, priorNote, patientName, visitDate, visitTime }) {
  const parts = [
    `Patient folder: ${patientName}`,
    `Visit date: ${visitDate}`,
    `Visit time: ${visitTime}`,
    '',
    priorNote
      ? `--- MOST RECENT PRIOR NOTE for this patient ("${priorNote.name}") ---\n${priorNote.text}\n--- end prior note ---`
      : '--- No prior note on file for this patient. This is the first note the app has seen. ---',
    '',
    '--- TODAY\'S DICTATION ---',
    dictation,
    '--- end dictation ---',
    '',
    'Work out what a compliant SOAP note for this visit requires that the dictation does not supply.',
    '',
    'The visit date and time are given above, so never ask for those. Required on the note beyond those:',
    'region of complaint, current pain rating,',
    'palpation findings, what treatment was actually performed (which CPTs, and the specific regions,',
    'exercises with sets and reps, and areas adjusted), and the plan frequency and duration.',
    '',
    'Do not ask about anything the dictation already answers, and do not ask about anything you can',
    'legitimately carry forward from the prior note - carry it forward as a suggestion instead so it can',
    'be confirmed with one click. Diagnoses carry forward unless a change was dictated.',
    '',
    'If range of motion was not mentioned at all, that is acceptable on a subsequent SOAP note and the',
    'note simply omits the ROM table. Do not ask for ROM values unless ROM was clearly assessed.',
    '',
    'Keep the list short. Every question you ask is a question the doctor has to answer between patients.',
  ];

  const response = await parseWithRefusalFallback({
    model: MODEL,
    max_tokens: 8000,
    cache_control: { type: 'ephemeral' },
    system: CLINICAL_STANDARD,
    messages: [{ role: 'user', content: parts.join('\n') }],
    output_config: { format: betaZodOutputFormat(GapAnalysisSchema) },
  });

  if (response.stop_reason === 'refusal') {
    throw refusalError();
  }
  if (!response.parsed_output) {
    throw new Error('Claude could not read that dictation. Try rephrasing it, or add more detail.');
  }

  return response.parsed_output;
}

// ---------------------------------------------------------------------------
// Call 2: write the note
// ---------------------------------------------------------------------------

const NoteSchema = z.object({
  html: z
    .string()
    .describe('The complete note as one HTML document, following the required skeleton exactly.'),
  complianceFlags: z
    .array(z.string())
    .describe(
      'Anything a carrier or PI attorney reviewer would question. Empty list if the note is clean. ' +
        'Never flag the note template, the canned CPT descriptions, or the procedure rationale ' +
        'repeating from the prior visit - those are supposed to be identical.',
    ),
});

export async function generateNote({ dictation, answers, priorNote, patientName, visitDate, visitTime }) {
  const answerBlock = answers?.length
    ? answers.map((a) => `- ${a.question} ${a.answer}`).join('\n')
    : '(none - the dictation was complete)';

  const parts = [
    `Patient folder name: ${patientName}`,
    `Visit date: ${visitDate}`,
    `Visit time: ${visitTime}`,
    '',
    priorNote
      ? `--- MOST RECENT PRIOR NOTE ("${priorNote.name}") ---\n${priorNote.text}\n--- end prior note ---`
      : '--- No prior note on file. Do not reference a previous visit you cannot see. ---',
    '',
    "--- TODAY'S DICTATION ---",
    dictation,
    '--- end dictation ---',
    '',
    '--- ANSWERS TO THE GAP QUESTIONS ---',
    answerBlock,
    '--- end answers ---',
    '',
    'Write the finished SOAP note for this visit.',
    '',
    'Use the dictation and the answers above as the source of every clinical value. Carry diagnoses',
    'forward from the prior note unless a change was dictated. Where the prior note gives you last',
    "visit's pain rating or measurements, use them for the comparison sentences.",
    '',
    'Before you finish, check the variable clinical content against the prior note. If the restrictions,',
    'findings, pain rating, ROM values, or functional status would come out word for word identical and',
    'in the identical order as last visit, put that in complianceFlags. Do NOT reword the note to hide',
    'it, and do NOT flag the template, the CPT descriptions, or the procedure rationale for repeating.',
    'Those are meant to be identical every visit.',
    '',
    HTML_FORMAT_SPEC,
  ];

  const request = {
    model: MODEL,
    max_tokens: 16000,
    cache_control: { type: 'ephemeral' },
    system: CLINICAL_STANDARD,
    messages: [{ role: 'user', content: parts.join('\n') }],
    output_config: { format: betaZodOutputFormat(NoteSchema) },
  };

  const response = await parseWithRefusalFallback(request);

  if (response.stop_reason === 'refusal') {
    throw refusalError();
  }
  if (!response.parsed_output?.html) {
    throw new Error('Claude did not return a usable note. Try again, or add detail to the dictation.');
  }

  return response.parsed_output;
}

/**
 * Runs the request through the beta endpoint with server-side refusal
 * fallbacks turned on, so a safety classifier declining a clinical request
 * does not simply dead-end - the API re-runs it on a fallback model inside the
 * same call. If this deployment's API access rejects those parameters, retries
 * once without them rather than failing the note.
 */
async function parseWithRefusalFallback(request) {
  try {
    return await client.beta.messages.parse({
      ...request,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
    });
  } catch (err) {
    if (err?.status === 400 || err?.status === 404) {
      return await client.beta.messages.parse(request);
    }
    throw err;
  }
}

function refusalError() {
  const err = new Error(
    'Claude declined to complete that request. Check the dictation for anything unusual and try again.',
  );
  err.status = 422;
  return err;
}

// ---------------------------------------------------------------------------
// Deterministic duplication check, run here rather than asked of the model.
//
// The point is NOT that consecutive notes look different. Template language is
// supposed to repeat. The point is variable clinical content - above all the
// restrictions on a PI or workers comp patient - coming out verbatim in the
// same sequence visit after visit, which tells a reviewer the note was never
// actually touched.
// ---------------------------------------------------------------------------

export function htmlToText(html) {
  return String(html)
    .replace(/<\s*(br|\/p|\/tr|\/h1|\/h2|hr)\s*\/?>/gi, '\n')
    .replace(/<\/td>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function normalize(line) {
  return line
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isBoilerplate(normalized) {
  return BOILERPLATE_MARKERS.some((marker) => normalized.includes(normalize(marker)));
}

function toSentences(text) {
  return text
    .split(/\n+|(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const RESTRICTION_HINTS = [
  'restrict',
  'no lifting',
  'lifting limited',
  'avoid',
  'limited to',
  'work status',
  'may return to',
  'no overhead',
  'no bending',
  'light duty',
  'sedentary',
  'off work',
];

function looksLikeRestriction(normalized) {
  return RESTRICTION_HINTS.some((hint) => normalized.includes(hint));
}

/**
 * Compares the new note against the prior note and returns the clinical
 * content that repeats verbatim. Returns an empty array when there is nothing
 * to worry about, or when there is no prior note to compare against.
 */
export function findRepeatedClinicalContent(priorText, newHtml) {
  if (!priorText) return [];

  const priorSentences = toSentences(priorText);
  const newSentences = toSentences(htmlToText(newHtml));

  const priorSet = new Set();
  const priorRestrictionOrder = [];

  for (const sentence of priorSentences) {
    const norm = normalize(sentence);
    if (!norm) continue;
    if (isBoilerplate(norm)) continue;
    if (looksLikeRestriction(norm)) priorRestrictionOrder.push(norm);
    if (norm.split(' ').length >= 8) priorSet.add(norm);
  }

  const repeats = [];
  const newRestrictionOrder = [];
  const seen = new Set();

  for (const sentence of newSentences) {
    const norm = normalize(sentence);
    if (!norm) continue;
    if (isBoilerplate(norm)) continue;
    if (looksLikeRestriction(norm)) newRestrictionOrder.push(norm);
    if (norm.split(' ').length < 8) continue;
    if (priorSet.has(norm) && !seen.has(norm)) {
      seen.add(norm);
      repeats.push({
        kind: looksLikeRestriction(norm) ? 'restriction' : 'clinical',
        text: sentence.trim(),
      });
    }
  }

  // The specific pattern the practice cares most about: the restriction list
  // reproduced in the identical order, which reads as an untouched note.
  const identicalRestrictionSequence =
    priorRestrictionOrder.length > 0 &&
    priorRestrictionOrder.length === newRestrictionOrder.length &&
    priorRestrictionOrder.every((line, i) => line === newRestrictionOrder[i]);

  if (identicalRestrictionSequence) {
    repeats.unshift({
      kind: 'restriction-sequence',
      text:
        `All ${priorRestrictionOrder.length} restriction lines are identical to the last visit, ` +
        'in the same order. Confirm the restrictions genuinely have not changed, or update them.',
    });
  }

  // Restrictions first, then everything else.
  return repeats.sort((a, b) => rank(a.kind) - rank(b.kind)).slice(0, 12);
}

function rank(kind) {
  if (kind === 'restriction-sequence') return 0;
  if (kind === 'restriction') return 1;
  return 2;
}
