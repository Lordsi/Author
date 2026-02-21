import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export async function onRequestPost(context) {
  const { request, env } = context;

  const stripeSecretKey = env.STRIPE_SECRET_KEY;
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET;
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!stripeSecretKey || !webhookSecret || !supabaseUrl || !supabaseServiceKey) {
    console.error('Missing env vars');
    return new Response('Server not configured', { status: 500 });
  }

  const rawBody = await request.text();
  const sig = request.headers.get('stripe-signature');

  const stripe = new Stripe(stripeSecretKey);
  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return new Response('Webhook signature verification failed', { status: 400 });
  }

  if (stripeEvent.type !== 'checkout.session.completed') {
    return new Response('OK');
  }

  const session = stripeEvent.data.object;
  const email = session.customer_details?.email || session.customer_email;

  if (!email) {
    console.error('No email in checkout session');
    return new Response('OK');
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { error } = await supabase.from('purchases').upsert(
    {
      email: email.toLowerCase(),
      stripe_session_id: session.id,
      status: 'completed',
      created_at: new Date().toISOString(),
    },
    { onConflict: 'email' }
  );

  if (error) {
    console.error('Supabase upsert error:', error);
    return new Response('Database error', { status: 500 });
  }

  return new Response('OK');
}
