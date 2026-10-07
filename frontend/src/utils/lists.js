// ── Shared academic lists — single source of truth ──────────────────────────
// Use these EVERYWHERE (registration, books, filters) so course values stay
// identical across the whole app. Never hardcode copies.

export const COURSE_GROUPS = [
  { group: 'B.Tech', options: ['B.Tech CSE', 'B.Tech AI&DS', 'B.Tech ME', 'B.Tech EE'] },
  { group: 'Diploma', options: ['Diploma ME', 'Diploma EE'] },
  {
    group: 'Science & Commerce',
    options: ['B.Sc Maths', 'M.Sc Maths', 'B.Sc Physics', 'M.Sc Physics', 'B.Com', 'M.Com'],
  },
  {
    group: 'Others',
    options: ['B.Pharm', 'D.Pharm', 'B.Sc Nursing', 'B.Sc Botany', 'BCA', 'MCA', 'BBA', 'MBA'],
  },
];

// Flat course list for filter dropdowns (same options, no groups)
export const COURSES = COURSE_GROUPS.flatMap(g => g.options);

// Indian mobile numbers: exactly 10 digits, nothing else
export const isValidMobile = (v) => /^\d{10}$/.test((v || '').trim());
