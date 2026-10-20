import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AUCTION_SERVERS,
  DEFAULT_AUCTION_SERVER,
  getAuctionServer,
  getServerFromSearch,
  getServerMeta,
  normalizeServer,
  withServerParam,
} from '../src/lib/auctionServers.js';

test('normalizeServer accepts known ids and falls back safely', () => {
  assert.equal(normalizeServer('primary'), 'primary');
  assert.equal(normalizeServer('secondary'), 'secondary');
  assert.equal(normalizeServer('nope'), DEFAULT_AUCTION_SERVER);
  assert.equal(normalizeServer(undefined), DEFAULT_AUCTION_SERVER);
  assert.equal(normalizeServer('nope', null), null);
});

test('getAuctionServer supports both the column and settings fallback', () => {
  assert.equal(getAuctionServer({ server: 'secondary' }), 'secondary');
  assert.equal(
    getAuctionServer({ settings: { server: 'secondary' } }),
    'secondary',
  );
  assert.equal(getAuctionServer({ settings: {} }), 'primary');
  assert.equal(getAuctionServer(null), 'primary');
});

test('settings.server wins over a migration default on the top-level column', () => {
  assert.equal(
    getAuctionServer({
      server: 'primary',
      settings: { server: 'secondary' },
    }),
    'secondary',
  );
});

test('getServerFromSearch only accepts known server values', () => {
  assert.equal(getServerFromSearch('?server=secondary'), 'secondary');
  assert.equal(getServerFromSearch('?foo=1&server=primary'), 'primary');
  assert.equal(getServerFromSearch('?server=bogus'), null);
  assert.equal(getServerFromSearch(''), null);
});

test('withServerParam preserves existing query strings and hashes', () => {
  assert.equal(
    withServerParam('/lobby/K7M2QX', 'secondary'),
    '/lobby/K7M2QX?server=secondary',
  );
  assert.equal(
    withServerParam('/lobby/K7M2QX?foo=1#team', 'primary'),
    '/lobby/K7M2QX?foo=1&server=primary#team',
  );
});

test('server metadata is stable and always has a fallback', () => {
  assert.equal(getServerMeta('secondary').label, 'Server 2');
  assert.equal(getServerMeta('unknown').id, AUCTION_SERVERS[0].id);
});
