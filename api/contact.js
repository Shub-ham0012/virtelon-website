// api/contact.js
// Vercel Serverless Function (Node.js runtime, no framework required).
// Receives the "Start a Project" enquiry form from index.html and emails it
// to Virtelon using an existing SMTP mailbox (Hostinger, or any SMTP host).
//
// Required environment variables (set in Vercel → Project → Settings → Environment Variables):
//   SMTP_HOST        e.g. smtp.hostinger.com
//   SMTP_PORT        e.g. 465
//   SMTP_SECURE      "true" for port 465 (SSL), "false" for port 587 (STARTTLS)
//   SMTP_USER        e.g. contact@virtelon.com
//   SMTP_PASS        the mailbox password (never committed to git)
//   CONTACT_TO_EMAIL where enquiries should land, e.g. contact@virtelon.com
// Optional:
//   CONTACT_FROM_EMAIL  defaults to SMTP_USER — must be a mailbox SMTP_USER is allowed to send as
//   CONTACT_FROM_NAME   defaults to "Virtelon Website"

const nodemailer = require('nodemailer');

// Best-effort in-memory duplicate/rate guard.
// Serverless functions are stateless across cold starts and can run as multiple
// concurrent instances, so this is NOT a distributed rate limiter — it only
// catches obvious repeat-click/bot bursts hitting the *same* warm instance.
// The primary duplicate-submit defense is client-side (button disabled on submit).
const recentByIp = new Map();
const RATE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const RATE_MAX = 6;

function getIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length) return fwd.split(',')[0].trim();
  return req.socket && req.socket.remoteAddress ? req.socket.remoteAddress : 'unknown';
}

