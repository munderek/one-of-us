'use strict';
/* Transport layer. Two backends with one interface:
   - 'peer': online by room code (WebRTC via PeerJS, STUN + TURN fallback, retries)
   - 'lan' : local network (TCP through the Electron main process, UDP discovery)
   Host is the hub, clients talk only to the host. */
const ICE = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }, { urls: 'stun:global.stun.twilio.com:3478' },
    { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
    { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
    { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' }
  ],
  iceCandidatePoolSize: 4
};
const net = (() => {
  const MAXP = 10;
  let mode = null, onM = () => {}, onE = () => {};

  /* ---------- online (PeerJS) ---------- */
  const P = (() => {
    let peer = null, hostConn = null, rcTimer = null, resv = new Set();
    const conns = new Map();
    function stop() {
      clearTimeout(rcTimer);
      const arr = [...conns.values()]; conns.clear();
      const h = hostConn; hostConn = null;
      const p = peer; peer = null;
      arr.forEach(c => { try { c.close(); } catch (e) {} });
      if (h) { try { h.close(); } catch (e) {} }
      if (p) { try { p.destroy(); } catch (e) {} }
    }
    function host(code) {
      return new Promise(res => {
        stop();
        let settled = false, t = null;
        const done = r => { if (!settled) { settled = true; clearTimeout(t); res(r); } };
        let p;
        try { p = new Peer('oneofus-' + code, { config: ICE, debug: 0 }); } catch (e) { done({ ok: false, err: 'peerjs' }); return; }
        peer = p;
        t = setTimeout(() => done({ ok: false, err: 'timeout' }), 20000);
        p.on('open', () => done({ ok: true }));
        p.on('error', e => { if (!settled) done({ ok: false, err: e.type || 'error' }); });
        p.on('disconnected', () => {
          if (peer !== p || p.destroyed) return;
          clearTimeout(rcTimer);
          rcTimer = setTimeout(() => { try { if (peer === p && !p.destroyed && p.disconnected) p.reconnect(); } catch (e) {} }, 1500);
        });
        p.on('connection', c => {
          let id = 0;
          for (let i = 1; i < MAXP; i++) if (!conns.has(i) && !resv.has(i)) { id = i; break; }
          if (!id) { c.on('open', () => { try { c.close(); } catch (e) {} }); return; }
          c._id = id; conns.set(id, c);
          c.on('open', () => { try { c.send({ t: 'welcome', id: c._id }); } catch (e) {} onE({ type: 'join', id: c._id }); });
          c.on('data', m => onM({ from: c._id, m }));
          c.on('close', () => { if (conns.get(c._id) === c) { conns.delete(c._id); onE({ type: 'leave', id: c._id }); } });
          c.on('error', () => {});
        });
      });
    }
    function join(code, opts) {
      const maxAtt = (opts && opts.att) || 3, to = (opts && opts.to) || 13000;
      return new Promise(res => {
        stop();
        let settled = false, att = 0;
        const done = r => { if (!settled) { settled = true; res(r); } };
        const attempt = () => {
          if (settled) return;
          att++;
          if (peer) { const o = peer; peer = null; hostConn = null; try { o.destroy(); } catch (e) {} }
          let p;
          try { p = new Peer(undefined, { config: ICE, debug: 0 }); } catch (e) { done({ ok: false, err: 'peerjs' }); return; }
          peer = p;
          const retry = () => { if (settled || peer !== p) return; if (att < maxAtt) setTimeout(attempt, 700); else done({ ok: false, err: 'timeout' }); };
          const tm = setTimeout(retry, to);
          p.on('error', e => {
            if (settled || peer !== p) return;
            clearTimeout(tm);
            if (e.type === 'peer-unavailable') done({ ok: false, err: 'peer-unavailable' });
            else if (att < maxAtt) setTimeout(attempt, 900);
            else done({ ok: false, err: e.type || 'error' });
          });
          p.on('open', () => {
            if (peer !== p || settled) return;
            const c = p.connect('oneofus-' + code, { serialization: 'json', reliable: true });
            hostConn = c;
            c.on('open', () => { if (settled || peer !== p) return; clearTimeout(tm); settled = true; res({ ok: true }); });
            c.on('data', m => { if (m && m.t === 'welcome') onE({ type: 'welcome', id: m.id }); else onM({ from: 0, m }); });
            c.on('close', () => {
              if (hostConn === c) { hostConn = null; if (settled) onE({ type: 'closed' }); }
            });
            c.on('error', () => {});
          });
        };
        attempt();
      });
    }
    return {
      stop, host, join,
      reserve: a => { resv = new Set(a); },
      send: m => { if (hostConn) { if (hostConn.open) { try { hostConn.send(m); } catch (e) {} } } else for (const c of conns.values()) if (c.open) { try { c.send(m); } catch (e) {} } },
      sendTo: (id, m) => { const c = conns.get(id); if (c && c.open) { try { c.send(m); } catch (e) {} } },
      kick: id => { const c = conns.get(id); if (c) { try { c.close(); } catch (e) {} } },
      rebind: (from, to) => {
        const c = conns.get(from); if (!c || from === to) return;
        conns.delete(from);
        const old = conns.get(to); conns.set(to, c); c._id = to;
        if (old && old !== c) { old._id = -1; try { old.close(); } catch (e) {} }
      }
    };
  })();

  if (window.lan) {
    lan.onMsg(d => { if (mode === 'lan') onM(d); });
    lan.onEvent(e => { if (mode === 'lan') onE(e); });
  }
  let listCb = null;
  if (window.rly) {
    rly.onMsg(d => { if (mode === 'relay') onM(d); });
    rly.onEvent(e => { if (mode === 'relay') onE(e); });
    rly.onList(l => { if (listCb) listCb(l); });
  }
  const parseIp = s => { const a = String(s).trim().split(':'); return [a[0], +a[1] || 7777]; };
  const stopAll = async () => { P.stop(); if (window.lan) await lan.stop(); if (window.rly) await rly.stop(); };
  const B = () => mode === 'lan' ? window.lan : mode === 'relay' ? window.rly : null;
  return {
    mode: () => mode,
    onMsg: cb => { onM = cb; }, onEvent: cb => { onE = cb; },
    stop: () => { P.stop(); if (window.lan) lan.stop(); if (window.rly) rly.stop(); mode = null; },
    /* m: 'lan' | 'online' (relay over MQTT first, WebRTC as fallback) */
    host: async (m, arg, info) => {
      await stopAll();
      if (m === 'lan') { mode = 'lan'; if (!window.lan) return { ok: false, err: 'lan-unavailable' }; return await lan.host(7777, info); }
      if (window.rly) {
        mode = 'relay';
        const r = await rly.host(arg, { custom: info && info.relay });
        if (r.ok || r.err === 'unavailable-id') { if (!r.ok) mode = null; return r; }
        await rly.stop();
      }
      mode = 'peer';
      const r2 = await P.host(arg);
      if (!r2.ok) mode = null;
      return r2;
    },
    join: async (m, arg, opts) => {
      await stopAll();
      if (m === 'lan') { mode = 'lan'; if (!window.lan) return { ok: false, err: 'lan-unavailable' }; const [h, p] = parseIp(arg); return await lan.join(h, p, opts); }
      let relayErr = null;
      if (window.rly) {
        mode = 'relay';
        const r = await rly.join(arg, { to: (opts && opts.to) || 9000, custom: opts && opts.relay });
        if (r.ok) return r;
        relayErr = r.err; await rly.stop();
      }
      mode = 'peer';
      const r2 = await P.join(arg, { att: 1, to: (opts && opts.to) || 7000 });
      if (r2.ok) return r2;
      mode = null;
      return { ok: false, err: relayErr === 'no-room' || r2.err === 'peer-unavailable' ? 'no-room' : (relayErr || r2.err) };
    },
    send: m => { const b = B(); if (b) b.send(m); else P.send(m); },
    sendTo: (id, m) => { const b = B(); if (b) b.sendTo(id, m); else P.sendTo(id, m); },
    kick: id => { const b = B(); if (b) b.kick(id); else P.kick(id); },
    rebind: (a, c) => { const b = B(); if (b) b.rebind(a, c); else P.rebind(a, c); },
    reserve: a => { P.reserve(a); if (window.lan) lan.reserve(a); if (window.rly) rly.reserve(a); },
    players: n => { if (mode === 'lan' && window.lan) lan.players(n); },
    publish: info => { if (mode === 'relay') rly.pub(info); },
    list: (on, cb) => { listCb = on ? cb : null; if (window.rly) rly.list(!!on); }
  };
})();
