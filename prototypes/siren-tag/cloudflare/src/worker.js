// PROTOTYPE - NOT FOR PRODUCTION
// Question: Is chasing and ramming bots in a game of tag fun for ten minutes?
// Date: 2026-11-24
//
// Crash Out: Houston Edition on Cloudflare. The Worker hands out the game's files and sends
// each room's connections to that room's Durable Object. A Durable Object is one room: it stays
// alive while people are connected, holds their connections, and runs the room (room-core.mjs,
// the same code server.js uses) with the game's own script as its simulation.
import { Room, simEnv, validCode } from '../../room-core.mjs';
import { runGame } from './sim.generated.js';

export class RoomDO {
  constructor(ctx, env) { this.ctx = ctx; this.env = env; this.room = null; this.timer = null; }
  async fetch(request) {
    if (request.headers.get('Upgrade') !== 'websocket') return new Response('This address is for the game to connect to.', { status: 426 });
    const code = new URL(request.url).searchParams.get('room').toUpperCase();
    if (!this.room) this.room = new Room({ code, makeGame: seed => runGame(...simEnv(seed)), test: this.env.TEST === '1', log: what => console.log(`room ${code}: ${what}`) });
    const room = this.room, pair = new WebSocketPair(), [client, server] = Object.values(pair);
    server.accept();                                       // the standard kind of connection: the room stays in memory while anyone is connected
    const conn = { player: null,
      send(text) { try { server.send(text); } catch (e) { /* that browser has gone */ } },
      close() { try { server.close(1000, 'closed'); } catch (e) { /* already closed */ } } };
    server.addEventListener('message', ev => {
      let m; try { m = JSON.parse(ev.data); } catch (e) { return; }
      try { room.message(conn, m, Date.now()); } catch (e) { console.log(`room ${code}: message failed: ${e && e.stack}`); }
      this.run();
    });
    const gone = () => room.closed(conn, Date.now());
    server.addEventListener('close', gone); server.addEventListener('error', gone);
    this.run();
    return new Response(null, { status: 101, webSocket: client });
  }
  run() { // the room's clock: ticks while the room has a reason to exist, then stops so Cloudflare can put the object away
    if (this.timer) return;
    this.timer = setInterval(() => {
      const room = this.room, now = Date.now();
      if (!room) { clearInterval(this.timer); this.timer = null; return; }
      try { room.tick(now); } catch (e) { console.log(`room ${room.code}: tick failed: ${e && e.stack}`); }
      if (room.finished(now)) { clearInterval(this.timer); this.timer = null; this.room = null; }
    }, 16);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/ws') {
      const code = String(url.searchParams.get('room') || '').toUpperCase();
      if (!validCode(code)) return new Response('A room code has four letters or digits.', { status: 400 });
      return env.ROOMS.get(env.ROOMS.idFromName(code)).fetch(request);
    }
    if (url.pathname === '/health') return Response.json({ ok: true, host: 'cloudflare' });
    return env.ASSETS.fetch(request);
  },
};
