// Patient folder names and note file names, matching the conventions the
// practice already uses in Drive:
//   folder: "Lastname, Firstname"
//   file:   "Lastname_Firstname_SOAP_MMDDYY"

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

/**
 * Capitalizes a name without destroying one that was typed deliberately.
 *
 * ALL CAPS and all lowercase get normalized, because a folder called
 * "BOYD, MICHELLE" sitting next to "Boyd, Michelle" splits one patient's chart
 * across two folders. Anything already mixed case is left exactly as typed, so
 * McDonald and DeAngelo survive.
 */
function titleCase(s) {
  return s
    .trim()
    .split(/([ '-])/) // keep the separators so O'Brien and Smith-Jones survive
    .map((part) => {
      if (!/^[a-zA-Z]/.test(part)) return part;
      const deliberatelyMixed = part !== part.toUpperCase() && part !== part.toLowerCase();
      const body = deliberatelyMixed ? part.slice(1) : part.slice(1).toLowerCase();
      return part[0].toUpperCase() + body;
    })
    .join('');
}

/**
 * Accepts either order and returns the folder convention.
 * "michelle boyd" and "Boyd, Michelle" both become "Boyd, Michelle".
 */
export function normalizePatientName(raw) {
  const name = String(raw || '').trim().replace(/\s+/g, ' ');
  if (!name) throw badRequest('Enter the patient name.');
  if (name.length > 120) throw badRequest('That name is too long.');
  if (/[\\/:*?"<>|]/.test(name)) throw badRequest('Remove any of \\ / : * ? " < > | from the name.');

  if (name.includes(',')) {
    const [last, ...rest] = name.split(',');
    const first = rest.join(' ').trim();
    if (!last.trim() || !first) throw badRequest('Enter both a first and last name.');
    return `${titleCase(last)}, ${titleCase(first)}`;
  }

  const words = name.split(' ');
  if (words.length < 2) throw badRequest('Enter both a first and last name.');
  const last = words.pop();
  return `${titleCase(last)}, ${titleCase(words.join(' '))}`;
}

/** "Boyd, Michelle" + "2026-08-27" -> "Boyd_Michelle_SOAP_082726" */
export function buildFileName(patientFolderName, isoDate) {
  const namePart =
    String(patientFolderName)
      .replace(/,/g, '')
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^A-Za-z0-9_'-]/g, '') || 'Patient';

  const [y, m, d] = String(isoDate).split('-');
  const datePart = y && m && d ? `${m}${d}${y.slice(2)}` : 'nodate';

  return `${namePart}_SOAP_${datePart}`;
}
