// PROTOTYPE - NOT FOR PRODUCTION
// Question: Is chasing and ramming bots in a game of tag fun for ten minutes?
// Date: 2026-11-24
//
// One private room of Crash Out: Houston Edition, with no idea what it is running on. The same
// file is used by server.js (a plain computer, for same-Wi-Fi play) and by the Cloudflare
// Durable Object in cloudflare/src/worker.js (the public game). A room owns ONE simulation,
// and that simulation is the game's own script from index.html, so a room follows the rules of
// solo play. Whoever hosts the room gives it three things: a way to make that simulation, a way
// to talk to each browser (conn.send, conn.close), and a clock tick.

export const HOLD = 20;          // seconds a dropped player's seat is held, braked, before a bot drives it
export const SILENT = 5;         // seconds without a word from a browser before it counts as dropped
export const MAX_PLAYERS = 2;    // this first version: two people to a room
const SNAP_EVERY = 3;            // simulation steps between snapshots: 60 / 3 = 20 a second
const STEP = 1 / 60;
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';   // no I, L, O, 0 or 1 to misread

const rand = n => { const a = new Uint32Array(1); globalThis.crypto.getRandomValues(a); return a[0] % n; };
const hex = bytes => { const a = new Uint8Array(bytes); globalThis.crypto.getRandomValues(a); return [...a].map(b => b.toString(16).padStart(2, '0')).join(''); };
export const newCode = () => Array.from({ length: 4 }, () => CODE_CHARS[rand(CODE_CHARS.length)]).join('');
export const validCode = c => typeof c === 'string' && /^[A-Z0-9]{4}$/.test(c);

// ---- The simulation: the game's own script, run without a screen ---------------------------
// The script is wrapped in a function whose arguments stand in for the browser. Anything to do
// with drawing answers to `blank`: every property, call and construction gives it back, and it
// counts as zero. The rules never read it; only the drawing code does, and that is never run.
export const SIM_ARGS = ['window', 'document', 'THREE', 'location', 'addEventListener', 'requestAnimationFrame', 'setInterval', 'clearInterval', 'navigator', 'innerWidth', 'innerHeight', 'devicePixelRatio'];
export function simBody(configText, htmlText) { // the text of that function's body, from config.js and index.html
  const start = htmlText.lastIndexOf('<script>'), end = htmlText.lastIndexOf('</script>');
  if (start < 0 || end < start) throw new Error('index.html has no game script');
  return `'use strict';\n${configText}\nconst CONFIG = window.CONFIG;\n${htmlText.slice(start + 8, end)}\nreturn window.game;`;
}
export function simEnv(seed) { // the stand-in browser, in SIM_ARGS order
  const blank = new Proxy(function () {}, { get: (t, k) => (k === Symbol.toPrimitive ? () => 0 : k === 'then' ? undefined : blank), apply: () => blank, construct: () => blank, set: () => true });
  const window = {};
  return [window, blank, blank, { search: `?seed=${seed}&render=cheap`, protocol: 'server:', host: '', hostname: '', origin: '' }, () => {}, () => 0, () => 0, () => {}, {}, 1280, 720, 1];
}

