import Stripe from 'stripe';

export async function onRequestPost(context) {
  const { request, env } = context;

  const stripeSecretKey = env.STRIPE_SECRET_KEY;
  const priceId = env.STRIPE_PRICE_ID;

  if (!stripeSecretKey || !priceId) {
    return Response.json(
      { message: 'Server not configured. Set STRIPE_SECRET_KEY and STRIPE_PRICE_ID.' },
      { status: 500 }
    );
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    // ignore
  }

  const baseUrl = request.headers.get('origin') || new URL(request.url).origin;
  const successUrl = body.successUrl || baseUrl + '/create-account.html?session_id={CHECKOUT_SESSION_ID}';
  const cancelUrl = body.cancelUrl || baseUrl + '/purchase.html';

  const stripe = new Stripe(stripeSecretKey);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card', 'paypal'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { product: 'queens-gods-digital' },
    });

    return Response.json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err);
    return Response.json(
      { message: err.message || 'Could not create checkout session.' },
      { status: 500 }
    );
  }
}
