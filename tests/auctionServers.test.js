import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AUCTION_SERVERS,
  DEFAULT_AUCTION_SERVER,
  PRIMARY_SERVER,
  SECONDARY_SERVER,
  SERVER_1,
  SERVER_2,
  SERVER_3,
  SERVER_4,
  SERVER_5,
  SERVER_LOCAL,
  isValidServer,
  getAuctionServer,
  getServerFromSearch,
  getServerMeta,
  normalizeServer,
  withServerParam,
} from '../src/lib/auctionServers.js';

test('normalizeServer accepts known ids and aliases, and falls back safely', () => {
  assert.equal(normalizeServer('server-1'), SERVER_1);
  assert.equal(normalizeServer('server-2'), SERVER_2);
  assert.equal(normalizeServer('server-3'), SERVER_3);
  assert.equal(normalizeServer('server-4'), SERVER_4);
  assert.equal(normalizeServer('primary'), SERVER_1);
  assert.equal(normalizeServer('secondary'), SERVER_2);
  assert.equal(normalizeServer('nope'), DEFAULT_AUCTION_SERVER);
  assert.equal(normalizeServer(undefined), DEFAULT_AUCTION_SERVER);
  assert.equal(normalizeServer('nope', null), null);
});

test('getAuctionServer routes modern and legacy directory records', () => {
  // Modern records
  assert.equal(getAuctionServer({ server: 'server-2' }), SERVER_2);
  assert.equal(getAuctionServer({ settings: { server: 'server-3' } }), SERVER_3);
  // Legacy aliases mapped to preserve existing rooms on paypact and ipl-auction-3
  assert.equal(getAuctionServer({ settings: { server: 'primary' } }), SERVER_4);
  assert.equal(getAuctionServer({ settings: { server: 'secondary' } }), SERVER_3);
  assert.equal(getAuctionServer({ settings: {} }), DEFAULT_AUCTION_SERVER);
  assert.equal(getAuctionServer(null), DEFAULT_AUCTION_SERVER);
});

test('settings.server wins over a migration default on the top-level column', () => {
  assert.equal(
    getAuctionServer({
      server: 'server-1',
      settings: { server: 'server-2' },
    }),
    SERVER_2,
  );
});

test('getServerFromSearch only accepts known server values', () => {
  assert.equal(getServerFromSearch('?server=server-2'), SERVER_2);
  assert.equal(getServerFromSearch('?foo=1&server=server-3'), SERVER_3);
  assert.equal(getServerFromSearch('?foo=1&server=primary'), SERVER_1);
  assert.equal(getServerFromSearch('?server=bogus'), null);
  assert.equal(getServerFromSearch(''), null);
});

test('withServerParam preserves existing query strings and hashes', () => {
  assert.equal(
    withServerParam('/lobby/K7M2QX', 'server-2'),
    '/lobby/K7M2QX?server=server-2',
  );
  assert.equal(
    withServerParam('/lobby/K7M2QX?foo=1#team', 'server-1'),
    '/lobby/K7M2QX?foo=1&server=server-1#team',
  );
});

test('server metadata covers all configured servers and always has a fallback', () => {
  assert.equal(AUCTION_SERVERS.length, 5);
  assert.equal(getServerMeta('server-1').label, 'Server 1');
  assert.equal(getServerMeta('server-2').label, 'Server 2');
  assert.equal(getServerMeta('server-3').label, 'Server 3');
  assert.equal(getServerMeta('server-4').label, 'Server 4');
  assert.equal(getServerMeta('server-5').label, 'Server 5');
  assert.equal(getServerMeta('secondary').label, 'Server 2');
  assert.equal(getServerMeta('unknown').id, AUCTION_SERVERS[0].id);
});

test('SERVER_LOCAL is recognized, normalized, and flagged as isLocal', () => {
  assert.equal(SERVER_LOCAL, 'local');
  assert.equal(isValidServer('local'), true);
  assert.equal(normalizeServer('local'), 'local');
  assert.equal(getServerFromSearch('?server=local'), 'local');
  assert.equal(withServerParam('/auction/SOLO-123456', 'local'), '/auction/SOLO-123456?server=local');
  
  const localMeta = getServerMeta('local');
  assert.equal(localMeta.id, 'local');
  assert.equal(localMeta.isLocal, true);
  assert.match(localMeta.label, /Local/i);
});
