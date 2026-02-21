import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { sessionIncludesExpectedPrice } from './_lib/stripe-utils.js';

export async function onRequestPost(context) {
  const { request, env } = context;

  const stripeSecretKey = env.STRIPE_SECRET_KEY;
  const priceId = env.STRIPE_PRICE_ID;
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!stripeSecretKey || !priceId || !supabaseUrl || !supabaseServiceKey) {
    return Response.json({ message: 'Server not configured' }, { status: 500 });
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    // ignore
  }

  const sessionId = body.session_id;
  if (!sessionId) {
    return Response.json({ message: 'Missing session_id' }, { status: 400 });
  }

  const stripe = new Stripe(stripeSecretKey);

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items.data.price'],
    });

    if (session.payment_status !== 'paid') {
      return Response.json({ message: 'Payment not completed' }, { status: 400 });
    }

    if (!sessionIncludesExpectedPrice(session, priceId)) {
      return Response.json({ message: 'Session does not include expected product' }, { status: 400 });
    }

    const email = session.customer_details?.email || session.customer_email;
    if (!email) {
      return Response.json({ message: 'No email in session' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { error: purchaseError } = await supabase.from('purchases').upsert(
      {
        email: email.toLowerCase(),
        stripe_session_id: session.id,
        status: 'completed',
        created_at: new Date().toISOString(),
      },
      { onConflict: 'email' }
    );

    if (purchaseError) {
      console.error('Verify session purchase upsert error:', purchaseError);
      return Response.json({ message: 'Could not persist purchase' }, { status: 500 });
    }

    return Response.json({ email: email.toLowerCase() });
  } catch (err) {
    console.error('Verify session error:', err);
    return Response.json(
      { message: err.message || 'Invalid session' },
      { status: 400 }
    );
  }
}
