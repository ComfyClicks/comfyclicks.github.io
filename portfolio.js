const menuButton = document.querySelector('.menu-button');
const navigation = document.querySelector('#primary-navigation');
const header = menuButton.closest('.site-header');
const mobileLayout = window.matchMedia('(max-width: 980px)');

function setMenuOpen(open) {
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.textContent = open ? 'Close' : 'Menu';
  navigation.classList.toggle('open', open);
}

menuButton.addEventListener('click', () => setMenuOpen(!navigation.classList.contains('open')));
header.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || !navigation.classList.contains('open')) return;
  setMenuOpen(false);
  menuButton.focus();
});
header.addEventListener('focusout', (event) => {
  if (!header.contains(event.relatedTarget)) setMenuOpen(false);
});
navigation.addEventListener('click', (event) => {
  const link = event.target.closest('a');
  if (!link || !navigation.classList.contains('open')) return;
  const destination = document.getElementById(link.hash.slice(1));
  if (destination) {
    destination.setAttribute('tabindex', '-1');
    destination.focus({ preventScroll: true });
  }
  setMenuOpen(false);
});
mobileLayout.addEventListener('change', () => setMenuOpen(false));
header.classList.add('menu-ready');

const contactForm = document.querySelector('#contact-form');
const contactStatus = document.querySelector('#contact-status');
const securityStatus = document.querySelector('#security-status');
const recovery = document.querySelector('#contact-recovery');
const retryButton = document.querySelector('#retry-security');
const widget = contactForm.querySelector('.cf-turnstile');
const submitButton = contactForm.querySelector('button[type="submit"]');
let contactWidgetId;
let verified = false;
let sending = false;

function updateSecurity(message, { ready = false, failed = false } = {}) {
  verified = ready;
  submitButton.disabled = !verified || sending;
  securityStatus.textContent = message;
  securityStatus.classList.toggle('is-error', failed);
  recovery.hidden = !failed;
}

function loadTurnstile() {
  if (window.turnstile?.render) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    const timeout = window.setTimeout(fail, 12000);

    function fail() {
      window.clearTimeout(timeout);
      script.remove();
      reject(new Error('Turnstile did not load.'));
    }

    script.addEventListener('error', fail, { once: true });
    script.addEventListener('load', () => {
      window.clearTimeout(timeout);
      if (window.turnstile?.render) resolve();
      else fail();
    }, { once: true });
    document.head.append(script);
  });
}

function securityUnavailable() {
  updateSecurity('The security check is unavailable. Please try again.', { failed: true });
}

async function startSecurityCheck() {
  updateSecurity('Loading security check…');

  try {
    await loadTurnstile();
    if (contactWidgetId !== undefined) {
      window.turnstile.reset(contactWidgetId);
      return;
    }
    contactWidgetId = window.turnstile.render(widget, {
      sitekey: widget.dataset.sitekey,
      action: widget.dataset.action,
      theme: widget.dataset.theme,
      size: 'compact',
      retry: 'never',
      'refresh-expired': 'manual',
      callback: () => updateSecurity('', { ready: true }),
      'error-callback': () => {
        securityUnavailable();
        return true;
      },
      'expired-callback': () => updateSecurity('The security check expired. Please try again.', { failed: true }),
      'timeout-callback': () => updateSecurity('The security check timed out. Please try again.', { failed: true }),
    });
  } catch {
    securityUnavailable();
  }
}

retryButton.addEventListener('click', () => {
  securityStatus.focus();
  startSecurityCheck();
});
startSecurityCheck();

contactForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!verified || sending) return;

  const body = new FormData(contactForm);
  if (!body.get('cf-turnstile-response')) {
    updateSecurity('Please retry the security check before sending.', { failed: true });
    return;
  }

  sending = true;
  submitButton.disabled = true;
  contactStatus.classList.remove('is-error');
  contactStatus.textContent = 'Sending…';

  try {
    const response = await fetch(contactForm.action, {
      method: 'POST',
      body,
      headers: { Accept: 'application/json' },
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.ok !== true) {
      throw new Error(result.error || 'Unable to send your message. Please try again.');
    }

    contactForm.reset();
    contactStatus.textContent = 'Thanks — your message has been sent.';
  } catch (error) {
    contactStatus.classList.add('is-error');
    contactStatus.textContent = error.message || 'Unable to send your message. Please try again.';
  } finally {
    sending = false;
    startSecurityCheck();
  }
});
