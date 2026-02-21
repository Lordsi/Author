export function sessionIncludesExpectedPrice(session, expectedPriceId) {
  if (!expectedPriceId) return false;

  const items = session?.line_items?.data || [];
  return items.some(function (item) {
    if (!item) return false;
    if (typeof item.price === 'string') return item.price === expectedPriceId;
    return item.price?.id === expectedPriceId;
  });
}
