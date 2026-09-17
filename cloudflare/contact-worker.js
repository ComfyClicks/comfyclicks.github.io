const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method !== 'POST' || url.pathname !== '/api/contact') {
      return json({ error: 'Not found.' }, 404);
    }

    const origin = request.headers.get('Origin');
    if (origin !== 'https://andywhite.cv') {
      return json({ error: 'Invalid request origin.' }, 403);
    }

    let form;
    try {
      form = await request.formData();
    } catch {
      return json({ error: 'Invalid form submission.' }, 400);
    }

    if (form.get('website')) return json({ ok: true });

    const name = String(form.get('name') || '').trim();
    const email = String(form.get('email') || '').trim();
    const message = String(form.get('message') || '').trim();
    const token = form.get('cf-turnstile-response');
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name || name.length > 100 || !emailPattern.test(email) || email.length > 254 || !message || message.length > 5000) {
      return json({ error: 'Please complete every field with valid information.' }, 400);
    }

    const forbidden = () => json({ error: 'Please complete the security check and try again.' }, 403);
    if (typeof token !== 'string' || !token.length || token.length > 2048) return forbidden();

    let verification;
    try {
      const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        signal: AbortSignal.timeout(10_000),
        body: new URLSearchParams({
          secret: env.TURNSTILE_SECRET_KEY,
          response: token,
          remoteip: request.headers.get('CF-Connecting-IP') || '',
        }),
      });
      if (!response.ok) return forbidden();
      verification = await response.json();
    } catch {
      return forbidden();
    }

    if (verification.success !== true || verification.action !== 'contact' || verification.hostname !== 'andywhite.cv') {
      return forbidden();
    }

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Andy White Portfolio <hello@andywhite.cv>',
        to: [env.CONTACT_TO_EMAIL],
        reply_to: email,
        subject: `Portfolio inquiry from ${name}`,
        text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
      }),
    });

    if (!resendResponse.ok) {
      console.error('Resend request failed', resendResponse.status, await resendResponse.text());
      return json({ error: 'Unable to send your message right now. Please try again later.' }, 502);
    }

    return json({ ok: true });
  },
};
