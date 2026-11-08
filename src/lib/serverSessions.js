/**
 * Counts live room subscriptions per auction server. A closed room only takes
 * its Realtime Database socket offline when no other subscription still needs
 * that server; otherwise navigating lobby -> auction would pull the socket out
 * from under the room that just opened.
 */
export function createServerSessionTracker() {
  const counts = new Map();

  return {
    acquire(server) {
      if (!server) return;
      counts.set(server, (counts.get(server) || 0) + 1);
    },
    release(server) {
      if (!server) return;
      const next = (counts.get(server) || 0) - 1;
      if (next > 0) counts.set(server, next);
      else counts.delete(server);
    },
    has(server) {
      return Boolean(server) && (counts.get(server) || 0) > 0;
    },
    size() {
      return counts.size;
    },
  };
}
