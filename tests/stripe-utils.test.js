import test from 'node:test';
import assert from 'node:assert/strict';

import { sessionIncludesExpectedPrice } from '../functions/_lib/stripe-utils.js';

test('matches expanded line item price ids', function () {
  const session = {
    line_items: {
      data: [{ price: { id: 'price_abc' } }, { price: { id: 'price_xyz' } }],
    },
  };

  assert.equal(sessionIncludesExpectedPrice(session, 'price_xyz'), true);
});

test('matches non-expanded line item price strings', function () {
  const session = {
    line_items: {
      data: [{ price: 'price_abc' }],
    },
  };

  assert.equal(sessionIncludesExpectedPrice(session, 'price_abc'), true);
});

test('returns false when expected price is missing or invalid', function () {
  const session = {
    line_items: {
      data: [{ price: { id: 'price_abc' } }, null],
    },
  };

  assert.equal(sessionIncludesExpectedPrice(session, 'price_missing'), false);
  assert.equal(sessionIncludesExpectedPrice(session, ''), false);
  assert.equal(sessionIncludesExpectedPrice({}, 'price_abc'), false);
});
