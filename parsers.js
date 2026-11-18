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
  // Tolera los fallos típicos del lector: "Tota1", "Tota)", basura al principio de línea, coma o punto.
  var IMP = '(\\d{1,5}\\s?[.,]\\s?\\d{2})';
  function imp(s) { return num(String(s).replace(/\s/g, '')); }
  function leerTicket(texto) {
    var t = texto.replace(/\r/g, '');
    var lineas = t.split('\n');
    var res = { fecha: null, hora: null, op: null, billetes: null, sobre: null, total: null };
    var mf = /(\d{2})\/(\d{2})\/(\d{4})\s*,?\s*(\d{1,2}:\d{2})?/.exec(t);
    if (mf) { res.fecha = mf[3] + '-' + mf[2] + '-' + mf[1]; res.hora = mf[4] || null; }
    var mo = /Op\.?\s*N[uúü]m[^:\d\n]*:?\s*(\d{1,})/i.exec(t);
    if (mo) res.op = mo[1];

    // Total de la transacción (puede venir en la línea siguiente)
    for (var i = 0; i < lineas.length && res.total == null; i++) {
      if (/transacc/i.test(lineas[i])) {
        var m = new RegExp(IMP).exec(lineas[i].split(/transacc\S*/i)[1] || '');
        if (!m && lineas[i + 1]) m = new RegExp(IMP).exec(lineas[i + 1]);
        if (!m && lineas[i + 2]) m = new RegExp(IMP).exec(lineas[i + 2]);
        if (m) res.total = imp(m[1]);
      }
    }
    // Billetes: línea "Billetes 28 600.00 EUR" o "Total 28 600.00 EUR" (antes del sobre)
    var iManual = -1;
    for (i = 0; i < lineas.length; i++) if (iManual < 0 && /manual|introducid|identificad|sobre:/i.test(lineas[i])) iManual = i;
    var hastaManual = iManual >= 0 ? iManual : lineas.length;
    for (i = 0; i < hastaManual && res.billetes == null; i++) {
      if (/b[il1|!]{1,2}[l1|i]?[e3]t[e3]s/i.test(lineas[i])) { var mb = new RegExp(IMP + '\\s*E', 'i').exec(lineas[i]) || new RegExp(IMP).exec(lineas[i]); if (mb) res.billetes = imp(mb[1]); }
    }
    for (i = 0; i < hastaManual && res.billetes == null; i++) {
      var mtb = new RegExp('Tota[l1I|)]\\s+\\d{1,3}\\s+' + IMP, 'i').exec(lineas[i]);
      if (mtb) res.billetes = imp(mtb[1]);
    }
    if (res.billetes == null) {
      // Suma de las líneas "50.00 X 7 350.00 EUR"
      var suma = 0, hay = false;
      for (i = 0; i < hastaManual; i++) {
        var md = new RegExp('\\d+[.,]\\d{2}\\s*[xX×]\\s*\\d+\\S*\\s+' + IMP).exec(lineas[i]);
        if (md) { suma += imp(md[1]); hay = true; }
      }
      if (hay) res.billetes = r2(suma);
    }
    // Sobre (efectivo introducido manualmente): primer importe tras esa línea que no sea el total de la transacción
    if (iManual >= 0) {
      for (i = iManual; i < Math.min(lineas.length, iManual + 7); i++) {
        if (/transacc/i.test(lineas[i])) break;
        if (/identificad|introducid/i.test(lineas[i])) continue;
        var ms = new RegExp(IMP + '\\s*E', 'i').exec(lineas[i]) || (/tota/i.test(lineas[i]) && new RegExp(IMP).exec(lineas[i]));
        if (ms) { res.sobre = imp(ms[1]); break; }
      }
    }
    // Cuadrar las tres cifras: si una falta o no encaja, se deduce de las otras dos
    var B = res.billetes, S = res.sobre, T = res.total;
    if (T != null && B != null && S != null && Math.abs(r2(B + S) - T) > 0.004) {
      if (B <= T) S = r2(T - B);
    }
    if (T != null && B != null && S == null) S = Math.abs(T - B) > 0.004 && B < T ? r2(T - B) : 0;
    if (T != null && B == null && S != null) B = r2(T - S);
    if (T == null && B != null) T = r2(B + (S || 0));
    if (T != null && B == null && S == null) { B = T; S = 0; }
    if (S == null && B != null) S = 0;
    res.billetes = B; res.sobre = S; res.total = T;
    res.cuadra = T != null && Math.abs(r2((B || 0) + (S || 0)) - T) < 0.005;
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
