(function () {
  const config = window.AUTH_CONFIG;
  if (!config?.supabaseUrl || !config?.supabaseAnonKey) return;

  const supabase = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
  const form = document.getElementById('login-form');
  const errEl = document.getElementById('login-error');

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
      const returnTo = new URLSearchParams(window.location.search).get('returnTo') || 'book-info.html';
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

        const returnTo = new URLSearchParams(window.location.search).get('returnTo') || 'book-info.html';
        window.location.href = returnTo;
      } catch (err) {
        showError('Something went wrong. Please try again.');
        if (btn) btn.disabled = false;
      }
    });
  }
})();
