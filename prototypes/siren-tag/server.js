#!/usr/bin/env node
// PROTOTYPE - NOT FOR PRODUCTION
// Question: Is chasing and ramming bots in a game of tag fun for ten minutes?
// Date: 2026-11-23
//
// The room server for Crash Out: Houston Edition. No packages to install: `node server.js`.
//
// It serves the game's own files, and it runs private rooms. Each room has ONE simulation, and
// that simulation is the game's own code: the script inside index.html, loaded here with a
// stand-in for the browser's drawing. So a room follows exactly the rules of solo play. Browsers
// send their driving; the server owns positions, bots, collisions, who has Mr. Crouch, the clock
// and the scores, and tells every browser 20 times a second.
//
//   node server.js            listen on port 8787 (or $PORT)
//   node server.js --test     also accept {t:'test'} messages that stage a situation (for the checks)
'use strict';
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto'), vm = require('vm'), os = require('os');

const DIR = __dirname, PORT = Number(process.env.PORT) || 8787, TEST = process.argv.includes('--test');
const HOLD = 20;          // seconds a dropped player's seat is held, braked, before a bot drives it
const SILENT = 4;         // seconds without a word from a browser before it counts as dropped
const MAX_PLAYERS = 2;    // this first version: two people to a room
const MAX_ROOMS = Number(process.env.MAX_ROOMS) || 12;   // each running room costs processor time: a small host can only carry a few
const SNAP_EVERY = 3;     // simulation steps between snapshots: 60 / 3 = 20 a second
const STEP = 1 / 60;
const FILES = { '/': 'index.html', '/index.html': 'index.html', '/config.js': 'config.js', '/vendor/three.js': 'vendor/three.js' };
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };

// ---- The simulation: the game's own script, run without a screen ---------------------------
let simSource = null;
function loadSim() {
  const html = fs.readFileSync(path.join(DIR, 'index.html'), 'utf8');
  const start = html.lastIndexOf('<script>'), end = html.lastIndexOf('</script>');
  if (start < 0 || end < start) throw new Error('index.html has no game script');
  simSource = { config: new vm.Script(fs.readFileSync(path.join(DIR, 'config.js'), 'utf8'), { filename: 'config.js' }), game: new vm.Script(html.slice(start + 8, end), { filename: 'index.html (game script)' }) };
}
function makeSim(seed) {
  // Anything to do with drawing answers to this: every property, call and construction gives it
  // back, and it counts as zero. The rules never read it; only the drawing code does, and the
  // drawing code is never run here.
  const blank = new Proxy(function () {}, { get: (t, k) => (k === Symbol.toPrimitive ? () => 0 : k === 'then' ? undefined : blank), apply: () => blank, construct: () => blank, set: () => true });
  const box = {
    console, setTimeout, clearTimeout, performance, URLSearchParams,
    setInterval: () => 0, clearInterval: () => {}, requestAnimationFrame: () => 0, addEventListener: () => {},
    THREE: blank, document: blank, navigator: {}, innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1,
    location: { search: `?seed=${seed}&render=cheap`, protocol: 'node:', host: '', hostname: '', origin: '' },
  };
  box.window = box;
  const ctx = vm.createContext(box);
  simSource.config.runInContext(ctx);
  simSource.game.runInContext(ctx);
  return { ctx, game: ctx.game };
}

// ---- Rooms ---------------------------------------------------------------------------------
const rooms = new Map();
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';      // no I, L, O, 0 or 1 to misread
function newCode() { for (;;) { let c = ''; for (let i = 0; i < 4; i++) c += CODE_CHARS[crypto.randomInt(CODE_CHARS.length)]; if (!rooms.has(c)) return c; } }
function lanAddresses() {
  const out = [];
  for (const list of Object.values(os.networkInterfaces())) for (const a of list || []) if (a.family === 'IPv4' && !a.internal) out.push(`http://${a.address}:${PORT}`);
  return out;
}
function roomInfo(room, player) {
  return { t: 'room', code: room.code, you: player.id, token: player.token, bots: room.bots, phase: room.phase, shift: room.shift, roles: room.roles, hold: HOLD, lan: lanAddresses(),
    players: room.players.map(p => ({ id: p.id, num: p.num, host: p.host, kind: p.kind, seat: p.seat, on: p.on, ready: p.ready })) };
}
const send = (player, obj) => { if (player.conn) player.conn.send(JSON.stringify(obj)); };
const tellRoom = room => { for (const p of room.players) send(p, roomInfo(room, p)); };
const maxBots = room => 8 - room.players.length;

