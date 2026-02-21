import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { sessionIncludesExpectedPrice } from './_lib/stripe-utils.js';

function isExistingUserError(message) {
  if (!message) return false;
  return /already (?:registered|exists|been registered)|user already/i.test(message);
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const stripeSecretKey = env.STRIPE_SECRET_KEY;
  const priceId = env.STRIPE_PRICE_ID;
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!stripeSecretKey || !priceId || !supabaseUrl || !supabaseServiceKey) {
    return Response.json({ message: 'Server not configured.' }, { status: 500 });
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    // ignore
  }

  const sessionId = (body.session_id || '').trim();
  const password = typeof body.password === 'string' ? body.password : '';

  if (!sessionId || !password) {
    return Response.json({ message: 'Missing session_id or password.' }, { status: 400 });
  }

  if (password.length < 8) {
    return Response.json({ message: 'Password must be at least 8 characters.' }, { status: 400 });
  }

  const stripe = new Stripe(stripeSecretKey);
  let checkoutSession;

  try {
    checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items.data.price'],
    });
  } catch (err) {
    console.error('Create account: invalid checkout session:', err);
    return Response.json({ message: 'Invalid checkout session.' }, { status: 400 });
  }

  if (checkoutSession.payment_status !== 'paid') {
    return Response.json({ message: 'Payment not completed.' }, { status: 400 });
  }

  if (!sessionIncludesExpectedPrice(checkoutSession, priceId)) {
    return Response.json({ message: 'This checkout session is not valid for this product.' }, { status: 400 });
  }

  const email = checkoutSession.customer_details?.email || checkoutSession.customer_email;
  if (!email) {
    return Response.json({ message: 'Checkout session does not include an email.' }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase();
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error: purchaseError } = await supabase.from('purchases').upsert(
    {
      email: normalizedEmail,
      stripe_session_id: checkoutSession.id,
      status: 'completed',
      created_at: new Date().toISOString(),
    },
    { onConflict: 'email' }
  );

  if (purchaseError) {
    console.error('Create account: failed to upsert purchase:', purchaseError);
    return Response.json({ message: 'Could not verify purchase right now.' }, { status: 500 });
  }

  const { error: createUserError } = await supabase.auth.admin.createUser({
    email: normalizedEmail,
    password,
    email_confirm: true,
  });

  if (createUserError) {
    if (isExistingUserError(createUserError.message)) {
      return Response.json(
        { message: 'An account already exists for this email.', email: normalizedEmail },
        { status: 409 }
      );
    }

    console.error('Create account: failed to create user:', createUserError);
    return Response.json({ message: 'Could not create account.' }, { status: 500 });
  }

  return Response.json({ email: normalizedEmail });
}
