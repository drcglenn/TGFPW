/* Peak Wellness SOAP notes - browser side.
 *
 * Everything here is display and form handling. No patient information is
 * stored in the browser: nothing goes to localStorage, and a refresh clears it.
 */

const $ = (id) => document.getElementById(id);

const state = {
  patient: null, // { id, name }
  dictation: '',
  gaps: [],
  note: null,
};

// --- small helpers -----------------------------------------------------------

async function api(path, options = {}) {
  const res = await fetch(path, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status}).`);
  return data;
}

function busy(text) {
  $('busy-text').textContent = text;
  $('busy').classList.remove('hidden');
}

function idle() {
  $('busy').classList.add('hidden');
}

function showError(message) {
  const el = $('error');
  el.textContent = message;
  el.classList.remove('hidden');
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function clearError() {
  $('error').classList.add('hidden');
}

function show(...ids) {
  for (const id of ['step-gaps', 'step-review', 'step-done']) $(id).classList.add('hidden');
  for (const id of ids) $(id).classList.remove('hidden');
}

// --- sign in -----------------------------------------------------------------

async function boot() {
  const [{ googleClientId }, me] = await Promise.all([api('/api/config'), api('/api/me')]);

  if (me.signedIn) return enterApp(me);

  // Render Google's own button. We never see or handle a password.
  const render = () => {
    if (!window.google?.accounts?.id) return setTimeout(render, 120);
    google.accounts.id.initialize({
      client_id: googleClientId,
      callback: onGoogleCredential,
    });
    google.accounts.id.renderButton($('google-button'), {
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      width: 280,
    });
  };
  render();
}

async function onGoogleCredential(response) {
  const err = $('login-error');
  err.classList.add('hidden');
  try {
    const me = await api('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential: response.credential }),
    });
    enterApp(me);
  } catch (e) {
    err.textContent = e.message;
    err.classList.remove('hidden');
  }
}

function enterApp(me) {
  $('screen-login').classList.add('hidden');
  $('app').classList.remove('hidden');
  $('who').textContent = me.name || me.email;

  if (!me.driveConnected) {
    const banner = $('drive-warning');
    banner.classList.remove('hidden');
    banner.innerHTML = me.isOwner
      ? 'Google Drive is not connected yet, so notes cannot be filed. ' +
        '<a href="/setup/drive">Connect Google Drive</a> to finish setup.'
      : 'Google Drive is not connected yet. Ask Dr. Glenn to finish setup before writing notes.';
  }

  const today = new Date();
  $('visit-date').value = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-');
  $('visit-time').value = `${String(today.getHours()).padStart(2, '0')}:${String(
    today.getMinutes(),
  ).padStart(2, '0')}`;

  loadPatients();
}

// --- patients ----------------------------------------------------------------

async function loadPatients(selectId) {
  const select = $('patient');
  try {
    const { patients } = await api('/api/patients');
    select.innerHTML = '<option value="">Select a patient...</option>';
    for (const p of patients) {
      const option = document.createElement('option');
      option.value = p.id;
      option.textContent = p.name;
      select.appendChild(option);
    }
    if (selectId) {
      select.value = selectId;
      select.dispatchEvent(new Event('change'));
    }
  } catch (e) {
    select.innerHTML = '<option value="">Could not load patients</option>';
    showError(`Could not read the patient list from Drive. ${e.message}`);
  }
}

$('patient').addEventListener('change', (e) => {
  const option = e.target.selectedOptions[0];
  state.patient = e.target.value ? { id: e.target.value, name: option.textContent } : null;
});

$('new-patient-toggle').addEventListener('click', () => {
  $('new-patient-row').classList.toggle('hidden');
  $('new-patient-name').focus();
});

$('new-patient-create').addEventListener('click', async () => {
  const name = $('new-patient-name').value.trim();
  if (!name) return;
  clearError();
  busy('Creating the patient folder...');
  try {
    const folder = await api('/api/patients', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    $('new-patient-name').value = '';
    $('new-patient-row').classList.add('hidden');
    await loadPatients(folder.id);
  } catch (e) {
    showError(e.message);
  } finally {
    idle();
  }
});

// --- dictation ---------------------------------------------------------------

$('dictation').addEventListener('input', (e) => {
  const words = e.target.value.trim().split(/\s+/).filter(Boolean).length;
  $('dictation-count').textContent = words ? `${words} words` : '';
});

function visitFields() {
  return {
    patientFolderId: state.patient?.id,
    patientName: state.patient?.name,
    dictation: $('dictation').value.trim(),
    visitDate: $('visit-date').value,
    visitTime: $('visit-time').value,
  };
}

$('analyze').addEventListener('click', async () => {
  clearError();
  const fields = visitFields();
  if (!fields.patientFolderId) return showError('Pick a patient first.');
  if (!fields.dictation) return showError('Type or paste the visit notes first.');

  state.dictation = fields.dictation;
  busy('Reading your notes and checking against the last visit...');
  $('analyze').disabled = true;

  try {
    const analysis = await api('/api/analyze', {
      method: 'POST',
      body: JSON.stringify(fields),
    });
    renderGaps(analysis);
    show('step-gaps');
    $('step-gaps').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (e) {
    showError(e.message);
  } finally {
    $('analyze').disabled = false;
    idle();
  }
});

function renderGaps(analysis) {
  state.gaps = analysis.gaps || [];

  const bits = [];
  if (analysis.summary) bits.push(analysis.summary);
  bits.push(
    analysis.priorNote
      ? `Compared against the last note on file, ${analysis.priorNote.name}.`
      : 'No previous note on file for this patient, so nothing was carried forward.',
  );
  $('analysis-summary').textContent = bits.join(' ');

  const container = $('gaps');
  container.innerHTML = '';

  if (!state.gaps.length) {
    const p = document.createElement('p');
    p.className = 'flag-none';
    p.textContent = 'Nothing missing. Your dictation covered everything the note needs.';
    container.appendChild(p);
    return;
  }

  state.gaps.forEach((gap, i) => {
    const wrap = document.createElement('div');
    wrap.className = 'gap';

    const label = document.createElement('label');
    label.htmlFor = `gap-${i}`;
    label.textContent = gap.question;

    const why = document.createElement('p');
    why.className = 'why';
    why.textContent = gap.why || '';

    const input = document.createElement('input');
    input.type = 'text';
    input.id = `gap-${i}`;
    input.autocomplete = 'off';
    if (gap.suggestion) input.value = gap.suggestion;

    wrap.append(label, why, input);

    if (gap.suggestion) {
      const carried = document.createElement('p');
      carried.className = 'carried';
      carried.textContent = 'Carried forward from the last visit. Change it if it is different today.';
      wrap.appendChild(carried);
    }

    container.appendChild(wrap);
  });
}

$('back-to-dictation').addEventListener('click', () => {
  show();
  $('step-dictation').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// --- generate ----------------------------------------------------------------

$('generate').addEventListener('click', async () => {
  clearError();
  const answers = state.gaps.map((gap, i) => ({
    question: gap.question,
    answer: $(`gap-${i}`)?.value.trim() || '',
  }));

  const unanswered = answers.filter((a) => !a.answer).length;
  if (unanswered) {
    const ok = confirm(
      `${unanswered} question${unanswered === 1 ? ' is' : 's are'} still blank. ` +
        'Anything left blank will be left blank on the note rather than filled in. Continue?',
    );
    if (!ok) return;
  }

  busy('Writing the note...');
  $('generate').disabled = true;

  try {
    const note = await api('/api/generate', {
      method: 'POST',
      body: JSON.stringify({ ...visitFields(), answers }),
    });
    state.note = note;
    renderReview(note);
    show('step-review');
    $('step-review').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (e) {
    showError(e.message);
  } finally {
    $('generate').disabled = false;
    idle();
  }
});

function renderReview(note) {
  const flags = $('flags');
  flags.innerHTML = '';

  const repeats = note.repeatedContent || [];
  const modelFlags = note.complianceFlags || [];

  for (const repeat of repeats) {
    const div = document.createElement('div');
    div.className = repeat.kind === 'restriction-sequence' ? 'flag hard' : 'flag';
    const title = document.createElement('strong');
    title.textContent =
      repeat.kind === 'restriction-sequence'
        ? 'Restrictions unchanged from last visit'
        : repeat.kind === 'restriction'
          ? 'Restriction repeated word for word'
          : 'Repeated from the last note';
    const body = document.createElement('span');
    body.textContent = repeat.text;
    div.append(title, body);
    flags.appendChild(div);
  }

  for (const flag of modelFlags) {
    const div = document.createElement('div');
    div.className = 'flag';
    const title = document.createElement('strong');
    title.textContent = 'Worth a look';
    const body = document.createElement('span');
    body.textContent = flag;
    div.append(title, body);
    flags.appendChild(div);
  }

  if (!repeats.length && !modelFlags.length) {
    const p = document.createElement('p');
    p.className = 'flag-none';
    p.textContent = 'Nothing flagged. Read it over anyway before it goes in the chart.';
    flags.appendChild(p);
  }

  // The note is Claude's output rendered as the Doc will look. It is inserted
  // into a sandboxed frame so nothing in it can run as script on this page.
  const preview = $('preview');
  preview.innerHTML = '';
  const frame = document.createElement('iframe');
  frame.setAttribute('sandbox', '');
  frame.setAttribute('title', 'Note preview');
  frame.style.cssText = 'width:100%;height:55vh;border:0;';
  frame.srcdoc = note.html;
  preview.appendChild(frame);

  $('filename').textContent = `${note.fileName}`;
}

$('back-to-gaps').addEventListener('click', () => {
  show('step-gaps');
  $('step-gaps').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// --- save --------------------------------------------------------------------

$('save').addEventListener('click', async () => {
  clearError();
  if (!state.note) return;

  busy('Filing the note in Drive...');
  $('save').disabled = true;

  try {
    const saved = await api('/api/save', {
      method: 'POST',
      body: JSON.stringify({
        patientFolderId: state.patient.id,
        patientName: state.patient.name,
        visitDate: $('visit-date').value,
        html: state.note.html,
      }),
    });

    $('done-message').textContent = `${saved.name} saved to ${state.patient.name}.`;
    $('doc-link').href = saved.url;
    show('step-done');
    $('step-done').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (e) {
    showError(e.message);
  } finally {
    $('save').disabled = false;
    idle();
  }
});

$('another').addEventListener('click', () => {
  $('dictation').value = '';
  $('dictation-count').textContent = '';
  state.dictation = '';
  state.gaps = [];
  state.note = null;
  show();
  clearError();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// --- sign out ----------------------------------------------------------------

$('signout').addEventListener('click', async () => {
  await api('/api/auth/logout', { method: 'POST' }).catch(() => {});
  window.location.reload();
});

boot().catch((e) => {
  document.body.innerHTML = `<p style="font-family:system-ui;padding:2rem">Could not start the app: ${e.message}</p>`;
});
