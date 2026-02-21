(function () {
  const config = window.AUTH_CONFIG;
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get('session_id');
  const FALLBACK_RETURN_TO = '/book-info.html';

  const formContainer = document.getElementById('create-form-container');
  const pendingEl = document.getElementById('create-pending');
  const purchaseRequiredEl = document.getElementById('create-purchase-required');
  const form = document.getElementById('create-account-form');
  const emailInput = document.getElementById('create-email');
  const errEl = document.getElementById('create-error');
  const successEl = document.getElementById('create-success');

  function showError(msg) {
    if (errEl) {
      errEl.textContent = msg;
      errEl.style.display = 'block';
    }
  }

  function hideError() {
    if (errEl) errEl.style.display = 'none';
  }

  function getApiUrl(pathname) {
    const base = (config?.apiBaseUrl || '').replace(/\/$/, '');
    return (base ? base + '/' : '/') + pathname;
  }

  function getSafeReturnTo() {
    const raw = new URLSearchParams(window.location.search).get('returnTo');
    if (!raw) return FALLBACK_RETURN_TO;

    try {
      const parsed = new URL(raw, window.location.origin);
      if (parsed.origin !== window.location.origin) return FALLBACK_RETURN_TO;
      if (parsed.pathname === '/login.html') return FALLBACK_RETURN_TO;
      return parsed.pathname + parsed.search + parsed.hash;
    } catch {
      return FALLBACK_RETURN_TO;
    }
  }

  async function verifySession() {
    if (!sessionId || !config) {
      purchaseRequiredEl.style.display = 'block';
      pendingEl.style.display = 'none';
      return;
    }

    try {
      const res = await fetch(getApiUrl('verify-session'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.email) {
        emailInput.value = data.email;
        formContainer.style.display = 'block';
        pendingEl.style.display = 'none';
        var intro = document.getElementById('create-intro');
        if (intro) intro.textContent = 'Set a password to finish your account.';
      } else {
        purchaseRequiredEl.style.display = 'block';
        pendingEl.style.display = 'none';
      }
    } catch (e) {
      purchaseRequiredEl.style.display = 'block';
      pendingEl.style.display = 'none';
    }
  }

  if (!sessionId) {
    purchaseRequiredEl.style.display = 'block';
    pendingEl.style.display = 'none';
  } else {
    verifySession();
  }

  if (form && config?.supabaseUrl && config?.supabaseAnonKey) {
    const supabase = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      hideError();

      const email = emailInput?.value?.trim();
      const password = form.querySelector('input[name="password"]')?.value;

      if (!email || !password) {
        showError('Please enter your email and password.');
        return;
      }

      if (password.length < 8) {
        showError('Password must be at least 8 characters.');
        return;
      }

      const btn = form.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;

      try {
        const createRes = await fetch(getApiUrl('create-account'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId, password }),
        });
        const createData = await createRes.json().catch(() => ({}));

        if (!createRes.ok && createRes.status !== 409) {
          showError(createData.message || 'Could not create account.');
          if (btn) btn.disabled = false;
          return;
        }

        const accountEmail = createData.email || email.toLowerCase();
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: accountEmail,
          password,
        });

        if (signInError) {
          if (createRes.status === 409) {
            showError('An account already exists for this email. Please log in or reset your password.');
          } else {
            showError('Account created, but sign-in failed. Please log in manually.');
          }
          if (btn) btn.disabled = false;
          return;
        }

        if (window.auth && typeof window.auth.syncSession === 'function') {
          window.auth.syncSession(signInData.session);
        }

        successEl.style.display = 'block';
        form.style.display = 'none';

        setTimeout(function () {
          window.location.href = getSafeReturnTo();
        }, 1500);
      } catch (err) {
        showError('Something went wrong. Please try again.');
        if (btn) btn.disabled = false;
      }
    });
  }
})();
