import test from 'node:test';
import assert from 'node:assert/strict';
import { generateRoomCode, normalizeRoomCode, generateSoloRoomCode } from '../src/lib/roomCodes.js';
import { withServerParam } from '../src/lib/auctionServers.js';
import { isLocalRoom, localAuctionReducer, saveLocalSoloRoom, loadLocalSoloRoom } from '../src/lib/localAuctionEngine.js';

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
  // Asserts SOLO-XXXXXX passes through unchanged or uppercase-trimmed
  assert.equal(normalizeRoomCode('SOLO-A1B2C3'), 'SOLO-A1B2C3');
  assert.equal(normalizeRoomCode('  solo-f4e3d2  '), 'SOLO-F4E3D2');
});

test('generateSoloRoomCode prefixes SOLO- followed by 6 alphanumeric chars', () => {
  const code = generateSoloRoomCode(() => 0.5);
  assert.match(code, /^SOLO-[A-Z0-9]{6}$/);
});

test('SOLO-XXXXXX id survives normalization, routing, load, and summary path unchanged', () => {
  const soloId = 'SOLO-K7M2QX';

  // 1. Normalization
  assert.equal(normalizeRoomCode(soloId), soloId);
  assert.equal(normalizeRoomCode('  solo-k7m2qx '), soloId);

  // 2. Routing with server param
  const auctionRoute = withServerParam(`/auction/${soloId}`, 'local');
  const summaryRoute = withServerParam(`/summary/${soloId}`, 'local');
  assert.equal(auctionRoute, '/auction/SOLO-K7M2QX?server=local');
  assert.equal(summaryRoute, '/summary/SOLO-K7M2QX?server=local');

  // 3. Local engine persistence round-trip
  const memoryStore = new Map();
  globalThis.window = {
    localStorage: {
      getItem: (k) => memoryStore.get(k) || null,
      setItem: (k, v) => memoryStore.set(k, String(v)),
      removeItem: (k) => memoryStore.delete(k),
    },
  };

  const state = localAuctionReducer(null, {
    type: 'INIT_AUCTION',
    roomId: soloId,
    humanUser: { uid: 'u1', displayName: 'Manager', team: 'MI' },
    auctionType: 'mega',
  });
  saveLocalSoloRoom(state);

  const loaded = loadLocalSoloRoom(soloId);
  assert.equal(loaded?.id, soloId);
  assert.equal(isLocalRoom(soloId, 'local', Boolean(loaded)), true);
});
