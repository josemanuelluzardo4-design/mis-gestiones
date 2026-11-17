/* MIS GESTIONES · lectores de documentos (extracto, liquidación, ticket, PDA) */
(function (root) {
  'use strict';

  function num(s) {
    if (s == null) return NaN;
    if (typeof s === 'number') return s;
    s = String(s).trim().replace(/\s|€|EUR/gi, '');
    var neg = /^-|-$/.test(s);
    s = s.replace(/^-|-$/g, '');
    if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, '').replace(',', '.');
    else if (/^\d+,\d+$/.test(s)) s = s.replace(',', '.');
    else if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, '');
    var v = parseFloat(s);
    return neg ? -v : v;
  }
  function r2(v) { return Math.round(v * 100) / 100; }

  // dd/mm/yy o dd/mm/yyyy -> YYYY-MM-DD
  function isoDe(s) {
    var m = /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/.exec(String(s).trim());
    if (!m) return null;
    var y = m[3].length === 2 ? '20' + m[3] : m[3];
    if (m[1] === '00') return null;
    return y + '-' + m[2].padStart(2, '0') + '-' + m[1].padStart(2, '0');
  }

  var CONCEPTOS = [
    { re: /sacas\s+sin\s+liquidar/i, tipo: 'cobro' },
    { re: /su\s+abono/i, tipo: 'ingreso' },
    { re: /traspaso\s+de\s+cuenta/i, tipo: 'cierre' },
    { re: /anticipo/i, tipo: 'anticipo' },
    { re: /su\s+cargo/i, tipo: 'cargo' },
    { re: /fact\.?\s*proveedor/i, tipo: 'cuota' }
  ];
  function tipoDe(texto) {
    for (var i = 0; i < CONCEPTOS.length; i++) if (CONCEPTOS[i].re.test(texto)) return CONCEPTOS[i].tipo;
    return null;
  }

  /* ---------- Extracto de cuentas desde filas (Excel) ---------- */
  // filas: array de arrays (celdas). Devuelve {movs:[{fecha,tipo,concepto,importe}], desde, hasta}
  function extractoDesdeFilas(filas) {
    var iDebe = -1, iHaber = -1, iFecha = -1, iConc = -1;
    for (var r = 0; r < Math.min(filas.length, 30); r++) {
      var fila = filas[r] || [];
      for (var c = 0; c < fila.length; c++) {
        var t = String(fila[c] == null ? '' : fila[c]).replace(/\s+/g, '').toUpperCase();
        if (t === 'DEBE') iDebe = c;
        if (t === 'HABER') iHaber = c;
        if (t === 'CONCEPTO') iConc = c;
      }
    }
    var movs = [];
    filas.forEach(function (fila) {
      if (!fila) return;
      var celdas = fila.map(function (x) { return x == null ? '' : String(x); });
      var texto = celdas.join(' ');
      var tipo = tipoDe(texto);
      if (!tipo) return;
      var fecha = null;
      for (var c = 0; c < celdas.length && !fecha; c++) {
        if (iConc >= 0 && c > iConc) break;
        fecha = isoDe(celdas[c]);
      }
      if (!fecha) for (c = 0; c < celdas.length && !fecha; c++) fecha = isoDe(celdas[c]);
      if (!fecha) return;
      var debe = iDebe >= 0 ? num(fila[iDebe]) : NaN;
      var haber = iHaber >= 0 ? num(fila[iHaber]) : NaN;
      var importe;
      if (!isNaN(debe) || !isNaN(haber)) {
        importe = Math.abs(debe || 0) > 0 ? Math.abs(debe) : Math.abs(haber || 0);
      } else {
        importe = importeDeTexto(texto, tipo);
      }
      if (!importe) return;
      var concepto = '';
      for (var k = 0; k < CONCEPTOS.length; k++) { var m = CONCEPTOS[k].re.exec(texto); if (m) { concepto = m[0]; break; } }
      movs.push({ fecha: fecha, tipo: tipo, concepto: concepto, importe: r2(importe) });
    });
    return resumirMovs(movs);
  }

  // Para líneas de texto (PDF): toma el primer importe con decimales tras el concepto
  function importeDeTexto(texto, tipo) {
    var c = CONCEPTOS.filter(function (x) { return x.tipo === tipo; })[0];
    var m = c.re.exec(texto);
    var resto = m ? texto.slice(m.index + m[0].length) : texto;
    resto = resto.replace(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, ' ');
    var nums = resto.match(/-?\d{1,3}(?:\.\d{3})*,\d{2}-?|-?\d+[.,]\d{2}-?/g) || [];
    for (var i = 0; i < nums.length; i++) { var v = Math.abs(num(nums[i])); if (v > 0) return v; }
    return 0;
  }

  function extractoDesdeLineas(lineas) {
    var movs = [];
    lineas.forEach(function (l) {
      var tipo = tipoDe(l);
      if (!tipo) return;
      var mf = /\b(\d{1,2}\/\d{1,2}\/\d{2,4})\b/.exec(l);
      var fecha = mf && isoDe(mf[1]);
      if (!fecha) return;
      var imp = importeDeTexto(l, tipo);
      if (!imp) return;
      movs.push({ fecha: fecha, tipo: tipo, concepto: '', importe: r2(imp) });
    });
    return resumirMovs(movs);
  }

  function resumirMovs(movs) {
    var dias = {};
    var otros = [];
    movs.forEach(function (m) {
      if (m.tipo === 'cobro' || m.tipo === 'ingreso') {
        var d = dias[m.fecha] || (dias[m.fecha] = { cobrado: 0, ingresado: 0, ingresos: [] });
        if (m.tipo === 'cobro') d.cobrado = r2(d.cobrado + m.importe);
        else { d.ingresado = r2(d.ingresado + m.importe); d.ingresos.push(m.importe); }
      } else otros.push(m);
    });
    var fechas = movs.map(function (m) { return m.fecha; }).sort();
    return { dias: dias, otros: otros, desde: fechas[0] || null, hasta: fechas[fechas.length - 1] || null, total: movs.length };
  }

  /* ---------- Liquidación (paquetes por día) ---------- */
  // línea tipo: "1/09/26 D 96 16 109 29 114 29 526,905 44,100 230,80"
  function liquidacionDesdeLineas(lineas) {
    var dias = {};
    lineas.forEach(function (l) {
      var m = /^\s*(\d{1,2}\/\d{1,2}\/\d{2,4})\s*[A-Z]?\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/.exec(l);
      if (!m) return;
      var f = isoDe(m[1]);
      if (!f) return;
      dias[f] = { paradas: +m[2], recogidas: +m[3], entregados: +m[4], expSal: +m[5], bultos: +m[6], bultosSal: +m[7] };
    });
    var fechas = Object.keys(dias).sort();
    return { dias: dias, desde: fechas[0] || null, hasta: fechas[fechas.length - 1] || null, total: fechas.length };
  }
  function liquidacionDesdeFilas(filas) {
    var lineas = filas.map(function (f) {
      return (f || []).map(function (x) { return x == null ? '' : String(x).trim(); }).filter(Boolean).join(' ');
    });
    return liquidacionDesdeLineas(lineas);
  }

  /* ---------- Ticket de Prosegur ---------- */
  function leerTicket(texto) {
    var t = texto.replace(/\r/g, '');
    var res = { fecha: null, hora: null, op: null, billetes: null, sobre: null, total: null };
    var mf = /(\d{2})\/(\d{2})\/(\d{4})\s*,?\s*(\d{1,2}:\d{2})?/.exec(t);
    if (mf) { res.fecha = mf[3] + '-' + mf[2] + '-' + mf[1]; res.hora = mf[4] || null; }
    var mo = /Op\.?\s*N[uú]m[^:\d]*:?\s*(\d{2,})/i.exec(t);
    if (mo) res.op = mo[1];
    var mb = /Billetes[^\n]*?(\d+[.,]\d{2})/i.exec(t);
    if (mb) res.billetes = num(mb[1]);
    var lineas = t.split('\n');
    for (var i = 0; i < lineas.length; i++) {
      if (/manualmente|sobre/i.test(lineas[i])) {
        for (var j = i; j < Math.min(lineas.length, i + 6); j++) {
          var ms = /^\s*Total\s+(\d+[.,]\d{2})\s*EUR/i.exec(lineas[j]);
          if (ms) { res.sobre = num(ms[1]); break; }
        }
        if (res.sobre != null) break;
      }
    }
    var mt = /Total\s+de\s+transacci[oóò]n\s*\n?\s*(\d+[.,]\d{2})/i.exec(t);
    if (mt) res.total = num(mt[1]);
    if (res.billetes == null) {
      var mtb = /^\s*Total\s+\d+\s+(\d+[.,]\d{2})\s*EUR/im.exec(t);
      if (mtb) res.billetes = num(mtb[1]);
    }
    if (res.total == null && (res.billetes != null || res.sobre != null)) res.total = r2((res.billetes || 0) + (res.sobre || 0));
    if (res.total != null && res.billetes == null && res.sobre != null) res.billetes = r2(res.total - res.sobre);
    if (res.total != null && res.billetes == null && res.sobre == null) res.billetes = res.total;
    if (res.total != null && res.billetes != null && res.sobre == null && Math.abs(res.total - res.billetes) > 0.004) res.sobre = r2(res.total - res.billetes);
    if (res.sobre == null && res.billetes != null) res.sobre = 0;
    res.cuadra = res.total != null && Math.abs(r2((res.billetes || 0) + (res.sobre || 0)) - res.total) < 0.005;
    return res;
  }

  /* ---------- PDA: "Cobrados a contado" ---------- */
  function importePda(texto) {
    var m = /(\d{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2})\s*€?/.exec(texto.replace(/\s+(?=,)/g, ''));
    return m ? num(m[1]) : null;
  }

  var api = {
    num: num, isoDe: isoDe, tipoDe: tipoDe,
    extractoDesdeFilas: extractoDesdeFilas, extractoDesdeLineas: extractoDesdeLineas,
    liquidacionDesdeLineas: liquidacionDesdeLineas, liquidacionDesdeFilas: liquidacionDesdeFilas,
    leerTicket: leerTicket, importePda: importePda
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Lectores = api;
})(this);
