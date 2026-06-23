/** ປີ ພ.ສ. (ລາວ) = ຄ.ສ. + 543 */
export const BE_OFFSET = 543;

export function ceToBe(ce) {
  return Number(ce) + BE_OFFSET;
}

export function beToCe(be) {
  return Number(be) - BE_OFFSET;
}

/** Convert YYYY-MM-DD → day, month, year (stored as CE) */
export function parseIsoDate(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    return { day: '', month: '', year: '' };
  }
  const [year, month, day] = iso.split('-');
  return {
    day: String(Number(day)),
    month: String(Number(month)),
    year,
  };
}

/** Combine day, month, year → YYYY-MM-DD (year in CE) */
export function toIsoDate(day, month, yearCe) {
  const d = Number(day);
  const m = Number(month);
  const y = Number(yearCe);
  if (!d || !m || !y) return '';
  const date = new Date(y, m - 1, d);
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  ) {
    return '';
  }
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** Lao month names */
export const MONTHS_LO = [
  'ມັງກອນ',
  'ກຸມພາ',
  'ມີນາ',
  'ເມສາ',
  'ພຶດສະພາ',
  'ມິຖຸນາ',
  'ກໍລະກົດ',
  'ສິງຫາ',
  'ກັນຍາ',
  'ຕຸລາ',
  'ພະຈິກ',
  'ທັນວາ',
];

/** @deprecated Use MONTHS_LO */
export const MONTHS_TH = MONTHS_LO;

/** Display birth date in Lao style: e.g., 19 เมສາ 2567 */
export function formatDateLao(iso) {
  if (!iso) return '-';
  const { day, month, year } = parseIsoDate(iso);
  if (!day || !month || !year) return iso;
  const monthName = MONTHS_LO[Number(month) - 1] || month;
  return `${day} ${monthName} ${ceToBe(year)}`;
}

/** Display DD/MM/YYYY (BE) */
export function formatDateDMY(iso) {
  if (!iso) return '-';
  const { day, month, year } = parseIsoDate(iso);
  if (!day || !month || !year) return iso;
  return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${ceToBe(year)}`;
}

/** Convert Day/Month/Year text → YYYY-MM-DD (supports BE and CE) */
export function parseDmyText(text) {
  const trimmed = text.trim();
  if (!trimmed) return '';

  const parts = trimmed.split(/[/\-.]/).map((p) => p.trim());
  if (parts.length !== 3) return '';

  let day = Number(parts[0]);
  let month = Number(parts[1]);
  let year = Number(parts[2]);

  if (!day || !month || !year) return '';

  if (year > 2400) {
    year = beToCe(year);
  } else if (year < 100) {
    year += year > 50 ? 1900 : 2000;
  }

  return toIsoDate(day, month, year);
}

/** Birth year options (CE) for DB storage */
export function birthYearOptions() {
  const current = new Date().getFullYear();
  const years = [];
  for (let y = current - 15; y >= current - 80; y -= 1) {
    years.push(y);
  }
  return years;
}

/** Birth year options shown in BE (Lao) */
export function birthYearOptionsLao() {
  return birthYearOptions().map((ce) => ({ ce, be: ceToBe(ce) }));
}
