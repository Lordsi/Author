function jsonResponse(payload, status) {
  return Response.json(payload, { status: status || 200 });
}

function wantsJson(request) {
  const accept = request.headers.get('accept') || '';
  return accept.includes('application/json');
}

function errorResponse(request, message, status) {
  if (wantsJson(request)) {
    return jsonResponse({ message }, status || 400);
  }

  return new Response(
    '<!doctype html><html><body style="font-family:sans-serif;padding:2rem;">' +
      '<h1>Request could not be submitted</h1>' +
      '<p>' +
      message +
      '</p><p><a href="/order.html">Back to order page</a></p></body></html>',
    {
      status: status || 400,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    }
  );
}

function successResponse(request) {
  if (wantsJson(request)) {
    return jsonResponse({ message: 'Order request received.' }, 200);
  }

  return new Response(
    '<!doctype html><html><body style="font-family:sans-serif;padding:2rem;">' +
      '<h1>Request received</h1>' +
      '<p>Thank you. We received your order request and will contact you by email.</p>' +
      '<p><a href="/order.html">Back to site</a></p></body></html>',
    {
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    }
  );
}

function normalizeText(value) {
  return (value || '').toString().trim();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function onRequestPost(context) {
  const { request } = context;

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse(request, 'Invalid form submission.', 400);
  }

  const name = normalizeText(formData.get('name'));
  const email = normalizeText(formData.get('email')).toLowerCase();
  const address = normalizeText(formData.get('address'));
  const copiesRaw = normalizeText(formData.get('copies'));
  const copies = Number.parseInt(copiesRaw, 10);

  if (name.length < 2 || name.length > 120) {
    return errorResponse(request, 'Please provide a valid name.', 400);
  }

  if (!isValidEmail(email) || email.length > 254) {
    return errorResponse(request, 'Please provide a valid email address.', 400);
  }

  if (address.length < 8 || address.length > 500) {
    return errorResponse(request, 'Please provide a valid shipping address.', 400);
  }

  if (!Number.isInteger(copies) || copies < 1 || copies > 10) {
    return errorResponse(request, 'Please select a valid number of copies.', 400);
  }

  console.log('Order request received:', {
    name,
    email,
    address,
    copies,
    received_at: new Date().toISOString(),
  });

  return successResponse(request);
}
