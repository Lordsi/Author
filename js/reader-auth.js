/**
 * Protects reader pages. Call on DOMContentLoaded.
 * Redirects to login if not authenticated.
 */
(function () {
  function init() {
    if (window.auth && typeof window.auth.check === 'function') {
      window.auth.check({
        redirectTo: '../login.html',
        returnParam: true,
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
