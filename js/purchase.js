(function () {
  const config = window.AUTH_CONFIG;
  if (!config) {
    console.warn('AUTH_CONFIG not set. Purchase will not work until configured.');
    return;
  }

  const btn = document.getElementById('btn-stripe');
  const errEl = document.getElementById('purchase-error');
  const loadingEl = document.getElementById('purchase-loading');

  function showError(msg) {
    errEl.textContent = msg;
    errEl.style.display = 'block';
    loadingEl.style.display = 'none';
    if (btn) btn.disabled = false;
  }

  function hideError() {
    errEl.style.display = 'none';
  }

  if (btn) {
    btn.addEventListener('click', async function () {
      hideError();
      btn.disabled = true;
      loadingEl.style.display = 'block';

      try {
        const base = (config.apiBaseUrl || '').replace(/\/$/, '');
        const res = await fetch((base ? base + '/' : '/') + 'create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            successUrl: window.location.origin + '/create-account.html?session_id={CHECKOUT_SESSION_ID}',
            cancelUrl: window.location.origin + '/purchase.html',
          }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          showError(data.message || 'Could not start checkout. Please try again.');
          return;
        }

        if (data.url) {
          window.location.href = data.url;
        } else {
          showError('Checkout URL not received. Please try again.');
        }
      } catch (e) {
        showError('Network error. Please check your connection and try again.');
      }
    });
  }
})();
