// ── Email sender (Gmail SMTP via nodemailer) ────────────────────────────────
// Configure with env vars:
//   SMTP_HOST (default smtp.gmail.com), SMTP_PORT (default 587)
//   SMTP_USER (your Gmail address), SMTP_PASS (Gmail App Password), MAIL_FROM
// If SMTP_USER/SMTP_PASS are missing, sendMail logs and returns { sent: false }
// so the app keeps working (librarian informs the member manually).
const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_USER || !SMTP_PASS) return null;
  transporter = nodemailer.createTransport({
    host: SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(SMTP_PORT) || 587,
    secure: false,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

async function sendMail(to, subject, html) {
  const tx = getTransporter();
  if (!tx) {
    console.log(`[mailer] SMTP not configured — email to ${to} skipped: ${subject}`);
    return { sent: false, reason: 'smtp_not_configured' };
  }
  try {
    await tx.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
    });
    return { sent: true };
  } catch (err) {
    console.error('[mailer] send failed:', err.message);
    return { sent: false, reason: err.message };
  }
}

function holdAvailableEmail(name, bookTitle, copyCode) {
  const subject = `Good news — "${bookTitle}" is now available at the library`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; color: #161015;">
      <h2 style="font-weight: normal;">Hello ${name},</h2>
      <p>Great news from your college library <strong>LibSys</strong>!</p>
      <p>The book you were waiting for is now back on the shelf:</p>
      <div style="background: #f7f4ee; border-radius: 12px; padding: 16px 20px; margin: 16px 0;">
        <div style="font-size: 18px;"><strong>${bookTitle}</strong></div>
        <div style="color: #3f383d; font-size: 14px;">Copy: ${copyCode}</div>
      </div>
      <p>Please visit the library counter soon to borrow it — first come, first served.</p>
      <p style="color: #3f383d; font-size: 13px;">— LibSys, College Library Management System</p>
    </div>`;
  return { subject, html };
}

module.exports = { sendMail, holdAvailableEmail };