function isRateLimited(ip) {
  const now = Date.now();
  const hits = (recentByIp.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  hits.push(now);
  recentByIp.set(ip, hits);
  // Prevent unbounded memory growth on a long-lived warm instance.
  if (recentByIp.size > 500) recentByIp.clear();
  return hits.length > RATE_MAX;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(v, max = 500) {
  if (typeof v !== 'string') return '';
  return v.trim().slice(0, max);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ ok: false, error: 'Method not allowed.' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  // --- Honeypot + time-trap spam defense ---------------------------------
  // A hidden field ("company_site") that real users never see or fill, and a
  // minimum time-since-page-load check. Bots that fill every field instantly
  // get a fake success response so the enquiry is silently dropped instead
  // of alerting the script that it was blocked.
  const honeypot = clean(body.hp, 200);
  const renderedAt = Number(body.ts) || 0;
  const elapsed = renderedAt ? Date.now() - renderedAt : 99999;
  if (honeypot || elapsed < 2500) {
    res.status(200).json({ ok: true });
    return;
  }

  const ip = getIp(req);
  if (isRateLimited(ip)) {
    res.status(429).json({ ok: false, error: 'Too many requests. Please try again later, or reach us on WhatsApp.' });
    return;
  }

  // --- Field extraction + server-side validation --------------------------
  const name = clean(body.name, 120);
  const company = clean(body.company, 160);
  const email = clean(body.email, 200);
  const phone = clean(body.phone, 60);
  const industry = clean(body.industry, 160);
  const projectTypes = Array.isArray(body.projectTypes)
    ? body.projectTypes.map((v) => clean(v, 60)).filter(Boolean).slice(0, 10)
    : [];
  const message = clean(body.message, 4000);
  const budget = clean(body.budget, 60);
  const timeline = clean(body.timeline, 60);
  const existingSite = clean(body.existingSite, 300);
  const source = clean(body.source, 200) || 'virtelon.com — Start a Project';

  const errors = [];
  if (!name) errors.push('Name is required.');
  if (!email || !EMAIL_RE.test(email)) errors.push('A valid email is required.');
  if (name.length > 0 && name.length < 2) errors.push('Name looks too short.');

  if (errors.length) {
    res.status(400).json({ ok: false, error: errors.join(' ') });
    return;
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, CONTACT_TO_EMAIL } = process.env;
  const CONTACT_FROM_EMAIL = process.env.CONTACT_FROM_EMAIL || SMTP_USER;
  const CONTACT_FROM_NAME = process.env.CONTACT_FROM_NAME || 'Virtelon Website';

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !CONTACT_TO_EMAIL) {
    console.error('[api/contact] Missing SMTP env vars — cannot send enquiry email.');
    res.status(500).json({
      ok: false,
      error: 'Email is not configured yet on the server. Please WhatsApp or email us directly for now.',
    });
    return;
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 465,
    secure: SMTP_SECURE ? SMTP_SECURE === 'true' : Number(SMTP_PORT) !== 587,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  const submittedAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });

  const rows = [
    ['Name', name],
    ['Company / Business', company || '—'],
    ['Email', email],
    ['Phone / WhatsApp', phone || '—'],
    ['Industry', industry || '—'],
    ['What they want to build', projectTypes.length ? projectTypes.join(', ') : '—'],
    ['Approximate budget', budget || '—'],
    ['Timeline', timeline || '—'],
    ['Existing website / system', existingSite || '—'],
    ['Source', source],
    ['Submitted', `${submittedAt} IST`],
  ];

  const textLines = [
    'New enquiry received via the Virtelon website.',
    '',
    ...rows.map(([k, v]) => `${k}: ${v}`),
    '',
    'Message:',
    message || '—',
  ];

  const htmlRows = rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 12px 6px 0;color:#5F5E58;font:600 13px/1.4 -apple-system,Segoe UI,Arial,sans-serif;white-space:nowrap;vertical-align:top">${escapeHtml(k)}</td><td style="padding:6px 0;color:#0A0A0A;font:400 13px/1.5 -apple-system,Segoe UI,Arial,sans-serif">${escapeHtml(v)}</td></tr>`
    )
    .join('');

  const html = `
  <div style="background:#F4F4F0;padding:28px 16px;font-family:-apple-system,Segoe UI,Arial,sans-serif">
    <div style="max-width:560px;margin:0 auto;background:#0A0A0A;border-radius:12px;overflow:hidden">
      <div style="padding:20px 24px;background:#0A0A0A">
        <span style="color:#CDF03A;font:700 12px/1 'JetBrains Mono',monospace;letter-spacing:.06em">VIRTELON PRIVATE LIMITED</span>
        <h1 style="margin:8px 0 0;color:#F4F4F0;font-size:19px;line-height:1.3">New project enquiry</h1>
      </div>
      <div style="background:#ffffff;padding:20px 24px">
        <table style="width:100%;border-collapse:collapse">${htmlRows}</table>
        <div style="margin-top:16px;padding-top:16px;border-top:1px solid #e7e7e2">
          <div style="color:#5F5E58;font:600 13px/1.4 -apple-system,Segoe UI,Arial,sans-serif;margin-bottom:6px">Message</div>
          <div style="color:#0A0A0A;font:400 14px/1.6 -apple-system,Segoe UI,Arial,sans-serif;white-space:pre-wrap">${escapeHtml(message) || '—'}</div>
        </div>
      </div>
      <div style="padding:14px 24px;background:#F4F4F0;color:#8E8D85;font:400 11.5px/1.5 -apple-system,Segoe UI,Arial,sans-serif">
        Sent automatically from the Start a Project form on virtelon.com. Reply-To is set to the enquirer's email.
      </div>
    </div>
  </div>`;

  try {
    await transporter.sendMail({
      from: `"${CONTACT_FROM_NAME}" <${CONTACT_FROM_EMAIL}>`,
      to: CONTACT_TO_EMAIL,
      replyTo: `"${name}" <${email}>`,
      subject: `New Virtelon enquiry — ${name}${company ? ` (${company})` : ''}`,
      text: textLines.join('\n'),
      html,
    });
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[api/contact] sendMail failed:', err && err.message);
    res.status(502).json({
      ok: false,
      error: 'Could not send the enquiry right now. Please try WhatsApp or email us directly.',
    });
  }
};
