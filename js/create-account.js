(function () {
  const config = window.AUTH_CONFIG;
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get('session_id');

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

  async function verifySession() {
    if (!sessionId || !config) {
      purchaseRequiredEl.style.display = 'block';
      pendingEl.style.display = 'none';
      return;
    }

    try {
      const base = (config.apiBaseUrl || '').replace(/\/$/, '');
      const res = await fetch((base ? base + '/' : '/') + 'verify-session', {
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

      if (password.length < 6) {
        showError('Password must be at least 6 characters.');
        return;
      }

      const btn = form.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;

      try {
        const { data: authData, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + '/book-info.html' },
        });

        if (error) {
          showError(error.message || 'Could not create account.');
          if (btn) btn.disabled = false;
          return;
        }

        successEl.style.display = 'block';
        form.style.display = 'none';

        setTimeout(function () {
          window.location.href = 'book-info.html';
        }, 1500);
      } catch (err) {
        showError('Something went wrong. Please try again.');
        if (btn) btn.disabled = false;
      }
    });
  }
})();
