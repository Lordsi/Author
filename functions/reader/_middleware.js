import { createClient } from '@supabase/supabase-js';

const ACCESS_COOKIE_NAME = 'qg_access_token';

function getCookieValue(request, cookieName) {
  const cookieHeader = request.headers.get('cookie') || '';
  const pieces = cookieHeader.split(';');

  for (const piece of pieces) {
    const trimmed = piece.trim();
    if (!trimmed) continue;

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;

    const name = trimmed.slice(0, eqIndex);
    if (name !== cookieName) continue;

    const rawValue = trimmed.slice(eqIndex + 1);
    try {
      return decodeURIComponent(rawValue);
    } catch {
      return rawValue;
    }
  }

  return '';
}

function redirectToLogin(request) {
  const current = new URL(request.url);
  const loginUrl = new URL('/login.html', current.origin);
  loginUrl.searchParams.set('returnTo', current.pathname + current.search);
  return Response.redirect(loginUrl.toString(), 302);
}

function redirectToPurchase(request) {
  return Response.redirect(new URL('/purchase.html', request.url).toString(), 302);
}

export async function onRequest(context) {
  const { request, env, next } = context;
  const supabaseUrl = env.SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Reader middleware missing Supabase environment variables.');
    return new Response('Reader is temporarily unavailable.', { status: 500 });
  }

  const accessToken = getCookieValue(request, ACCESS_COOKIE_NAME);
  if (!accessToken) {
    return redirectToLogin(request);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(accessToken);

  if (userError || !user?.email) {
    if (userError) {
      console.warn('Reader middleware auth lookup failed:', userError.message);
    }
    return redirectToLogin(request);
  }

  const email = user.email.toLowerCase();
  const { data: purchase, error: purchaseError } = await supabase
    .from('purchases')
    .select('status')
    .eq('email', email)
    .maybeSingle();

  if (purchaseError) {
    console.error('Reader middleware purchase lookup failed:', purchaseError.message);
    return new Response('Could not validate purchase status.', { status: 500 });
  }

  if (!purchase || purchase.status !== 'completed') {
    return redirectToPurchase(request);
  }

  return next();
}
