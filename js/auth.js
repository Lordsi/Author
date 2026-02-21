/**
 * Auth utilities for the reader. Checks session and redirects if not logged in.
 * Include this on pages that require authentication (e.g. reader pages).
 */
(function () {
  const ACCESS_COOKIE_NAME = 'qg_access_token';
  const config = window.AUTH_CONFIG;
  if (!config?.supabaseUrl || !config?.supabaseAnonKey) return;

  const supabase = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);

  function setAccessTokenCookie(token) {
    if (!token) return;
    const attrs = ['Path=/', 'SameSite=Lax', 'Max-Age=604800'];
    if (window.location.protocol === 'https:') attrs.push('Secure');
    document.cookie = ACCESS_COOKIE_NAME + '=' + encodeURIComponent(token) + '; ' + attrs.join('; ');
  }

  function clearAccessTokenCookie() {
    const attrs = ['Path=/', 'SameSite=Lax', 'Max-Age=0'];
    if (window.location.protocol === 'https:') attrs.push('Secure');
    document.cookie = ACCESS_COOKIE_NAME + '=; ' + attrs.join('; ');
  }

  function syncSessionCookie(session) {
    if (session?.access_token) {
      setAccessTokenCookie(session.access_token);
      return;
    }

    clearAccessTokenCookie();
  }

  supabase.auth.getSession().then(function ({ data: { session } }) {
    syncSessionCookie(session);
  });

  supabase.auth.onAuthStateChange(function (_event, session) {
    syncSessionCookie(session);
  });

  window.auth = {
    check: function (options) {
      options = options || {};
      const redirectTo = options.redirectTo || 'login.html';
      const returnParam = options.returnParam !== false;

      return supabase.auth.getSession().then(function ({ data: { session } }) {
        syncSessionCookie(session);
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
        clearAccessTokenCookie();
        window.location.href = 'index.html';
      });
    },

    getSession: function () {
      return supabase.auth.getSession();
    },

    syncSession: function (session) {
      syncSessionCookie(session || null);
    },
  };
})();
