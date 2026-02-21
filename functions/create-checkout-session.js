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

  const origin = new URL(request.url).origin;
  const successUrlObj = new URL('/create-account.html', origin);
  successUrlObj.searchParams.set('session_id', '{CHECKOUT_SESSION_ID}');
  const successUrl = successUrlObj.toString();
  const cancelUrl = new URL('/purchase.html', origin).toString();

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
