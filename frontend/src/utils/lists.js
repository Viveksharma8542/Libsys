// ── Shared academic lists — single source of truth ──────────────────────────
// Use these EVERYWHERE (registration, books, filters) so department and
// course values stay identical across the whole app. Never hardcode copies.

export const DEPARTMENTS = [
  'Commerce',
  'Computer Science',
  'Management',
  'Mathematics',
  'Physics',
];

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

// Indian mobile numbers: exactly 10 digits, nothing else
export const isValidMobile = (v) => /^\d{10}$/.test((v || '').trim());
