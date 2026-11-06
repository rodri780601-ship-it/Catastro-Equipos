/* =========================================================
   planilla.js — Formato oficial de la planilla de inventario
   "AAAA_Catastro_Nacional_UIA_Unificado_DD.MM.AAAA.xlsx"
   Hoja RESUMEN con fórmulas + una hoja por región, con las
   mismas 13 columnas, estilos, anchos, filtros y paneles.
   ========================================================= */
'use strict';

const Planilla = (function () {
  // Columnas de cada hoja regional (orden y anchos del archivo oficial)
  const COLS = [
    { key: 'rut',            header: 'RUT',                    width: 13 },
    { key: 'nombre',         header: 'NOMBRE DEL TRABAJADOR',  width: 32 },
    { key: 'region',         header: 'REGION',                 width: 20 },
    { key: 'oficina',        header: 'OFICINA',                width: 30 },
    { key: 'marca',          header: 'MARCA PC',               width: 11 },
    { key: 'modelo',         header: 'MODELO PC',              width: 20 },
    { key: 'formato',        header: 'FORMATO',                width: 10 },
    { key: 'serie',          header: 'NUMERO DE SERIE',        width: 26 },
    { key: 'propiedad',      header: 'PROPIEDAD',              width: 12 },
    { key: 'proveedor',      header: 'PROVEEDOR (ARRIENDO)',   width: 18 },
    { key: 'fechaArriendo',  header: 'FECHA ARRIENDO',         width: 14 },
    { key: 'pantallaModelo', header: 'PANTALLA MODELO',        width: 18 },
    { key: 'pantallaSerie',  header: 'PANTALLA (N°Serie)',     width: 28 }
  ];

  // Nombre de hoja y nombre de región (en mayúsculas, como en la columna REGION)
  const HOJAS = {
    OC:   { hoja: 'PC OC',         nombre: 'OFICINA CENTRAL' },
    XV:   { hoja: 'Arica',         nombre: 'ARICA Y PARINACOTA' },
    I:    { hoja: 'Tarapaca',      nombre: 'TARAPACÁ' },
    II:   { hoja: 'Antofagasta',   nombre: 'ANTOFAGASTA' },
    III:  { hoja: 'Atacama',       nombre: 'ATACAMA' },
    IV:   { hoja: 'Coquimbo',      nombre: 'COQUIMBO' },
    V:    { hoja: 'Valparaiso',    nombre: 'VALPARAÍSO' },
    RM:   { hoja: 'Metropolitana', nombre: 'METROPOLITANA' },
    VI:   { hoja: 'OHiggins',      nombre: "O'HIGGINS" },
    VII:  { hoja: 'Maule',         nombre: 'MAULE' },
    XVI:  { hoja: 'Ñuble',         nombre: 'ÑUBLE' },
    VIII: { hoja: 'Bio Bio',       nombre: 'BIOBÍO' },
    IX:   { hoja: 'Araucania',     nombre: 'LA ARAUCANÍA' },
    XIV:  { hoja: 'Los Rios',      nombre: 'LOS RÍOS' },
    X:    { hoja: 'Los Lagos',     nombre: 'LOS LAGOS' },
    XI:   { hoja: 'Aysen',         nombre: 'AYSÉN' },
    XII:  { hoja: 'Magallanes',    nombre: 'MAGALLANES' }
  };
  const ORDEN = ['OC', 'XV', 'I', 'II', 'III', 'IV', 'V', 'RM', 'VI', 'VII', 'XVI', 'VIII', 'IX', 'XIV', 'X', 'XI', 'XII'];
  const titulo = code => code === 'OC' ? 'Catastro de equipos OFICINA CENTRAL' : 'Catastro de equipos Región: ' + HOJAS[code].nombre;

  // Estilos del archivo oficial (índices: 1 título resumen, 2 encabezado resumen, 3 celda con borde,
  // 4 "TOTAL", 5 total con borde, 6 título de hoja, 7 encabezado de hoja, 8 fecha dd-mm-aaaa)
  const STYLES = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="3"><numFmt numFmtId="164" formatCode="General"/><numFmt numFmtId="165" formatCode="General"/><numFmt numFmtId="166" formatCode="dd\\-mm\\-yyyy"/></numFmts><fonts count="8"><font><sz val="11"/><color theme="1"/><name val="Calibri"/><family val="2"/><charset val="1"/></font><font><sz val="10"/><name val="Arial"/><family val="0"/></font><font><sz val="10"/><name val="Arial"/><family val="0"/></font><font><sz val="10"/><name val="Arial"/><family val="0"/></font><font><b val="true"/><sz val="12"/><name val="Arial"/><family val="0"/><charset val="1"/></font><font><b val="true"/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Arial"/><family val="0"/><charset val="1"/></font><font><sz val="10"/><name val="Arial"/><family val="0"/><charset val="1"/></font><font><b val="true"/><sz val="10"/><name val="Arial"/><family val="0"/><charset val="1"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF1F4E78"/><bgColor rgb="FF003366"/></patternFill></fill></fills><borders count="2"><border diagonalUp="false" diagonalDown="false"><left/><right/><top/><bottom/><diagonal/></border><border diagonalUp="false" diagonalDown="false"><left style="thin"><color rgb="FFBFBFBF"/></left><right style="thin"><color rgb="FFBFBFBF"/></right><top style="thin"><color rgb="FFBFBFBF"/></top><bottom style="thin"><color rgb="FFBFBFBF"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="164" fontId="0" fillId="0" borderId="0" applyFont="true" applyBorder="true" applyAlignment="true" applyProtection="true"><alignment horizontal="general" vertical="bottom" textRotation="0" wrapText="false" indent="0" shrinkToFit="false"/><protection locked="true" hidden="false"/></xf></cellStyleXfs><cellXfs count="9">' +
    '<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyFont="false" applyBorder="false" applyAlignment="false" applyProtection="false"><alignment horizontal="general" vertical="bottom" textRotation="0" wrapText="false" indent="0" shrinkToFit="false"/><protection locked="true" hidden="false"/></xf>' +
    '<xf numFmtId="164" fontId="4" fillId="0" borderId="0" xfId="0" applyFont="true" applyBorder="false" applyAlignment="false" applyProtection="false"><alignment horizontal="general" vertical="bottom" textRotation="0" wrapText="false" indent="0" shrinkToFit="false"/><protection locked="true" hidden="false"/></xf>' +
    '<xf numFmtId="164" fontId="5" fillId="2" borderId="0" xfId="0" applyFont="true" applyBorder="false" applyAlignment="true" applyProtection="false"><alignment horizontal="center" vertical="bottom" textRotation="0" wrapText="false" indent="0" shrinkToFit="false"/><protection locked="true" hidden="false"/></xf>' +
    '<xf numFmtId="164" fontId="6" fillId="0" borderId="1" xfId="0" applyFont="true" applyBorder="true" applyAlignment="false" applyProtection="false"><alignment horizontal="general" vertical="bottom" textRotation="0" wrapText="false" indent="0" shrinkToFit="false"/><protection locked="true" hidden="false"/></xf>' +
    '<xf numFmtId="164" fontId="7" fillId="0" borderId="0" xfId="0" applyFont="true" applyBorder="false" applyAlignment="false" applyProtection="false"><alignment horizontal="general" vertical="bottom" textRotation="0" wrapText="false" indent="0" shrinkToFit="false"/><protection locked="true" hidden="false"/></xf>' +
    '<xf numFmtId="165" fontId="7" fillId="0" borderId="1" xfId="0" applyFont="true" applyBorder="true" applyAlignment="false" applyProtection="false"><alignment horizontal="general" vertical="bottom" textRotation="0" wrapText="false" indent="0" shrinkToFit="false"/><protection locked="true" hidden="false"/></xf>' +
    '<xf numFmtId="164" fontId="4" fillId="0" borderId="0" xfId="0" applyFont="true" applyBorder="true" applyAlignment="false" applyProtection="false"><alignment horizontal="general" vertical="bottom" textRotation="0" wrapText="false" indent="0" shrinkToFit="false"/><protection locked="true" hidden="false"/></xf>' +
    '<xf numFmtId="164" fontId="5" fillId="2" borderId="1" xfId="0" applyFont="true" applyBorder="true" applyAlignment="true" applyProtection="false"><alignment horizontal="center" vertical="center" textRotation="0" wrapText="true" indent="0" shrinkToFit="false"/><protection locked="true" hidden="false"/></xf>' +
    '<xf numFmtId="166" fontId="6" fillId="0" borderId="1" xfId="0" applyFont="true" applyBorder="true" applyAlignment="false" applyProtection="false"><alignment horizontal="general" vertical="bottom" textRotation="0" wrapText="false" indent="0" shrinkToFit="false"/><protection locked="true" hidden="false"/></xf>' +
    '</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';

  // Tema de colores estándar (el mismo del archivo oficial)
  const THEME = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\n<a:theme xmlns:a=\"http://schemas.openxmlformats.org/drawingml/2006/main\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\" name=\"Office Theme\"><a:themeElements><a:clrScheme name=\"Office\"><a:dk1><a:srgbClr val=\"000000\"/></a:dk1><a:lt1><a:srgbClr val=\"ffffff\"/></a:lt1><a:dk2><a:srgbClr val=\"1f497d\"/></a:dk2><a:lt2><a:srgbClr val=\"eeece1\"/></a:lt2><a:accent1><a:srgbClr val=\"4f81bd\"/></a:accent1><a:accent2><a:srgbClr val=\"c0504d\"/></a:accent2><a:accent3><a:srgbClr val=\"9bbb59\"/></a:accent3><a:accent4><a:srgbClr val=\"8064a2\"/></a:accent4><a:accent5><a:srgbClr val=\"4bacc6\"/></a:accent5><a:accent6><a:srgbClr val=\"f79646\"/></a:accent6><a:hlink><a:srgbClr val=\"0000ff\"/></a:hlink><a:folHlink><a:srgbClr val=\"800080\"/></a:folHlink></a:clrScheme><a:fontScheme name=\"Office\"><a:majorFont><a:latin typeface=\"Cambria\" pitchFamily=\"0\" charset=\"1\"/><a:ea typeface=\"\"/><a:cs typeface=\"\"/></a:majorFont><a:minorFont><a:latin typeface=\"Calibri\" pitchFamily=\"0\" charset=\"1\"/><a:ea typeface=\"\"/><a:cs typeface=\"\"/></a:minorFont></a:fontScheme><a:fmtScheme><a:fillStyleLst><a:solidFill><a:schemeClr val=\"phClr\"></a:schemeClr></a:solidFill><a:gradFill><a:gsLst><a:gs pos=\"0\"><a:schemeClr val=\"phClr\"><a:tint val=\"50000\"/></a:schemeClr></a:gs><a:gs pos=\"35000\"><a:schemeClr val=\"phClr\"><a:tint val=\"37000\"/></a:schemeClr></a:gs><a:gs pos=\"100000\"><a:schemeClr val=\"phClr\"><a:tint val=\"15000\"/></a:schemeClr></a:gs></a:gsLst><a:lin ang=\"16200000\" scaled=\"1\"/><a:tileRect l=\"0\" t=\"0\" r=\"0\" b=\"0\"/></a:gradFill><a:gradFill><a:gsLst><a:gs pos=\"0\"><a:schemeClr val=\"phClr\"><a:shade val=\"51000\"/></a:schemeClr></a:gs><a:gs pos=\"80000\"><a:schemeClr val=\"phClr\"><a:shade val=\"93000\"/></a:schemeClr></a:gs><a:gs pos=\"100000\"><a:schemeClr val=\"phClr\"><a:shade val=\"94000\"/></a:schemeClr></a:gs></a:gsLst><a:lin ang=\"16200000\" scaled=\"0\"/><a:tileRect l=\"0\" t=\"0\" r=\"0\" b=\"0\"/></a:gradFill></a:fillStyleLst><a:lnStyleLst><a:ln w=\"9525\" cap=\"flat\" cmpd=\"sng\" algn=\"ctr\"><a:prstDash val=\"solid\"/></a:ln><a:ln w=\"25400\" cap=\"flat\" cmpd=\"sng\" algn=\"ctr\"><a:prstDash val=\"solid\"/></a:ln><a:ln w=\"38100\" cap=\"flat\" cmpd=\"sng\" algn=\"ctr\"><a:prstDash val=\"solid\"/></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val=\"phClr\"></a:schemeClr></a:solidFill><a:gradFill><a:gsLst><a:gs pos=\"0\"><a:schemeClr val=\"phClr\"><a:tint val=\"40000\"/></a:schemeClr></a:gs><a:gs pos=\"40000\"><a:schemeClr val=\"phClr\"><a:tint val=\"45000\"/><a:shade val=\"99000\"/></a:schemeClr></a:gs><a:gs pos=\"100000\"><a:schemeClr val=\"phClr\"><a:shade val=\"20000\"/></a:schemeClr></a:gs></a:gsLst><a:path path=\"circle\"><a:fillToRect l=\"50000\" t=\"-80000\" r=\"50000\" b=\"180000\"/></a:path><a:tileRect l=\"0\" t=\"0\" r=\"0\" b=\"0\"/></a:gradFill><a:gradFill><a:gsLst><a:gs pos=\"0\"><a:schemeClr val=\"phClr\"><a:tint val=\"80000\"/></a:schemeClr></a:gs><a:gs pos=\"100000\"><a:schemeClr val=\"phClr\"><a:shade val=\"30000\"/></a:schemeClr></a:gs></a:gsLst><a:path path=\"circle\"><a:fillToRect l=\"50000\" t=\"50000\" r=\"50000\" b=\"50000\"/></a:path><a:tileRect l=\"0\" t=\"0\" r=\"0\" b=\"0\"/></a:gradFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements></a:theme>";

  const nombreArchivo = (d = new Date()) => {
    const dd = String(d.getDate()).padStart(2, '0'), mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}_Catastro_Nacional_UIA_Unificado_${dd}.${mm}.${d.getFullYear()}.xlsx`;
  };

  const str = v => (v === null || v === undefined) ? '' : String(v);
  const up = s => str(s).trim().toUpperCase();

  /* ---------- Valor de cada celda de un equipo ---------- */
  function celdas(e) {
    return COLS.map((col, c) => {
      if (col.key === 'region') return { c, v: HOJAS[e.region] ? HOJAS[e.region].nombre : str(e.region), s: 3 };
      const v = str(e[col.key]);
      if (col.key === 'fechaArriendo') {
        if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return { c, v, t: 'd', s: 8 };
        if (/^\d{4}$/.test(v) && !e.fechaTxt) return { c, v: Number(v), t: 'n', s: 3 };
      }
      if (col.key === 'serie' && e.serieNum && /^\d{1,15}$/.test(v)) return { c, v: Number(v), t: 'n', s: 3 };
      return { c, v, s: 3 };
    });
  }

  /* ---------- Libro completo ---------- */
  // equipos: registros del sistema (con region = código). Se respetan región y orden de la planilla.
  async function construir(equipos, opts = {}) {
    const porRegion = {};
    ORDEN.forEach(c => { porRegion[c] = []; });
    (equipos || []).forEach(e => { if (porRegion[e.region]) porRegion[e.region].push(e); });
    Object.values(porRegion).forEach(l => l.sort((a, b) => (a.orden || 0) - (b.orden || 0)));

    const hojas = [];
    const resumenFilas = [];
    ORDEN.forEach((code, i) => {
      const lista = porRegion[code];
      const ultima = 2 + lista.length;
      const rows = [
        { r: 1, cells: COLS.map((col, c) => ({ c, v: c === 0 ? titulo(code) : '', s: 6 })) },
        { r: 2, ht: 30, cells: COLS.map((col, c) => ({ c, v: col.header, s: 7 })) }
      ];
      lista.forEach((e, k) => rows.push({ r: 3 + k, cells: celdas(e) }));
      hojas.push({
        name: HOJAS[code].hoja, cols: COLS.map(c => c.width), rows,
        merges: ['A1:M1'], autoFilter: `A2:M${Math.max(ultima, 2)}`, freezeRows: 2
      });
      // Valores calculados del resumen (iguales a los que dan las fórmulas)
      const q = XLSX_LIB.quote(HOJAS[code].hoja), f = Math.max(ultima, 3);
      const total = lista.filter(e => str(e.nombre).trim() !== '' || str(e.serie).trim() !== '').length;
      const cuenta = (key, val) => lista.filter(e => up(e[key]) === val).length;
      const conaf = cuenta('propiedad', 'CONAF'), arr = cuenta('propiedad', 'ARRIENDO');
      const r = 4 + i;
      resumenFilas.push({
        r, cells: [
          { c: 0, v: HOJAS[code].hoja, s: 3 },
          { c: 1, v: HOJAS[code].nombre, s: 3 },
          { c: 2, t: 'f', f: `COUNTA(${q}!B3:B2000)+COUNTIFS(${q}!B3:B${f},"",${q}!H3:H${f},"<>")`, v: total, s: 3 },
          { c: 3, t: 'f', f: `COUNTIF(${q}!I3:I2000,"CONAF")`, v: conaf, s: 3 },
          { c: 4, t: 'f', f: `COUNTIF(${q}!I3:I2000,"ARRIENDO")`, v: arr, s: 3 },
          { c: 5, t: 'f', f: `C${r}-D${r}-E${r}`, v: total - conaf - arr, s: 3 },
          { c: 6, t: 'f', f: `COUNTIF(${q}!G3:G2000,"AIO")`, v: cuenta('formato', 'AIO'), s: 3 },
          { c: 7, t: 'f', f: `COUNTIF(${q}!G3:G2000,"DESKTOP")`, v: cuenta('formato', 'DESKTOP'), s: 3 }
        ]
      });
    });
    const suma = c => resumenFilas.reduce((s, row) => s + row.cells[c].v, 0);
    const L = 'CDEFGH';
    const resumen = {
      name: 'RESUMEN', selected: true, cols: [14, 22, 13, 10, 11, 14, 8, 10],
      rows: [
        { r: 1, cells: [{ c: 0, v: `Catastro Nacional de Computadores ${opts.anio || new Date().getFullYear()} – Resumen`, s: 1 }] },
        { r: 3, cells: ['Hoja', 'Región', 'Total equipos', 'CONAF', 'ARRIENDO', 'Otra propiedad', 'AIO', 'DESKTOP'].map((v, c) => ({ c, v, s: 2 })) },
        ...resumenFilas,
        { r: 21, cells: [{ c: 0, v: 'TOTAL', s: 4 }, ...[2, 3, 4, 5, 6, 7].map(c => ({ c, t: 'f', f: `SUM(${L[c - 2]}4:${L[c - 2]}20)`, v: suma(c), s: 5 }))] }
      ]
    };
    return XLSX_LIB.write({ title: 'Catastro Nacional de Computadores', styles: STYLES, theme: THEME, sheets: [resumen, ...hojas] });
  }

  /* ---------- Lectura (importación) ---------- */
  const normH = s => str(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ]+/g, ' ').trim();
  const SINONIMOS = {
    rut: ['rut', 'rut trabajador', 'rut funcionario', 'run'],
    nombre: ['nombre del trabajador', 'nombre trabajador', 'trabajador', 'nombre', 'funcionario', 'nombre funcionario', 'usuario', 'responsable'],
    region: ['region'],
    oficina: ['oficina', 'ubicacion', 'unidad', 'oficina ubicacion'],
    marca: ['marca pc', 'marca'],
    modelo: ['modelo pc', 'modelo'],
    formato: ['formato', 'tipo', 'tipo de equipo', 'formato pc'],
    serie: ['numero de serie', 'n serie', 'n de serie', 'nro serie', 'nro de serie', 'serie', 'numero serie', 'serial', 'n serie pc'],
    propiedad: ['propiedad'],
    proveedor: ['proveedor arriendo', 'proveedor'],
    fechaArriendo: ['fecha arriendo', 'fecha de arriendo', 'fecha arriendo inicio'],
    pantallaModelo: ['pantalla modelo', 'modelo pantalla', 'monitor modelo', 'modelo monitor'],
    pantallaSerie: ['pantalla n serie', 'pantalla serie', 'pantalla n de serie', 'serie pantalla', 'n serie pantalla', 'monitor serie', 'serie monitor'],
    inventario: ['n inventario', 'n de inventario', 'inventario', 'numero de inventario', 'nro inventario']
  };
  const MAPA = {};
  Object.entries(SINONIMOS).forEach(([k, l]) => l.forEach(h => { MAPA[h] = k; }));

  function mapearEncabezados(fila) {
    const mapa = {}, usados = new Set();
    (fila || []).forEach((h, i) => {
      const k = MAPA[normH(h)];
      if (k && !usados.has(k)) { mapa[i] = k; usados.add(k); }
    });
    return mapa;
  }

  // Códigos de región a partir de un texto (nombre de región, nombre de hoja o código)
  function regionDe(texto) {
    const n = normH(texto);
    if (!n) return null;
    for (const code of ORDEN) {
      const h = HOJAS[code];
      if (n === normH(h.nombre) || n === normH(h.hoja) || n === code.toLowerCase()) return code;
    }
    const extra = {
      'oc': 'OC', 'oficina central': 'OC', 'nivel central': 'OC', 'pc oc': 'OC',
      'arica': 'XV', 'arica y parinacota': 'XV', 'tarapaca': 'I', 'valparaiso': 'V', 'region metropolitana': 'RM', 'rm': 'RM', 'santiago': 'RM',
      'o higgins': 'VI', 'ohiggins': 'VI', 'libertador general bernardo o higgins': 'VI', 'nuble': 'XVI', 'ñuble': 'XVI',
      'biobio': 'VIII', 'bio bio': 'VIII', 'araucania': 'IX', 'la araucania': 'IX', 'los rios': 'XIV', 'aysen': 'XI', 'aisen': 'XI',
      'magallanes y la antartica chilena': 'XII', 'magallanes': 'XII'
    };
    if (extra[n]) return extra[n];
    const sinPref = n.replace(/^(region (de |del |de la |de los )?)/, '');
    if (sinPref !== n) return regionDe(sinPref);
    return null;
  }

  // Convierte el valor leído de una celda al formato que guarda el sistema
  function valorCelda(key, v) {
    if (v === null || v === undefined) return { v: '' };
    if (typeof v === 'object' && v.date) return { v: key === 'fechaArriendo' ? v.date : v.date.split('-').reverse().join('-') };
    if (typeof v === 'number') {
      if (key === 'fechaArriendo') {
        if (Number.isInteger(v) && v >= 1900 && v <= 2200) return { v: String(v) };
        if (v > 20000 && v < 80000) return { v: XLSX_LIB.serialToIso(v) };
      }
      if (key === 'serie') return { v: String(v), num: true };
      return { v: String(v) };
    }
    const t = String(v).trim();
    return key === 'fechaArriendo' && /^\d{4}$/.test(t) ? { v: t, txt: true } : { v: t };
  }

  /**
   * Lee un archivo .xlsx (todas las hojas menos RESUMEN) o .csv.
   * Devuelve { filas: [{ hoja, fila, region, datos: {clave: valor}, serieNum }], hojas: [...], sinEncabezado: [...] }
   */
  function interpretar(hojas) {
    const filas = [], leidas = [], sinEncabezado = [];
    hojas.forEach(h => {
      if (normH(h.name) === 'resumen') return;
      let headerIdx = -1, mapa = null;
      for (let i = 0; i < Math.min(15, h.rows.length); i++) {
        const m = mapearEncabezados(h.rows[i]);
        const ks = Object.values(m);
        if (ks.length >= 3 && (ks.includes('serie') || ks.includes('nombre'))) { headerIdx = i; mapa = m; break; }
      }
      if (headerIdx < 0) { if (h.rows.some(r => r && r.length)) sinEncabezado.push(h.name); return; }
      leidas.push(h.name);
      const regionHoja = regionDe(h.name);
      for (let i = headerIdx + 1; i < h.rows.length; i++) {
        const row = h.rows[i] || [];
        const datos = {};
        let serieNum = false, fechaTxt = false, vacia = true;
        Object.entries(mapa).forEach(([idx, key]) => {
          const r = valorCelda(key, row[idx]);
          datos[key] = r.v;
          if (r.num) serieNum = true;
          if (r.txt) fechaTxt = true;
          if (r.v !== '') vacia = false;
        });
        if (vacia) continue;
        const regionTxt = datos.region;
        filas.push({
          hoja: h.name, fila: i + 1, datos, serieNum, fechaTxt,
          region: regionDe(regionTxt) || regionHoja, regionTexto: regionTxt || ''
        });
      }
    });
    return { filas, hojas: leidas, sinEncabezado };
  }

  return { COLS, HOJAS, ORDEN, STYLES, THEME, titulo, nombreArchivo, construir, interpretar, regionDe, mapearEncabezados, normH };
})();

if (typeof module !== 'undefined') module.exports = Planilla;
