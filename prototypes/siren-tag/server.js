#!/usr/bin/env node
// PROTOTYPE - NOT FOR PRODUCTION
// Question: Is chasing and ramming bots in a game of tag fun for ten minutes?
// Date: 2026-11-24
//
// The room server for Crash Out: Houston Edition on a plain computer: `node server.js`, with no
// packages to install. Use it for two phones on the same Wi-Fi, or on any host that runs Node.
// The public game runs the same rooms on Cloudflare instead: see cloudflare/.
//
// It serves the game's own files, and it runs private rooms. What a room is and does lives in
// room-core.mjs, shared with the Cloudflare version; this file is only the plumbing: files over
// HTTP, a small WebSocket server written by hand, and a clock.
//
//   node server.js            listen on port 8787 (or $PORT)
//   node server.js --test     also accept staged situations from a browser (for the checks)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { Room, newCode, validCode, simBody, simEnv, SIM_ARGS } from './room-core.mjs';

const DIR = path.dirname(fileURLToPath(import.meta.url)), PORT = Number(process.env.PORT) || 8787, TEST = process.argv.includes('--test');
const MAX_ROOMS = Number(process.env.MAX_ROOMS) || 12;   // each running room costs processor time: a small host can only carry a few
const FILES = { '/': 'index.html', '/index.html': 'index.html', '/config.js': 'config.js', '/vendor/three.js': 'vendor/three.js' };
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };

// The simulation is the game's own script, read fresh from index.html when the server starts.
const runGame = new Function(...SIM_ARGS, simBody(fs.readFileSync(path.join(DIR, 'config.js'), 'utf8'), fs.readFileSync(path.join(DIR, 'index.html'), 'utf8')));
const makeGame = seed => runGame(...simEnv(seed));

const rooms = new Map();
function lanAddresses() {
  const out = [];
  for (const list of Object.values(os.networkInterfaces())) for (const a of list || []) if (a.family === 'IPv4' && !a.internal) out.push(`http://${a.address}:${PORT}`);
  return out;
}
const stamp = () => new Date().toISOString().slice(11, 19);
function openRoom(code) {
  const room = new Room({ code, makeGame, lan: lanAddresses, test: TEST, log: what => console.log(`[${stamp()}] room ${code}: ${what}`) });
  rooms.set(code, room); return room;
}
function onMessage(conn, m) {
  const wall = Date.now();
  if (!conn.room) { // the first thing a browser says picks its room
    if (m.t === 'create') {
      if (rooms.size >= MAX_ROOMS) return conn.send(JSON.stringify({ t: 'err', msg: 'The server is full: every room is in use. Try again in a few minutes.', fatal: true }));
      const want = String(m.room || '').toUpperCase();
      conn.room = openRoom(validCode(want) && !rooms.has(want) ? want : (() => { for (;;) { const c = newCode(); if (!rooms.has(c)) return c; } })());
    } else if (m.t === 'join') {
      conn.room = rooms.get(String(m.room || '').toUpperCase());
      if (!conn.room) return conn.send(JSON.stringify({ t: 'err', msg: 'No room has that code. Check it with the host.', fatal: true }));
    } else return;
  }
  conn.room.message(conn, m, wall);
}
let lagging = 0;         // rooms that could not keep up with real time on the last pass: the host is too small for the load
setInterval(() => {
  const wall = Date.now(); let slow = 0;
  for (const [code, room] of rooms) {
    room.tick(wall); if (room.lagging) slow++;
    if (room.finished(wall)) { rooms.delete(code); console.log(`[${stamp()}] room ${code}: closed`); }
  }
  lagging = slow;
}, 8);

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
  const gone = () => { conn.open = false; if (conn.room) conn.room.closed(conn, Date.now()); };
  socket.on('close', gone); socket.on('error', gone);
}

// ---- HTTP: the game's files, and a health check --------------------------------------------
const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  if (url === '/health') { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ ok: true, rooms: rooms.size, maxRooms: MAX_ROOMS, behind: lagging, players: [...rooms.values()].reduce((a, r) => a + r.connected, 0) })); return; }
  const file = FILES[url];
  if (!file) { res.writeHead(404, { 'content-type': 'text/plain' }); res.end('Not found'); return; }
  fs.readFile(path.join(DIR, file), (err, data) => {
    if (err) { res.writeHead(500); res.end('Could not read ' + file); return; }
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' }); res.end(data);
  });
});
server.on('upgrade', acceptSocket);
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Crash Out room server on port ${PORT}${TEST ? ' (test hooks on)' : ''}`);
  console.log(`  this computer:   http://localhost:${PORT}`);
  const lan = lanAddresses();
  for (const a of lan) console.log(`  same Wi-Fi:      ${a}   <- open this on the phones`);
  if (!lan.length) console.log('  no network address found: other devices cannot reach this computer');
});