// ---- A room --------------------------------------------------------------------------------
export class Room {
  // opts: code; makeGame(seed) -> the game's check hooks (window.game); lan() -> addresses to share;
  // test: accept staged situations (for the checks); log(text)
  constructor(opts) {
    Object.assign(this, { code: opts.code, makeGame: opts.makeGame, lan: opts.lan || (() => []), test: !!opts.test, log: opts.log || (() => {}) });
    Object.assign(this, { players: [], bots: 3, phase: 'lobby', shift: 0, roles: [], game: null, ticks: 0, acc: 0, last: 0, nextNum: 1, quietSince: 0, lagging: false, born: 0 });
  }
  get connected() { return this.players.filter(p => p.on).length; }
  info(player) {
    return { t: 'room', code: this.code, you: player.id, token: player.token, bots: this.bots, phase: this.phase, shift: this.shift, roles: this.roles, hold: HOLD, lan: this.lan(),
      players: this.players.map(p => ({ id: p.id, num: p.num, host: p.host, kind: p.kind, seat: p.seat, on: p.on, ready: p.ready })) };
  }
  tell() { for (const p of this.players) if (p.conn) p.conn.send(JSON.stringify(this.info(p))); }
  add(conn, wall) {
    const p = { id: hex(4), token: hex(12), num: this.nextNum++, host: this.players.length === 0, kind: this.players.length % 4, seat: -1, conn, on: true, ready: false, lastSeen: wall, awaySince: 0, botting: false };
    this.players.push(p); conn.player = p; this.bots = Math.min(this.bots, 8 - this.players.length); this.tell(); return p;
  }
  // The first thing a browser says: create this room, or join it.
  enter(conn, m, wall) {
    const fail = (msg, extra) => conn.send(JSON.stringify({ t: 'err', msg, fatal: true, ...extra }));
    if (m.t === 'create') {
      if (this.players.length) return fail('That room code is taken.', { retry: true });   // the browser picks another code and tries again
      this.add(conn, wall); this.log('created'); return;
    }
    if (!this.players.length) return fail('No room has that code. Check it with the host.');
    const back = m.token && this.players.find(p => p.token === m.token);
    if (back) { // the same person, back after a drop or a reload: their seat is theirs again
      if (back.conn && back.conn !== conn) { back.conn.player = null; back.conn.close(); }
      Object.assign(back, { conn, on: true, lastSeen: wall, awaySince: 0, botting: false }); conn.player = back;
      if (this.game && back.seat >= 0 && this.phase !== 'lobby') this.game.net.hostAway(back.seat, null);
      this.log(`P${back.num} is back`); this.tell(); return;
    }
    if (this.players.length >= MAX_PLAYERS) return fail('That room is full: it already has two players.');
    const p = this.add(conn, wall); this.log(`P${p.num} joined`);
  }
  drop(p, why, wall) { // the line went: hold the seat
    if (!p.on) return;
    p.on = false; p.awaySince = wall; p.ready = false; if (p.conn) { const c = p.conn; p.conn = null; c.player = null; c.close(); }
    if (this.game && p.seat >= 0 && this.phase !== 'lobby') this.game.net.hostAway(p.seat, 'hold');
    this.log(`P${p.num} dropped (${why})`); this.tell();
  }
  closed(conn, wall) { const p = conn.player; if (p && p.conn === conn) { p.conn = null; this.drop(p, 'connection closed', wall); } }
  leave(p) { // they chose to leave
    this.players = this.players.filter(q => q !== p);
    if (this.game && p.seat >= 0 && this.phase !== 'lobby') this.game.net.hostAway(p.seat, 'bot');
    if (this.players.length && p.host) this.players[0].host = true;
    this.log(`P${p.num} left`); this.tell();
  }
  start(wall) {
    if (!this.game) this.game = this.makeGame(1 + rand(1e9));
    this.shift++;
    // Seats: eight of them, two of each rig. A person gets the first seat of the rig they picked,
    // or the second if the other person picked the same one.
    const taken = [];
    for (const p of this.players) { p.seat = taken.includes(p.kind) ? p.kind + 4 : p.kind; taken.push(p.seat); p.ready = false; p.botting = false; if (!p.on) p.awaySince = wall; }
    const humans = this.players.map(p => p.seat), order = this.shift % 2 ? humans : humans.slice().reverse();   // who gets the first start spot alternates each shift
    const bots = Math.max(humans.length < 2 ? 1 : 0, Math.min(this.bots, 8 - humans.length));
    const botSeats = [0, 1, 2, 3, 4, 5, 6, 7].filter(s => !humans.includes(s)).slice(0, bots);
    this.roles = [order[0], ...botSeats.slice(0, 2), ...order.slice(1), ...botSeats.slice(2)];
    this.game.net.hostStart(JSON.stringify({ roles: this.roles, humans, bots }));
    for (const p of this.players) if (!p.on) this.game.net.hostAway(p.seat, 'hold');
    this.phase = 'play'; this.ticks = 0; this.acc = 0; this.last = wall;
    this.log(`shift ${this.shift} started: seats ${this.roles.join(',')} people in ${humans.join(',')}`); this.tell();
  }
  message(conn, m, wall) {
    if (!m || typeof m !== 'object') return;
    const p = conn.player;
    if (!p) { if (m.t === 'create' || m.t === 'join') this.enter(conn, m, wall); return; }
    p.lastSeen = wall;
    if (m.t === 'in') { if (this.phase === 'play' && p.seat >= 0) this.game.net.hostInput(p.seat, JSON.stringify({ s: m.s, th: m.th, st: m.st, h: m.h, r: m.r })); }
    else if (m.t === 'ping') { /* just keeping the line warm */ }
    else if (m.t === 'rig') { const k = Number(m.kind); if (k >= 0 && k < 4 && (this.phase === 'lobby' || p.seat < 0)) { p.kind = k | 0; this.tell(); } }
    else if (m.t === 'bots') { if (p.host && this.phase === 'lobby') { this.bots = Math.max(0, Math.min(8 - this.players.length, Number(m.n) | 0)); this.tell(); } }
    else if (m.t === 'start') { if (p.host && this.phase === 'lobby') this.start(wall); }
    else if (m.t === 'ready') { if (this.phase === 'results') { p.ready = true; if (this.players.filter(q => q.on).every(q => q.ready)) this.start(wall); else this.tell(); } }
    else if (m.t === 'leave') { conn.player = null; p.conn = null; this.leave(p); conn.close(); }
    else if (m.t === 'test' && this.test && this.game && this.phase !== 'lobby') this.game.net.hostTest(JSON.stringify(m.op || {}));
  }
  // Call this often (every 8 to 16 ms). It notices dropped browsers, runs the simulation up to
  // the present, and sends everyone the state 20 times a second.
  tick(wall) {
    if (!this.born) this.born = wall;
    for (const p of this.players) {
      if (p.on && wall - p.lastSeen > SILENT * 1000) this.drop(p, 'silent', wall);
      if (!p.on && !p.botting && this.phase !== 'lobby' && p.seat >= 0 && wall - p.awaySince > HOLD * 1000) { p.botting = true; this.game.net.hostAway(p.seat, 'bot'); this.log(`P${p.num}'s seat goes to a bot`); this.tell(); }
    }
    if (this.connected) this.quietSince = 0; else if (!this.quietSince) this.quietSince = wall;
    if (this.phase === 'lobby' || !this.game) { this.last = wall; return; }
    const gap = (wall - this.last) / 1000; this.lagging = gap > 0.25;
    this.acc += Math.min(gap, 0.25); this.last = wall;
    while (this.acc >= STEP) {
      this.acc -= STEP;
      this.game.step(1, false); this.game.net.hostTick(); this.ticks++;
      if (this.ticks % SNAP_EVERY) continue;
      const snap = JSON.parse(this.game.net.snapshot());
      snap.t = 'snap'; snap.sh = this.shift; snap.held = {};
      for (const p of this.players) if (!p.on && p.seat >= 0) snap.held[p.seat] = p.botting ? 0 : Math.max(0, HOLD - (wall - p.awaySince) / 1000);
      const text = JSON.stringify(snap);
      for (const p of this.players) if (p.conn && p.seat >= 0) p.conn.send(text);
      const phase = snap.sc === 'results' ? 'results' : 'play';
      if (phase !== this.phase) { this.phase = phase; if (phase === 'results') this.log(`shift ${this.shift} over: ${snap.tot.map(Math.round).join(' ')}`); this.tell(); }
    }
  }
  // Nobody has been connected for a while: the host may forget this room.
  finished(wall) { return (!this.players.length && wall - this.born > 15000) || (this.quietSince > 0 && wall - this.quietSince > (this.phase === 'lobby' ? 60 : 300) * 1000); }
}
