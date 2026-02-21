/**
 * Auth utilities for the reader. Checks session and redirects if not logged in.
 * Include this on pages that require authentication (e.g. reader pages).
 */
(function () {
  const config = window.AUTH_CONFIG;
  if (!config?.supabaseUrl || !config?.supabaseAnonKey) return;

  const supabase = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);

  window.auth = {
    check: function (options) {
      options = options || {};
      const redirectTo = options.redirectTo || 'login.html';
      const returnParam = options.returnParam !== false;

      return supabase.auth.getSession().then(function ({ data: { session } }) {
        if (!session) {
          const returnTo = returnParam ? encodeURIComponent(window.location.pathname + window.location.search) : '';
          const sep = redirectTo.includes('?') ? '&' : '?';
          window.location.href = redirectTo + (returnTo ? sep + 'returnTo=' + returnTo : '');
          return null;
        }
        return session;
      });
    },

    logout: function () {
      return supabase.auth.signOut().then(function () {
        window.location.href = 'index.html';
      });
    },

    getSession: function () {
      return supabase.auth.getSession();
    },
  };
})();
