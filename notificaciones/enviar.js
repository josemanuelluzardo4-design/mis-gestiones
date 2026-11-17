/* MIS GESTIONES · envío de avisos (lo ejecuta GitHub Actions cada 30 minutos por la tarde) */
'use strict';
const admin = require('firebase-admin');

const URL_APP = 'https://josemanuelluzardo4-design.github.io/mis-gestiones/';
const ZONA = 'Europe/Madrid';

function ahoraMadrid() {
  const p = {};
  new Intl.DateTimeFormat('en-GB', { timeZone: ZONA, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    .formatToParts(new Date()).forEach(x => { p[x.type] = x.value; });
  return { fecha: `${p.year}-${p.month}-${p.day}`, hm: `${p.hour}:${p.minute}` };
}
const r2 = v => Math.round(v * 100) / 100;
const euros = v => v.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' €';
const ingresado = d => r2((d.tickets || []).reduce((a, t) => a + (t.total || 0), 0));

async function main() {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!json) { console.log('Falta el secreto FIREBASE_SERVICE_ACCOUNT: no se envía nada.'); return; }
  admin.initializeApp({ credential: admin.credential.cert(JSON.parse(json)) });
  const fs = admin.firestore();
  const { fecha, hm } = ahoraMadrid();
  console.log('Hora en Madrid:', fecha, hm);

  const usuarios = await fs.collection('users').get();
  for (const u of usuarios.docs) {
    const datos = u.data() || {};
    const a = Object.assign({ recordar: true, efectivo: true, hora: '21:30', saldoInicial: 0, cierres: [] }, datos.ajustes || {});
    const enviados = datos.enviados || {};
    if (hm < (a.hora || '21:30')) continue;

    const tokensSnap = await u.ref.collection('tokens').get();
    const tokens = tokensSnap.docs.map(d => d.data().token).filter(Boolean);
    if (!tokens.length) continue;

    const avisos = [], marcar = {};
    if (a.recordar !== false && enviados.recordar !== fecha) {
      const hoy = await u.ref.collection('dias').doc(fecha).get();
      if (!hoy.exists) avisos.push('Aún no has apuntado hoy: paquetes, cobrado e ingresado.');
      marcar.recordar = fecha;
    }
    if (a.efectivo !== false && enviados.efectivo !== fecha) {
      const seur = await u.ref.collection('seur').doc('efectivo').get();
      const cierresSeur = seur.exists ? (seur.data().otros || []).filter(o => o.tipo === 'cierre').map(o => o.fecha) : [];
      const cierre = cierresSeur.concat(a.cierres || []).filter(f => f <= fecha).sort().pop() || null;
      const dias = await u.ref.collection('dias').get();
      let c = 0, i = 0, antiguo = false;
      dias.forEach(d => {
        if (cierre && d.id < cierre) return;
        const x = d.data(); c += x.cobrado || 0; i += ingresado(x);
        if (d.id < fecha && (x.cobrado || 0) > 0) antiguo = true;
      });
      const p = r2((cierre ? 0 : (a.saldoInicial || 0)) + c - i);
      if (p > 0.005 && antiguo) avisos.push(`Llevas ${euros(p)} cobrados sin ingresar en la máquina.`);
      marcar.efectivo = fecha;
    }

    if (avisos.length) {
      const res = await admin.messaging().sendEachForMulticast({
        tokens,
        notification: { title: 'MIS GESTIONES', body: avisos.join(' ') },
        webpush: { fcmOptions: { link: URL_APP }, notification: { icon: URL_APP + 'icons/icon-192.png', badge: URL_APP + 'icons/icon-192.png' } }
      });
      console.log(`Enviado a ${res.successCount} de ${tokens.length} dispositivos.`);
      const malos = [];
      res.responses.forEach((r, n) => {
        const c = r.error && r.error.code;
        if (c === 'messaging/registration-token-not-registered' || c === 'messaging/invalid-registration-token' || c === 'messaging/invalid-argument') malos.push(tokens[n]);
      });
      for (const d of tokensSnap.docs) if (malos.includes(d.data().token)) await d.ref.delete();
    }
    if (Object.keys(marcar).length) await u.ref.set({ enviados: Object.assign({}, enviados, marcar) }, { merge: true });
  }
}
main().catch(e => { console.error(e); process.exit(1); });
