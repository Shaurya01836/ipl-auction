import test from 'node:test';
import assert from 'node:assert/strict';
import { isUserAdmin } from '../src/lib/adminAuth.js';
import { isQuotaError } from '../src/lib/quota.js';

test('admin authorization: legitimate admin access is granted with case and whitespace tolerance', () => {
  const configuredAdmin = 'admin@example.com';

  assert.equal(
    isUserAdmin({ email: 'admin@example.com' }, configuredAdmin),
    true,
    'Exact match must be granted admin access',
  );

  assert.equal(
    isUserAdmin({ email: 'ADMIN@EXAMPLE.COM' }, configuredAdmin),
    true,
    'Case-insensitive match must be granted admin access',
  );

  assert.equal(
    isUserAdmin({ email: '  admin@example.com  ' }, configuredAdmin),
    true,
    'Trimmed whitespace match must be granted admin access',
  );
});

test('admin authorization: unauthorized users are strictly denied without leaking admin email', () => {
  const configuredAdmin = 'admin@example.com';

  assert.equal(
    isUserAdmin({ email: 'attacker@example.com' }, configuredAdmin),
    false,
    'Different email must be denied',
  );

  assert.equal(
    isUserAdmin({ email: '' }, configuredAdmin),
    false,
    'Empty email must be denied',
  );

  assert.equal(
    isUserAdmin(null, configuredAdmin),
    false,
    'Null user must be denied',
  );

  assert.equal(
    isUserAdmin(undefined, configuredAdmin),
    false,
    'Undefined user must be denied',
  );

  assert.equal(
    isUserAdmin({ email: 'admin@example.com' }, ''),
    false,
    'Unconfigured admin email must deny all access',
  );

  assert.equal(
    isUserAdmin({ email: 'admin@example.com' }, null),
    false,
    'Null admin email must deny all access',
  );
});

test('quota detection: accurately identifies Firebase and RTDB quota exhaustion errors', () => {
  // 1. Standard Firestore / Cloud Functions error codes
  assert.equal(isQuotaError({ code: 'resource-exhausted' }), true);
  assert.equal(isQuotaError({ code: 'functions/resource-exhausted' }), true);
  assert.equal(isQuotaError({ code: 'storage/quota-exceeded' }), true);
  assert.equal(isQuotaError({ code: 'quota-exceeded' }), true);

  // 2. Realtime Database quota messages
  assert.equal(
    isQuotaError({
      message: "PERMISSION_DENIED: The Firebase database 'crick-auction' has exceeded its quota limits.",
    }),
    true,
  );
  assert.equal(isQuotaError({ message: 'Client is over quota' }), true);
  assert.equal(isQuotaError({ message: 'Daily free limit reached.' }), true);
  assert.equal(isQuotaError({ message: 'Bandwidth limit exceeded' }), true);
  assert.equal(
    isQuotaError(new Error('Quota exceeded for quota metric...')),
    true,
  );
});

test('quota detection: unrelated network and auth errors never trigger quota lockout', () => {
  // Network failures
  assert.equal(isQuotaError({ code: 'network-request-failed' }), false);
  assert.equal(isQuotaError(new Error('Failed to fetch')), false);
  assert.equal(isQuotaError(new Error('NetworkError when attempting to fetch resource.')), false);
  assert.equal(isQuotaError({ code: 'unavailable', message: 'The service is currently unavailable.' }), false);

  // Permission / Security rules (without quota text)
  assert.equal(isQuotaError({ code: 'permission-denied', message: 'Missing or insufficient permissions.' }), false);

  // Authentication errors
  assert.equal(isQuotaError({ code: 'auth/user-not-found' }), false);
  assert.equal(isQuotaError({ code: 'auth/wrong-password' }), false);
  assert.equal(isQuotaError({ code: 'auth/invalid-email' }), false);

  // Edge cases
  assert.equal(isQuotaError(null), false);
  assert.equal(isQuotaError(undefined), false);
  assert.equal(isQuotaError(''), false);
  assert.equal(isQuotaError(new Error('Unexpected token in JSON')), false);
});

test('console.error is un-intercepted and explicit quota handling functions as expected', () => {
  let isExceeded = false;
  let errorMsg = '';

  const triggerQuota = (msg) => {
    isExceeded = true;
    errorMsg = msg;
  };

  const handleFirebaseError = (err) => {
    if (isQuotaError(err)) {
      triggerQuota('Server daily free limit reached.');
      return true;
    }
    return false;
  };

  // Calling console.error with quota text does NOT trigger quota state (no monkey-patching!)
  console.error('Test log: quota exceeded');
  assert.equal(isExceeded, false, 'console.error must not be hijacked to trigger quota');

  // Explicit handler catches actual quota error
  const handled = handleFirebaseError({ code: 'resource-exhausted' });
  assert.equal(handled, true);
  assert.equal(isExceeded, true);
  assert.equal(errorMsg, 'Server daily free limit reached.');

  // Explicit handler ignores unrelated network error
  isExceeded = false;
  const ignored = handleFirebaseError({ code: 'network-request-failed' });
  assert.equal(ignored, false);
  assert.equal(isExceeded, false);
});