function createRoom(conn) {
  const room = { code: newCode(), players: [], bots: 3, phase: 'lobby', shift: 0, roles: [], sim: null, tick: 0, acc: 0, last: performance.now(), emptySince: 0, nextNum: 1 };
  rooms.set(room.code, room); addPlayer(room, conn); return room;
}
function addPlayer(room, conn) {
  const p = { id: crypto.randomBytes(4).toString('hex'), token: crypto.randomBytes(12).toString('hex'), num: room.nextNum++, host: room.players.length === 0, kind: room.players.length % 4, seat: -1, conn, on: true, ready: false, lastSeen: Date.now(), awaySince: 0, botting: false };
  room.players.push(p); conn.player = p; conn.room = room; room.bots = Math.min(room.bots, maxBots(room)); tellRoom(room); return p;
}
function joinRoom(conn, code, token) {
  const room = rooms.get(String(code || '').toUpperCase());
  if (!room) return conn.send(JSON.stringify({ t: 'err', msg: 'No room has that code. Check it with the host.', fatal: true }));
  const back = token && room.players.find(p => p.token === token);
  if (back) { // the same person, back after a drop or a reload: their seat is theirs again
    if (back.conn && back.conn !== conn) { back.conn.player = null; back.conn.close(); }
    back.conn = conn; back.on = true; back.lastSeen = Date.now(); back.awaySince = 0; back.botting = false; conn.player = back; conn.room = room;
    if (room.sim && back.seat >= 0) room.sim.game.net.hostAway(back.seat, null);
    log(room, `P${back.num} is back`); tellRoom(room); return;
  }
  if (room.players.length >= MAX_PLAYERS) return conn.send(JSON.stringify({ t: 'err', msg: 'That room is full: it already has two players.', fatal: true }));
  const p = addPlayer(room, conn); log(room, `P${p.num} joined`);
}
function dropPlayer(room, p, why) { // the line went: hold the seat
  if (!p.on) return;
  p.on = false; p.awaySince = Date.now(); p.ready = false; if (p.conn) { p.conn.player = null; p.conn.close(); p.conn = null; }
  if (room.sim && p.seat >= 0 && room.phase !== 'lobby') room.sim.game.net.hostAway(p.seat, 'hold');
  log(room, `P${p.num} dropped (${why})`); tellRoom(room);
}
function removePlayer(room, p) { // they chose to leave
  room.players = room.players.filter(q => q !== p);
  if (room.sim && p.seat >= 0 && room.phase !== 'lobby') room.sim.game.net.hostAway(p.seat, 'bot');
  if (!room.players.length) { rooms.delete(room.code); log(room, 'closed: everyone left'); return; }
  if (p.host) room.players[0].host = true;
  log(room, `P${p.num} left`); tellRoom(room);
}
function startShift(room) {
  if (!room.sim) room.sim = makeSim(crypto.randomInt(1, 1e9));
  room.shift++;
  // Seats: eight of them, two of each rig. A person gets the first seat of the rig they picked, or
  // the second if the other person picked the same one.
  const taken = [];
  for (const p of room.players) { p.seat = taken.includes(p.kind) ? p.kind + 4 : p.kind; taken.push(p.seat); p.ready = false; p.botting = false; if (!p.on) p.awaySince = Date.now(); }
  const humans = room.players.map(p => p.seat), order = room.shift % 2 ? humans : humans.slice().reverse();   // who gets the first start spot alternates each shift
  const bots = Math.max(humans.length < 2 ? 1 : 0, Math.min(room.bots, 8 - humans.length));
  const botSeats = [0, 1, 2, 3, 4, 5, 6, 7].filter(s => !humans.includes(s)).slice(0, bots);
  room.roles = [order[0], ...botSeats.slice(0, 2), ...order.slice(1), ...botSeats.slice(2)];
  room.sim.game.net.hostStart(JSON.stringify({ roles: room.roles, humans, bots }));
  for (const p of room.players) if (!p.on) room.sim.game.net.hostAway(p.seat, 'hold');
  room.phase = 'play'; room.tick = 0; room.acc = 0; room.last = performance.now();
  log(room, `shift ${room.shift} started: seats ${room.roles.join(',')} people in ${humans.join(',')}`); tellRoom(room);
}
function onMessage(conn, m) {
  if (m.t === 'create') {
    if (conn.player) return;
    if (rooms.size >= MAX_ROOMS) return conn.send(JSON.stringify({ t: 'err', msg: 'The server is full: every room is in use. Try again in a few minutes.', fatal: true }));
    const room = createRoom(conn); log(room, 'created'); return;
  }
  if (m.t === 'join') { if (conn.player) return; return joinRoom(conn, m.room, m.token); }
  const p = conn.player, room = conn.room; if (!p || !room) return;
  p.lastSeen = Date.now();
  if (m.t === 'in') { if (room.phase === 'play' && p.seat >= 0) room.sim.game.net.hostInput(p.seat, JSON.stringify({ s: m.s, th: m.th, st: m.st, h: m.h, r: m.r })); }
  else if (m.t === 'ping') { /* just keeping the line warm */ }
  else if (m.t === 'rig') { const k = Number(m.kind); if (k >= 0 && k < 4 && (room.phase === 'lobby' || p.seat < 0)) { p.kind = k | 0; tellRoom(room); } }
  else if (m.t === 'bots') { if (p.host && room.phase === 'lobby') { room.bots = Math.max(0, Math.min(maxBots(room), Number(m.n) | 0)); tellRoom(room); } }
  else if (m.t === 'start') { if (p.host && room.phase === 'lobby') startShift(room); }
  else if (m.t === 'ready') { if (room.phase === 'results') { p.ready = true; if (room.players.filter(q => q.on).every(q => q.ready)) startShift(room); else tellRoom(room); } }
  else if (m.t === 'leave') { conn.player = null; removePlayer(room, p); conn.close(); }
  else if (m.t === 'test' && TEST && room.sim) { try { vm.runInContext(String(m.js), room.sim.ctx); } catch (e) { send(p, { t: 'err', msg: 'test: ' + e.message }); } }
}
let lagging = 0;         // rooms that could not keep up with real time on the last pass: the host is too small for the load
function stepRooms() {
  const now = performance.now(), wall = Date.now(); let slow = 0;
  for (const room of rooms.values()) {
    // dropped browsers, held seats, empty rooms
    for (const p of room.players) {
      if (p.on && wall - p.lastSeen > SILENT * 1000) dropPlayer(room, p, 'silent');
      if (!p.on && !p.botting && room.phase !== 'lobby' && p.seat >= 0 && wall - p.awaySince > HOLD * 1000) { p.botting = true; room.sim.game.net.hostAway(p.seat, 'bot'); log(room, `P${p.num}'s seat goes to a bot`); tellRoom(room); }
    }
    if (room.players.some(p => p.on)) room.emptySince = 0; else { room.emptySince = room.emptySince || wall; if (wall - room.emptySince > 5 * 60 * 1000) { rooms.delete(room.code); log(room, 'closed: empty for five minutes'); continue; } }
    if (room.phase === 'lobby' || !room.sim) { room.last = now; continue; }
    const gap = (now - room.last) / 1000; if (gap > 0.25) slow++;
    room.acc += Math.min(gap, 0.25); room.last = now;
    while (room.acc >= STEP) {
      room.acc -= STEP;
      room.sim.game.step(1, false); room.sim.game.net.hostTick(); room.tick++;
      if (room.tick % SNAP_EVERY) continue;
      const snap = JSON.parse(room.sim.game.net.snapshot());
      snap.t = 'snap'; snap.sh = room.shift; snap.held = {};
      for (const p of room.players) if (!p.on && p.seat >= 0) snap.held[p.seat] = p.botting ? 0 : Math.max(0, HOLD - (wall - p.awaySince) / 1000);
      const text = JSON.stringify(snap);
      for (const p of room.players) if (p.conn && p.seat >= 0) p.conn.send(text);
      const phase = snap.sc === 'results' ? 'results' : 'play';
      if (phase !== room.phase) { room.phase = phase; if (phase === 'results') log(room, `shift ${room.shift} over: ${snap.tot.map(Math.round).join(' ')}`); tellRoom(room); }
    }
  }
  lagging = slow;
}
const log = (room, what) => console.log(`[${new Date().toISOString().slice(11, 19)}] room ${room.code}: ${what}`);

