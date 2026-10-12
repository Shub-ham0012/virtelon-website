// No submissions or credentials are stored in browser storage or application logs.
const interests = new Set(['project', 'crm', 'other']);
const limit = 12000;
export function validate(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return 'Please send a valid enquiry.';
  if (data.website) return 'Your enquiry could not be accepted. Please email contact@virtelon.com.';
  for (const [key, max, min] of [['name', 100, 1], ['email', 254, 3], ['company', 150, 0], ['message', 5000, 20]]) {
    const value = data[key] ?? '';
    if (typeof value !== 'string' || value.trim().length < min || value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) return 'Please check your name, email and message lengths.';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) || /[\r\n]/.test(data.name + data.email + (data.company || ''))) return 'Please enter a valid name and email.';
  if (!interests.has(data.interest) || data.consent !== 'yes') return 'Choose an enquiry type and agree to using your details to reply.';
  return null;
}
export function createHandler({ fetcher = fetch, env = process.env } = {}) {
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    const json = req.headers.accept?.includes('application/json');
    const reply = (code, message, ok = false) => {
      res.statusCode = code;
      if (json) { res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ ok, message })); }
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      // Messages are fixed, never echo submitted content into HTML.
      return res.end(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Enquiry ${ok ? 'accepted' : 'not accepted'} — Virtelon</title><body style="background:#0b0d10;color:#f2f0e9;font:18px/1.7 system-ui;max-width:700px;margin:60px auto;padding:24px"><h1>${ok ? 'Enquiry accepted' : 'Enquiry not accepted'}</h1><p>${message}</p><p><a style="color:#6e8cff" href="/contact">Return to contact</a> · <a style="color:#6e8cff" href="mailto:contact@virtelon.com">Email Virtelon</a></p></body></html>`);
    };
    if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return reply(405, 'Use the contact form to send an enquiry.'); }
    const origin = req.headers.origin;
    const host = req.headers.host;
    // Same-origin browser submissions only. No CORS allowance; non-browser clients
    // still need valid input and pass the provider's abuse checks.
    if (origin) {
      try { if (new URL(origin).host !== host) return reply(403, 'Please submit from the Virtelon contact page.'); }
      catch { return reply(403, 'Please submit from the Virtelon contact page.'); }
    }
    if (req.headers['sec-fetch-site'] === 'cross-site') return reply(403, 'Please submit from the Virtelon contact page.');
    if (Number(req.headers['content-length']) > limit) return reply(413, 'This enquiry is too large. Please shorten the message.');
    let data = req.body;
    try {
      const contentType = req.headers['content-type'] || '';
      if (!/^(application\/json|application\/x-www-form-urlencoded)(;|$)/.test(contentType)) return reply(415, 'Unsupported submission format.');
      if (typeof data === 'string' || Buffer.isBuffer(data)) {
        const raw = String(data);
        if (Buffer.byteLength(raw) > limit) return reply(413, 'This enquiry is too large. Please shorten the message.');
        data = contentType.startsWith('application/json') ? JSON.parse(raw) : Object.fromEntries(new URLSearchParams(raw));
      }
      if (Buffer.byteLength(JSON.stringify(data ?? {})) > limit) return reply(413, 'This enquiry is too large. Please shorten the message.');
    } catch { return reply(400, 'Please send a valid enquiry.'); }
    const invalid = validate(data);
    if (invalid) return reply(400, invalid);
    if (!env.WEB3FORMS_ACCESS_KEY) return reply(503, 'The form delivery service is not configured. Please email contact@virtelon.com.');
    try {
      const response = await fetcher('https://api.web3forms.com/submit', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(15000),
        body: JSON.stringify({
          access_key: env.WEB3FORMS_ACCESS_KEY,
          subject: 'Virtelon website enquiry', from_name: 'Virtelon website',
          name: data.name.trim(), email: data.email.trim(), replyto: data.email.trim(),
          company: (data.company || '').trim(), enquiry_type: data.interest,
          message: data.message.trim(), consent: 'Permission to respond to this enquiry',
          source: 'Virtelon dark production website', botcheck: ''
        })
      });
      const result = await response.json();
      if (!response.ok || result.success !== true) return reply(502, 'The delivery provider did not accept this enquiry. Your details are still here. Please retry later or email contact@virtelon.com.');
      return reply(200, 'Your enquiry was accepted by our delivery provider. We will review it and reply by email.', true);
    } catch { return reply(502, 'We could not confirm delivery. Please retry later or email contact@virtelon.com.'); }
  };
}
export default createHandler();
