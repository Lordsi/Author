(function () {
  const form = document.getElementById('order-form');
  const feedback = document.getElementById('order-feedback');

  if (!form || !feedback) return;

  function showFeedback(message, isError) {
    feedback.textContent = message;
    feedback.style.display = 'block';
    if (isError) {
      feedback.style.background = 'rgba(220,53,69,0.15)';
      feedback.style.color = '#f8a5a5';
    } else {
      feedback.style.background = 'rgba(40,167,69,0.15)';
      feedback.style.color = '#90d4a0';
    }
  }

  function clearFeedback() {
    feedback.style.display = 'none';
    feedback.textContent = '';
  }

  form.addEventListener('submit', async function (event) {
    if (!window.fetch) return;
    event.preventDefault();
    clearFeedback();

    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) submitButton.disabled = true;

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form),
      });
      const payload = await response.json().catch(function () {
        return {};
      });

      if (!response.ok) {
        showFeedback(payload.message || 'Could not submit your request. Please try again.', true);
        if (submitButton) submitButton.disabled = false;
        return;
      }

      form.reset();
      showFeedback(
        'Your order request has been received. You will get a confirmation email soon.',
        false
      );
      if (submitButton) submitButton.disabled = false;
    } catch (err) {
      showFeedback('Network error. Please check your connection and try again.', true);
      if (submitButton) submitButton.disabled = false;
    }
  });
})();
