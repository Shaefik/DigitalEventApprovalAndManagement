// mailService.js : one place for sending emails
require('dotenv').config();


const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Builds a clean, Classroom-style email: heading, short message, details table, one button
function buildEmail({ heading, intro, rows = [], ctaLabel, ctaUrl, tone = '#4f46e5', note }) {
  const visible = rows.filter(([, v]) => v);
  const html = `<div style="background:#f1f5f9;padding:24px 12px;font-family:Segoe UI,Arial,sans-serif;color:#0f172a">
  <div style="max-width:560px;margin:auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
    <div style="background:${tone};color:#fff;padding:16px 24px;font-weight:600;font-size:14px">PSG Permission Portal</div>
    <div style="padding:24px">
      <h2 style="margin:0 0 8px;font-size:20px">${esc(heading)}</h2>
      <p style="margin:0 0 16px;font-size:14px;line-height:1.5;color:#334155">${esc(intro)}</p>
      ${note ? `<p style="margin:0 0 16px;padding:10px 12px;background:#fef2f2;border-radius:8px;font-size:14px;color:#991b1b"><b>Reason:</b> ${esc(note)}</p>` : ''}
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        ${visible.map(([k, v]) => `<tr><td style="padding:6px;color:#64748b;width:38%;border-bottom:1px solid #f1f5f9">${esc(k)}</td><td style="padding:6px;border-bottom:1px solid #f1f5f9"><b>${esc(v)}</b></td></tr>`).join('')}
      </table>
      ${ctaUrl ? `<p style="margin:24px 0 0"><a href="${esc(ctaUrl)}" style="background:${tone};color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:600;display:inline-block">${esc(ctaLabel)}</a></p>` : ''}
    </div>
    <div style="padding:14px 24px;background:#f8fafc;font-size:12px;color:#64748b">You received this because you are part of the approval process in the PSG Permission Portal.</div>
  </div></div>`;
  const text = [heading, '', intro, note ? `Reason: ${note}` : '', '', ...visible.map(([k, v]) => `${k}: ${v}`), ctaUrl ? `\n${ctaLabel}: ${ctaUrl}` : ''].join('\n');
  return { html, text };
}

// Sends one email. NEVER throws, so a mail problem can't break an approval.

async function sendMail({
  to,
  subject,
  html,
  text,
  sensitive = false
}) {
  if (!to) return { sent: false };

  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;

  if (!apiKey || !senderEmail) {
    console.error('Brevo email service not configured');
    return { sent: false };
  }

  const override = sensitive
    ? undefined
    : process.env.MAIL_TEST_RECIPIENT;

  try {
    const response = await fetch(
      'https://api.brevo.com/v3/smtp/email',
      {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          sender: {
            name: process.env.BREVO_SENDER_NAME
              || 'PSG Permission Portal',
            email: senderEmail
          },
          to: [
            { email: override || to }
          ],
          subject: override
            ? `${subject} [for ${to}]`
            : subject,
          htmlContent: html,
          textContent: text
        }),
        signal: AbortSignal.timeout(10000)
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));

      console.error(
        'Brevo email failed:',
        response.status,
        error.code || 'Unknown error'
      );

      return { sent: false };
    }

    console.log('Email accepted by Brevo');

    return { sent: true };

  } catch (error) {
    console.error('Email failed:', error.message);
    return { sent: false };
  }
}


module.exports = { sendMail, buildEmail };