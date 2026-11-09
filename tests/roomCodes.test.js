import test from 'node:test';
import assert from 'node:assert/strict';
import { generateRoomCode, normalizeRoomCode } from '../src/lib/roomCodes.js';

test('generateRoomCode always returns the requested fixed length', () => {
  assert.equal(generateRoomCode(6, () => 0).length, 6);
  assert.equal(generateRoomCode(6, () => 0.999999).length, 6);
  assert.equal(generateRoomCode(8, () => 0.5).length, 8);
});

test('generateRoomCode only uses uppercase alphanumerics', () => {
  const values = [0, 0.01, 0.25, 0.5, 0.75, 0.999];
  let index = 0;
  const code = generateRoomCode(6, () => values[index++ % values.length]);
  assert.match(code, /^[A-Z0-9]{6}$/);
});

test('normalizeRoomCode trims and uppercases user input', () => {
  assert.equal(normalizeRoomCode('  ab12cd '), 'AB12CD');
  assert.equal(normalizeRoomCode(null), '');
  assert.equal(normalizeRoomCode(undefined), '');
});
