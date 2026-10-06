// ── Email sender ────────────────────────────────────────────────────────────
// Two providers (first configured one wins):
//   1. Brevo HTTP API (BREVO_API_KEY + verified BREVO_SENDER) — works from
//      Render free tier, which blocks SMTP ports. Preferred in production.
//   2. Direct SMTP via nodemailer (SMTP_USER/SMTP_PASS/...) — local dev or
//      paid hosting where SMTP ports are open.
// If neither is configured, sendMail logs and returns { sent: false }.
const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE } = process.env;
  const SMTP_USER = (process.env.SMTP_USER || '').trim();
  const SMTP_PASS = (process.env.SMTP_PASS || '').trim();
  if (!SMTP_USER || !SMTP_PASS) return null;
  const port = parseInt(SMTP_PORT) || 587;
  // Port 465 = implicit SSL; 587 = STARTTLS. Override with SMTP_SECURE=true/false.
  const secure = SMTP_SECURE !== undefined && SMTP_SECURE !== ''
    ? SMTP_SECURE === 'true'
    : port === 465;
  transporter = nodemailer.createTransport({
    host: SMTP_HOST || 'smtp.gmail.com',
    port,
    secure,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    connectionTimeout: 15000,
    greetingTimeout: 10000,
  });
  return transporter;
}

// Parse "Name <addr@x.com>" or plain "addr@x.com" into { name, email }
function parseFrom(raw, fallbackEmail) {
  const m = /^(.*)<([^<>]+)>$/.exec((raw || '').trim());
  if (m) return { name: m[1].trim() || 'LibSys Library', email: m[2].trim() };
  return { name: 'LibSys Library', email: (raw || '').trim() || fallbackEmail || '' };
}

// ── Brevo HTTP API (plain HTTPS — unaffected by SMTP port blocks)
async function sendViaBrevo(to, toName, subject, html) {
  const sender = parseFrom(process.env.MAIL_FROM, process.env.BREVO_SENDER);
  const senderEmail = (process.env.BREVO_SENDER || sender.email).trim();
  const apiKey = (process.env.BREVO_API_KEY || '').trim();
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      sender: { name: sender.name, email: senderEmail },
      to: [{ email: to, name: toName || '' }],
      subject,
      htmlContent: html,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    // Safe diagnostics: key prefix + length only (never log the key itself).
    // A healthy Brevo v3 key starts with "xkeysib-" and is ~108 chars long.
    console.error(
      `[mailer] brevo key check: prefix="${apiKey.slice(0, 8)}" length=${apiKey.length}`
    );
    throw new Error(`Brevo rejected the request (HTTP ${res.status}): ${text.slice(0, 200)}`);
  }
  return { sent: true, via: 'brevo' };
}

function emailChannel() {
  if (process.env.BREVO_API_KEY) return 'brevo';
  if (process.env.SMTP_USER && process.env.SMTP_PASS) return 'smtp';
  return 'none';
}

async function sendMail(to, subject, html, toName = '') {
  // Prefer HTTP API (works everywhere, including Render free tier)
  if (process.env.BREVO_API_KEY) {
    try {
      return await sendViaBrevo(to, toName, subject, html);
    } catch (err) {
      console.error('[mailer] send failed:', err.message);
      return { sent: false, reason: err.message };
    }
  }
  // Fallback: direct SMTP (local dev, paid hosting)
  const tx = getTransporter();
  if (!tx) {
    console.log(`[mailer] no email provider configured — email to ${to} skipped: ${subject}`);
    return { sent: false, reason: 'smtp_not_configured' };
  }
  try {
    await tx.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
    });
    return { sent: true, via: 'smtp' };
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

function otpEmail(name, otp) {
  const subject = `Your LibSys password-reset code: ${otp}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; color: #161015;">
      <h2 style="font-weight: normal;">Hello ${name},</h2>
      <p>We received a request to reset your <strong>LibSys</strong> library password.</p>
      <p>Enter this one-time code on the website (valid for <strong>10 minutes</strong>):</p>
      <div style="background: #f7f4ee; border-radius: 12px; padding: 20px; margin: 16px 0; text-align: center; font-size: 32px; letter-spacing: 8px; font-weight: bold;">
        ${otp}
      </div>
      <p style="color: #3f383d; font-size: 13px;">If you did not ask for this, just ignore this email — your password stays unchanged.</p>
      <p style="color: #3f383d; font-size: 13px;">— LibSys, College Library Management System</p>
    </div>`;
  return { subject, html };
}

function passwordChangedEmail(name) {
  const subject = `Your LibSys password was changed successfully`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; color: #161015;">
      <h2 style="font-weight: normal;">Hello ${name},</h2>
      <p>✅ Your <strong>LibSys</strong> library password has been <strong>changed successfully</strong>.</p>
      <p>You can now sign in with your new password.</p>
      <p style="color: #c8392b; font-size: 13px;">Didn't do this? Contact your librarian immediately.</p>
      <p style="color: #3f383d; font-size: 13px;">— LibSys, College Library Management System</p>
    </div>`;
  return { subject, html };
}

module.exports = { sendMail, holdAvailableEmail, otpEmail, passwordChangedEmail };
