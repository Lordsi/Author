(function () {
  const config = window.AUTH_CONFIG;
  if (!config?.supabaseUrl || !config?.supabaseAnonKey) return;

  const supabase = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
  const form = document.getElementById('login-form');
  const errEl = document.getElementById('login-error');
  const FALLBACK_RETURN_TO = '/book-info.html';

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

  function showError(msg) {
    if (errEl) {
      errEl.textContent = msg;
      errEl.style.display = 'block';
    }
  }

  function hideError() {
    if (errEl) errEl.style.display = 'none';
  }

  // Redirect if already logged in
  supabase.auth.getSession().then(function ({ data: { session } }) {
    if (session) {
      if (window.auth && typeof window.auth.syncSession === 'function') {
        window.auth.syncSession(session);
      }
      const returnTo = getSafeReturnTo();
      window.location.href = returnTo;
    }
  });

  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      hideError();

      const email = form.querySelector('input[name="email"]')?.value?.trim();
      const password = form.querySelector('input[name="password"]')?.value;

      if (!email || !password) {
        showError('Please enter your email and password.');
        return;
      }

      const btn = form.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;

      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
          showError(error.message || 'Invalid email or password.');
          if (btn) btn.disabled = false;
          return;
        }

        if (window.auth && typeof window.auth.syncSession === 'function') {
          window.auth.syncSession(data.session);
        }

        const returnTo = getSafeReturnTo();
        window.location.href = returnTo;
      } catch (err) {
        showError('Something went wrong. Please try again.');
        if (btn) btn.disabled = false;
      }
    });
  }
})();
