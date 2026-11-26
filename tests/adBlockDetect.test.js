import test from 'node:test';
import assert from 'node:assert/strict';
import { isAdBlockerError } from '../src/lib/adBlockDetect.js';

test('isAdBlockerError detects DOM reconciliation NotFoundError and ad-script errors', () => {
  const notFoundErr = new Error("Failed to execute 'removeChild' on 'Node'");
  notFoundErr.name = 'NotFoundError';
  assert.equal(isAdBlockerError(notFoundErr), true);

  assert.equal(
    isAdBlockerError(new Error("Failed to execute 'insertBefore' on 'Node': The node before which the new node is to be inserted is not a child of this node.")),
    true
  );
  assert.equal(isAdBlockerError(new Error('adsbygoogle.push() error')), true);
  assert.equal(isAdBlockerError(new Error('Failed to load pagead2.googlesyndication.com')), true);
});

test('isAdBlockerError returns false for unrelated application errors', () => {
  assert.equal(isAdBlockerError(null), false);
  assert.equal(isAdBlockerError(undefined), false);
  assert.equal(isAdBlockerError(new Error('Firebase RTDB permission denied')), false);
  assert.equal(isAdBlockerError(new TypeError('Cannot read properties of undefined')), false);
});

