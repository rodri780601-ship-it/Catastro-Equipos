/* =========================================================
   xlsx.js — Lectura y escritura de archivos Excel (.xlsx)
   Sin librerías externas: funciona sin conexión a internet.
   - Zip: compresión con CompressionStream (si el navegador la ofrece)
   - Escritura: estilos, celdas combinadas, filtros, paneles
     inmovilizados, fórmulas con su valor calculado y fechas.
   - Lectura: todas las hojas, textos compartidos, números y fechas.
   ========================================================= */
'use strict';

const XLSX_LIB = (function () {
  const enc = new TextEncoder();
  const dec = new TextDecoder('utf-8');

  /* ---------------- CRC32 ---------------- */
  const CRC_TABLE = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })();
  function crc32(bytes) {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  /* ---------------- Compresión ---------------- */
  async function streamThrough(bytes, stream) {
    const out = new Blob([bytes]).stream().pipeThrough(stream);
    return new Uint8Array(await new Response(out).arrayBuffer());
  }
  const canCompress = typeof CompressionStream !== 'undefined';
  const canDecompress = typeof DecompressionStream !== 'undefined';
  async function deflate(bytes) { return streamThrough(bytes, new CompressionStream('deflate-raw')); }
  async function inflate(bytes) { return streamThrough(bytes, new DecompressionStream('deflate-raw')); }

  /* ---------------- ZIP: escritura ---------------- */
  async function zip(files) {
    const now = new Date();
    const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2);
    const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
    const parts = [], central = [];
    let offset = 0;
    for (const f of files) {
      const name = enc.encode(f.name);
      const raw = typeof f.data === 'string' ? enc.encode(f.data) : f.data;
      const crc = crc32(raw);
      let data = raw, method = 0;
      if (canCompress && raw.length > 64) {
        try { const z = await deflate(raw); if (z.length < raw.length) { data = z; method = 8; } } catch (e) { /* se guarda sin comprimir */ }
      }
      const lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true);
      lh.setUint16(8, method, true); lh.setUint16(10, dosTime, true); lh.setUint16(12, dosDate, true);
      lh.setUint32(14, crc, true); lh.setUint32(18, data.length, true); lh.setUint32(22, raw.length, true);
      lh.setUint16(26, name.length, true); lh.setUint16(28, 0, true);
      parts.push(new Uint8Array(lh.buffer), name, data);
      const ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true);
      ch.setUint16(10, method, true); ch.setUint16(12, dosTime, true); ch.setUint16(14, dosDate, true);
      ch.setUint32(16, crc, true); ch.setUint32(20, data.length, true); ch.setUint32(24, raw.length, true);
      ch.setUint16(28, name.length, true); ch.setUint32(42, offset, true);
      central.push(new Uint8Array(ch.buffer), name);
      offset += 30 + name.length + data.length;
    }
    const cdSize = central.reduce((s, p) => s + p.length, 0);
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
    end.setUint32(12, cdSize, true); end.setUint32(16, offset, true);
    return new Blob([...parts, ...central, new Uint8Array(end.buffer)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  /* ---------------- ZIP: lectura ---------------- */
  async function unzip(buffer) {
    const u8 = new Uint8Array(buffer), dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
    let eocd = -1;
    for (let i = u8.length - 22; i >= Math.max(0, u8.length - 65557); i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    if (eocd < 0) throw new Error('zip');
    const count = dv.getUint16(eocd + 10, true);
    let p = dv.getUint32(eocd + 16, true);
    const entries = {};
    for (let i = 0; i < count; i++) {
      if (dv.getUint32(p, true) !== 0x02014b50) throw new Error('zip');
      const method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true);
      const nlen = dv.getUint16(p + 28, true), xlen = dv.getUint16(p + 30, true), clen = dv.getUint16(p + 32, true);
      const lho = dv.getUint32(p + 42, true);
      const name = dec.decode(u8.subarray(p + 46, p + 46 + nlen));
      entries[name] = { method, csize, lho };
      p += 46 + nlen + xlen + clen;
    }
    return {
      names: Object.keys(entries),
      async read(name) {
        const e = entries[name] || entries[Object.keys(entries).find(k => k.toLowerCase() === String(name).toLowerCase())];
        if (!e) return null;
        const start = e.lho + 30 + dv.getUint16(e.lho + 26, true) + dv.getUint16(e.lho + 28, true);
        const data = u8.subarray(start, start + e.csize);
        if (e.method === 0) return dec.decode(data);
        if (e.method === 8) {
          if (!canDecompress) throw new Error('nodecompress');
          return dec.decode(await inflate(data));
        }
        throw new Error('zip');
      }
    };
  }

  /* ---------------- Utilidades XML ---------------- */
  const xmlEsc = s => String(s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const xmlUnesc = s => String(s).replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (m, e) => {
    const k = e.toLowerCase();
    if (k === 'amp') return '&'; if (k === 'lt') return '<'; if (k === 'gt') return '>'; if (k === 'quot') return '"'; if (k === 'apos') return "'";
    return String.fromCodePoint(k[1] === 'x' ? parseInt(k.slice(2), 16) : parseInt(k.slice(1), 10));
  });
  const attr = (tag, name) => { const m = new RegExp('\\s' + name + '="([^"]*)"').exec(tag); return m ? xmlUnesc(m[1]) : null; };
  const colLetter = n => { let s = ''; n++; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; };
  const colIndex = letters => { let n = 0; for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64); return n - 1; };

  // Fechas: número de serie de Excel (sistema 1900) <-> 'AAAA-MM-DD'
  const EPOCH = Date.UTC(1899, 11, 30);
  const isoToSerial = iso => { const [y, m, d] = iso.split('-').map(Number); return Math.round((Date.UTC(y, m - 1, d) - EPOCH) / 86400000); };
  const serialToIso = n => new Date(EPOCH + Math.round(n * 86400000)).toISOString().slice(0, 10);

  /* =========================================================
     Escritura de libros
     book = { sheets: [{ name, cols: [ancho…], rows: [{ r, ht, cells: [{ c, v, t, s, f }] }],
                         merges: ['A1:M1'], autoFilter: 'A2:M10', freezeRows: 2, selected: true }],
              styles: '<styleSheet …>' }
     Tipos de celda: 's' texto · 'n' número · 'd' fecha ISO · 'f' fórmula (v = valor calculado)
     ========================================================= */
  async function write(book) {
    const sst = [], sstIndex = new Map();
    let sstCount = 0;
    const str = v => { v = String(v); sstCount++; if (!sstIndex.has(v)) { sstIndex.set(v, sst.length); sst.push(v); } return sstIndex.get(v); };

    const sheetXml = sh => {
      let last = { r: 1, c: 0 };
      const rowsXml = sh.rows.map(row => {
        const cells = row.cells.map(cell => {
          const ref = colLetter(cell.c) + row.r;
          if (row.r >= last.r) last.r = row.r;
          if (cell.c > last.c) last.c = cell.c;
          const s = cell.s != null ? ` s="${cell.s}"` : '';
          const v = cell.v;
          if (cell.t === 'f') return `<c r="${ref}"${s} t="n"><f>${xmlEsc(cell.f)}</f><v>${Number(v) || 0}</v></c>`;
          if (v === null || v === undefined || v === '') return `<c r="${ref}"${s}/>`;
          if (cell.t === 'n') return `<c r="${ref}"${s} t="n"><v>${Number(v)}</v></c>`;
          if (cell.t === 'd') return `<c r="${ref}"${s} t="n"><v>${isoToSerial(v)}</v></c>`;
          return `<c r="${ref}"${s} t="s"><v>${str(v)}</v></c>`;
        }).join('');
        const ht = row.ht ? ` ht="${row.ht}" customHeight="1"` : '';
        return `<row r="${row.r}"${ht}>${cells}</row>`;
      }).join('');
      const pane = sh.freezeRows
        ? `<pane xSplit="0" ySplit="${sh.freezeRows}" topLeftCell="A${sh.freezeRows + 1}" activePane="bottomLeft" state="frozen"/><selection pane="topLeft" activeCell="A1" sqref="A1"/><selection pane="bottomLeft" activeCell="A1" sqref="A1"/>`
        : '<selection activeCell="A1" sqref="A1"/>';
      const cols = sh.cols && sh.cols.length ? `<cols>${sh.cols.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols>` : '';
      return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
        '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
        `<sheetPr filterMode="false"><pageSetUpPr fitToPage="false"/></sheetPr><dimension ref="A1:${colLetter(last.c)}${last.r}"/>` +
        `<sheetViews><sheetView${sh.selected ? ' tabSelected="1"' : ''} zoomScale="100" zoomScaleNormal="100" workbookViewId="0">${pane}</sheetView></sheetViews>` +
        '<sheetFormatPr defaultColWidth="8.6796875" defaultRowHeight="15"/>' + cols +
        `<sheetData>${rowsXml}</sheetData>` +
        (sh.autoFilter ? `<autoFilter ref="${sh.autoFilter}"/>` : '') +
        (sh.merges && sh.merges.length ? `<mergeCells count="${sh.merges.length}">${sh.merges.map(m => `<mergeCell ref="${m}"/>`).join('')}</mergeCells>` : '') +
        '<pageMargins left="0.75" right="0.75" top="1" bottom="1" header="0.511811023622047" footer="0.511811023622047"/>' +
        '<pageSetup paperSize="9" orientation="portrait"/></worksheet>';
    };

    const sheetsXml = book.sheets.map(sheetXml);
    const quote = n => /^[\p{L}_][\p{L}\p{N}_.]*$/u.test(n) ? n : `'${n.replace(/'/g, "''")}'`;
    const absRef = ref => ref.replace(/([A-Z]+)(\d+)/g, '$$$1$$$2');
    const definedNames = book.sheets.map((sh, i) => sh.autoFilter
      ? `<definedName name="_xlnm._FilterDatabase" localSheetId="${i}" hidden="1">${xmlEsc(quote(sh.name))}!${absRef(sh.autoFilter)}</definedName>` : '').join('');
    const files = [
      { name: '[Content_Types].xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>' +
        (book.theme ? '<Override PartName="/xl/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>' : '') +
        book.sheets.map((s, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('') +
        '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>' },
      { name: '_rels/.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>' },
      { name: 'docProps/app.xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Catastro de Equipos CONAF</Application></Properties>' },
      { name: 'docProps/core.xml', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${xmlEsc(book.title || '')}</dc:title><dc:creator>Catastro de Equipos CONAF</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString().slice(0, 19)}Z</dcterms:created></cp:coreProperties>` },
      { name: 'xl/workbook.xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><workbookPr date1904="false"/><bookViews><workbookView activeTab="0"/></bookViews><sheets>' +
        book.sheets.map((s, i) => `<sheet name="${xmlEsc(s.name)}" sheetId="${i + 1}" r:id="rId${i + 3}"/>`).join('') + '</sheets>' +
        (definedNames ? `<definedNames>${definedNames}</definedNames>` : '') + '<calcPr fullCalcOnLoad="1"/></workbook>' },
      { name: 'xl/_rels/workbook.xml.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>' +
        book.sheets.map((s, i) => `<Relationship Id="rId${i + 3}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('') +
        (book.theme ? `<Relationship Id="rId${book.sheets.length + 3}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>` : '') + '</Relationships>' },
      { name: 'xl/styles.xml', data: book.styles },
      ...sheetsXml.map((x, i) => ({ name: `xl/worksheets/sheet${i + 1}.xml`, data: x }))
    ];
    if (book.theme) files.push({ name: 'xl/theme/theme1.xml', data: book.theme });
    // Los textos compartidos se generan después de las hojas (ahí se registran)
    files.splice(7, 0, {
      name: 'xl/sharedStrings.xml',
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${sstCount}" uniqueCount="${sst.length}">` +
        sst.map(s => `<si><t${/^\s|\s$|\n/.test(s) ? ' xml:space="preserve"' : ''}>${xmlEsc(s)}</t></si>`).join('') + '</sst>'
    });
    return zip(files);
  }

  /* =========================================================
     Lectura de libros
     Devuelve [{ name, rows: [[valor, …], …] }] — valores: texto, número o { date: 'AAAA-MM-DD' }
     ========================================================= */
  const DATE_IDS = new Set([14, 15, 16, 17, 18, 19, 20, 21, 22, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 45, 46, 47, 50, 51, 52, 53, 54, 55, 56, 57, 58]);
  const isDateCode = code => {
    const c = String(code).replace(/"[^"]*"/g, '').replace(/\[[^\]]*\]/g, '').replace(/\\./g, '').toLowerCase();
    return !/general/.test(c) && /[dmy]/.test(c) && !/^[#0.,%\s]*$/.test(c);
  };
  const tagRe = name => new RegExp(`<(?:\\w+:)?${name}\\b[^>]*?(?:/>|>([\\s\\S]*?)</(?:\\w+:)?${name}>)`, 'g');
  const textOf = xml => { let s = ''; xml.replace(/<(?:\w+:)?t\b[^>]*?(?:\/>|>([\s\S]*?)<\/(?:\w+:)?t>)/g, (m, t) => { s += t ? xmlUnesc(t) : ''; return m; }); return s; };

  async function read(buffer) {
    const z = await unzip(buffer);
    const wbXml = await z.read('xl/workbook.xml');
    if (!wbXml) throw new Error('noxlsx');
    const relsXml = (await z.read('xl/_rels/workbook.xml.rels')) || '';
    const rels = {};
    relsXml.replace(/<(?:\w+:)?Relationship\b[^>]*>/g, t => { rels[attr(t, 'Id')] = attr(t, 'Target'); return t; });
    // Textos compartidos
    const sst = [];
    const sstXml = await z.read('xl/sharedStrings.xml');
    if (sstXml) sstXml.replace(tagRe('si'), (m, inner) => { sst.push(inner ? textOf(inner) : ''); return m; });
    // Estilos con formato de fecha
    const dateStyles = new Set();
    const stXml = await z.read('xl/styles.xml');
    if (stXml) {
      const custom = {};
      stXml.replace(/<(?:\w+:)?numFmt\b[^>]*>/g, t => { custom[attr(t, 'numFmtId')] = attr(t, 'formatCode'); return t; });
      const xfs = /<(?:\w+:)?cellXfs\b[^>]*>([\s\S]*?)<\/(?:\w+:)?cellXfs>/.exec(stXml);
      if (xfs) {
        let i = 0;
        xfs[1].replace(/<(?:\w+:)?xf\b[^>]*>/g, t => {
          const id = Number(attr(t, 'numFmtId') || 0);
          if (DATE_IDS.has(id) || (custom[id] && isDateCode(custom[id]))) dateStyles.add(i);
          i++; return t;
        });
      }
    }
    const sheets = [];
    const sheetTags = wbXml.match(/<(?:\w+:)?sheet\b[^>]*>/g) || [];
    for (const t of sheetTags) {
      const name = attr(t, 'name');
      const rid = attr(t, 'r:id') || attr(t, 'id');
      let target = rels[rid] || '';
      target = target.startsWith('/') ? target.slice(1) : 'xl/' + target.replace(/^\.\//, '');
      const xml = await z.read(target);
      if (!xml) continue;
      const rows = [];
      const data = /<(?:\w+:)?sheetData\b[^>]*>([\s\S]*?)<\/(?:\w+:)?sheetData>/.exec(xml);
      if (data) {
        let rowIdx = -1;
        data[1].replace(tagRe('row'), (m, inner) => {
          const rAttr = attr(m.slice(0, m.indexOf('>') + 1), 'r');
          rowIdx = rAttr ? Number(rAttr) - 1 : rowIdx + 1;
          const row = [];
          let colIdx = -1;
          (inner || '').replace(tagRe('c'), (cm, cin) => {
            const open = cm.slice(0, cm.indexOf('>') + 1);
            const ref = attr(open, 'r');
            colIdx = ref ? colIndex(ref.replace(/\d+/g, '')) : colIdx + 1;
            const t = attr(open, 't'), s = Number(attr(open, 's') || 0);
            const vm = cin ? /<(?:\w+:)?v\b[^>]*>([\s\S]*?)<\/(?:\w+:)?v>/.exec(cin) : null;
            const raw = vm ? xmlUnesc(vm[1]) : null;
            let val = null;
            if (t === 's') val = raw != null ? sst[Number(raw)] : null;
            else if (t === 'inlineStr') val = cin ? textOf(cin) : null;
            else if (t === 'str' || t === 'e') val = raw;
            else if (t === 'b') val = raw === '1' ? 'VERDADERO' : 'FALSO';
            else if (raw != null && raw !== '') {
              const num = Number(raw);
              val = dateStyles.has(s) && isFinite(num) ? { date: serialToIso(num) } : num;
            }
            if (val !== null && val !== '') row[colIdx] = val;
            return cm;
          });
          rows[rowIdx] = row;
          return m;
        });
      }
      for (let i = 0; i < rows.length; i++) if (!rows[i]) rows[i] = [];
      sheets.push({ name, rows });
    }
    return sheets;
  }

  return { write, read, quote: n => /^[\p{L}_][\p{L}\p{N}_.]*$/u.test(n) ? n : `'${n.replace(/'/g, "''")}'`, zip, unzip, crc32, colLetter, colIndex, isoToSerial, serialToIso };
})();

if (typeof module !== 'undefined') module.exports = XLSX_LIB;
