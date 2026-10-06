// ── Hold queue helpers: expiry + escalation ─────────────────────────────────
// Called lazily inside request handlers (no cron needed — safe on free-tier
// hosting that sleeps). Safe to call often; each run only touches holds that
// actually need attention.
const { query } = require('../config/db');
const { sendMail, holdAvailableEmail } = require('./mailer');

async function getHoldExpiryDays() {
  try {
    const { rows } = await query(`SELECT value FROM system_config WHERE key='hold_expiry_days'`);
    const n = parseInt(rows[0]?.value);
    return Number.isInteger(n) && n > 0 ? n : 3;
  } catch {
    return 3;
  }
}

async function auditSystem(action, entity, entityId, details) {
  try {
    await query(
      `INSERT INTO audit_logs (user_id, user_role, action, entity, entity_id, details)
       VALUES (NULL, 'system', $1, $2, $3, $4)`,
      [action, entity, entityId, JSON.stringify(details || {})]
    );
  } catch (e) { console.error('hold audit error:', e.message); }
}

// Notify the longest-waiting hold for a book (marks notified + emails).
// Returns { borrowerName, email, emailSent } or null when nobody is waiting.
async function notifyOldestWaiting(bookId, copyCode = '') {
  const hRes = await query(
    `SELECT h.id,
            COALESCE(su.name, tu.name) AS borrower_name,
            COALESCE(su.email, tu.email) AS borrower_email,
            b.title AS book_title
     FROM holds h
     LEFT JOIN students s ON s.id = h.student_id LEFT JOIN users su ON su.id = s.user_id
     LEFT JOIN teachers t ON t.id = h.teacher_id LEFT JOIN users tu ON tu.id = t.user_id
     JOIN books b ON b.id = h.book_id
     WHERE h.book_id = $1 AND h.status = 'waiting'
     ORDER BY h.created_at ASC LIMIT 1`,
    [bookId]
  );
  if (!hRes.rows.length) return null;
  const hold = hRes.rows[0];
  const { subject, html } = holdAvailableEmail(hold.borrower_name, hold.book_title, copyCode);
  const result = hold.borrower_email ? await sendMail(hold.borrower_email, subject, html, hold.borrower_name) : { sent: false };
  await query(`UPDATE holds SET status='notified', notified_at=NOW(), email_sent=$1 WHERE id=$2`,
    [result.sent, hold.id]);
  await auditSystem('NOTIFY_HOLD', 'holds', hold.id, { email_sent: result.sent });
  return { borrowerName: hold.borrower_name, email: hold.borrower_email, emailSent: result.sent };
}

// Expire notified holds past their pickup window; pass the slot to the next
// person in queue (only while a copy is actually free).
async function processExpiredHolds() {
  try {
    const days = await getHoldExpiryDays();
    const { rows } = await query(
      `SELECT h.id, h.book_id, COALESCE(b.available_copies, 0) AS available
       FROM holds h JOIN books b ON b.id = h.book_id
       WHERE h.status = 'notified' AND h.notified_at < NOW() - ($1 || ' days')::interval`,
      [String(days)]
    );
    for (const r of rows) {
      await query(`UPDATE holds SET status='expired' WHERE id=$1 AND status='notified'`, [r.id]);
      await auditSystem('EXPIRE_HOLD', 'holds', r.id, { after_days: days });
      if (parseInt(r.available) > 0) {
        await notifyOldestWaiting(r.book_id);
      }
    }
  } catch (e) { console.error('processExpiredHolds error:', e.message); }
}

module.exports = { getHoldExpiryDays, notifyOldestWaiting, processExpiredHolds };
