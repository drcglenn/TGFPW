# Peak Wellness SOAP Notes

A private web app for Peak Wellness Sports Chiropractic. Dictate a visit in
whatever order it comes out, and it produces a formatted SOAP note and files it as
a Google Doc in that patient's Drive folder.

**Setting it up for the first time? Read [SETUP.md](SETUP.md).** It's written for
someone who isn't a developer and assumes nothing.

---

## What it does

```
Sign in  ->  Pick a patient  ->  Dictate the visit  ->  Answer what's missing
         ->  Review the note  ->  Filed in Drive
```

1. **Sign in** with a practice Google account. Only addresses on the allowlist get
   in. There are no passwords in this app.
2. **Pick a patient**, or add one. The list is read live from the folder names in
   `PW Patient Resources / Documentation`.
3. **Dictate** the visit however it comes out. Messy is fine.
4. **Answer the gaps.** The app reads the dictation against what a compliant note
   requires and asks once, in a batch, for whatever is missing. Anything it can
   legitimately carry forward from the last visit arrives pre-filled.
5. **Review** the note as it will look in the Doc, along with anything flagged.
6. **Save** it as a native Google Doc named `Lastname_Firstname_SOAP_MMDDYY`.

---

## Where patient information lives

**In your Google Drive. Nowhere else.**

- **There is no database.** Not for patients, not for notes, not for drafts. The
  patient list is folder names read live from Drive on every request.
- **Note content exists in memory for the length of one request**, then in Drive.
  It is never written to disk and never written to a log.
- **Logs record** the request method, path, status code, duration, and which staff
  member saved which file ID. No names, no clinical content.
- **The only thing stored outside Drive** is a login cookie holding a staff email
  address and an expiry time.
- **The browser stores nothing.** No `localStorage`. Refreshing clears it.

Notes are created by, and owned by, Dr. Glenn's own Google account, so they land in
the existing folders exactly as if made by hand.

### Who touches the data

| Who | What they see | Covered by |
|---|---|---|
| Google Cloud Run | The request, in transit | Google BAA |
| Anthropic (Claude API) | The dictation and the note | Anthropic BAA |
| Google Drive | The finished note, stored | Google BAA |

**Both BAAs must be signed before real patient information goes through this.**
SETUP.md Steps 2 and 5.

### One permission worth knowing about

The app asks Google for **full Drive access**, not folder-scoped access, and that
is worth stating plainly rather than leaving buried in a comment.

Google's narrow `drive.file` scope only reaches files an app created itself. The
Documentation folder and every existing patient folder pre-date this app, so that
scope cannot even list them, and Google offers no middle option that means "this
folder and its contents."

In practice the app only ever touches the Documentation folder. But the refresh
token produced during setup carries broader permission than the app uses, so treat
that token like a password: it lives only in the Cloud Run environment, it is shown
once during setup, and it is never written to this repository or to a log.

---

## The clinical standard

Everything about how a note is written - S/O/A/P structure, the CPT-coded
treatment block, procedure rationale, ROM tables and normals, ICD-10 conventions,
the "no em dashes, write deg not the degree symbol" rules, the Google Doc HTML -
lives in [`lib/soap-standard.js`](lib/soap-standard.js).

That file is lifted from the practice's existing `pw-clinical-docs` skill, so a
note from this app is structurally identical to one from that skill. **To change
how notes read, change that file.** Nothing else needs to move.

### The two rules that make it defensible

1. **Never invent a clinical finding.** Anything not dictated or supplied is a gap
   to ask about, never a value to guess at, and never a silent default to "within
   normal limits."
2. **Ask once, in a batch.** One short list between patients, not a conversation.

### What gets flagged, and what doesn't

This is easy to get backwards, so it's worth being precise.

**Not flagged, deliberately.** The template being the same shape every visit. The
CPT descriptions and procedure rationale reading word for word identical. Headers,
section bars, signature blocks. That language is standardized and it is *supposed*
to repeat - rewording it to look different would make the chart worse, not better.

**Flagged.** Variable clinical content that should have changed and didn't. Above
all, **restrictions on PI and workers' comp documentation appearing verbatim in the
identical sequence visit after visit** - that reads as a note nobody touched and a
patient nobody reassessed. Same for pain ratings that never move, ROM copied
forward unchanged, and functional status described identically every time.

Two independent checks run on every note:

- **Claude flags** what a reviewer would question, given the prior note.
- **A deterministic check** in [`lib/claude.js`](lib/claude.js)
  (`findRepeatedClinicalContent`) compares the new note against the last one
  sentence by sentence, ignoring the known boilerplate, and calls out repeats -
  with the restriction-sequence case sorted to the top and marked hardest.

Neither one rewrites the note. Both surface it for Dr. Glenn to decide.

---

## Scope

**In:** SOAP notes for established visits (TBCE 76.1(f)).

**Out, by design:** initial evaluations, re-exams, PI narratives, work status
reports, rehab programs, letters, analytics. Those stay in the existing Claude
skills. This is Phase 1 and deliberately does one thing.

---

## Running it locally

```bash
npm install
cp .env.example .env      # fill in your values
INSECURE_COOKIES=1 npm start
```

Then open http://localhost:8080. `INSECURE_COOKIES=1` allows the login cookie over
plain http and **must never be set on the deployed app**.

```bash
npm test
```

Covers the allowlist, the duplication checker, the Drive upload body, and the
naming conventions - the logic that runs without calling Google or Claude.

Dependency versions are pinned exactly in `package.json`, so a fresh `npm install`
installs the same versions this was tested against without needing a lockfile.

---

## Layout

```
server.js              Routes, validation, error handling
lib/config.js          Settings, read from the environment
lib/auth.js            Google sign-in, allowlist, signed session cookie
lib/drive.js           Patient folders, prior-note lookup, saving the Doc
lib/claude.js          The two Claude calls and the duplication checker
lib/naming.js          Patient folder and note file naming conventions
lib/soap-standard.js   The clinical standard. Edit this to change how notes read.
public/                The interface
test/                  Tests for the logic that runs offline
```

## Cost

Roughly **$0 to $5/month** for hosting (Cloud Run bills only while in use), plus
roughly **$0.10 to $0.30 per note** for the Claude API. The clinical standard is
sent with a cache marker, so repeat notes cost less than the first.

---

## A standing caveat

This app drafts. **Dr. Glenn signs.** Read every note before it goes in a chart.
