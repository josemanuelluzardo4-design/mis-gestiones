/* MIS GESTIONES · app del repartidor */
(function () {
  'use strict';
  var L = window.Lectores;

  /* ================= utilidades ================= */
  function $(s, el) { return (el || document).querySelector(s); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function r2(v) { return Math.round(v * 100) / 100; }
  function miles(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function euros(n, signo) {
    var neg = n < -0.004, t = Math.abs(n).toFixed(2).split('.');
    var s = miles(t[0]) + ',' + t[1] + ' €';
    if (signo) return (neg ? '−' : (n > 0.004 ? '+' : '')) + s;
    return (neg ? '−' : '') + s;
  }
  function aNum(s) { if (s == null || s === '') return 0; var v = L.num(s); return isNaN(v) ? 0 : r2(v); }
  function campoEuros(v) { return v ? Math.abs(v).toFixed(2).replace('.', ',') : ''; }
  function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function deIso(t) { return new Date(+t.slice(0, 4), +t.slice(5, 7) - 1, +t.slice(8, 10)); }
  function hoyIso() { return iso(new Date()); }
  function sumaDias(t, n) { var d = deIso(t); d.setDate(d.getDate() + n); return iso(d); }
  function corta(t) { return t.slice(8, 10) + '/' + t.slice(5, 7); }
  function larga(t) { return corta(t) + '/' + t.slice(0, 4); }
  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function nombreDia(t) { var d = deIso(t); return cap(DIAS[d.getDay()]) + ', ' + d.getDate() + ' de ' + MESES[d.getMonth()]; }
  function tipo(dif) { return Math.abs(dif) < 0.005 ? 'ok' : (dif > 0 ? 'fav' : 'con'); }
  function periodoTexto(a, b) {
    if (a === b) return nombreDia(a);
    var fm = iso(new Date(+a.slice(0, 4), +a.slice(5, 7), 0));
    if (a.slice(8) === '01' && b === fm) return cap(MESES[+a.slice(5, 7) - 1]) + ' ' + a.slice(0, 4);
    return 'Del ' + corta(a) + ' al ' + corta(b) + '/' + b.slice(0, 4);
  }

  var I = {
    hoy: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
    res: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
    seur: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9"/></svg>',
    campana: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/></svg>',
    cam: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3"/></svg>',
    cal: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" style="color:var(--acc)" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
    abajo: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
    check: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',
    up: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
    down: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>',
    alerta: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>',
    doc: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></svg>',
    izq: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>',
    der: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>',
    borrar: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>'
  };
  function icoEstado(t) { return t === 'ok' ? I.check : (t === 'fav' ? I.up : (t === 'con' ? I.down : I.alerta)); }

  /* ================= colores ================= */
  var CLARO = { ok: '#0B3D91', 'ok-bg': '#E6F0FF', 'ok-dot': '#2F6FD6', fav: '#0F5A30', 'fav-bg': '#E3F5EA', 'fav-dot': '#1E8E4E', con: '#A30D25', 'con-bg': '#FDECEE', 'con-dot': '#C8102E', 'gris-bg': '#EEF1F6', warn: '#6B3A00', 'warn-bg': '#FFF4E5', 'warn-line': '#F0D9B5', 'warn-bar': '#C77700', sombra: 'rgba(10,30,70,.10)', card: '#FFFFFF', field: '#FFFFFF', 'head-ink': '#FFFFFF', 'on-navy': '#FFFFFF', 'seg-on': '#FFFFFF' };
  var OSCURO = { ok: '#9CC3FF', 'ok-bg': '#14233F', 'ok-dot': '#4C8DF0', fav: '#8FE0AE', 'fav-bg': '#123022', 'fav-dot': '#2FA866', con: '#FF9AA8', 'con-bg': '#3A1419', 'con-dot': '#E5484D', 'gris-bg': '#232323', warn: '#F5C98A', 'warn-bg': '#33240F', 'warn-line': '#5A4220', 'warn-bar': '#E0A040', sombra: 'rgba(0,0,0,.45)', card: '#1A1A1A', field: '#141414', line: '#3A3A3A', line2: '#2A2A2A', soft: '#202020', soft2: '#262626', off: '#5C5C5C', bg: '#0D0D0D', head: '#0D0D0D', 'head-2': '#1F1F1F', 'seg-on': '#3A3A3A' };
  var TEMAS = [
    { id: 'marino', nombre: 'Marino y oro', base: CLARO, v: { bg: '#F4F2EE', ink: '#0B1A33', mut: '#4F5A6E', line: '#D9D4C8', line2: '#E7E2D8', soft: '#FAF8F3', soft2: '#EFEBE2', off: '#8A8F99', head: '#0B1A33', 'head-sub': '#B9C2D3', 'head-2': '#1C2C4A', marca: '#D4B26A', 'seg-ink': '#E3E9F5', navy: '#0B1A33', cta: '#0B1A33', 'on-cta': '#D4B26A', acc: '#8A6D2F', sel: '#E9E2D0' } },
    { id: 'esmeralda', nombre: 'Esmeralda', base: CLARO, v: { bg: '#F2F4F1', ink: '#0F3B2E', mut: '#4E6359', line: '#C9D6CE', line2: '#DDE5E0', soft: '#F7FAF8', soft2: '#E6EEE9', off: '#8A9A92', head: '#0F3B2E', 'head-sub': '#B8D0C5', 'head-2': '#1E5243', marca: '#D8BE84', 'seg-ink': '#DCEBE3', navy: '#0F3B2E', cta: '#0F3B2E', 'on-cta': '#D8BE84', acc: '#0F6B4F', sel: '#DCEBE3' } },
    { id: 'burdeos', nombre: 'Burdeos', base: CLARO, v: { bg: '#F6F1EE', ink: '#4A1420', mut: '#6E5257', line: '#E1D2CF', line2: '#EBDFDC', soft: '#FBF7F5', soft2: '#F1E6E3', off: '#9C8C8F', head: '#4A1420', 'head-sub': '#E2C6CB', 'head-2': '#5E2230', marca: '#E3C79A', 'seg-ink': '#F2DDE1', navy: '#4A1420', cta: '#4A1420', 'on-cta': '#E3C79A', acc: '#7A2435', sel: '#F1E1DE' } },
    { id: 'titanio', nombre: 'Titanio', base: CLARO, v: { bg: '#ECEDEF', ink: '#1F2329', mut: '#5A606B', line: '#D3D6DB', line2: '#E1E3E7', soft: '#F6F7F8', soft2: '#E4E6EA', off: '#8C929C', head: '#2B2F36', 'head-sub': '#A9AEB8', 'head-2': '#3A3F48', marca: '#C8CCD3', 'seg-ink': '#DADDE2', navy: '#2B2F36', cta: '#1F2329', 'on-cta': '#FFFFFF', acc: '#1F2329', sel: '#E0E3E8' } },
    { id: 'marfil', nombre: 'Marfil', base: CLARO, v: { bg: '#FAF8F4', ink: '#1C1917', mut: '#78716C', line: '#E5DED2', line2: '#EEE8DE', soft: '#FDFBF8', soft2: '#F1ECE3', off: '#A8A29E', head: '#FAF8F4', 'head-ink': '#1C1917', 'head-sub': '#78716C', 'head-2': '#EFE9DF', marca: '#9A7B4F', 'seg-ink': '#57534E', navy: '#1C1917', cta: '#1C1917', 'on-cta': '#D6C3A0', acc: '#8A6A3F', sel: '#EFE6D6' } },
    { id: 'negro-oro', nombre: 'Negro y oro', base: OSCURO, v: { ink: '#F5F0E6', mut: '#A8A29A', 'head-ink': '#F5F0E6', 'head-sub': '#A8A29A', marca: '#C9A962', 'seg-ink': '#CFC8BC', navy: '#C9A962', 'on-navy': '#0D0D0D', cta: '#C9A962', 'on-cta': '#0D0D0D', acc: '#C9A962', sel: '#3A3226' } },
    { id: 'negro-rojo', nombre: 'Negro y rojo', base: OSCURO, v: { ink: '#F5F5F5', mut: '#A3A3A3', 'head-ink': '#F5F5F5', 'head-sub': '#A3A3A3', marca: '#FB7185', 'seg-ink': '#D4D4D4', navy: '#E11D48', 'on-navy': '#FFFFFF', cta: '#E11D48', 'on-cta': '#FFFFFF', acc: '#FB7185', sel: '#3A1A20' } }
  ];
  var TAMANOS = [{ id: 'pequena', nombre: 'Pequeña', z: 0.8 }, { id: 'mediana', nombre: 'Mediana', z: 0.88 }, { id: 'normal', nombre: 'Grande', z: 1 }];
  function aplicarTamano() {
    var t = TAMANOS.filter(function (x) { return x.id === db.ajustes.tam; })[0] || TAMANOS[1];
    document.body.style.zoom = t.z;
  }
  function temaActual() { return TEMAS.filter(function (x) { return x.id === db.ajustes.tema; })[0] || TEMAS[0]; }
  function aplicarTema() {
    var t = temaActual(), st = document.documentElement.style;
    var vals = Object.assign({}, t.base, t.v);
    Object.keys(vals).forEach(function (k) { st.setProperty('--' + k, vals[k]); });
    st.colorScheme = t.base === OSCURO ? 'dark' : 'light';
    var m = document.querySelector('meta[name=theme-color]'); if (m) m.setAttribute('content', vals.head);
  }
  function horaTxt() { var d = new Date(); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') + ':' + String(d.getSeconds()).padStart(2, '0'); }
  function reloj() {
    return '<span class="reloj num" role="timer" aria-live="off" aria-label="Hora actual" style="display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 10px;border-radius:16px;background:var(--head-2);color:var(--head-ink);font-size:15px;font-weight:700;letter-spacing:.02em">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="color:var(--marca)"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg><b style="font-weight:700">' + horaTxt() + '</b></span>';
  }
  setInterval(function () {
    var t = horaTxt();
    document.querySelectorAll('.reloj b').forEach(function (b) { b.textContent = t; });
  }, 1000);
  function avatar(tam) {
    var t = tam || 40;
    return '<button type="button" data-a="fotoPerfil" aria-label="' + (db.ajustes.foto ? 'Cambiar tu foto de perfil' : 'Poner tu foto de perfil') + '" style="width:' + t + 'px;height:' + t + 'px;border-radius:50%;border:2px solid var(--marca);background:var(--head-2);color:var(--marca);padding:0;overflow:hidden;display:flex;align-items:center;justify-content:center;flex-shrink:0">' +
      (db.ajustes.foto ? '<img data-foto="perfil" alt="" style="width:100%;height:100%;object-fit:cover">' : '<svg width="' + Math.round(t * .5) + '" height="' + Math.round(t * .5) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>') + '</button>';
  }

  /* ================= datos ================= */
  var CLAVE = 'misgestiones.v1';
  var db;
  function dbVacia() {
    return { dias: {}, seur: { efectivo: null, paquetes: null }, ajustes: { recordar: true, efectivo: true, seur: true, hora: '21:30', saldoInicial: 0, cierres: [], tema: 'marino', tam: 'mediana' } };
  }
  /* --- Firebase: sesión, datos en la nube y sincronización --- */
  var fbApp = firebase.initializeApp(self.FIREBASE_CONFIG);
  var auth = firebase.auth(), fs = firebase.firestore();
  try { fs.enablePersistence({ synchronizeTabs: true }).catch(function () {}); } catch (e) {}
  var usuario = null, cargado = { ajustes: false, dias: false, seur: false }, escuchas = [];
  var sync = { ajustes: null, dias: {}, seur: {} };
  function refU() { return fs.collection('users').doc(usuario.uid); }
  function listo() { return cargado.ajustes && cargado.dias && cargado.seur; }
  function normalizar() {
    var v = dbVacia();
    db.dias = db.dias || {}; db.seur = db.seur || v.seur; db.ajustes = Object.assign(v.ajustes, db.ajustes || {});
  }
  function cargar() { db = dbVacia(); }
  // Escribe solo lo que ha cambiado respecto a lo último sincronizado
  function guardar() {
    if (!usuario) return;
    var ops = [];
    var aj = JSON.stringify(db.ajustes);
    if (aj !== sync.ajustes) { sync.ajustes = aj; ops.push(function (b) { b.set(refU(), { ajustes: JSON.parse(aj), correo: usuario.email }, { merge: true }); }); }
    Object.keys(db.dias).forEach(function (k) {
      var j = JSON.stringify(db.dias[k]);
      if (j !== sync.dias[k]) { sync.dias[k] = j; ops.push(function (b) { b.set(refU().collection('dias').doc(k), JSON.parse(j)); }); }
    });
    Object.keys(sync.dias).forEach(function (k) { if (!db.dias[k]) { delete sync.dias[k]; ops.push(function (b) { b.delete(refU().collection('dias').doc(k)); }); } });
    ['efectivo', 'paquetes'].forEach(function (t) {
      var j = db.seur[t] ? JSON.stringify(db.seur[t]) : null;
      if (j !== (sync.seur[t] || null)) {
        sync.seur[t] = j;
        ops.push(function (b) { var r = refU().collection('seur').doc(t); if (j) b.set(r, JSON.parse(j)); else b.delete(r); });
      }
    });
    for (var n = 0; n < ops.length; n += 400) {
      var lote = fs.batch();
      ops.slice(n, n + 400).forEach(function (f) { f(lote); });
      lote.commit().catch(function (e) { toast('No se pudo guardar en la nube: ' + (e && e.message || e)); });
    }
  }
  var repintarPendiente = false;
  function repintarSiPuedo() {
    var a = document.activeElement;
    if (a && /INPUT|TEXTAREA|SELECT/.test(a.tagName) && !ui.cal && !ui.modal) { repintarPendiente = true; return; }
    repintarPendiente = false;
    if (!ui.sucio) abrirDia(ui.fecha);
    pintar();
  }
  document.addEventListener('focusout', function () { setTimeout(function () { if (repintarPendiente) repintarSiPuedo(); }, 50); });
  function escuchar() {
    escuchas.forEach(function (f) { f(); }); escuchas = [];
    cargado = { ajustes: false, dias: false, seur: false };
    db = dbVacia(); sync = { ajustes: null, dias: {}, seur: {} };
    escuchas.push(refU().onSnapshot(function (d) {
      var x = d.exists ? d.data() : {};
      db.ajustes = Object.assign(dbVacia().ajustes, x.ajustes || {});
      sync.ajustes = JSON.stringify(db.ajustes);
      cargado.ajustes = true; aplicarTema(); aplicarTamano(); trasCarga();
    }, errorNube));
    escuchas.push(refU().collection('dias').onSnapshot(function (q) {
      var dias = {}, s2 = {};
      q.forEach(function (d) { dias[d.id] = d.data(); s2[d.id] = JSON.stringify(dias[d.id]); });
      db.dias = dias; sync.dias = s2; cargado.dias = true; trasCarga();
    }, errorNube));
    escuchas.push(refU().collection('seur').onSnapshot(function (q) {
      var s3 = { efectivo: null, paquetes: null }, j = {};
      q.forEach(function (d) { s3[d.id] = d.data(); j[d.id] = JSON.stringify(s3[d.id]); });
      db.seur = s3; sync.seur = j; cargado.seur = true; trasCarga();
    }, errorNube));
  }
  function trasCarga() { if (listo()) { normalizar(); repintarSiPuedo(); } }
  function errorNube(e) { toast('Error con la nube: ' + (e && e.message || e)); }

  /* --- pantalla de entrada --- */
  function pLogin(modo) {
    var reg = modo === 'registro';
    return '<header class="top" style="min-height:38vh;justify-content:flex-end"><div class="marca"><span>MIS GESTIONES</span></div><h1>' + (reg ? 'Crear tu cuenta' : 'Entrar') + '</h1>' +
      '<span class="sub">' + (reg ? 'Solo la primera vez. Usa tu correo de siempre.' : 'Con tu correo y tu contraseña.') + '</span></header>' +
      '<main><form class="card" id="fLogin" novalidate>' +
      '<div class="campo"><label for="lCorreo">Correo</label><input id="lCorreo" class="txt peq" type="email" autocomplete="username" inputmode="email" value="' + esc(self.CORREO_DUENO || '') + '"></div>' +
      '<div class="campo"><label for="lClave">Contraseña' + (reg ? ' (mínimo 6 caracteres)' : '') + '</label><input id="lClave" class="txt peq" type="password" autocomplete="' + (reg ? 'new-password' : 'current-password') + '"></div>' +
      '<p id="lError" class="vacio" role="alert" style="padding:0;color:var(--con);display:none"></p>' +
      '<button type="submit" class="btn rojo">' + (reg ? 'Crear cuenta' : 'Entrar') + '</button>' +
      '<button type="button" class="btn suave" data-a="' + (reg ? 'irLogin' : 'irRegistro') + '">' + (reg ? 'Ya tengo cuenta: entrar' : 'Es mi primera vez: crear cuenta') + '</button>' +
      (reg ? '' : '<button type="button" class="btn suave" data-a="olvido">He olvidado la contraseña</button>') +
      '</form></main>';
  }
  var modoLogin = 'login';
  function errorLogin(t) { var e = $('#lError'); if (e) { e.textContent = t; e.style.display = 'block'; } }
  function traducirError(e) {
    var c = e && e.code || '';
    if (/invalid-credential|wrong-password|user-not-found|invalid-login/.test(c)) return 'Correo o contraseña incorrectos.';
    if (/email-already-in-use/.test(c)) return 'Esa cuenta ya existe. Pulsa «Ya tengo cuenta: entrar».';
    if (/weak-password/.test(c)) return 'La contraseña tiene que tener al menos 6 caracteres.';
    if (/invalid-email/.test(c)) return 'Ese correo no es válido.';
    if (/too-many-requests/.test(c)) return 'Demasiados intentos. Espera unos minutos.';
    if (/network/.test(c)) return 'Sin conexión. Revisa internet.';
    return 'No se pudo: ' + (e && e.message || e);
  }
  document.addEventListener('submit', function (ev) {
    if (ev.target.id !== 'fLogin') return;
    ev.preventDefault();
    var correo = ($('#lCorreo').value || '').trim().toLowerCase(), clave = $('#lClave').value || '';
    if (!correo || !clave) { errorLogin('Escribe el correo y la contraseña.'); return; }
    if (self.CORREO_DUENO && correo !== self.CORREO_DUENO.toLowerCase()) { errorLogin('Esta app es solo para ' + self.CORREO_DUENO + '.'); return; }
    var p = modoLogin === 'registro' ? auth.createUserWithEmailAndPassword(correo, clave) : auth.signInWithEmailAndPassword(correo, clave);
    p.catch(function (e) { errorLogin(traducirError(e)); });
  });

  function ingresadoDia(d) { return r2((d && d.tickets || []).reduce(function (a, t) { return a + (t.total || 0); }, 0)); }
  function cierresSeur() {
    var e = db.seur.efectivo;
    return e && e.otros ? e.otros.filter(function (o) { return o.tipo === 'cierre'; }).map(function (o) { return o.fecha; }) : [];
  }
  function ultimoCierre() {
    var hoy = hoyIso();
    var todos = cierresSeur().concat(db.ajustes.cierres || []).filter(function (f) { return f <= hoy; }).sort();
    return todos.length ? todos[todos.length - 1] : null;
  }
  function pendiente() {
    var c = 0, i = 0, cierre = ultimoCierre();
    Object.keys(db.dias).forEach(function (k) { if (cierre && k < cierre) return; var d = db.dias[k]; c += d.cobrado || 0; i += ingresadoDia(d); });
    return r2((cierre ? 0 : (db.ajustes.saldoInicial || 0)) + c - i);
  }

  /* --- fotos en IndexedDB --- */
  var idb = null;
  function abrirIdb() {
    if (idb) return idb;
    idb = new Promise(function (ok, ko) {
      try {
        var rq = indexedDB.open('misgestiones-fotos', 1);
        rq.onupgradeneeded = function () { rq.result.createObjectStore('f'); };
        rq.onsuccess = function () { ok(rq.result); };
        rq.onerror = function () { ko(rq.error); };
      } catch (e) { ko(e); }
    });
    return idb;
  }
  function blobABase64(b) { return new Promise(function (ok) { var r = new FileReader(); r.onload = function () { ok(String(r.result).split(',')[1]); }; r.readAsDataURL(b); }); }
  function base64ABlob(s) { var bin = atob(s), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return new Blob([u], { type: 'image/jpeg' }); }
  function fotoGuardar(id, blob) {
    var nube = usuario ? blobABase64(blob).then(function (b64) { return refU().collection('fotos').doc(id).set({ d: b64, t: Date.now() }); }).then(function () { return true; }, function () { return false; }) : Promise.resolve(false);
    return Promise.all([fotoLocal(id, blob), nube]).then(function (r) { return r[0] || r[1]; });
  }
  function fotoLocal(id, blob) {
    return abrirIdb().then(function (d) { return new Promise(function (ok) { var tx = d.transaction('f', 'readwrite'); tx.objectStore('f').put(blob, id); tx.oncomplete = function () { ok(true); }; tx.onerror = function () { ok(false); }; }); }).catch(function () { return false; });
  }
  var urlsFotos = {};
  function fotoUrl(id) {
    if (urlsFotos[id]) return Promise.resolve(urlsFotos[id]);
    return abrirIdb().then(function (d) { return new Promise(function (ok) { var rq = d.transaction('f').objectStore('f').get(id); rq.onsuccess = function () { ok(rq.result || null); }; rq.onerror = function () { ok(null); }; }); }).catch(function () { return null; })
      .then(function (b) {
        if (b) return b;
        if (!usuario) return null;
        return refU().collection('fotos').doc(id).get().then(function (d) {
          if (!d.exists) return null;
          var bl = base64ABlob(d.data().d); fotoLocal(id, bl); return bl;
        }).catch(function () { return null; });
      }).then(function (b) { return b ? (urlsFotos[id] = URL.createObjectURL(b)) : null; });
  }
  function pintarFotos() {
    document.querySelectorAll('img[data-foto]').forEach(function (im) {
      fotoUrl(im.getAttribute('data-foto')).then(function (u) { if (u) im.src = u; else im.style.visibility = 'hidden'; });
    });
  }

  /* ================= estado de pantalla ================= */
  var ui = {
    fecha: hoyIso(), borrador: null,
    resumen: { modo: 'semana', ini: null, fin: null },
    seur: { tab: 'efectivo', solo: false, rangos: { efectivo: null, paquetes: null } },
    cal: null, modal: null, ocupado: null
  };
  function abrirDia(f) {
    ui.fecha = f;
    var d = db.dias[f];
    ui.borrador = d ? JSON.parse(JSON.stringify(d)) : { paquetes: 0, cobrado: 0, tickets: [], pda: null };
    ui.borrador.lecturaPda = null;
    ui.sucio = false;
  }
  function rangoSemana(t) { var d = deIso(t); var lun = sumaDias(t, -((d.getDay() + 6) % 7)); return [lun, sumaDias(lun, 6)]; }
  function rangoMes(t) { return [t.slice(0, 8) + '01', iso(new Date(+t.slice(0, 4), +t.slice(5, 7), 0))]; }

  /* ================= avisos ================= */
  function avisos() {
    var out = [], a = db.ajustes, hoy = hoyIso(), ahora = new Date();
    if (a.recordar) {
      var hm = (a.hora || '21:30').split(':');
      var limite = new Date(); limite.setHours(+hm[0], +hm[1], 0, 0);
      if (ahora >= limite && !db.dias[hoy]) out.push({ t: 'con', titulo: 'Aún no has apuntado hoy', texto: 'Apunta paquetes, cobrado e ingresado antes de terminar el día.' });
    }
    if (a.efectivo) {
      var p = pendiente();
      var antiguo = Object.keys(db.dias).filter(function (k) { return k < hoy && (db.dias[k].cobrado || 0) > 0; }).length > 0;
      if (p > 0.005 && antiguo) out.push({ t: 'con', titulo: 'Efectivo sin ingresar', texto: 'Llevas ' + euros(p) + ' cobrados sin meter en la máquina.' });
    }
    if (a.seur) {
      var e = compararEfectivo(null, null), q = compararPaquetes(null, null);
      var n = e.avisos + q.malos;
      if (n > 0) out.push({ t: 'con', titulo: 'Diferencias con SEUR', texto: n === 1 ? 'Hay 1 día que no cuadra con lo que dice SEUR.' : 'Hay ' + n + ' días que no cuadran con lo que dice SEUR.', ir: 'seur' });
    }
    return out;
  }
  function htmlAvisos(lista) {
    return lista.map(function (a) {
      return '<div class="aviso ' + a.t + '" role="status"><span aria-hidden="true">' + I.alerta + '</span><div><b>' + esc(a.titulo) + '</b>' + esc(a.texto) +
        (a.ir ? ' <a href="#' + a.ir + '" style="color:inherit;font-weight:700">Ver</a>' : '') + '</div></div>';
    }).join('');
  }

  /* ================= comparaciones ================= */
  function compararEfectivo(ini, fin) {
    var s = db.seur.efectivo, filas = [], cob = 0, ing = 0, nAvisos = 0;
    if (!s) return { filas: [], avisos: 0, hay: false };
    var desde = ini || s.desde, hasta = fin || s.hasta;
    var fechas = {};
    Object.keys(s.dias).forEach(function (k) { fechas[k] = 1; });
    Object.keys(db.dias).forEach(function (k) { if (k >= s.desde && k <= s.hasta && ((db.dias[k].cobrado || 0) > 0 || ingresadoDia(db.dias[k]) > 0)) fechas[k] = 1; });
    Object.keys(fechas).sort().forEach(function (k) {
      if (k < desde || k > hasta) return;
      var sd = s.dias[k] || { cobrado: 0, ingresado: 0 };
      var mio = db.dias[k];
      var dif = r2(sd.ingresado - sd.cobrado);
      cob += sd.cobrado; ing += sd.ingresado;
      var extras = [];
      if (mio && (mio.cobrado || 0) > 0 && Math.abs(mio.cobrado - sd.cobrado) > 0.004) extras.push('Tu PDA: ' + euros(mio.cobrado) + ' · SEUR: ' + euros(sd.cobrado));
      var mi = mio ? ingresadoDia(mio) : 0;
      if (mi > 0 && Math.abs(mi - sd.ingresado) > 0.004) extras.push('Tus tickets: ' + euros(mi) + ' · SEUR anotó: ' + euros(sd.ingresado));
      if (extras.length) nAvisos++;
      filas.push({ fecha: k, t: tipo(dif), dif: dif, det: 'SEUR cobró ' + euros(sd.cobrado) + ' · ingresaste ' + euros(sd.ingresado), extras: extras });
    });
    var saldo = r2(ing - cob);
    return { hay: true, filas: filas, cob: r2(cob), ing: r2(ing), saldo: saldo, avisos: nAvisos, desde: desde, hasta: hasta };
  }
  function compararPaquetes(ini, fin) {
    var s = db.seur.paquetes, filas = [], malos = 0, total = 0, sinApuntar = 0;
    if (!s) return { filas: [], malos: 0, hay: false };
    var desde = ini || s.desde, hasta = fin || s.hasta;
    Object.keys(s.dias).sort().forEach(function (k) {
      if (k < desde || k > hasta) return;
      var seur = s.dias[k].entregados, mio = db.dias[k];
      total++;
      if (!mio || !mio.paquetes) { sinApuntar++; filas.push({ fecha: k, t: 'gris', det: 'SEUR ' + seur + ' · tú no lo apuntaste', estado: 'Sin apuntar' }); return; }
      var dif = seur - mio.paquetes, t = dif === 0 ? 'ok' : (dif > 0 ? 'fav' : 'con');
      if (t !== 'ok') malos++;
      filas.push({ fecha: k, t: t, det: 'Tú ' + mio.paquetes + ' · SEUR ' + seur, estado: t === 'ok' ? 'Cuadra' : (dif > 0 ? 'SEUR +' + dif : 'SEUR ' + dif) });
    });
    return { hay: true, filas: filas, malos: malos, total: total, sinApuntar: sinApuntar, desde: desde, hasta: hasta };
  }

  /* ================= pintado ================= */
  var app = $('#app');
  function vista() { var h = (location.hash || '').replace('#', ''); return ['hoy', 'resumen', 'seur', 'avisos'].indexOf(h) >= 0 ? h : 'hoy'; }
  function nav(v) {
    function a(id, txt, ico) { return '<a href="#' + id + '"' + (v === id ? ' aria-current="page"' : '') + '>' + ico + txt + '</a>'; }
    return '<nav class="abajo" aria-label="Secciones">' + a('hoy', 'Hoy', I.hoy) + a('resumen', 'Resumen', I.res) + a('seur', 'SEUR', I.seur) + a('avisos', 'Avisos', I.campana) + '</nav>';
  }
  function pintar() {
    if (!authListo) { app.innerHTML = '<header class="top"><div class="marca"><span>MIS GESTIONES</span></div><h1>Cargando…</h1></header>'; return; }
    if (!usuario) { app.innerHTML = pLogin(modoLogin); pintarCapa(); return; }
    if (!listo()) { app.innerHTML = '<header class="top"><div class="marca"><span>MIS GESTIONES</span></div><h1>Cargando…</h1><span class="sub">Trayendo tus datos de la nube</span></header>'; return; }
    var v = vista();
    var h = v === 'hoy' ? pHoy() : v === 'resumen' ? pResumen() : v === 'seur' ? pSeur() : pAvisos();
    app.innerHTML = h + nav(v);
    pintarCapa();
    pintarFotos();
  }

  /* ---------- HOY ---------- */
  function pHoy() {
    if (!ui.borrador) abrirDia(ui.fecha);
    var b = ui.borrador, esHoy = ui.fecha === hoyIso();
    var p = pendiente();
    var tick = b.tickets.map(function (t, n) {
      return '<div class="ticket">' + (t.foto ? '<img alt="Foto del ticket" data-foto="' + esc(t.foto) + '">' : '<span class="mini" aria-hidden="true"></span>') +
        '<div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:2px"><span style="font-size:14px;font-weight:700">Ticket: ' + euros(t.total) + '</span>' +
        '<span style="font-size:12px">Billetes ' + euros(t.billetes || 0) + (t.sobre ? ' + sobre ' + euros(t.sobre) : ' · sin sobre') + (t.op ? ' · Op. ' + esc(t.op) : '') + (t.hora ? ' · ' + esc(t.hora) : '') + '</span></div>' +
        '<button type="button" class="icobtn" data-a="quitarTicket" data-n="' + n + '" aria-label="Quitar este ticket">' + I.borrar + '</button></div>';
    }).join('');
    var lect = '';
    if (b.lecturaPda) {
      var lp = b.lecturaPda;
      lect = '<div class="lectura" role="status">' + (lp.valor != null ? 'He leído ' + euros(lp.valor) + ' en la foto de la PDA. Compruébalo:' : 'No he podido leer el importe. Escríbelo a mano mirando la foto:') +
        (lp.recorte ? '<img src="' + lp.recorte + '" alt="Importe recortado de la foto de la PDA">' : '') + '</div>';
    }
    var lista = avisos();
    return '<header class="top alto"><div class="marca"><span>MIS GESTIONES</span><span style="display:flex;align-items:center;gap:10px">' + reloj() + avatar(40) + '</span></div>' +
      '<span class="sub">' + (esHoy ? 'Hoy' : 'Apuntando otro día') + '</span>' +
      '<div class="fila" style="gap:8px"><h1 style="flex:1">' + esc(nombreDia(ui.fecha)) + '</h1>' +
      '<button type="button" data-a="calDiaHoy" aria-label="Cambiar el día" style="width:48px;height:48px;border-radius:12px;border:none;background:var(--head-2);display:flex;align-items:center;justify-content:center">' + I.cal.replace('color:var(--acc)', 'color:var(--head-ink)') + '</button></div>' +
      (esHoy ? '' : '<button type="button" data-a="volverHoy" style="align-self:flex-start;height:36px;border-radius:10px;border:1.5px solid var(--head-sub);background:transparent;color:var(--head-ink);font-size:13px;font-weight:700;padding:0 12px">Volver a hoy</button>') + '</header>' +
      '<main class="sube">' +
      '<section class="card sombra" style="flex-direction:row;justify-content:space-between;align-items:center">' +
      '<div style="display:flex;flex-direction:column;gap:4px"><span class="lab">Efectivo sin ingresar</span><span class="grande num">' + euros(p) + '</span>' + (ultimoCierre() ? '<span style="font-size:12px;color:var(--mut)">Desde el cierre del ' + corta(ultimoCierre()) + '</span>' : '') + '</div>' +
      (p > 0.005 ? '<span class="chip" style="background:var(--con-bg);color:var(--con)">' + I.alerta + 'Ingrésalo</span>' : (p < -0.005 ? '<span class="chip" style="background:var(--fav-bg);color:var(--fav)">' + I.up + 'A tu favor</span>' : '<span class="chip" style="background:var(--ok-bg);color:var(--ok)">' + I.check + 'Al día</span>')) +
      '</section>' + htmlAvisos(lista) +
      '<section class="card"><h2>Apuntar el día</h2>' +
      '<div class="campo"><label for="paq">Paquetes entregados</label><div class="fila">' +
      '<button type="button" class="paso" data-a="menos" aria-label="Uno menos">−</button>' +
      '<input id="paq" class="txt num" inputmode="numeric" value="' + (b.paquetes || 0) + '" data-c="paquetes" style="text-align:center;font-size:22px;font-weight:800">' +
      '<button type="button" class="paso mas" data-a="mas" aria-label="Uno más">+</button></div></div>' +
      '<div class="campo"><label for="cob">Efectivo cobrado (PDA)</label><div class="fila">' +
      '<input id="cob" class="txt num" inputmode="decimal" placeholder="0,00" value="' + campoEuros(b.cobrado) + '" data-c="cobrado">' +
      '<button type="button" class="btn suave" data-a="fotoPda" style="height:52px;flex-shrink:0">' + I.cam + 'PDA</button></div>' + lect + '</div>' +
      '<div class="campo"><span class="lab">Ingresado en máquina: <b class="num" style="color:var(--ink)">' + euros(ingresadoDia(b)) + '</b></span>' + tick +
      '<div class="g2"><button type="button" class="btn suave punt" data-a="fotoTicket">' + I.cam + 'Foto del ticket</button>' +
      '<button type="button" class="btn suave" data-a="ticketMano">A mano</button></div></div>' +
      '</section>' +
      '<button type="button" class="btn rojo" data-a="guardarDia" style="height:52px;font-size:16px">' + (db.dias[ui.fecha] ? 'Guardar cambios' : 'Guardar el día') + '</button>' +
      (db.dias[ui.fecha] ? '<p class="vacio" style="text-align:center;margin:0">Este día ya está guardado. Puedes cambiarlo y volver a guardar.</p>' : '') +
      '</main>';
  }

  /* ---------- RESUMEN ---------- */
  function pResumen() {
    var r = ui.resumen;
    if (!r.ini) { var w = rangoSemana(hoyIso()); r.ini = w[0]; r.fin = w[1]; }
    var dias = Object.keys(db.dias).filter(function (k) { return k >= r.ini && k <= r.fin; }).sort();
    var p = 0, c = 0, i = 0, conP = 0;
    dias.forEach(function (k) { var d = db.dias[k]; p += d.paquetes || 0; c += d.cobrado || 0; i += ingresadoDia(d); if (d.paquetes) conP++; });
    var conDatos = dias.filter(function (k) { return db.dias[k].paquetes > 0; });
    var grupos = [];
    if (conDatos.length > 1 && conDatos.length <= 7) grupos = conDatos.map(function (k) { var d = deIso(k); return [DIAS[d.getDay()].slice(0, 3) + ' ' + d.getDate(), db.dias[k].paquetes]; });
    else if (conDatos.length > 7) {
      var sem = {};
      conDatos.forEach(function (k) { var lun = rangoSemana(k)[0]; sem[lun] = (sem[lun] || 0) + db.dias[k].paquetes; });
      grupos = Object.keys(sem).sort().map(function (k) { return ['Sem ' + corta(k < r.ini ? r.ini : k), sem[k]]; });
      if (grupos.length > 8) grupos = grupos.slice(-8);
    }
    var max = grupos.reduce(function (a, g) { return Math.max(a, g[1]); }, 0);
    var barras = grupos.length ? '<div class="barras" role="img" aria-label="Paquetes: ' + esc(grupos.map(function (g) { return g[0] + ' ' + g[1]; }).join(', ')) + '">' +
      grupos.map(function (g, n) { return '<div><em class="num">' + miles(g[1]) + '</em><div class="b' + (n === grupos.length - 1 ? ' ult' : '') + '" style="height:' + Math.max(6, Math.round(g[1] / max * 86)) + 'px"></div><small>' + esc(g[0]) + '</small></div>'; }).join('') + '</div>' : '';
    var sobra = r2(i - c), ts = tipo(sobra);
    var tabs = [['dia', 'Día'], ['semana', 'Semana'], ['mes', 'Mes'], ['fechas', 'Fechas']].map(function (t) {
      return '<button type="button" data-a="modo" data-v="' + t[0] + '" aria-pressed="' + (r.modo === t[0]) + '">' + t[1] + '</button>';
    }).join('');
    var listaDias = dias.map(function (k) {
      var d = db.dias[k];
      return '<button type="button" class="dia" data-a="irDia" data-v="' + k + '" style="border:none;width:100%;text-align:left">' +
        '<div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:2px"><span style="font-size:14px;font-weight:700">' + esc(nombreDia(k)) + '</span>' +
        '<span class="det num">' + (d.paquetes || 0) + ' paquetes · cobrado ' + euros(d.cobrado || 0) + ' · ingresado ' + euros(ingresadoDia(d)) + '</span></div>' + I.der + '</button>';
    }).join('');
    return '<header class="top"><div class="marca"><span>MIS GESTIONES</span><span style="display:flex;align-items:center;gap:10px">' + reloj() + avatar(40) + '</span></div><h1>Resumen</h1>' +
      '<div class="seg" role="group" aria-label="Periodo" style="grid-template-columns:repeat(4,minmax(0,1fr))">' + tabs + '</div></header>' +
      '<main>' +
      '<button type="button" class="btn sec" data-a="calResumen" aria-haspopup="dialog" style="justify-content:flex-start;height:48px;font-size:15px">' + I.cal + '<span style="flex:1;text-align:left">' + esc(periodoTexto(r.ini, r.fin)) + '</span>' + I.abajo + '</button>' +
      '<section class="card" style="gap:4px"><span class="lab">Paquetes entregados</span>' +
      '<div class="fila" style="align-items:baseline"><span class="num" style="font-size:36px;font-weight:800;letter-spacing:-.02em">' + miles(p) + '</span>' +
      '<span style="font-size:14px;color:var(--mut)">' + (conP === 0 ? 'sin entregas apuntadas' : conP === 1 ? '1 día' : conP + ' días · ' + (p / conP).toFixed(1).replace('.', ',') + ' al día') + '</span></div>' + barras + '</section>' +
      '<section class="g2"><div class="card" style="gap:4px"><span class="lab">Cobrado</span><span class="num" style="font-size:22px;font-weight:800">' + euros(c) + '</span></div>' +
      '<div class="card" style="gap:4px"><span class="lab">Ingresado</span><span class="num" style="font-size:22px;font-weight:800">' + euros(i) + '</span></div></section>' +
      '<section class="estado ' + ts + '"><span class="ico">' + icoEstado(ts) + '</span><div style="flex:1"><div style="font-size:14px;font-weight:600">' + (ts === 'ok' ? 'Todo ingresado' : ts === 'fav' ? 'Ingresado de más' : 'Cobrado sin ingresar') + '</div>' +
      '<div class="num" style="font-size:20px;font-weight:800">' + euros(sobra, true) + '</div></div></section>' +
      '<section class="card"><h2>Días apuntados</h2>' + (listaDias ? '<div class="lista">' + listaDias + '</div>' : '<p class="vacio">No hay días apuntados en estas fechas.</p>') + '</section>' +
      '</main>';
  }

  /* ---------- SEUR ---------- */
  function pSeur() {
    var s = ui.seur, tab = s.tab;
    var doc = db.seur[tab];
    var tabs = [['efectivo', 'Efectivo'], ['paquetes', 'Paquetes']].map(function (t) { return '<button type="button" data-a="tabSeur" data-v="' + t[0] + '" aria-pressed="' + (tab === t[0]) + '">' + t[1] + '</button>'; }).join('');
    var h = '<header class="top"><div class="marca"><span>MIS GESTIONES</span><span style="display:flex;align-items:center;gap:10px">' + reloj() + avatar(40) + '</span></div><h1>Comparar con SEUR</h1>' +
      '<div class="seg" role="group" aria-label="Qué comparar" style="grid-template-columns:repeat(2,minmax(0,1fr))">' + tabs + '</div></header><main>';
    var archivoTxt = tab === 'efectivo' ? 'Extracto de cuentas (Excel o PDF)' : 'Hoja de liquidación (PDF o Excel)';
    h += '<section class="card" style="gap:10px"><div class="fila"><span class="icobtn" style="background:var(--soft2);border:none;color:var(--ink)">' + I.doc + '</span>' +
      '<div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:2px"><span style="font-size:14px;font-weight:700;overflow-wrap:anywhere">' + (doc ? esc(doc.nombre) : archivoTxt) + '</span>' +
      '<span style="font-size:12px;color:var(--mut)">' + (doc ? 'Leído: del ' + larga(doc.desde) + ' al ' + larga(doc.hasta) : 'Aún no has subido ninguno') + '</span></div>' +
      '<button type="button" class="btn suave" data-a="subirDoc" style="height:44px">' + (doc ? 'Cambiar' : 'Subir') + '</button></div>';
    if (!doc) {
      h += '<p class="vacio" style="padding:0">' + (tab === 'efectivo' ? 'Sube el extracto que te manda SEUR. La app compara cada día lo que SEUR dice que cobraste e ingresaste con tus fotos de la PDA y de los tickets.' : 'Sube la hoja de liquidación (la que trae Paradas, Expediciones y Bultos). La app compara las expediciones entregadas de cada día con los paquetes que apuntaste.') + '</p></section></main>';
      return h;
    }
    var rg = s.rangos[tab] || rangoInicial(tab, doc);
    s.rangos[tab] = rg;
    h += '<button type="button" class="btn suave" data-a="calSeur" aria-haspopup="dialog" style="justify-content:flex-start">' + I.cal + '<span style="flex:1;text-align:left">' + esc(rg[0] === rg[1] ? 'El ' + larga(rg[0]) : 'Del ' + corta(rg[0]) + ' al ' + larga(rg[1])) + '</span>' + I.abajo + '</button></section>';
    var filas, res;
    if (tab === 'efectivo') {
      var e = compararEfectivo(rg[0], rg[1]), ts = tipo(e.saldo);
      res = '<section class="estado ' + ts + '"><span class="ico">' + icoEstado(ts) + '</span><div style="flex:1"><div style="font-size:18px;font-weight:800">' +
        (ts === 'ok' ? 'Todo cuadra' : ts === 'fav' ? euros(e.saldo) + ' a tu favor' : euros(-e.saldo) + ' pendiente') + '</div>' +
        '<div style="font-size:12px;font-weight:600">SEUR cobró ' + euros(e.cob) + ' · ingresaste ' + euros(e.ing) + '</div></div></section>';
      var nC = (doc.otros || []).filter(function (o) { return o.tipo === 'cierre' && o.fecha > rg[0] && o.fecha <= rg[1]; }).length;
      if (nC) res += '<div class="aviso gris">' + I.alerta + '<div><b>En estas fechas hay ' + (nC === 1 ? '1 cierre de mes' : nC + ' cierres de mes') + '</b>En cada cierre SEUR descuenta lo pendiente de tu factura, así que este total no es lo que debes ahora. Para ver un periodo limpio, elige del día de un cierre al día antes del siguiente.</div></div>';
      if (e.avisos) res += '<div class="aviso con">' + I.alerta + '<div><b>' + e.avisos + (e.avisos === 1 ? ' día' : ' días') + ' con datos distintos a los tuyos</b>Mira las líneas naranjas: tu PDA o tus tickets no coinciden con lo que anotó SEUR.</div></div>';
      filas = e.filas.map(function (f) { return Object.assign(f, { estado: f.t === 'ok' ? 'Cuadra' : euros(f.dif, true), marcar: f.t !== 'ok' || f.extras.length }); });
    } else {
      var q = compararPaquetes(rg[0], rg[1]);
      var tq = q.malos ? 'con' : (q.sinApuntar === q.total ? 'gris' : 'ok');
      res = '<section class="estado ' + tq + '"><span class="ico">' + icoEstado(tq) + '</span><div style="flex:1"><div style="font-size:18px;font-weight:800">' +
        (q.malos ? (q.malos === 1 ? '1 día no cuadra' : q.malos + ' días no cuadran') : (tq === 'gris' ? 'No hay días tuyos para comparar' : 'Todo cuadra')) + '</div>' +
        '<div style="font-size:12px;font-weight:600">' + (q.total - q.malos - q.sinApuntar) + ' de ' + q.total + ' días cuadran' + (q.sinApuntar ? ' · ' + q.sinApuntar + ' sin apuntar' : '') + '</div></div></section>';
      filas = q.filas.map(function (f) { return Object.assign(f, { extras: [], marcar: f.t !== 'ok' }); });
    }
    var todas = filas.length;
    if (s.solo) filas = filas.filter(function (f) { return f.marcar; });
    var COLD = { ok: 'var(--ok-dot)', fav: 'var(--fav-dot)', con: 'var(--con-dot)', gris: 'var(--off)' };
    var COLT = { ok: 'var(--ok)', fav: 'var(--fav)', con: 'var(--con)', gris: 'var(--mut)' };
    var COLB = { ok: 'var(--soft)', fav: 'var(--fav-bg)', con: 'var(--con-bg)', gris: 'var(--gris-bg)' };
    var lista = filas.map(function (f) {
      return '<div class="dia" style="background:' + (f.extras.length && f.t === 'ok' ? 'var(--warn-bg)' : COLB[f.t]) + '"><span class="punto" style="background:' + COLD[f.t] + '"></span>' +
        '<div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:2px"><span class="num" style="font-size:14px;font-weight:700">' + corta(f.fecha) + '</span>' +
        '<span class="det num">' + esc(f.det) + '</span>' + f.extras.map(function (x) { return '<span class="extra num">⚠ ' + esc(x) + '</span>'; }).join('') + '</div>' +
        '<span class="num" style="font-size:12px;font-weight:800;white-space:nowrap;color:' + COLT[f.t] + '">' + esc(f.estado) + '</span></div>';
    }).join('');
    h += res + '<section class="card" style="gap:8px"><div class="fila" style="justify-content:space-between"><h2>Día a día</h2>' +
      '<button type="button" class="btn suave" data-a="solo" aria-pressed="' + s.solo + '" style="height:36px;font-size:13px">' + (s.solo ? 'Ver todos' : 'Solo diferencias') + '</button></div>' +
      '<div class="leyenda"><span><i style="background:var(--ok-dot)"></i>Cuadra</span><span><i style="background:var(--fav-dot)"></i>A tu favor</span><span><i style="background:var(--con-dot)"></i>' + (tab === 'efectivo' ? 'Pendiente de ingresar' : 'SEUR cuenta menos') + '</span>' + (tab === 'paquetes' ? '<span><i style="background:var(--off)"></i>Sin apuntar</span>' : '') + '</div>' +
      (lista ? '<div class="lista">' + lista + '</div>' : '<p class="vacio">' + (todas ? 'No hay días con diferencias en estas fechas.' : 'No hay datos en estas fechas.') + '</p>') + '</section>';
    if (tab === 'efectivo' && doc.otros && doc.otros.length) {
      var otros = doc.otros.filter(function (o) { return o.fecha >= rg[0] && o.fecha <= rg[1]; });
      if (otros.length) {
        var NOM = { cierre: 'Cierre del mes (traspaso)', anticipo: 'Anticipo de factura', cargo: 'Cargo', cuota: 'Cuota / factura de proveedor' };
        h += '<section class="card" style="gap:8px"><h2>Otros movimientos (no son efectivo)</h2><p class="vacio" style="padding:0">Salen en el extracto pero no cuentan para el efectivo cobrado e ingresado.</p><div class="lista">' +
          otros.map(function (o) { return '<div class="dia"><div style="flex:1;display:flex;flex-direction:column;gap:2px"><span style="font-size:14px;font-weight:700">' + corta(o.fecha) + ' · ' + esc(NOM[o.tipo] || o.tipo) + '</span></div><span class="num" style="font-weight:700">' + euros(o.importe) + '</span></div>'; }).join('') + '</div></section>';
      }
    }
    return h + '</main>';
  }

  function rangoInicial(tab, doc) {
    if (tab !== 'efectivo') return [doc.desde, doc.hasta];
    var c = (doc.otros || []).filter(function (o) { return o.tipo === 'cierre'; }).map(function (o) { return o.fecha; }).sort();
    if (c.length >= 2) return [c[c.length - 2], sumaDias(c[c.length - 1], -1)];
    return [doc.desde, doc.hasta];
  }

  /* ---------- AVISOS / AJUSTES ---------- */
  function pAvisos() {
    var a = db.ajustes, lista = avisos();
    function sw(k, tit, txt) {
      return '<div class="fila" style="padding:12px 0;border-bottom:1px solid var(--line2);gap:14px"><div style="flex:1;display:flex;flex-direction:column;gap:4px"><span style="font-size:16px;font-weight:700" id="sw-' + k + '">' + tit + '</span><span style="font-size:13px;line-height:1.4;color:var(--mut)">' + txt + '</span></div>' +
        '<button type="button" class="switch" role="switch" aria-checked="' + !!a[k] + '" aria-labelledby="sw-' + k + '" data-a="sw" data-v="' + k + '"><span></span></button></div>';
    }
    var horas = ['19:00', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00'];
    return '<header class="top"><div class="marca"><span>MIS GESTIONES</span><span style="display:flex;align-items:center;gap:10px">' + reloj() + avatar(40) + '</span></div><h1>Avisos y ajustes</h1></header><main>' +
      (lista.length ? htmlAvisos(lista) : '<div class="aviso ok">' + I.check + '<div><b>Todo en orden</b>No hay avisos ahora mismo.</div></div>') +
      '<section class="card"><h2>Tu perfil</h2><div class="fila" style="gap:14px">' + avatar(72) +
      '<div style="display:flex;flex-direction:column;gap:8px;flex:1"><button type="button" class="btn suave" data-a="fotoPerfil">' + I.cam + (db.ajustes.foto ? 'Cambiar foto' : 'Poner foto') + '</button>' +
      (db.ajustes.foto ? '<button type="button" class="btn suave" data-a="quitarFoto" style="color:var(--con)">Quitar foto</button>' : '') + '</div></div></section>' +
      '<section class="card"><h2>Tamaño de la app</h2><div role="group" aria-label="Tamaño de la app" style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px">' +
      TAMANOS.map(function (t) {
        var on = (db.ajustes.tam || 'mediana') === t.id;
        return '<button type="button" data-a="tam" data-v="' + t.id + '" aria-pressed="' + on + '" style="height:48px;border-radius:12px;border:' + (on ? '3px solid var(--acc)' : '1.5px solid var(--line)') + ';background:var(--field);color:var(--ink);font-size:' + Math.round(15 * t.z) + 'px;font-weight:700">' + t.nombre + '</button>';
      }).join('') + '</div></section>' +
      '<section class="card"><h2>Colores de la app</h2><div class="g2" role="group" aria-label="Colores de la app">' +
      TEMAS.map(function (t) {
        var on = temaActual().id === t.id, c = Object.assign({}, t.base, t.v);
        return '<button type="button" data-a="tema" data-v="' + t.id + '" aria-pressed="' + on + '" style="min-height:56px;border-radius:14px;border:' + (on ? '3px solid var(--acc)' : '1.5px solid var(--line)') + ';background:var(--field);color:var(--ink);display:flex;align-items:center;gap:10px;padding:6px 10px;font-size:13px;font-weight:700;text-align:left">' +
          '<span aria-hidden="true" style="width:30px;height:30px;border-radius:15px;flex-shrink:0;border:1px solid var(--line);background:linear-gradient(135deg,' + c.head + ' 50%,' + (c.marca) + ' 50%)"></span><span style="flex:1">' + t.nombre + '</span>' + (on ? '<span style="color:var(--acc)">' + I.check + '</span>' : '') + '</button>';
      }).join('') + '</div></section>' +
      '<section class="card" style="gap:0;padding-top:4px;padding-bottom:4px">' +
      sw('recordar', 'Recordar apuntar el día', 'Si a la hora elegida no has apuntado nada.') +
      '<div class="fila" style="padding:10px 0;border-bottom:1px solid var(--line2)"><label for="hora" style="flex:1">Hora del recordatorio</label><select id="hora" data-c="hora" style="height:44px;border-radius:12px;border:1.5px solid var(--line);padding:0 10px;font-size:15px;font-weight:700;background:var(--field);color:var(--ink)">' +
      horas.map(function (h) { return '<option' + (h === a.hora ? ' selected' : '') + '>' + h + '</option>'; }).join('') + '</select></div>' +
      sw('efectivo', 'Efectivo sin ingresar', 'Si llevas dinero cobrado más de un día sin meterlo en la máquina.') +
      '<div style="border-bottom:none">' + sw('seur', 'Diferencias con SEUR', 'Al subir la hoja o el extracto, si algún día no cuadra.').replace('border-bottom:1px solid var(--line2);', '') + '</div></section>' +
      pNotif() +
      '<section class="card"><h2>Cierre de mes</h2><p class="vacio" style="padding:0">' + (ultimoCierre() ? 'Último cierre: ' + larga(ultimoCierre()) + '. El efectivo sin ingresar cuenta desde ese día.' : 'Todavía no hay ningún cierre. Si subes el extracto, la app coge los cierres (traspasos) de SEUR.') + '</p>' +
      '<button type="button" class="btn suave" data-a="cierre">Hacer cierre hoy</button></section>' +
      '<section class="card"><h2>Efectivo al empezar</h2><div class="campo"><label for="saldo">Si ya llevabas efectivo sin ingresar el primer día que usas la app, ponlo aquí</label>' +
      '<input id="saldo" class="txt peq num" inputmode="decimal" placeholder="0,00" value="' + campoEuros(a.saldoInicial) + '" data-c="saldoInicial"></div></section>' +
      '<section class="card"><h2>Copia de seguridad</h2><p class="vacio" style="padding:0">Tus datos se guardan en la nube y se ven en todos tus dispositivos. Si quieres una copia extra, copia este texto y guárdalo.</p>' +
      '<div class="g2"><button type="button" class="btn suave" data-a="copiar">Copiar mis datos</button><button type="button" class="btn suave" data-a="restaurar">Restaurar</button></div></section>' +
      '<section class="card"><h2>Tu cuenta</h2><p class="vacio" style="padding:0">Has entrado como ' + esc(usuario ? usuario.email : '') + '.</p><button type="button" class="btn suave" data-a="salir">Cerrar sesión</button></section>' +
      '<section class="card"><h2>Pruebas</h2><p class="vacio" style="padding:0">Rellena tus días con lo que dicen los documentos de SEUR que hayas subido, para ver la app funcionando. Después usa «Borrar todo» antes de empezar de verdad.</p>' +
      '<div class="g2"><button type="button" class="btn suave" data-a="demo">Rellenar con SEUR</button><button type="button" class="btn suave" data-a="borrarTodo" style="color:var(--con)">Borrar todo</button></div></section>' +
      '</main>';
  }

  /* ================= capa: calendario, modales, avisos ================= */
  var capa = $('#capa');
  function pintarCapa() {
    var h = '';
    if (ui.cal) h += pCal();
    else if (ui.modal) h += '<div class="modal" role="dialog" aria-modal="true" aria-label="' + esc(ui.modal.titulo) + '"><div class="caja">' + ui.modal.html + '</div></div>';
    if (ui.ocupado) h += '<div class="modal" style="align-items:center"><div class="caja" role="status"><h2>' + esc(ui.ocupado.titulo) + '</h2><p class="vacio" style="padding:0">' + esc(ui.ocupado.texto) + '</p><div class="progreso"><div style="width:' + Math.round((ui.ocupado.p || 0) * 100) + '%"></div></div></div></div>';
    capa.innerHTML = h;
  }
  function ocupado(titulo, texto, p) { ui.ocupado = titulo ? { titulo: titulo, texto: texto, p: p } : null; pintarCapa(); }
  function modal(titulo, html) { ui.modal = titulo ? { titulo: titulo, html: html } : null; pintarCapa(); }
  var tt;
  function toast(t) {
    var el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); el.textContent = t;
    document.body.appendChild(el); clearTimeout(tt); tt = setTimeout(function () { el.remove(); }, 3800);
    setTimeout(function () { if (el.parentNode) el.remove(); }, 4200);
  }

  function abrirCal(ini, fin, marcados, alAplicar, uno) {
    ui.cal = { ini: ini, fin: fin, y: +ini.slice(0, 4), m: +ini.slice(5, 7) - 1, marcados: marcados, ok: alAplicar, uno: !!uno };
    pintarCapa();
  }
  function pCal() {
    var c = ui.cal, hueco = (new Date(c.y, c.m, 1).getDay() + 6) % 7, n = new Date(c.y, c.m + 1, 0).getDate();
    var celdas = '';
    for (var k = 0; k < hueco; k++) celdas += '<span></span>';
    for (var d = 1; d <= n; d++) {
      var t = iso(new Date(c.y, c.m, d));
      var cls = 'cal-c';
      if (c.ini && c.fin && c.ini !== c.fin) { if (t > c.ini && t < c.fin) cls += ' dentro'; }
      if (t === c.ini) cls += ' ini'; if (t === c.fin || (t === c.ini && !c.fin)) cls += ' fin';
      if (t === c.ini && c.ini === c.fin) cls = 'cal-c ini fin';
      celdas += '<div class="' + cls + '"><button type="button" data-a="calDia" data-v="' + t + '" aria-label="' + d + ' de ' + MESES[c.m] + '">' + d + (c.marcados[t] ? '<i></i>' : '') + '</button></div>';
    }
    var ayuda = c.uno ? 'Toca el día que quieres apuntar o revisar' : !c.ini ? 'Toca el primer día' : (!c.fin ? 'Desde el ' + corta(c.ini) + ' · ahora toca el último día' : 'Del ' + corta(c.ini) + ' al ' + corta(c.fin));
    return '<div class="modal" role="dialog" aria-modal="true" aria-label="Elegir fechas"><div class="caja">' +
      '<div class="fila" style="justify-content:space-between"><button type="button" class="icobtn" data-a="calMes" data-v="-1" aria-label="Mes anterior">' + I.izq + '</button>' +
      '<span style="font-size:17px;font-weight:800">' + cap(MESES[c.m]) + ' ' + c.y + '</span>' +
      '<button type="button" class="icobtn" data-a="calMes" data-v="1" aria-label="Mes siguiente">' + I.der + '</button></div>' +
      '<span style="font-size:13px;font-weight:600;color:var(--mut);text-align:center">' + ayuda + '</span>' +
      '<div class="cal-dias"><span>L</span><span>M</span><span>X</span><span>J</span><span>V</span><span>S</span><span>D</span></div>' +
      '<div class="cal-grid">' + celdas + '</div>' +
      '<div class="fila" style="font-size:12px;color:var(--mut);gap:8px"><span style="width:6px;height:6px;border-radius:3px;background:var(--acc)"></span>Días con datos</div>' +
      '<div class="g2"><button type="button" class="btn sec" data-a="calNo" style="height:48px">Cancelar</button><button type="button" class="btn rojo" data-a="calSi" style="height:48px"' + (c.ini ? '' : ' disabled') + '>Aplicar</button></div></div></div>';
  }

  /* ================= imágenes y OCR ================= */
  function cargarImagen(file) {
    return new Promise(function (ok, ko) {
      var u = URL.createObjectURL(file), im = new Image();
      im.onload = function () { ok(im); };
      im.onerror = function () { ko(new Error('No se pudo abrir la foto')); };
      im.src = u;
    });
  }
  function lienzo(im, maxLado, gris) {
    var esc_ = Math.min(1, maxLado / Math.max(im.naturalWidth || im.width, im.naturalHeight || im.height));
    var w = Math.round((im.naturalWidth || im.width) * esc_), h = Math.round((im.naturalHeight || im.height) * esc_);
    var cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    var cx = cv.getContext('2d'); cx.drawImage(im, 0, 0, w, h);
    if (gris) {
      var d = cx.getImageData(0, 0, w, h), px = d.data, hist = new Array(256).fill(0);
      for (var i = 0; i < px.length; i += 4) { var g = Math.round(px[i] * .299 + px[i + 1] * .587 + px[i + 2] * .114); px[i] = g; hist[g]++; }
      var tot = w * h, acc = 0, lo = 0, hi = 255;
      for (i = 0; i < 256; i++) { acc += hist[i]; if (acc > tot * .02) { lo = i; break; } }
      acc = 0; for (i = 255; i >= 0; i--) { acc += hist[i]; if (acc > tot * .02) { hi = i; break; } }
      var rango = Math.max(1, hi - lo);
      for (i = 0; i < px.length; i += 4) { var v = Math.max(0, Math.min(255, Math.round((px[i] - lo) * 255 / rango))); px[i] = px[i + 1] = px[i + 2] = v; }
      cx.putImageData(d, 0, 0);
    }
    return cv;
  }
  function aBlob(cv, q) { return new Promise(function (ok) { cv.toBlob(function (b) { ok(b); }, 'image/jpeg', q || .72); }); }

  var lector = null, idioma = null;
  function abs(p) { return new URL(p, location.href).href; }
  function prepararLector() {
    if (lector) return lector;
    ocupado('Preparando el lector', 'La primera vez tarda un poco más: se descarga el lector de fotos.', .05);
    lector = Promise.resolve().then(function () { return Tesseract.createWorker('spa', 1, {
      workerPath: abs('lib/worker.min.js'), corePath: abs('lib/core'), langPath: abs('lib/lang'),
      workerBlobURL: false,
      logger: function (m) { if (ui.ocupado && typeof m.progress === 'number') { ui.ocupado.p = m.progress; var b = capa.querySelector('.progreso div'); if (b) b.style.width = Math.round(m.progress * 100) + '%'; } }
    }); }).catch(function (e) { lector = null; ocupado(null); throw e; });
    return lector;
  }

  var fotoPara = null;
  function pedirFoto(para) { fotoPara = para; var f = $('#fFoto'); f.value = ''; f.click(); }

  function leerFotoTicket(file) {
    var id = 'f' + Date.now();
    var w;
    return cargarImagen(file).then(function (im) {
      return Promise.all([aBlob(lienzo(im, 1100, false), .6).then(function (b) { return fotoGuardar(id, b); }), prepararLector().then(function (x) { w = x; return lienzo(im, 2200, true); })]);
    }).then(function (r) {
      ocupado('Leyendo el ticket', 'Un momento…', .3);
      return w.setParameters({ tessedit_pageseg_mode: '3', tessedit_char_whitelist: '' }).then(function () { return w.recognize(r[1]); });
    }).then(function (res) {
      ocupado(null);
      var t = L.leerTicket(res.data.text);
      t.foto = id;
      return t;
    });
  }
  function leerFotoPda(file) {
    var id = 'p' + Date.now(), w, cv;
    return cargarImagen(file).then(function (im) {
      return Promise.all([aBlob(lienzo(im, 1100, false), .6).then(function (b) { return fotoGuardar(id, b); }), prepararLector().then(function (x) { w = x; cv = lienzo(im, 2000, true); })]);
    }).then(function () {
      ocupado('Leyendo la PDA', 'Buscando «Cobrados a contado»…', .3);
      return w.setParameters({ tessedit_pageseg_mode: '11', tessedit_char_whitelist: '' }).then(function () { return w.recognize(cv); });
    }).then(function (res) {
      var lineas = res.data.lines || [];
      var iCont = -1;
      lineas.forEach(function (l, n) { if (iCont < 0 && /contado/i.test(l.text)) iCont = n; });
      var cand = null;
      var re = /\d+\s*[,.]\s*\d{2}/;
      for (var n = (iCont >= 0 ? iCont : 0); n < lineas.length && !cand; n++) if (re.test(lineas[n].text)) cand = lineas[n];
      if (!cand) for (n = 0; n < lineas.length && !cand; n++) if (re.test(lineas[n].text)) cand = lineas[n];
      if (!cand) return { valor: null, recorte: null, foto: id };
      var b = cand.bbox, pad = Math.round((b.y1 - b.y0) * .5);
      var x0 = Math.max(0, b.x0 - pad), y0 = Math.max(0, b.y0 - pad), x1 = Math.min(cv.width, b.x1 + pad), y1 = Math.min(cv.height, b.y1 + pad);
      var cr = document.createElement('canvas'), k = 3; cr.width = (x1 - x0) * k; cr.height = (y1 - y0) * k;
      var cx = cr.getContext('2d'); cx.imageSmoothingQuality = 'high'; cx.drawImage(cv, x0, y0, x1 - x0, y1 - y0, 0, 0, cr.width, cr.height);
      var recorte = cr.toDataURL('image/jpeg', .85);
      return w.setParameters({ tessedit_pageseg_mode: '7', tessedit_char_whitelist: '0123456789,.€' }).then(function () { return w.recognize(cr); }).then(function (r2_) {
        var v = L.importePda(r2_.data.text.replace(/\./g, ',')); if (v == null) v = L.importePda(cand.text);
        return { valor: v, recorte: recorte, foto: id };
      });
    }).then(function (x) { ocupado(null); return w.setParameters({ tessedit_char_whitelist: '' }).then(function () { return x; }); });
  }

  /* ================= documentos de SEUR ================= */
  function lineasPdf(buf) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = abs('lib/pdf.worker.min.js');
    return pdfjsLib.getDocument({ data: buf }).promise.then(function (pdf) {
      var paginas = [];
      for (var i = 1; i <= pdf.numPages; i++) paginas.push(pdf.getPage(i).then(function (p) { return p.getTextContent(); }));
      return Promise.all(paginas);
    }).then(function (cont) {
      var out = [];
      cont.forEach(function (c) {
        var filas = {};
        c.items.forEach(function (it) { if (!it.str || !it.str.trim()) return; var y = Math.round(it.transform[5] / 3); (filas[y] = filas[y] || []).push(it); });
        Object.keys(filas).map(Number).sort(function (a, b) { return b - a; }).forEach(function (y) {
          out.push(filas[y].sort(function (a, b) { return a.transform[4] - b.transform[4]; }).map(function (it) { return it.str.trim(); }).join(' '));
        });
      });
      return out;
    });
  }
  function leerDocumento(file) {
    var nombre = file.name || 'documento';
    var esPdf = /\.pdf$/i.test(nombre) || file.type === 'application/pdf';
    ocupado('Leyendo el documento', nombre, .3);
    return file.arrayBuffer().then(function (buf) {
      if (esPdf) return lineasPdf(buf).then(function (ls) { return { ext: L.extractoDesdeLineas(ls), liq: L.liquidacionDesdeLineas(ls) }; });
      var wb = XLSX.read(buf, { type: 'array' });
      var filas = [];
      wb.SheetNames.forEach(function (n) { filas = filas.concat(XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, raw: false, defval: '' })); });
      return { ext: L.extractoDesdeFilas(filas), liq: L.liquidacionDesdeFilas(filas) };
    }).then(function (r) {
      ocupado(null);
      var nE = Object.keys(r.ext.dias).length, nL = r.liq.total;
      if (!nE && !nL) { toast('No he encontrado datos de SEUR en «' + nombre + '». ¿Es el extracto o la hoja de liquidación?'); return; }
      if (nE >= nL) {
        db.seur.efectivo = { nombre: nombre, desde: r.ext.desde, hasta: r.ext.hasta, dias: r.ext.dias, otros: r.ext.otros, subido: new Date().toISOString() };
        ui.seur.tab = 'efectivo'; ui.seur.rangos.efectivo = null;
        toast('Extracto leído: ' + nE + ' días con cobros o ingresos, del ' + larga(r.ext.desde) + ' al ' + larga(r.ext.hasta) + '.');
      } else {
        db.seur.paquetes = { nombre: nombre, desde: r.liq.desde, hasta: r.liq.hasta, dias: r.liq.dias, subido: new Date().toISOString() };
        ui.seur.tab = 'paquetes'; ui.seur.rangos.paquetes = [r.liq.desde, r.liq.hasta];
        toast('Liquidación leída: ' + nL + ' días de reparto, del ' + larga(r.liq.desde) + ' al ' + larga(r.liq.hasta) + '.');
      }
      guardar(); pintar();
    }).catch(function (e) { ocupado(null); toast('No se pudo leer el documento: ' + (e && e.message || e)); });
  }

  /* ================= acciones ================= */
  function guardarBorrador() {
    var b = ui.borrador;
    var d = { paquetes: b.paquetes || 0, cobrado: r2(b.cobrado || 0), tickets: b.tickets, pda: b.pda || null, guardado: new Date().toISOString() };
    db.dias[ui.fecha] = d; guardar();
  }
  function opRepetido(op) {
    if (!op) return null;
    var dias = Object.keys(db.dias);
    for (var i = 0; i < dias.length; i++) if ((db.dias[dias[i]].tickets || []).some(function (t) { return t.op === op; })) return dias[i];
    if (ui.borrador && ui.borrador.tickets.some(function (t) { return t.op === op; })) return ui.fecha;
    return null;
  }
  function anadirTicket(t) {
    var rep = opRepetido(t.op);
    if (rep) { toast('Ese ticket (Op. ' + t.op + ') ya está apuntado el ' + larga(rep) + '.'); return; }
    if (t.fecha && t.fecha !== ui.fecha) {
      ui.ticketPendiente = t;
      modal('Fecha del ticket', '<h2>El ticket es del ' + larga(t.fecha) + '</h2><p class="vacio" style="padding:0">Estás apuntando el ' + larga(ui.fecha) + '. ¿En qué día lo guardo?</p>' +
        '<button type="button" class="btn rojo" data-a="ticketEnSuDia">En el ' + larga(t.fecha) + ' (día del ticket)</button>' +
        '<button type="button" class="btn sec" data-a="ticketAqui">En el ' + larga(ui.fecha) + '</button>');
      return;
    }
    ui.borrador.tickets.push(t); ui.sucio = true; pintar();
    toast('Ticket leído: ' + euros(t.total) + (t.sobre ? ' (billetes ' + euros(t.billetes) + ' + sobre ' + euros(t.sobre) + ')' : '') + '. Comprueba y guarda el día.');
  }

  document.addEventListener('click', function (ev) {
    var el = ev.target.closest('[data-a]'); if (!el) return;
    var a = el.getAttribute('data-a'), v = el.getAttribute('data-v');
    var b = ui.borrador;
    switch (a) {
      case 'mas': ui.sucio = true; b.paquetes = (b.paquetes || 0) + 1; $('#paq').value = b.paquetes; break;
      case 'menos': ui.sucio = true; b.paquetes = Math.max(0, (b.paquetes || 0) - 1); $('#paq').value = b.paquetes; break;
      case 'fotoPda': pedirFoto('pda'); break;
      case 'fotoTicket': pedirFoto('ticket'); break;
      case 'ticketMano':
        modal('Ticket a mano', '<h2>Añadir ingreso a mano</h2><div class="campo"><label for="mB">Billetes</label><input id="mB" class="txt peq num" inputmode="decimal" placeholder="0,00"></div>' +
          '<div class="campo"><label for="mS">Sobre (monedas)</label><input id="mS" class="txt peq num" inputmode="decimal" placeholder="0,00"></div>' +
          '<div class="campo"><label for="mO">Nº de operación (opcional)</label><input id="mO" class="txt peq num" inputmode="numeric"></div>' +
          '<div class="g2"><button type="button" class="btn sec" data-a="cerrarModal">Cancelar</button><button type="button" class="btn rojo" data-a="ticketManoOk">Añadir</button></div>');
        setTimeout(function () { var x = $('#mB'); if (x) x.focus(); }, 30);
        break;
      case 'ticketManoOk':
        var bi = aNum($('#mB').value), so = aNum($('#mS').value), op = ($('#mO').value || '').trim() || null;
        if (bi + so <= 0) { toast('Escribe al menos un importe.'); return; }
        modal(null); anadirTicket({ billetes: bi, sobre: so, total: r2(bi + so), op: op, fecha: null, hora: null, foto: null, mano: true });
        break;
      case 'ticketEnSuDia':
        var t = ui.ticketPendiente; ui.ticketPendiente = null; modal(null);
        var otro = db.dias[t.fecha] || { paquetes: 0, cobrado: 0, tickets: [], pda: null };
        otro.tickets = (otro.tickets || []).concat([t]); otro.guardado = new Date().toISOString(); db.dias[t.fecha] = otro; guardar();
        toast('Ticket de ' + euros(t.total) + ' guardado en el ' + larga(t.fecha) + '.'); pintar();
        break;
      case 'ticketAqui':
        var t2 = ui.ticketPendiente; ui.ticketPendiente = null; modal(null); t2.fecha = null; anadirTicket(t2);
        break;
      case 'quitarTicket': ui.sucio = true; b.tickets.splice(+el.getAttribute('data-n'), 1); pintar(); break;
      case 'cerrarModal': modal(null); break;
      case 'irRegistro': modoLogin = 'registro'; pintar(); break;
      case 'irLogin': modoLogin = 'login'; pintar(); break;
      case 'olvido':
        var co = ($('#lCorreo').value || '').trim();
        if (!co) { errorLogin('Escribe tu correo arriba.'); break; }
        auth.sendPasswordResetEmail(co).then(function () { toast('Te hemos mandado un correo para cambiar la contraseña.'); }, function (e) { errorLogin(traducirError(e)); });
        break;
      case 'salir':
        modal('Salir', '<h2>¿Cerrar sesión en este móvil?</h2><p class="vacio" style="padding:0">Tus datos siguen guardados en la nube.</p><div class="g2"><button type="button" class="btn sec" data-a="cerrarModal">Cancelar</button><button type="button" class="btn rojo" data-a="salirOk">Salir</button></div>'); break;
      case 'salirOk': modal(null); auth.signOut(); break;
      case 'notifOn': activarNotificaciones(); break;
      case 'tam': db.ajustes.tam = v; guardar(); aplicarTamano(); pintar(); break;
      case 'tema': db.ajustes.tema = v; guardar(); aplicarTema(); pintar(); break;
      case 'fotoPerfil': var fp = $('#fPerfil'); fp.value = ''; fp.click(); break;
      case 'quitarFoto': db.ajustes.foto = false; guardar(); if (urlsFotos.perfil) { URL.revokeObjectURL(urlsFotos.perfil); delete urlsFotos.perfil; } pintar(); break;
      case 'calDiaHoy': abrirCal(ui.fecha, ui.fecha, marcasMias(), function (x) { abrirDia(x); }, true); break;
      case 'volverHoy': abrirDia(hoyIso()); pintar(); break;
      case 'cierre':
        modal('Cierre', '<h2>¿Hacer cierre de mes hoy?</h2><p class="vacio" style="padding:0">El efectivo sin ingresar vuelve a empezar desde hoy, como cuando SEUR hace el traspaso y lo descuenta de tu factura. Si subes el extracto, la app usa sus cierres automáticamente.</p>' +
          '<div class="g2"><button type="button" class="btn sec" data-a="cerrarModal">Cancelar</button><button type="button" class="btn rojo" data-a="cierreOk">Hacer cierre</button></div>'); break;
      case 'cierreOk': db.ajustes.cierres = (db.ajustes.cierres || []).concat([hoyIso()]); guardar(); modal(null); toast('Cierre hecho el ' + larga(hoyIso()) + '.'); pintar(); break;
      case 'guardarDia':
        guardarBorrador(); toast('Día ' + larga(ui.fecha) + ' guardado.'); abrirDia(ui.fecha); pintar(); break;
      case 'modo':
        var r = ui.resumen;
        if (v === 'fechas') { abrirCal(r.ini, r.fin, marcasMias(), function (x, y) { r.modo = 'fechas'; r.ini = x; r.fin = y; }); break; }
        r.modo = v; var rg = v === 'dia' ? [hoyIso(), hoyIso()] : v === 'semana' ? rangoSemana(hoyIso()) : rangoMes(hoyIso());
        r.ini = rg[0]; r.fin = rg[1]; pintar(); break;
      case 'calResumen':
        abrirCal(ui.resumen.ini, ui.resumen.fin, marcasMias(), function (x, y) { ui.resumen.modo = 'fechas'; ui.resumen.ini = x; ui.resumen.fin = y; }); break;
      case 'irDia': abrirDia(v); location.hash = 'hoy'; break;
      case 'tabSeur': ui.seur.tab = v; ui.seur.solo = false; pintar(); break;
      case 'solo': ui.seur.solo = !ui.seur.solo; pintar(); break;
      case 'subirDoc': var fd = $('#fDoc'); fd.value = ''; fd.click(); break;
      case 'calSeur':
        var tab = ui.seur.tab, doc = db.seur[tab], m = {};
        Object.keys(doc.dias).forEach(function (k) { m[k] = 1; });
        var rr = ui.seur.rangos[tab];
        abrirCal(rr[0], rr[1], m, function (x, y) { ui.seur.rangos[tab] = [x, y]; }); break;
      case 'calDia':
        var c = ui.cal;
        if (c.uno) { if (v > hoyIso()) { toast('Ese día todavía no ha llegado.'); break; } ui.cal = null; c.ok(v, v); pintar(); break; }
        if (!c.ini || c.fin) { c.ini = v; c.fin = null; } else if (v < c.ini) c.ini = v; else c.fin = v;
        pintarCapa(); break;
      case 'calMes':
        var cc = ui.cal; cc.m += +v; if (cc.m < 0) { cc.m = 11; cc.y--; } if (cc.m > 11) { cc.m = 0; cc.y++; } pintarCapa(); break;
      case 'calNo': ui.cal = null; pintarCapa(); break;
      case 'calSi': var k2 = ui.cal; ui.cal = null; k2.ok(k2.ini, k2.fin || k2.ini); pintar(); break;
      case 'sw': db.ajustes[v] = !db.ajustes[v]; guardar(); pintar(); break;
      case 'copiar':
        var txt = JSON.stringify(db);
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(function () { toast('Datos copiados. Pégalos en un chat contigo mismo para guardarlos.'); }, function () { mostrarTexto(txt); });
        else mostrarTexto(txt);
        break;
      case 'restaurar':
        modal('Restaurar', '<h2>Restaurar datos</h2><p class="vacio" style="padding:0">Pega aquí el texto de tu copia de seguridad. Sustituye lo que hay ahora en este móvil.</p><textarea id="resT" aria-label="Copia de seguridad"></textarea>' +
          '<div class="g2"><button type="button" class="btn sec" data-a="cerrarModal">Cancelar</button><button type="button" class="btn rojo" data-a="restaurarOk">Restaurar</button></div>'); break;
      case 'restaurarOk':
        try { var nd = JSON.parse($('#resT').value); if (!nd || !nd.dias) throw 0; db = nd; cargarDesde(db); guardar(); modal(null); abrirDia(hoyIso()); toast('Datos restaurados.'); pintar(); }
        catch (e) { toast('Ese texto no es una copia válida.'); } break;
      case 'demo':
        var n = 0, e = db.seur.efectivo, q = db.seur.paquetes;
        if (!e && !q) { toast('Primero sube el extracto o la liquidación en la pantalla SEUR.'); break; }
        var fechas = {};
        if (e) Object.keys(e.dias).forEach(function (k) { fechas[k] = 1; });
        if (q) Object.keys(q.dias).forEach(function (k) { fechas[k] = 1; });
        Object.keys(fechas).forEach(function (k) {
          var d = db.dias[k] || { paquetes: 0, cobrado: 0, tickets: [], pda: null };
          if (q && q.dias[k] && !d.paquetes) d.paquetes = q.dias[k].entregados;
          if (e && e.dias[k]) { if (!d.cobrado) d.cobrado = e.dias[k].cobrado; if (!(d.tickets || []).length && e.dias[k].ingresado) { var ing = e.dias[k].ingresos || [e.dias[k].ingresado]; d.tickets = [{ billetes: ing[0], sobre: r2(e.dias[k].ingresado - ing[0]), total: e.dias[k].ingresado, op: null, foto: null, mano: true, demo: true }]; } }
          d.demo = true; db.dias[k] = d; n++;
        });
        guardar(); abrirDia(ui.fecha); toast(n + ' días rellenados para probar.'); pintar(); break;
      case 'borrarTodo':
        modal('Borrar todo', '<h2>¿Borrar todos los datos?</h2><p class="vacio" style="padding:0">Se borran tus días, los documentos de SEUR subidos y los ajustes de este móvil. No se puede deshacer.</p>' +
          '<div class="g2"><button type="button" class="btn sec" data-a="cerrarModal">Cancelar</button><button type="button" class="btn rojo" data-a="borrarOk">Borrar</button></div>'); break;
      case 'borrarOk': db = dbVacia(); db.ajustes.tema = temaActual().id; guardar();
        refU().collection('fotos').get().then(function (q) { var b = fs.batch(); q.forEach(function (d) { b.delete(d.ref); }); return b.commit(); }).catch(function () {}); modal(null); abrirDia(hoyIso()); ui.seur.rangos = { efectivo: null, paquetes: null }; toast('Datos borrados.'); pintar(); break;
    }
  });
  function mostrarTexto(txt) {
    modal('Copia', '<h2>Tu copia de seguridad</h2><p class="vacio" style="padding:0">Selecciona todo el texto y cópialo.</p><textarea readonly aria-label="Copia de seguridad">' + esc(txt) + '</textarea><button type="button" class="btn sec" data-a="cerrarModal">Cerrar</button>');
  }
  function cargarDesde() { var v = dbVacia(); db.dias = db.dias || {}; db.seur = db.seur || v.seur; db.ajustes = Object.assign(v.ajustes, db.ajustes || {}); }
  function marcasMias() { var m = {}; Object.keys(db.dias).forEach(function (k) { m[k] = 1; }); return m; }

  document.addEventListener('input', function (ev) {
    var c = ev.target.getAttribute && ev.target.getAttribute('data-c'); if (!c) return;
    var b = ui.borrador;
    if (c === 'paquetes' || c === 'cobrado') ui.sucio = true;
    if (c === 'paquetes') b.paquetes = Math.max(0, parseInt(ev.target.value, 10) || 0);
    if (c === 'cobrado') { b.cobrado = aNum(ev.target.value); }
  });
  document.addEventListener('change', function (ev) {
    var c = ev.target.getAttribute && ev.target.getAttribute('data-c'); if (!c) return;
    if (c === 'fecha' && ev.target.value) { abrirDia(ev.target.value); pintar(); }
    if (c === 'hora') { db.ajustes.hora = ev.target.value; guardar(); }
    if (c === 'saldoInicial') { db.ajustes.saldoInicial = aNum(ev.target.value); guardar(); pintar(); }
  });

  $('#fFoto').addEventListener('change', function (ev) {
    var f = ev.target.files && ev.target.files[0]; if (!f) return;
    if (fotoPara === 'ticket') {
      leerFotoTicket(f).then(function (t) {
        if (t.total == null) { ocupado(null); toast('No he podido leer el importe del ticket. Haz otra foto más cerca o añádelo a mano.'); return; }
        if (!t.cuadra) toast('Revisa el ticket: billetes y sobre no suman el total.');
        anadirTicket(t);
      }).catch(function (e) { ocupado(null); toast('No se pudo leer la foto: ' + (e && e.message || e)); });
    } else {
      leerFotoPda(f).then(function (r) {
        var b = ui.borrador; b.pda = r.foto; b.lecturaPda = r; ui.sucio = true;
        if (r.valor != null) b.cobrado = r.valor;
        pintar();
      }).catch(function (e) { ocupado(null); toast('No se pudo leer la foto: ' + (e && e.message || e)); });
    }
  });
  $('#fPerfil').addEventListener('change', function (ev) {
    var f = ev.target.files && ev.target.files[0]; if (!f) return;
    cargarImagen(f).then(function (im) {
      var w = im.naturalWidth, h = im.naturalHeight, l = Math.min(w, h), cv = document.createElement('canvas');
      cv.width = cv.height = 320;
      cv.getContext('2d').drawImage(im, (w - l) / 2, (h - l) / 2, l, l, 0, 0, 320, 320);
      return aBlob(cv, .85);
    }).then(function (b) { return fotoGuardar('perfil', b); }).then(function (ok) {
      if (!ok) { toast('No se pudo guardar la foto en este navegador.'); return; }
      if (urlsFotos.perfil) { URL.revokeObjectURL(urlsFotos.perfil); delete urlsFotos.perfil; }
      db.ajustes.foto = true; guardar(); pintar(); toast('Foto de perfil guardada.');
    }).catch(function () { toast('No se pudo abrir la foto.'); });
  });
  $('#fDoc').addEventListener('change', function (ev) { var f = ev.target.files && ev.target.files[0]; if (f) leerDocumento(f); });

  window.addEventListener('hashchange', function () { ui.cal = null; ui.modal = null; pintar(); window.scrollTo(0, 0); });

  /* ================= notificaciones ================= */
  var swReg = null, mensajeria = null;
  function esIOS() { return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); }
  function esInstalada() { return (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true; }
  function soportaPush() { return 'serviceWorker' in navigator && 'Notification' in window && 'PushManager' in window; }
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('firebase-messaging-sw.js').then(function (r) { swReg = r; }).catch(function () {});
  }
  try {
    if (firebase.messaging.isSupported && firebase.messaging.isSupported()) {
      mensajeria = firebase.messaging();
      mensajeria.onMessage(function (m) { var n = m.notification || {}; toast((n.title ? n.title + ': ' : '') + (n.body || '')); });
    }
  } catch (e) { mensajeria = null; }
  function pNotif() {
    var estado, boton = '';
    if (esIOS() && !esInstalada()) {
      estado = 'En iPhone, primero añade la app a la pantalla de inicio: en Safari toca Compartir (el cuadrado con la flecha) → «Añadir a pantalla de inicio». Después ábrela desde ese icono y vuelve aquí.';
    } else if (!soportaPush() || !mensajeria) {
      estado = 'Este navegador no permite notificaciones. Prueba con Chrome o Safari actualizados.';
    } else if (Notification.permission === 'denied') {
      estado = 'Las notificaciones están bloqueadas. Actívalas en los ajustes del móvil para esta app.';
    } else if (Notification.permission === 'granted' && tokenLocal()) {
      estado = 'Activadas en este móvil. Te avisaremos a la hora elegida.';
      boton = '<button type="button" class="btn suave" data-a="notifOn">Volver a activar</button>';
    } else {
      estado = 'Recibe los avisos aunque tengas la app cerrada.';
      boton = '<button type="button" class="btn rojo" data-a="notifOn">Activar notificaciones en este móvil</button>';
    }
    return '<section class="card"><h2>Notificaciones en el móvil</h2><p class="vacio" style="padding:0">' + estado + '</p>' + boton + '</section>';
  }
  function tokenLocal() { try { return localStorage.getItem('mg.token') || ''; } catch (e) { return ''; } }
  function activarNotificaciones() {
    if (!mensajeria || !soportaPush()) { toast('Este navegador no permite notificaciones.'); return; }
    Notification.requestPermission().then(function (p) {
      if (p !== 'granted') { toast('No has dado permiso para las notificaciones.'); pintar(); return; }
      var reg = swReg ? Promise.resolve(swReg) : navigator.serviceWorker.register('firebase-messaging-sw.js');
      return reg.then(function (r) { return mensajeria.getToken({ vapidKey: self.FIREBASE_VAPID, serviceWorkerRegistration: r }); }).then(function (tk) {
        if (!tk) throw new Error('sin token');
        try { localStorage.setItem('mg.token', tk); } catch (e) {}
        var id = tk;
        return refU().collection('tokens').doc(id.slice(-40)).set({ token: tk, creado: Date.now(), dispositivo: navigator.userAgent.slice(0, 160) }).then(function () {
          toast('Notificaciones activadas en este móvil.'); pintar();
        });
      });
    }).catch(function (e) { toast('No se pudieron activar: ' + (e && e.message || e)); });
  }

  /* ================= arranque ================= */
  var authListo = false;
  auth.onAuthStateChanged(function (u) {
    authListo = true;
    if (u && self.CORREO_DUENO && (u.email || '').toLowerCase() !== self.CORREO_DUENO.toLowerCase()) {
      auth.signOut(); toast('Esta app es solo para ' + self.CORREO_DUENO + '.'); return;
    }
    usuario = u || null;
    escuchas.forEach(function (f) { f(); }); escuchas = [];
    urlsFotos = {};
    if (usuario) escuchar();
    pintar();
  });
  cargar();
  aplicarTema();
  aplicarTamano();
  abrirDia(hoyIso());
  pintar();
})();
