/**
 * shared.js — Paradox 2026 Event Preview
 * Shared constants, theme config, Drive helpers, and CSV parser
 * loaded by index.html, preview.html, and event.html.
 */

/* ── Department constants ────────────────────────────────────────── */

const DEPT_LABELS = {
  cultural:   'CULTURALS',
  technicals: 'TECHNICALS',
  sports:     'SPORTS',
};

const DEPT_HEADER_LABELS = {
  cultural:   'CULTURAL',
  technicals: 'TECHNICALS',
  sports:     'SPORTS',
};

/**
 * Full theme config per department.
 * CSS custom properties are set on :root by applyTheme().
 * Raw values are also exposed for any JS that needs them directly.
 */
const THEMES = {
  cultural: {
    gradient:    'linear-gradient(180deg, #1C0034 0%, #270A55 100%)',
    headerBg:    '#521570',
    contentBg:   '#FFFCDE',
    textColor:   '#3F0A58',
    headerText:  '#FCF7C7',
    btnBg:       '#3F0A58',
    btnText:     '#FCF7C7',
    cardBg:      '#7B3FA8',
    cardBorder:  '#34044C',
  },
  technicals: {
    gradient:    'linear-gradient(180deg, #020F1A 0%, #152837 100%)',
    headerBg:    '#23345C',
    contentBg:   '#E5E6E5',
    textColor:   '#121B31',
    headerText:  '#DBDCCD',
    btnBg:       '#121B31',
    btnText:     '#DBDCCD',
    cardBg:      '#C4580F',
    cardBorder:  '#5C2A00',
  },
  sports: {
    gradient:    'linear-gradient(180deg, #1A0505 0%, #350d01 100%)',
    headerBg:    '#5C1C15',
    contentBg:   '#FCDFD8',
    textColor:   '#330B07',
    headerText:  '#F1D7C4',
    btnBg:       '#330B07',
    btnText:     '#EED5BE',
    cardBg:      '#A63020',
    cardBorder:  '#5C1810',
  },
};

/** Published Google Sheets CSV URLs — one per department. */
const SHEET_CSVS = {
  cultural:   'https://docs.google.com/spreadsheets/d/e/2PACX-1vT6pxU5Zp1o0ZPI7vcDOH-a9T0SQvIL-Gk150FPiTm3ER0YyCsQ6xfILwTl3KK1A2ATaHgUzlf8ki78/pub?gid=744375888&single=true&output=csv',
  technicals: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRJOZnntUinD8Q3mazF6P85QFw5C17mJA9qzsNQB3ks_uvkBFDlQHRct0XxPGJXsU4lvQCwqrwz9bJK/pub?gid=1367318563&single=true&output=csv',
  sports:     'https://docs.google.com/spreadsheets/d/e/2PACX-1vRoOAQ-Mvjo--ALp6XA4zhRmVGZ7v-AyS_bR7H49W4PCLnQ74QXP6_W2XvJTPEFlYeAbq9_gJtfnNAA/pub?gid=1720746419&single=true&output=csv',
};

/* ── Theme application ───────────────────────────────────────────── */

/**
 * Apply a department theme by setting CSS custom properties on :root.
 * Also sets the background gradient on #bg-gradient if present.
 *
 * @param {string} dept - one of 'cultural' | 'technicals' | 'sports'
 * @returns {object} the theme object (or cultural fallback)
 */
function applyTheme(dept) {
  const theme = THEMES[dept] || THEMES.cultural;
  const root  = document.documentElement;

  root.style.setProperty('--color-header-bg',   theme.headerBg);
  root.style.setProperty('--color-content-bg',  theme.contentBg);
  root.style.setProperty('--color-text',         theme.textColor);
  root.style.setProperty('--color-btn-bg',       theme.btnBg);
  root.style.setProperty('--color-btn-text',     theme.btnText);
  root.style.setProperty('--color-header-text',  theme.headerText);
  root.style.setProperty('--color-card-bg',      theme.cardBg);
  root.style.setProperty('--color-card-border',  theme.cardBorder);

  const bgEl = document.getElementById('bg-gradient');
  if (bgEl) bgEl.style.background = theme.gradient;

  return theme;
}

/* ── Drive URL helpers ───────────────────────────────────────────── */

/**
 * Returns a direct-display image URL for a Google Drive file ID.
 * Works for images shared with "Anyone with the link".
 */
function driveImgUrl(id) {
  return 'https://lh3.googleusercontent.com/d/' + id;
}

/**
 * Returns a download URL for a Google Drive file ID.
 * Use for fetching JSON / non-image files.
 */
function driveFileUrl(id) {
  return 'https://docs.google.com/uc?export=download&id=' + id;
}

/* ── CSV parser ──────────────────────────────────────────────────── */

/**
 * Parse a published Google Sheet CSV into an array of event objects.
 * Columns: event_name(0) | event_id(1) | is_approved(2) | poster_url(3) |
 *          event_json(4) | form_json(5)
 * All rows returned — preview shows approved and unapproved events.
 *
 * @param {string} csv
 * @returns {Array<{name, event_id, is_approved, poster_url, event_json, form_json}>}
 */
function parseSheet(csv) {
  const lines  = csv.trim().split('\n');
  const events = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (!cols || !cols[0].trim()) continue;
    events.push({
      name:        (cols[0] || '').trim(),
      event_id:    (cols[1] || '').trim(),
      is_approved: (cols[2] || '').trim().toUpperCase() === 'TRUE',
      poster_url:  (cols[3] || '').trim(),
      event_json:  (cols[4] || '').trim(),
      form_json:   (cols[5] || '').trim(),
    });
  }
  return events;
}

/**
 * RFC 4180-compliant single-line CSV parser.
 * Handles quoted fields that may contain commas.
 *
 * @param {string} line
 * @returns {string[]}
 */
function parseCSVLine(line) {
  const result = [];
  let cur = '', inQuote = false, i = 0;
  while (i < line.length) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') {
        // escaped quote inside quoted field ("" → ")
        cur += '"'; i += 2; continue;
      }
      inQuote = !inQuote;
    } else if (ch === ',' && !inQuote) {
      result.push(cur); cur = '';
    } else {
      cur += ch;
    }
    i++;
  }
  result.push(cur);
  return result;
}

/* ── Date formatting helpers ─────────────────────────────────────── */

/** Format a date string as "12 January" (en-IN locale). */
function fmtDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return isNaN(dt) ? '—' : dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' });
}

/** Format a datetime string as "12 Jan, 02:30 PM" (en-IN locale). */
function fmtDateTime(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return isNaN(dt) ? '—' : dt.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}