// ---- A small WebSocket server, by hand, so there is nothing to install ---------------------
function acceptSocket(req, socket) {
  const key = req.headers['sec-websocket-key'];
  if (!key || req.url.split('?')[0] !== '/ws') { socket.destroy(); return; }
  socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' +
    crypto.createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64') + '\r\n\r\n');
  socket.setNoDelay(true);
  const conn = { player: null, room: null, open: true,
    send(text) { if (!conn.open) return; const body = Buffer.from(text), n = body.length; let head;
      if (n < 126) head = Buffer.from([0x81, n]); else if (n < 65536) { head = Buffer.alloc(4); head[0] = 0x81; head[1] = 126; head.writeUInt16BE(n, 2); } else { head = Buffer.alloc(10); head[0] = 0x81; head[1] = 127; head.writeBigUInt64BE(BigInt(n), 2); }
      socket.write(Buffer.concat([head, body])); },
    close() { if (!conn.open) return; conn.open = false; try { socket.end(Buffer.from([0x88, 0])); } catch (e) { /* already gone */ } socket.destroy(); },
  };
  let buf = Buffer.alloc(0), parts = [];
  socket.on('data', chunk => {
    buf = Buffer.concat([buf, chunk]);
    for (;;) {
      if (buf.length < 2) return;
      const fin = buf[0] & 0x80, op = buf[0] & 0x0f, masked = buf[1] & 0x80; let len = buf[1] & 0x7f, at = 2;
      if (len === 126) { if (buf.length < 4) return; len = buf.readUInt16BE(2); at = 4; } else if (len === 127) { if (buf.length < 10) return; len = Number(buf.readBigUInt64BE(2)); at = 10; }
      if (len > 65536 || !masked) { conn.close(); return; }                       // browsers always mask; nothing here is ever this long
      if (buf.length < at + 4 + len) return;
      const mask = buf.subarray(at, at + 4), data = Buffer.from(buf.subarray(at + 4, at + 4 + len)); buf = buf.subarray(at + 4 + len);
      for (let i = 0; i < data.length; i++) data[i] ^= mask[i & 3];
      if (op === 8) { conn.close(); return; }
      if (op === 9) { socket.write(Buffer.concat([Buffer.from([0x8a, data.length]), data])); continue; }   // ping: pong
      if (op === 10) continue;
      parts.push(data); if (!fin) continue;
      const text = Buffer.concat(parts).toString('utf8'); parts = [];
      let m; try { m = JSON.parse(text); } catch (e) { continue; }
      try { if (m && typeof m === 'object') onMessage(conn, m); } catch (e) { console.error('message failed:', e); }
    }
  });
  const gone = () => { conn.open = false; const p = conn.player, room = conn.room; if (p && room && p.conn === conn) { p.conn = null; dropPlayer(room, p, 'socket closed'); } };
  socket.on('close', gone); socket.on('error', gone);
}

// ---- HTTP: the game's files, and a health check --------------------------------------------
const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  if (url === '/health') { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ ok: true, rooms: rooms.size, maxRooms: MAX_ROOMS, behind: lagging, players: [...rooms.values()].reduce((a, r) => a + r.players.filter(p => p.on).length, 0) })); return; }
  const file = FILES[url];
  if (!file) { res.writeHead(404, { 'content-type': 'text/plain' }); res.end('Not found'); return; }
  fs.readFile(path.join(DIR, file), (err, data) => {
    if (err) { res.writeHead(500); res.end('Could not read ' + file); return; }
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' }); res.end(data);
  });
});
server.on('upgrade', acceptSocket);
loadSim();
setInterval(stepRooms, 8);
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Crash Out room server on port ${PORT}${TEST ? ' (test hooks on)' : ''}`);
  console.log(`  this computer:   http://localhost:${PORT}`);
  const lan = lanAddresses();
  for (const a of lan) console.log(`  same Wi-Fi:      ${a}   <- open this on the phones`);
  if (!lan.length) console.log('  no network address found: other devices cannot reach this computer');
});
