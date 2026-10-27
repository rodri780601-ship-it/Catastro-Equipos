/* =========================================================
   app.js — Interfaz y lógica del Catastro de Equipos
   ========================================================= */
(function () {
  'use strict';

  /* =====================================================
     Utilidades
     ===================================================== */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const fmtDate = s => { if (!s) return '—'; const [y, m, d] = String(s).slice(0, 10).split('-'); return d && m ? `${d}-${m}-${y}` : s; };
  const fmtDateTime = s => s ? fmtDate(s) + ' ' + String(s).slice(11, 16) : '—';
  const nowStamp = () => { const d = new Date(); return isoDate(d) + 'T' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') + ':' + String(d.getSeconds()).padStart(2, '0'); };
  const regionName = c => (REGIONES.find(r => r.code === c) || {}).name || (c ? c : '—');
  const initials = n => String(n || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const plural = (n, s, p) => `${n.toLocaleString('es-CL')} ${n === 1 ? s : (p || s + 's')}`;

  const I = (name) => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ''}</svg>`;
  const ICONS = {
    dashboard: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
    laptop: '<rect x="4" y="4" width="16" height="11" rx="1.5"/><path d="M2 19h20"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7"/><path d="M18.5 14a6.5 6.5 0 0 1 3 6"/>',
    file: '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h6"/>',
    history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/>',
    shield: '<path d="M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6z"/><circle cx="12" cy="11" r="2.5"/><path d="M8.5 16.5a4 4 0 0 1 7 0"/>',
    database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    upload: '<path d="M12 15V3"/><path d="m7 8 5-5 5 5"/><path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/>',
    download: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    edit: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
    assign: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="m16 11 2 2 4-4"/>',
    undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>',
    wrench: '<path d="M14.7 6.3a4 4 0 0 0 5 5L21 13l-8 8-2-2 6.3-6.3"/><path d="M14.7 6.3 9 12 3 6l2-2a4 4 0 0 1 5.7 0z"/>',
    trash: '<path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 13h10l1-13"/><path d="M9 7V4h6v3"/>',
    printer: '<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="1.5"/><path d="M7 14h10v7H7z"/>',
    alert: '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17.5v.01"/>',
    check: '<path d="m5 12 5 5 9-10"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    left: '<path d="m15 18-6-6 6-6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3"/>',
    refresh: '<path d="M20 12a8 8 0 0 1-14.3 5"/><path d="M4 12a8 8 0 0 1 14.3-5"/><path d="M18 3v4h-4M6 21v-4h4"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    power: '<path d="M12 3v9"/><path d="M6.3 6.3a8 8 0 1 0 11.4 0"/>'
  };

  const D = () => Store.data;
  const persona = id => D().personas.find(p => p.id === id);
  const contrato = id => D().contratos.find(c => c.id === id);
  const equipo = id => D().equipos.find(e => e.id === id);

  let me = null;
  const isAdmin = () => !!me && me.role === 'admin';
  const inScope = o => isAdmin() || (o && o.region === me.region);

  function save() {
    if (!Store.save()) toast('No fue posible guardar: el almacenamiento del navegador está lleno o bloqueado.', 'error');
  }

  function log(eq, tipo, detalle) {
    D().movimientos.push({
      id: Store.uid('m'), fecha: nowStamp(), equipoId: eq.id, inventario: eq.inventario,
      region: eq.region, tipo, detalle, usuario: me ? me.name : 'Sistema'
    });
    eq.actualizado = nowStamp();
  }

  /* ---------- Badges ---------- */
  function estadoBadge(e) {
    const map = { 'Asignado': 'b-ok', 'Disponible': 'b-info', 'En reparación': 'b-warn', 'De baja': 'b-neutral' };
    return `<span class="badge ${map[e.estado] || 'b-neutral'}"><span class="dot"></span>${esc(e.estado)}</span>` +
      (e.solicitudBaja ? ` <span class="badge b-danger" title="Solicitud de baja pendiente">Baja solicitada</span>` : '');
  }
  const propBadge = e => e.propiedad === 'Arrendado' ? `<span class="badge b-lease">Arrendado</span>` : `<span class="badge b-own">Propio</span>`;

  function contratoStatus(c) {
    const left = daysBetween(todayISO(), c.fechaTermino);
    if (left < 0) return { cls: 'b-danger', label: `Vencido hace ${plural(-left, 'día')}`, left };
    if (left <= 90) return { cls: 'b-warn', label: `Vence en ${plural(left, 'día')}`, left };
    return { cls: 'b-ok', label: `Vigente · ${plural(left, 'día')}`, left };
  }

  /* ---------- Toast ---------- */
  function toast(msg, type = 'ok') {
    const el = document.createElement('div');
    el.className = 'toast ' + type;
    el.textContent = msg;
    $('#toast-root').appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; }, 3200);
    setTimeout(() => el.remove(), 3600);
  }

  /* ---------- Modal ---------- */
  let modalOnClose = null;
  function openModal({ title, body, size = '', submitLabel = 'Guardar', submitClass = 'primary', footer, onSubmit, onOpen, onClose }) {
    const root = $('#modal-root');
    root.innerHTML = `
      <div class="modal-backdrop">
        <form class="modal ${size}" novalidate role="dialog" aria-modal="true" aria-label="${esc(title)}">
          <header><h2>${esc(title)}</h2><button type="button" class="icon-btn" data-close aria-label="Cerrar">${I('x')}</button></header>
          <div class="modal-body">${body}</div>
          <footer>${footer ?? `<button type="button" class="btn" data-close>Cancelar</button>${onSubmit ? `<button type="submit" class="btn ${submitClass}">${esc(submitLabel)}</button>` : ''}`}</footer>
        </form>
      </div>`;
    const form = $('form', root);
    modalOnClose = onClose || null;
    $$('[data-close]', root).forEach(b => b.addEventListener('click', closeModal));
    $('.modal-backdrop', root).addEventListener('mousedown', e => { if (e.target.classList.contains('modal-backdrop')) closeModal(); });
    form.addEventListener('submit', e => {
      e.preventDefault();
      $$('.field.invalid', form).forEach(f => { f.classList.remove('invalid'); const er = $('.err', f); if (er) er.remove(); });
      if (!onSubmit) return closeModal();
      const fd = {};
      new FormData(form).forEach((v, k) => { fd[k] = typeof v === 'string' ? v.trim() : v; });
      const res = onSubmit(fd, form);
      if (res !== false) closeModal();
    });
    if (onOpen) onOpen(form);
    const first = $('input:not([type=hidden]):not([disabled]),select:not([disabled]),textarea', form);
    if (first) setTimeout(() => first.focus(), 30);
    return form;
  }
  function closeModal() {
    $('#modal-root').innerHTML = '';
    if (modalOnClose) { const f = modalOnClose; modalOnClose = null; f(); }
  }
  function fieldError(form, name, msg) {
    const input = form.elements[name];
    const field = input && (input.closest ? input.closest('.field') : (input[0] && input[0].closest('.field')));
    if (field) {
      field.classList.add('invalid');
      const s = document.createElement('span'); s.className = 'err'; s.textContent = msg; field.appendChild(s);
      if (input.focus) input.focus();
    } else toast(msg, 'error');
    return false;
  }
  function confirmDialog({ title, message, confirmLabel = 'Confirmar', danger = false, onConfirm }) {
    openModal({ title, size: 'sm', body: `<p style="margin:0">${message}</p>`, submitLabel: confirmLabel, submitClass: danger ? 'danger' : 'primary', onSubmit: () => onConfirm() });
  }

  const opt = (v, label, sel) => `<option value="${esc(v)}" ${String(v) === String(sel ?? '') ? 'selected' : ''}>${esc(label ?? v)}</option>`;
  const regionOptions = (sel, withAll) => (withAll ? opt('', withAll, sel) : '') + REGIONES.map(r => opt(r.code, r.name, sel)).join('');

  /* ---------- Paginación ---------- */
  function paginate(list, page, size = 25) {
    const pages = Math.max(1, Math.ceil(list.length / size));
    const p = Math.min(Math.max(1, page), pages);
    return { rows: list.slice((p - 1) * size, p * size), page: p, pages, from: list.length ? (p - 1) * size + 1 : 0, to: Math.min(p * size, list.length), total: list.length };
  }
  function pagerHTML(pg) {
    if (pg.total === 0) return '';
    const btns = [];
    const add = (n) => btns.push(`<button type="button" data-page="${n}" class="${n === pg.page ? 'on' : ''}">${n}</button>`);
    const win = new Set([1, pg.pages, pg.page - 1, pg.page, pg.page + 1].filter(n => n >= 1 && n <= pg.pages));
    let last = 0;
    [...win].sort((a, b) => a - b).forEach(n => { if (n - last > 1) btns.push('<span class="muted">…</span>'); add(n); last = n; });
    return `<div class="pager"><span class="info">Mostrando ${pg.from}–${pg.to} de ${pg.total.toLocaleString('es-CL')}</span>
      <button type="button" data-page="${pg.page - 1}" ${pg.page <= 1 ? 'disabled' : ''} aria-label="Anterior">‹</button>${btns.join('')}
      <button type="button" data-page="${pg.page + 1}" ${pg.page >= pg.pages ? 'disabled' : ''} aria-label="Siguiente">›</button></div>`;
  }
  function bindPager(container, onPage) {
    $$('[data-page]', container).forEach(b => b.addEventListener('click', () => onPage(+b.dataset.page)));
  }

  /* =====================================================
     Excel / CSV
     ===================================================== */
  function downloadBlob(content, filename, mime) {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1500);
  }
  function exportRows(rows, filename, sheetName = 'Datos') {
    if (!rows.length) return toast('No hay datos para exportar.', 'warn');
    const stamp = todayISO();
    if (window.XLSX) {
      const ws = XLSX.utils.json_to_sheet(rows);
      const keys = Object.keys(rows[0]);
      ws['!cols'] = keys.map(k => ({ wch: Math.min(50, Math.max(k.length, ...rows.slice(0, 300).map(r => String(r[k] ?? '').length)) + 2) }));
      ws['!autofilter'] = { ref: ws['!ref'] };
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
      XLSX.writeFile(wb, `${filename}_${stamp}.xlsx`);
    } else {
      const keys = Object.keys(rows[0]);
      const cell = v => { const s = String(v ?? ''); return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
      const csv = [keys.map(cell).join(';')].concat(rows.map(r => keys.map(k => cell(r[k])).join(';'))).join('\r\n');
      downloadBlob('﻿' + csv, `${filename}_${stamp}.csv`, 'text/csv;charset=utf-8');
    }
  }
  function parseCSV(text) {
    text = text.replace(/^﻿/, '');
    const firstLine = text.split(/\r?\n/)[0] || '';
    const delim = (firstLine.match(/;/g) || []).length >= (firstLine.match(/,/g) || []).length ? ';' : ',';
    const rows = []; let row = [], cur = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) {
        if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; }
        else cur += ch;
      } else if (ch === '"') q = true;
      else if (ch === delim) { row.push(cur); cur = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cur); rows.push(row); row = []; cur = ''; }
      else cur += ch;
    }
    if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
    const head = (rows.shift() || []).map(h => h.trim());
    return rows.filter(r => r.some(c => String(c).trim() !== '')).map(r => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? '').trim()])));
  }
  function readTableFile(file) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onerror = () => reject(new Error('No se pudo leer el archivo.'));
      if (/\.csv$/i.test(file.name) || !window.XLSX) {
        if (!/\.csv$/i.test(file.name)) return reject(new Error('La librería de Excel no está disponible (sin conexión). Guarde el archivo como CSV e inténtelo de nuevo.'));
        fr.onload = () => resolve(parseCSV(String(fr.result)));
        fr.readAsText(file, 'utf-8');
      } else {
        fr.onload = () => {
          try {
            const wb = XLSX.read(fr.result, { type: 'array', cellDates: true });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(ws, { defval: '', raw: true });
            resolve(rows.map(r => {
              const o = {};
              Object.keys(r).forEach(k => { const v = r[k]; o[k] = v instanceof Date ? isoDate(v) : String(v).trim(); });
              return o;
            }));
          } catch (e) { reject(new Error('El archivo no tiene un formato de Excel válido.')); }
        };
        fr.readAsArrayBuffer(file);
      }
    });
  }
  function parseFlexDate(s) {
    s = String(s || '').trim();
    if (!s) return '';
    let m;
    if ((m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/))) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
    if ((m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/))) {
      const y = m[3].length === 2 ? '20' + m[3] : m[3];
      return `${y}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
    }
    if (/^\d{5}$/.test(s)) { const d = new Date(Date.UTC(1899, 11, 30) + (+s) * 86400000); return d.toISOString().slice(0, 10); }
    return '';
  }

  /* =====================================================
     Acta de entrega (impresión)
     ===================================================== */
  function printActa(personaId, equipoIds) {
    const p = persona(personaId);
    const eqs = equipoIds.map(equipo).filter(Boolean);
    if (!p || !eqs.length) return toast('No hay equipos asignados para generar el acta.', 'warn');
    const w = window.open('', '_blank');
    if (!w) return toast('El navegador bloqueó la ventana. Permita ventanas emergentes para imprimir el acta.', 'error');
    const folio = 'AE-' + eqs[0].region + '-' + Date.now().toString().slice(-6);
    const rows = eqs.map((e, i) => `<tr><td>${i + 1}</td><td>${esc(e.inventario)}</td><td>${esc(e.tipo)}</td><td>${esc(e.marca)} ${esc(e.modelo)}</td><td>${esc(e.serie)}</td><td>${esc(e.propiedad)}${e.propiedad === 'Arrendado' && contrato(e.contratoId) ? '<br><small>' + esc(contrato(e.contratoId).codigo) + '</small>' : ''}</td></tr>`).join('');
    w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Acta de entrega ${esc(folio)}</title>
      <style>
        body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:36px;font-size:13px;line-height:1.45}
        h1{font-size:17px;text-align:center;margin:0 0 4px;letter-spacing:.03em}
        .sub{text-align:center;color:#444;margin-bottom:22px}
        .head{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;border-bottom:2px solid #004d40;padding-bottom:10px;margin-bottom:18px}
        .head img{display:block;width:190px;height:auto;margin-bottom:6px}
        .head strong{color:#004d40;font-size:14px}
        table{width:100%;border-collapse:collapse;margin:10px 0 18px}
        th,td{border:1px solid #999;padding:6px 8px;text-align:left;vertical-align:top}
        th{background:#e9f6ec;font-size:12px}
        .data td:first-child{width:160px;background:#f7f9f7;font-weight:bold}
        .sign{display:flex;gap:60px;margin-top:70px}
        .sign div{flex:1;text-align:center;border-top:1px solid #333;padding-top:6px}
        ol{padding-left:18px}
        @media print{body{margin:14mm}}
      </style></head><body>
      <div class="head"><div><img src="${new URL('img/logo-gobierno-conaf.svg', location.href).href}" alt="Gobierno de Chile · CONAF"><strong>CORPORACIÓN NACIONAL FORESTAL</strong><br>Región ${esc(regionName(p.region))}</div><div style="text-align:right">Folio: <b>${esc(folio)}</b><br>Fecha: ${esc(fmtDate(todayISO()))}</div></div>
      <h1>ACTA DE ENTREGA DE EQUIPAMIENTO INFORMÁTICO</h1>
      <div class="sub">Asignación de equipos para el desempeño de funciones institucionales</div>
      <table class="data">
        <tr><td>Funcionario/a</td><td>${esc(p.nombre)}</td></tr>
        <tr><td>RUT</td><td>${esc(p.rut)}</td></tr>
        <tr><td>Cargo</td><td>${esc(p.cargo || '—')}</td></tr>
        <tr><td>Unidad</td><td>${esc(p.unidad || '—')}</td></tr>
        <tr><td>Correo</td><td>${esc(p.email || '—')}</td></tr>
      </table>
      <table><thead><tr><th>#</th><th>N° inventario</th><th>Tipo</th><th>Marca / modelo</th><th>N° serie</th><th>Propiedad</th></tr></thead><tbody>${rows}</tbody></table>
      <p><b>Compromisos del funcionario/a:</b></p>
      <ol>
        <li>Utilizar el equipamiento exclusivamente para fines institucionales.</li>
        <li>Cuidar su integridad y comunicar de inmediato a la Unidad de TI cualquier falla, pérdida, robo o daño.</li>
        <li>No trasladar, prestar ni modificar el equipo sin autorización de la Unidad de TI.</li>
        <li>Restituir el equipamiento al término de sus funciones, traslado o cuando la institución lo requiera.</li>
      </ol>
      <div class="sign"><div>Entrega<br><small>${esc(me.name)} · Unidad de TI</small></div><div>Recibe conforme<br><small>${esc(p.nombre)} · ${esc(p.rut)}</small></div></div>
      <script>window.onload=function(){setTimeout(function(){window.print()},250)}<\/script>
      </body></html>`);
    w.document.close();
  }

  /* =====================================================
     Sesión
     ===================================================== */
  function showLogin() {
    $('#app-view').classList.add('hidden');
    $('#login-view').classList.remove('hidden');
    $('#login-form').reset();
    $('#login-error').classList.add('hidden');
  }
  function startApp() {
    $('#login-view').classList.add('hidden');
    $('#app-view').classList.remove('hidden');
    $('#user-name').textContent = me.name;
    $('#user-role').textContent = isAdmin() ? 'Administrador · Nacional' : 'Usuario · ' + regionName(me.region);
    $('#user-avatar').textContent = initials(me.name);
    $('#sidebar-foot').innerHTML = isAdmin() ? 'Alcance: todas las regiones' : 'Alcance: Región ' + esc(regionName(me.region));
    if (!location.hash || location.hash === '#') location.hash = '#/panel';
    else route();
  }
  function tryLogin(username, password) {
    const u = D().users.find(x => x.username.toLowerCase() === String(username).toLowerCase().trim());
    if (!u || !u.active || u.passHash !== hashPass(u.username, password)) return false;
    me = u;
    try { sessionStorage.setItem(SESSION_KEY, u.id); } catch (e) { /* sin sessionStorage */ }
    return true;
  }
  function resetViewState() {
    Object.assign(eqState, { q: '', region: '', tipo: '', propiedad: '', estado: 'vigentes', contrato: '', sort: 'inventario', dir: 1, page: 1 });
    Object.assign(fuState, { q: '', region: '', activo: 'activos', page: 1 });
    Object.assign(mvState, { q: '', tipo: '', region: '', desde: '', hasta: '', page: 1 });
  }
  function logout() {
    me = null;
    resetViewState();
    try { sessionStorage.removeItem(SESSION_KEY); } catch (e) { /* ignore */ }
    history.replaceState(null, '', location.pathname + location.search);
    showLogin();
  }
  function changePasswordModal() {
    openModal({
      title: 'Cambiar contraseña', size: 'sm',
      body: `
        <label class="field"><span>Contraseña actual</span><input type="password" name="actual" autocomplete="current-password"></label>
        <label class="field"><span>Nueva contraseña</span><input type="password" name="nueva" autocomplete="new-password"><small>Mínimo 8 caracteres.</small></label>
        <label class="field"><span>Repetir nueva contraseña</span><input type="password" name="repetir" autocomplete="new-password"></label>`,
      onSubmit: (fd, form) => {
        if (hashPass(me.username, fd.actual) !== me.passHash) return fieldError(form, 'actual', 'La contraseña actual no es correcta.');
        if (fd.nueva.length < 8) return fieldError(form, 'nueva', 'Debe tener al menos 8 caracteres.');
        if (fd.nueva !== fd.repetir) return fieldError(form, 'repetir', 'Las contraseñas no coinciden.');
        me.passHash = hashPass(me.username, fd.nueva);
        save(); toast('Contraseña actualizada.');
      }
    });
  }

  /* =====================================================
     Navegación
     ===================================================== */
  const ROUTES = {
    panel: { title: 'Panel', icon: 'dashboard', render: renderPanel },
    equipos: { title: 'Equipos', icon: 'laptop', render: renderEquipos },
    equipo: { title: 'Ficha de equipo', render: renderEquipo, hidden: true, parent: 'equipos' },
    funcionarios: { title: 'Funcionarios', icon: 'users', render: renderFuncionarios },
    contratos: { title: 'Contratos de arriendo', icon: 'file', render: renderContratos },
    movimientos: { title: 'Historial de movimientos', icon: 'history', render: renderMovimientos },
    usuarios: { title: 'Usuarios del sistema', icon: 'shield', render: renderUsuarios, admin: true },
    respaldo: { title: 'Importar y respaldar', icon: 'database', render: renderRespaldo, admin: true }
  };

  function renderNav(active) {
    const pend = D().equipos.filter(e => e.solicitudBaja && inScope(e)).length;
    const item = (key, label) => {
      const r = ROUTES[key];
      const badge = key === 'equipos' && pend && isAdmin() ? `<span class="count" title="Solicitudes de baja pendientes">${pend}</span>` : '';
      return `<a href="#/${key}" class="${active === key || r.parent === active ? 'active' : ''}">${I(r.icon)}<span>${label || r.title}</span>${badge}</a>`;
    };
    const activeKey = ROUTES[active] && ROUTES[active].parent ? ROUTES[active].parent : active;
    $('#nav').innerHTML = `
      <div class="nav-label">Inventario</div>
      ${item('panel')}${item('equipos')}${item('funcionarios')}${item('contratos', 'Contratos')}${item('movimientos', 'Movimientos')}
      ${isAdmin() ? `<div class="nav-label">Administración</div>${item('usuarios', 'Usuarios')}${item('respaldo', 'Importar / respaldo')}` : ''}`;
    $$('#nav a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#/' + activeKey));
  }

  function setTitle(title, sub) {
    $('#page-title').textContent = title;
    $('#page-sub').textContent = sub || '';
    document.title = title + ' · Catastro de Equipos CONAF';
  }

  function route() {
    if (!me) return;
    closeModal();
    const [name, param] = location.hash.replace(/^#\/?/, '').split('?')[0].split('/');
    let key = ROUTES[name] ? name : 'panel';
    if (ROUTES[key].admin && !isAdmin()) key = 'panel';
    renderNav(key);
    $('#app-view').classList.remove('nav-open');
    const content = $('#content');
    content.innerHTML = '';
    ROUTES[key].render(content, param ? decodeURIComponent(param) : '');
    window.scrollTo(0, 0);
  }

  /* =====================================================
     PANEL
     ===================================================== */
  function renderPanel(el) {
    setTitle('Panel', isAdmin() ? 'Vista nacional' : 'Región ' + regionName(me.region));
    const all = D().equipos.filter(inScope);
    const vig = all.filter(e => e.estado !== 'De baja');
    const count = s => vig.filter(e => e.estado === s).length;
    const arr = vig.filter(e => e.propiedad === 'Arrendado').length;
    const year = todayISO().slice(0, 4);
    const bajasAno = all.filter(e => e.estado === 'De baja' && (e.fechaBaja || '').startsWith(year)).length;
    const pct = n => vig.length ? Math.round(n / vig.length * 100) : 0;

    const kpi = (label, value, foot, color, href) => `
      <a class="kpi" href="${href}"><div class="k-label"><span class="dot" style="background:${color}"></span>${label}</div>
      <div class="k-value">${value.toLocaleString('es-CL')}</div><div class="k-foot">${foot}</div></a>`;

    // Distribución (por región para admin, por unidad para usuario)
    const groupKey = isAdmin() ? 'region' : 'unidad';
    const groups = {};
    vig.forEach(e => { const k = e[groupKey] || '—'; (groups[k] = groups[k] || { p: 0, a: 0 }); e.propiedad === 'Arrendado' ? groups[k].a++ : groups[k].p++; });
    const gList = Object.entries(groups).sort((a, b) => (b[1].p + b[1].a) - (a[1].p + a[1].a));
    const gMax = Math.max(1, ...gList.map(([, v]) => v.p + v.a));
    const barsHTML = gList.map(([k, v]) => {
      const label = isAdmin() ? regionName(k) : k;
      const href = isAdmin() ? `#/equipos?region=${encodeURIComponent(k)}` : '#/equipos';
      return `<a class="bar-row" href="${href}" style="text-decoration:none;color:inherit" title="${esc(label)}: ${v.p} propios, ${v.a} arrendados">
        <span class="lbl">${esc(label)}</span>
        <span class="bar-track"><i style="width:${v.p / gMax * 100}%;background:var(--own)"></i><i style="width:${v.a / gMax * 100}%;background:var(--lease)"></i></span>
        <span class="val">${v.p + v.a}</span></a>`;
    }).join('') || '<div class="empty">Sin equipos vigentes.</div>';

    const tipos = {};
    vig.forEach(e => tipos[e.tipo] = (tipos[e.tipo] || 0) + 1);
    const tList = Object.entries(tipos).sort((a, b) => b[1] - a[1]);
    const tMax = Math.max(1, ...tList.map(t => t[1]));
    const tiposHTML = tList.map(([t, n]) => `<div class="bar-row"><span class="lbl">${esc(t)}</span><span class="bar-track"><i style="width:${n / tMax * 100}%;background:var(--heading)"></i></span><span class="val">${n}</span></div>`).join('');

    // Alertas
    const alerts = [];
    const pend = all.filter(e => e.solicitudBaja);
    if (pend.length) alerts.push({ cls: 'danger', icon: 'trash', title: `${plural(pend.length, 'solicitud', 'solicitudes')} de baja pendiente${pend.length === 1 ? '' : 's'}`, text: isAdmin() ? 'Requieren revisión y aprobación del administrador.' : 'En espera de aprobación del administrador.', href: '#/equipos?estado=solicitud' });
    D().contratos.forEach(c => {
      const st = contratoStatus(c);
      const n = vig.filter(e => e.contratoId === c.id).length;
      if (st.left < 0 && n) alerts.push({ cls: 'danger', icon: 'file', title: `Contrato ${c.codigo} vencido con ${plural(n, 'equipo vigente', 'equipos vigentes')}`, text: `${c.proveedor}. Coordine la devolución o renovación.`, href: `#/equipos?contrato=${c.id}` });
      else if (st.left >= 0 && st.left <= 90 && n) alerts.push({ cls: 'warn', icon: 'clock', title: `Contrato ${c.codigo} vence en ${plural(st.left, 'día')}`, text: `${c.proveedor} · ${plural(n, 'equipo')} en ${isAdmin() ? 'el país' : 'su región'}.`, href: `#/equipos?contrato=${c.id}` });
    });
    const inact = vig.filter(e => e.estado === 'Asignado' && persona(e.personaId) && !persona(e.personaId).activo);
    if (inact.length) alerts.push({ cls: 'warn', icon: 'users', title: `${plural(inact.length, 'equipo')} asignado${inact.length === 1 ? '' : 's'} a funcionarios inactivos`, text: 'Gestione la devolución de estos equipos.', href: '#/equipos?estado=inactivos' });
    const rep = vig.filter(e => e.estado === 'En reparación');
    if (rep.length) alerts.push({ cls: 'info', icon: 'wrench', title: `${plural(rep.length, 'equipo')} en reparación`, text: 'Haga seguimiento con el servicio técnico.', href: '#/equipos?estado=En%20reparaci%C3%B3n' });
    const colors = { danger: ['var(--danger-bg)', 'var(--danger)'], warn: ['var(--warn-bg)', 'var(--warn)'], info: ['var(--info-bg)', 'var(--info)'] };
    const alertsHTML = alerts.length ? alerts.map(a => `<a class="alert-item" href="${a.href}"><span class="ic" style="background:${colors[a.cls][0]};color:${colors[a.cls][1]}">${I(a.icon)}</span><div><strong>${esc(a.title)}</strong><span>${esc(a.text)}</span></div></a>`).join('')
      : '<div class="empty" style="padding:20px"><strong>Todo en orden</strong>No hay alertas pendientes.</div>';

    const mvs = D().movimientos.filter(inScope).slice(-7).reverse();
    const mvHTML = mvs.map(m => `<li style="--tl:${tlColor(m.tipo)}"><div class="t-head"><span class="t-type">${esc(m.tipo)}</span><a class="mono" href="#/equipo/${m.equipoId}">${esc(m.inventario)}</a><span class="t-date">${fmtDateTime(m.fecha)}</span></div><div class="t-body">${esc(m.detalle)}</div></li>`).join('');

    el.innerHTML = `
      <div class="kpis">
        ${kpi('Equipos vigentes', vig.length, `${plural(all.length - vig.length, 'dado', 'dados')} de baja en total`, 'var(--primary)', '#/equipos')}
        ${kpi('Asignados', count('Asignado'), `${pct(count('Asignado'))}% del parque vigente`, 'var(--ok)', '#/equipos?estado=Asignado')}
        ${kpi('Disponibles', count('Disponible'), 'Listos para asignar', 'var(--info)', '#/equipos?estado=Disponible')}
        ${kpi('En reparación', count('En reparación'), 'En servicio técnico', 'var(--warn)', '#/equipos?estado=En%20reparaci%C3%B3n')}
        ${kpi('Arrendados', arr, `${pct(arr)}% · ${vig.length - arr} propios`, 'var(--lease)', '#/equipos?propiedad=Arrendado')}
        ${kpi('Bajas ' + year, bajasAno, 'Dados de baja este año', 'var(--neutral)', '#/equipos?estado=De%20baja')}
      </div>
      <div class="grid g-dash">
        <div class="grid">
          <section class="panel">
            <div class="panel-head"><h3>Equipos vigentes por ${isAdmin() ? 'región' : 'unidad'}</h3>
              <div class="legend"><span><i style="background:var(--own)"></i>Propios</span><span><i style="background:var(--lease)"></i>Arrendados</span></div></div>
            <div class="panel-body"><div class="bars">${barsHTML}</div></div>
          </section>
          <section class="panel">
            <div class="panel-head"><h3>Equipos vigentes por tipo</h3></div>
            <div class="panel-body"><div class="bars">${tiposHTML || '<div class="empty">Sin datos.</div>'}</div></div>
          </section>
        </div>
        <div class="grid" style="align-content:start">
          <section class="panel">
            <div class="panel-head"><h3>Alertas</h3></div>
            <div class="panel-body"><div class="alerts">${alertsHTML}</div></div>
          </section>
          <section class="panel">
            <div class="panel-head"><h3>Últimos movimientos</h3><a class="btn sm ghost" href="#/movimientos">Ver todo</a></div>
            <div class="panel-body"><ul class="timeline">${mvHTML || '<li>Sin movimientos.</li>'}</ul></div>
          </section>
        </div>
      </div>`;
  }

  function tlColor(tipo) {
    return ({ 'Alta': 'var(--primary)', 'Asignación': 'var(--ok)', 'Devolución': 'var(--info)', 'Reparación': 'var(--warn)', 'Retorno de reparación': 'var(--info)', 'Solicitud de baja': 'var(--danger)', 'Baja': 'var(--neutral)', 'Traslado': 'var(--accent)', 'Reactivación': 'var(--primary)' })[tipo] || '#9aa59e';
  }

  /* =====================================================
     EQUIPOS — listado
     ===================================================== */
  const eqState = { q: '', region: '', tipo: '', propiedad: '', estado: 'vigentes', contrato: '', sort: 'inventario', dir: 1, page: 1 };

  function applyQueryToState(param) {
    // Admite #/equipos?estado=X&region=Y desde el panel
    const qs = (location.hash.split('?')[1] || '');
    if (!qs) return;
    const p = new URLSearchParams(qs);
    Object.assign(eqState, { q: '', region: '', tipo: '', propiedad: '', estado: 'vigentes', contrato: '', page: 1 });
    p.forEach((v, k) => { if (k in eqState) eqState[k] = v; });
    history.replaceState(null, '', '#/equipos');
  }

  function filterEquipos() {
    const f = eqState;
    let list = D().equipos.filter(inScope);
    if (f.region) list = list.filter(e => e.region === f.region);
    if (f.tipo) list = list.filter(e => e.tipo === f.tipo);
    if (f.propiedad) list = list.filter(e => e.propiedad === f.propiedad);
    if (f.contrato) list = list.filter(e => e.contratoId === f.contrato);
    if (f.estado === 'vigentes') list = list.filter(e => e.estado !== 'De baja');
    else if (f.estado === 'solicitud') list = list.filter(e => e.solicitudBaja);
    else if (f.estado === 'inactivos') list = list.filter(e => e.estado === 'Asignado' && persona(e.personaId) && !persona(e.personaId).activo);
    else if (f.estado && f.estado !== 'todos') list = list.filter(e => e.estado === f.estado);
    if (f.q) {
      const terms = norm(f.q).split(/\s+/);
      list = list.filter(e => {
        const p = persona(e.personaId);
        const hay = norm([e.inventario, e.serie, e.tipo, e.marca, e.modelo, e.unidad, e.ubicacion, p && p.nombre, p && p.rut, p && rutClean(p.rut)].join(' '));
        return terms.every(t => hay.includes(t));
      });
    }
    const key = {
      inventario: e => e.inventario, serie: e => e.serie, tipo: e => e.tipo, marca: e => e.marca + ' ' + e.modelo,
      propiedad: e => e.propiedad, region: e => regionName(e.region), estado: e => e.estado,
      persona: e => (persona(e.personaId) || {}).nombre || '~', actualizado: e => e.actualizado || ''
    }[f.sort] || (e => e.inventario);
    list.sort((a, b) => key(a).localeCompare(key(b), 'es', { numeric: true }) * f.dir);
    return list;
  }

  function renderEquipos(el) {
    applyQueryToState();
    setTitle('Equipos', isAdmin() ? 'Todas las regiones' : 'Región ' + regionName(me.region));
    const f = eqState;
    const estadoOpts = [['vigentes', 'Vigentes (sin bajas)'], ['todos', 'Todos los estados'], ['Asignado', 'Asignado'], ['Disponible', 'Disponible'], ['En reparación', 'En reparación'], ['solicitud', 'Con solicitud de baja'], ['inactivos', 'Asignados a inactivos'], ['De baja', 'De baja']];
    el.innerHTML = `
      <div class="toolbar">
        <div class="page-actions">
          <button class="btn primary" id="btn-alta">${I('plus')}Alta de equipo</button>
          ${isAdmin() ? `<button class="btn" id="btn-import">${I('upload')}Importar Excel</button>` : ''}
          <button class="btn" id="btn-export">${I('download')}Exportar</button>
        </div>
      </div>
      <div class="filters">
        <div class="search">${I('search')}<input type="search" id="f-q" placeholder="Buscar por inventario, serie, modelo, funcionario o RUT…" value="${esc(f.q)}" aria-label="Buscar"></div>
        ${isAdmin() ? `<select id="f-region" aria-label="Región">${regionOptions(f.region, 'Todas las regiones')}</select>` : ''}
        <select id="f-tipo" aria-label="Tipo">${opt('', 'Todos los tipos', f.tipo)}${TIPOS.map(t => opt(t, t, f.tipo)).join('')}</select>
        <select id="f-propiedad" aria-label="Propiedad">${opt('', 'Propios y arrendados', f.propiedad)}${opt('Propio', 'Solo propios', f.propiedad)}${opt('Arrendado', 'Solo arrendados', f.propiedad)}</select>
        <select id="f-contrato" aria-label="Contrato">${opt('', 'Todos los contratos', f.contrato)}${D().contratos.map(c => opt(c.id, c.codigo + ' · ' + c.proveedor, f.contrato)).join('')}</select>
        <select id="f-estado" aria-label="Estado">${estadoOpts.map(([v, l]) => opt(v, l, f.estado)).join('')}</select>
      </div>
      <div class="result-bar"><span id="eq-count"></span><button class="btn sm ghost" id="btn-clear">Limpiar filtros</button></div>
      <div id="eq-table"></div>`;

    let t;
    $('#f-q').addEventListener('input', e => { clearTimeout(t); t = setTimeout(() => { f.q = e.target.value; f.page = 1; drawEquiposTable(); }, 180); });
    ['region', 'tipo', 'propiedad', 'contrato', 'estado'].forEach(k => {
      const s = $('#f-' + k); if (s) s.addEventListener('change', () => { f[k] = s.value; f.page = 1; drawEquiposTable(); });
    });
    $('#btn-clear').addEventListener('click', () => { Object.assign(f, { q: '', region: '', tipo: '', propiedad: '', estado: 'vigentes', contrato: '', page: 1 }); renderEquipos(el); });
    $('#btn-alta').addEventListener('click', () => equipoForm(null));
    $('#btn-export').addEventListener('click', () => exportRows(filterEquipos().map(equipoRow), 'catastro_equipos', 'Equipos'));
    if ($('#btn-import')) $('#btn-import').addEventListener('click', importEquiposModal);
    drawEquiposTable();
  }

  function equipoRow(e) {
    const p = persona(e.personaId), c = contrato(e.contratoId);
    return {
      'N° inventario': e.inventario, 'N° serie': e.serie, 'Tipo': e.tipo, 'Marca': e.marca, 'Modelo': e.modelo,
      'Propiedad': e.propiedad, 'Contrato': c ? c.codigo : '', 'Proveedor': c ? c.proveedor : '',
      'Región': regionName(e.region), 'Unidad': e.unidad, 'Ubicación': e.ubicacion, 'Estado': e.estado,
      'Baja solicitada': e.solicitudBaja ? 'Sí' : '',
      'Responsable': p ? p.nombre : '', 'RUT responsable': p ? p.rut : '', 'Fecha asignación': e.fechaAsignacion ? fmtDate(e.fechaAsignacion) : '',
      'Fecha alta': fmtDate(e.fechaAlta), 'Fecha baja': e.fechaBaja ? fmtDate(e.fechaBaja) : '', 'Motivo baja': e.motivoBaja || '',
      'Observaciones': e.observaciones || ''
    };
  }

  function drawEquiposTable() {
    const box = $('#eq-table'); if (!box) return;
    const f = eqState;
    const list = filterEquipos();
    const pg = paginate(list, f.page);
    f.page = pg.page;
    const contratoSel = f.contrato && contrato(f.contrato);
    $('#eq-count').innerHTML = `<strong>${plural(list.length, 'equipo')}</strong>` + (contratoSel ? ` &nbsp;<span class="chip">Contrato ${esc(contratoSel.codigo)}<button type="button" id="chip-x" aria-label="Quitar filtro">×</button></span>` : '');
    if ($('#chip-x')) $('#chip-x').addEventListener('click', () => { f.contrato = ''; $('#f-contrato').value = ''; drawEquiposTable(); });

    const th = (key, label, cls = '') => `<th class="sortable ${f.sort === key ? 'sorted' : ''} ${cls}" data-sort="${key}">${label}<span class="arrow">${f.sort === key ? (f.dir === 1 ? '▲' : '▼') : '↕'}</span></th>`;
    if (!list.length) {
      box.innerHTML = `<div class="table-wrap"><div class="empty"><strong>No hay equipos que coincidan</strong>Ajuste los filtros o registre un alta.</div></div>`;
      return;
    }
    box.innerHTML = `<div class="table-wrap"><table>
      <thead><tr>${th('inventario', 'N° inventario')}${th('serie', 'N° serie', 'hide-sm')}${th('tipo', 'Tipo')}${th('marca', 'Marca / modelo', 'hide-sm')}${th('propiedad', 'Propiedad')}${isAdmin() ? th('region', 'Región', 'hide-sm') : ''}${th('estado', 'Estado')}${th('persona', 'Responsable', 'hide-sm')}<th></th></tr></thead>
      <tbody>${pg.rows.map(e => {
        const p = persona(e.personaId);
        return `<tr class="clickable" data-id="${e.id}">
          <td class="nowrap"><strong class="mono">${esc(e.inventario)}</strong></td>
          <td class="mono hide-sm">${esc(e.serie)}</td>
          <td>${esc(e.tipo)}</td>
          <td class="hide-sm">${esc(e.marca)}<span class="sub">${esc(e.modelo)}</span></td>
          <td>${propBadge(e)}</td>
          ${isAdmin() ? `<td class="hide-sm nowrap">${esc(regionName(e.region))}</td>` : ''}
          <td class="nowrap">${estadoBadge(e)}</td>
          <td class="hide-sm person">${p ? `<span class="name" title="${esc(p.nombre)}">${esc(p.nombre)}</span><span class="sub">${esc(p.unidad || '')}</span>` : '<span class="muted">—</span>'}</td>
          <td class="actions">${e.estado === 'Disponible' ? `<button class="btn sm" data-assign="${e.id}" title="Asignar">${I('assign')}<span class="hide-sm">Asignar</span></button>` : ''}</td>
        </tr>`;
      }).join('')}</tbody></table></div>${pagerHTML(pg)}`;

    $$('th[data-sort]', box).forEach(h => h.addEventListener('click', () => {
      if (f.sort === h.dataset.sort) f.dir *= -1; else { f.sort = h.dataset.sort; f.dir = 1; }
      drawEquiposTable();
    }));
    $$('tr[data-id]', box).forEach(tr => tr.addEventListener('click', ev => {
      if (ev.target.closest('button')) return;
      location.hash = '#/equipo/' + tr.dataset.id;
    }));
    $$('[data-assign]', box).forEach(b => b.addEventListener('click', () => asignarModal(equipo(b.dataset.assign), drawEquiposTable)));
    bindPager(box, p => { f.page = p; drawEquiposTable(); box.scrollIntoView({ block: 'start', behavior: 'smooth' }); });
  }

  /* ---------- Alta / edición de equipo ---------- */
  function nextInventario() {
    let n = D().nextInventario || 10001;
    const used = new Set(D().equipos.map(e => e.inventario));
    while (used.has('CONAF-' + n)) n++;
    return 'CONAF-' + n;
  }

  function equipoForm(eq, onDone) {
    const isNew = !eq;
    const e = eq || { inventario: nextInventario(), serie: '', tipo: 'Notebook', marca: '', modelo: '', propiedad: 'Propio', contratoId: '', region: isAdmin() ? '' : me.region, unidad: '', ubicacion: '', fechaAlta: todayISO(), observaciones: '' };
    const marcas = [...new Set(D().equipos.map(x => x.marca))].sort();
    const modelos = [...new Set(D().equipos.map(x => x.modelo))].sort();
    openModal({
      title: isNew ? 'Alta de equipo' : 'Editar equipo ' + e.inventario, size: 'lg',
      submitLabel: isNew ? 'Registrar alta' : 'Guardar cambios',
      body: `
        <div class="form-grid">
          <label class="field"><span>N° de inventario <span class="req">*</span></span><input name="inventario" value="${esc(e.inventario)}" class="mono"><small>Sugerido automáticamente; puede modificarlo.</small></label>
          <label class="field"><span>N° de serie <span class="req">*</span></span><input name="serie" value="${esc(e.serie)}" class="mono"></label>
          <label class="field"><span>Tipo <span class="req">*</span></span><select name="tipo">${TIPOS.map(t => opt(t, t, e.tipo)).join('')}</select></label>
          <label class="field"><span>Marca <span class="req">*</span></span><input name="marca" value="${esc(e.marca)}" list="dl-marcas"></label>
          <label class="field full"><span>Modelo</span><input name="modelo" value="${esc(e.modelo)}" list="dl-modelos"></label>
          <div class="field full"><span>Propiedad <span class="req">*</span></span>
            <div class="seg"><label><input type="radio" name="propiedad" value="Propio" ${e.propiedad !== 'Arrendado' ? 'checked' : ''}><span>Propio</span></label><label><input type="radio" name="propiedad" value="Arrendado" ${e.propiedad === 'Arrendado' ? 'checked' : ''}><span>Arrendado</span></label></div>
          </div>
          <label class="field full" id="row-contrato"><span>Contrato de arriendo <span class="req">*</span></span>
            <select name="contratoId">${opt('', 'Seleccione contrato…', e.contratoId)}${D().contratos.map(c => opt(c.id, `${c.codigo} · ${c.proveedor} (hasta ${fmtDate(c.fechaTermino)})`, e.contratoId)).join('')}</select></label>
          <label class="field"><span>Región <span class="req">*</span></span>
            <select name="region" ${isAdmin() ? '' : 'disabled'}>${regionOptions(e.region, 'Seleccione región…')}</select>
            ${!isNew && isAdmin() ? '<small>Si cambia la región, se registra como traslado.</small>' : ''}</label>
          <label class="field"><span>Unidad / departamento</span><select name="unidad">${opt('', 'Seleccione…', e.unidad)}${UNIDADES.map(u => opt(u, u, e.unidad)).join('')}</select></label>
          <label class="field"><span>Ubicación física</span><input name="ubicacion" value="${esc(e.ubicacion)}" placeholder="Ej.: Oficina 204, Bodega TI"></label>
          <label class="field"><span>Fecha de alta <span class="req">*</span></span><input type="date" name="fechaAlta" value="${esc(e.fechaAlta)}" max="${todayISO()}"></label>
          <label class="field full"><span>Observaciones</span><textarea name="observaciones" rows="2">${esc(e.observaciones)}</textarea></label>
        </div>
        <datalist id="dl-marcas">${marcas.map(m => `<option value="${esc(m)}">`).join('')}</datalist>
        <datalist id="dl-modelos">${modelos.map(m => `<option value="${esc(m)}">`).join('')}</datalist>`,
      onOpen: form => {
        const sync = () => { $('#row-contrato', form).classList.toggle('hidden', form.elements.propiedad.value !== 'Arrendado'); };
        $$('input[name=propiedad]', form).forEach(r => r.addEventListener('change', sync));
        sync();
      },
      onSubmit: (fd, form) => {
        const region = isAdmin() ? fd.region : me.region;
        fd.inventario = fd.inventario.toUpperCase();
        if (!fd.inventario) return fieldError(form, 'inventario', 'Ingrese el número de inventario.');
        if (D().equipos.some(x => x !== eq && norm(x.inventario) === norm(fd.inventario))) return fieldError(form, 'inventario', 'Ya existe un equipo con este número de inventario.');
        if (!fd.serie) return fieldError(form, 'serie', 'Ingrese el número de serie.');
        const dupSerie = D().equipos.find(x => x !== eq && norm(x.serie) === norm(fd.serie));
        if (dupSerie) return fieldError(form, 'serie', `Esta serie ya está registrada en ${dupSerie.inventario}.`);
        if (!fd.marca) return fieldError(form, 'marca', 'Ingrese la marca.');
        if (fd.propiedad === 'Arrendado' && !fd.contratoId) return fieldError(form, 'contratoId', 'Seleccione el contrato de arriendo.');
        if (!region) return fieldError(form, 'region', 'Seleccione la región.');
        if (!fd.fechaAlta) return fieldError(form, 'fechaAlta', 'Ingrese la fecha de alta.');

        const data = {
          inventario: fd.inventario, serie: fd.serie.toUpperCase(), tipo: fd.tipo, marca: fd.marca, modelo: fd.modelo,
          propiedad: fd.propiedad, contratoId: fd.propiedad === 'Arrendado' ? fd.contratoId : '',
          region, unidad: fd.unidad, ubicacion: fd.ubicacion, fechaAlta: fd.fechaAlta, observaciones: fd.observaciones
        };
        if (isNew) {
          const n = Object.assign({ id: Store.uid('e'), estado: 'Disponible', personaId: '', fechaAsignacion: '', fechaBaja: '', motivoBaja: '', detalleBaja: '', solicitudBaja: null }, data);
          D().equipos.push(n);
          const num = parseInt(String(n.inventario).replace(/\D/g, ''), 10);
          if (/^CONAF-\d+$/.test(n.inventario) && num >= (D().nextInventario || 0)) D().nextInventario = num + 1;
          const c = contrato(n.contratoId);
          log(n, 'Alta', `Ingreso al inventario como equipo ${n.propiedad.toLowerCase()}${c ? ' (contrato ' + c.codigo + ')' : ''}. ${n.tipo} ${n.marca} ${n.modelo}, serie ${n.serie}.`);
          save(); toast(`Equipo ${n.inventario} registrado.`);
          setTimeout(() => { location.hash = '#/equipo/' + n.id; }, 0);
        } else {
          const changes = [];
          const labels = { inventario: 'N° inventario', serie: 'N° serie', tipo: 'Tipo', marca: 'Marca', modelo: 'Modelo', propiedad: 'Propiedad', contratoId: 'Contrato', unidad: 'Unidad', ubicacion: 'Ubicación', fechaAlta: 'Fecha de alta', observaciones: 'Observaciones' };
          Object.keys(labels).forEach(k => {
            if (String(eq[k] || '') !== String(data[k] || '')) {
              const show = v => k === 'contratoId' ? ((contrato(v) || {}).codigo || '—') : (v || '—');
              changes.push(`${labels[k]}: ${show(eq[k])} → ${show(data[k])}`);
            }
          });
          const traslado = eq.region !== data.region;
          const oldRegion = eq.region;
          Object.assign(eq, data);
          if (traslado) {
            if (eq.personaId) { eq.personaId = ''; eq.estado = 'Disponible'; eq.fechaAsignacion = ''; }
            log(eq, 'Traslado', `Traslado de ${regionName(oldRegion)} a ${regionName(data.region)}.`);
          }
          if (changes.length) log(eq, 'Modificación', changes.join('; '));
          save(); toast('Cambios guardados.');
          if (onDone) onDone(); else route();
        }
      }
    });
  }

  /* ---------- Acciones de ciclo de vida ---------- */
  function eqSummary(e) {
    return `<div class="modal-summary"><span class="avatar" style="border-radius:8px">${I('laptop')}</span><div><strong class="mono">${esc(e.inventario)}</strong><span>${esc(e.tipo)} · ${esc(e.marca)} ${esc(e.modelo)} · S/N ${esc(e.serie)}</span></div></div>`;
  }

  function asignarModal(e, onDone) {
    const gente = D().personas.filter(p => p.activo && p.region === e.region).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    const actual = persona(e.personaId);
    openModal({
      title: actual ? 'Reasignar equipo' : 'Asignar equipo', submitLabel: actual ? 'Reasignar' : 'Asignar',
      body: `${eqSummary(e)}
        ${actual ? `<div class="callout info">${I('assign')}<div>Actualmente asignado a <b>${esc(actual.nombre)}</b>. Se registrará la devolución automáticamente.</div></div>` : ''}
        <label class="field"><span>Funcionario/a responsable <span class="req">*</span></span>
          <select name="personaId">${opt('', gente.length ? 'Seleccione…' : 'No hay funcionarios activos en la región', '')}${gente.filter(p => p.id !== e.personaId).map(p => opt(p.id, `${p.nombre} · ${p.rut} · ${p.unidad || 'Sin unidad'}`, '')).join('')}</select>
          <small>Solo se listan funcionarios activos de la Región ${esc(regionName(e.region))}. <a href="#" id="lnk-nueva-persona">Registrar nuevo funcionario</a></small></label>
        <div class="form-grid">
          <label class="field"><span>Fecha de entrega <span class="req">*</span></span><input type="date" name="fecha" value="${todayISO()}" max="${todayISO()}"></label>
          <label class="field"><span>Ubicación</span><input name="ubicacion" value="${esc(e.ubicacion || '')}"></label>
        </div>
        <label class="field"><span>Observación</span><input name="obs" placeholder="Ej.: entrega con cargador y mochila"></label>
        <label class="check"><input type="checkbox" name="acta" value="1" checked> Generar acta de entrega para firma</label>`,
      onOpen: form => {
        $('#lnk-nueva-persona', form).addEventListener('click', ev => { ev.preventDefault(); personaForm(null, e.region, () => asignarModal(e, onDone)); });
      },
      onSubmit: (fd, form) => {
        if (!fd.personaId) return fieldError(form, 'personaId', 'Seleccione al funcionario/a.');
        if (!fd.fecha) return fieldError(form, 'fecha', 'Ingrese la fecha.');
        const p = persona(fd.personaId);
        if (actual) log(e, 'Devolución', `Devuelto por ${actual.nombre} (${actual.rut}) para reasignación.`);
        e.personaId = p.id; e.estado = 'Asignado'; e.fechaAsignacion = fd.fecha; e.ubicacion = fd.ubicacion;
        log(e, 'Asignación', `Asignado a ${p.nombre} (${p.rut}) con fecha ${fmtDate(fd.fecha)}.${fd.obs ? ' ' + fd.obs : ''}`);
        save(); toast(`${e.inventario} asignado a ${p.nombre}.`);
        if (fd.acta) printActa(p.id, [e.id]);
        (onDone || route)();
      }
    });
  }

  function devolverModal(e) {
    const p = persona(e.personaId);
    openModal({
      title: 'Registrar devolución', submitLabel: 'Registrar devolución',
      body: `${eqSummary(e)}
        <p style="margin:0">Devuelto por <b>${esc(p ? p.nombre : '—')}</b>${p ? ' · ' + esc(p.rut) : ''}</p>
        <div class="form-grid">
          <label class="field"><span>Fecha de devolución</span><input type="date" name="fecha" value="${todayISO()}" max="${todayISO()}"></label>
          <label class="field"><span>Estado en que queda</span><select name="estado">${opt('Disponible', 'Disponible (en buen estado)')}${opt('En reparación', 'Requiere reparación')}</select></label>
        </div>
        <label class="field"><span>Observación</span><textarea name="obs" rows="2" placeholder="Estado del equipo, accesorios recibidos…"></textarea></label>`,
      onSubmit: fd => {
        e.estado = fd.estado; e.personaId = ''; e.fechaAsignacion = '';
        log(e, 'Devolución', `Devuelto por ${p ? p.nombre + ' (' + p.rut + ')' : 'responsable'} el ${fmtDate(fd.fecha)}.${fd.obs ? ' ' + fd.obs : ''}`);
        if (fd.estado === 'En reparación') log(e, 'Reparación', 'Enviado a reparación tras la devolución.');
        save(); toast('Devolución registrada.'); route();
      }
    });
  }

  function reparacionModal(e, retorno) {
    openModal({
      title: retorno ? 'Retorno de reparación' : 'Enviar a reparación', submitLabel: retorno ? 'Registrar retorno' : 'Enviar a reparación',
      body: `${eqSummary(e)}
        ${!retorno && e.personaId ? `<div class="callout warn">${I('alert')}<div>El equipo está asignado a <b>${esc((persona(e.personaId) || {}).nombre)}</b>. Al enviarlo a reparación se registrará su devolución.</div></div>` : ''}
        <label class="field"><span>${retorno ? 'Resultado de la reparación' : 'Falla reportada / servicio técnico'} <span class="req">*</span></span><textarea name="obs" rows="3"></textarea></label>`,
      onSubmit: (fd, form) => {
        if (!fd.obs) return fieldError(form, 'obs', 'Describa brevemente.');
        if (retorno) {
          e.estado = 'Disponible';
          log(e, 'Retorno de reparación', fd.obs);
        } else {
          if (e.personaId) { const p = persona(e.personaId); log(e, 'Devolución', `Devuelto por ${p ? p.nombre : 'responsable'} para reparación.`); }
          e.personaId = ''; e.fechaAsignacion = ''; e.estado = 'En reparación';
          log(e, 'Reparación', fd.obs);
        }
        save(); toast(retorno ? 'Equipo disponible nuevamente.' : 'Equipo enviado a reparación.'); route();
      }
    });
  }

  function bajaModal(e) {
    const direct = isAdmin();
    const sol = e.solicitudBaja;
    openModal({
      title: direct ? (sol ? 'Aprobar baja' : 'Dar de baja') : 'Solicitar baja',
      submitLabel: direct ? 'Confirmar baja' : 'Enviar solicitud', submitClass: 'danger',
      body: `${eqSummary(e)}
        ${direct ? `<div class="callout danger">${I('alert')}<div>El equipo dejará de estar vigente en el catastro. ${e.personaId ? 'Se registrará además su devolución.' : ''}</div></div>`
          : `<div class="callout info">${I('shield')}<div>La baja será revisada por un administrador. Mientras tanto el equipo sigue vigente.</div></div>`}
        <div class="form-grid">
          <label class="field"><span>Motivo <span class="req">*</span></span><select name="motivo">${opt('', 'Seleccione…', '')}${MOTIVOS_BAJA.map(m => opt(m, m, sol ? sol.motivo : (e.propiedad === 'Arrendado' ? 'Devolución a proveedor (fin de arriendo)' : ''))).join('')}</select></label>
          ${direct ? `<label class="field"><span>Fecha de baja <span class="req">*</span></span><input type="date" name="fecha" value="${todayISO()}" max="${todayISO()}"></label>` : '<div></div>'}
          <label class="field full"><span>Detalle / respaldo ${direct ? '(N° resolución, acta, informe técnico)' : ''}</span><textarea name="detalle" rows="3">${esc(sol ? sol.detalle : '')}</textarea></label>
        </div>`,
      onSubmit: (fd, form) => {
        if (!fd.motivo) return fieldError(form, 'motivo', 'Seleccione el motivo.');
        if (direct) {
          if (!fd.fecha) return fieldError(form, 'fecha', 'Ingrese la fecha de baja.');
          if (e.personaId) { const p = persona(e.personaId); log(e, 'Devolución', `Devuelto por ${p ? p.nombre : 'responsable'} por baja del equipo.`); }
          Object.assign(e, { estado: 'De baja', personaId: '', fechaAsignacion: '', fechaBaja: fd.fecha, motivoBaja: fd.motivo, detalleBaja: fd.detalle, solicitudBaja: null });
          log(e, 'Baja', `${fd.motivo}.${fd.detalle ? ' ' + fd.detalle : ''}${sol ? ` (solicitada por ${sol.usuario})` : ''}`);
          toast(`${e.inventario} dado de baja.`);
        } else {
          e.solicitudBaja = { motivo: fd.motivo, detalle: fd.detalle, fecha: nowStamp(), usuario: me.name, usuarioId: me.id };
          log(e, 'Solicitud de baja', `${fd.motivo}.${fd.detalle ? ' ' + fd.detalle : ''}`);
          toast('Solicitud de baja enviada al administrador.');
        }
        save(); route();
      }
    });
  }

  function rechazarBajaModal(e) {
    openModal({
      title: 'Rechazar solicitud de baja', submitLabel: 'Rechazar solicitud', size: 'sm',
      body: `${eqSummary(e)}<label class="field"><span>Motivo del rechazo <span class="req">*</span></span><textarea name="obs" rows="3"></textarea></label>`,
      onSubmit: (fd, form) => {
        if (!fd.obs) return fieldError(form, 'obs', 'Indique el motivo del rechazo.');
        e.solicitudBaja = null;
        log(e, 'Solicitud rechazada', fd.obs);
        save(); toast('Solicitud rechazada.'); route();
      }
    });
  }

  /* =====================================================
     EQUIPO — ficha
     ===================================================== */
  function renderEquipo(el, id) {
    const e = equipo(id);
    if (!e || !inScope(e)) {
      setTitle('Equipo no encontrado');
      el.innerHTML = `<a class="back" href="#/equipos">${I('left')}Volver a equipos</a><div class="panel"><div class="empty"><strong>Equipo no encontrado</strong>No existe o no pertenece a su región.</div></div>`;
      return;
    }
    setTitle('Ficha de equipo', e.inventario);
    const p = persona(e.personaId), c = contrato(e.contratoId);
    const baja = e.estado === 'De baja';
    const btn = (act, icon, label, cls = '') => `<button class="btn ${cls}" data-act="${act}">${I(icon)}${label}</button>`;
    const acts = [];
    if (!baja) {
      if (e.estado === 'Disponible') acts.push(btn('asignar', 'assign', 'Asignar', 'primary'));
      if (e.estado === 'Asignado') acts.push(btn('devolver', 'undo', 'Registrar devolución', 'primary'), btn('asignar', 'assign', 'Reasignar'), btn('acta', 'printer', 'Acta de entrega'));
      if (e.estado === 'En reparación') acts.push(btn('retorno', 'check', 'Retorno de reparación', 'primary'));
      else acts.push(btn('reparar', 'wrench', 'Enviar a reparación'));
      acts.push(btn('editar', 'edit', 'Editar'));
      if (!e.solicitudBaja) acts.push(btn('baja', 'trash', isAdmin() ? 'Dar de baja' : 'Solicitar baja'));
    } else if (isAdmin()) acts.push(btn('reactivar', 'refresh', 'Revertir baja'));

    let callout = '';
    if (e.solicitudBaja) {
      const s = e.solicitudBaja;
      callout = `<div class="callout danger" style="margin-bottom:16px">${I('alert')}<div class="grow"><b>Baja solicitada</b> por ${esc(s.usuario)} el ${fmtDateTime(s.fecha)} · ${esc(s.motivo)}${s.detalle ? '<br>' + esc(s.detalle) : ''}</div>
        ${isAdmin() ? `<div class="page-actions"><button class="btn sm danger" data-act="aprobar">Aprobar baja</button><button class="btn sm" data-act="rechazar">Rechazar</button></div>` : `<button class="btn sm" data-act="cancelar-sol">Retirar solicitud</button>`}</div>`;
    } else if (baja) {
      callout = `<div class="callout" style="background:var(--neutral-bg);margin-bottom:16px">${I('trash')}<div><b>Dado de baja</b> el ${fmtDate(e.fechaBaja)} · ${esc(e.motivoBaja)}${e.detalleBaja ? '<br>' + esc(e.detalleBaja) : ''}</div></div>`;
    } else if (c && contratoStatus(c).left < 0) {
      callout = `<div class="callout danger" style="margin-bottom:16px">${I('clock')}<div>El contrato de arriendo <b>${esc(c.codigo)}</b> venció el ${fmtDate(c.fechaTermino)}. Coordine la devolución al proveedor o la renovación.</div></div>`;
    } else if (p && !p.activo) {
      callout = `<div class="callout warn" style="margin-bottom:16px">${I('users')}<div>El responsable <b>${esc(p.nombre)}</b> está inactivo. Gestione la devolución del equipo.</div></div>`;
    }

    const hist = D().movimientos.filter(m => m.equipoId === e.id).slice().reverse();
    el.innerHTML = `
      <a class="back" href="#/equipos">${I('left')}Volver a equipos</a>
      <div class="detail-head">
        <div>
          <div class="eyebrow">${esc(e.tipo)}</div>
          <h2 class="mono" style="font-size:24px">${esc(e.inventario)}</h2>
          <div class="tags">${estadoBadge(e)} ${propBadge(e)} <span class="badge b-neutral">Región ${esc(regionName(e.region))}</span></div>
        </div>
        <div class="page-actions">${acts.join('')}</div>
      </div>
      ${callout}
      <div class="grid g-dash">
        <div class="grid" style="align-content:start">
          <section class="panel">
            <div class="panel-head"><h3>Datos del equipo</h3></div>
            <div class="panel-body"><dl class="dl">
              <div><dt>N° de inventario</dt><dd class="mono">${esc(e.inventario)}</dd></div>
              <div><dt>N° de serie</dt><dd class="mono">${esc(e.serie)}</dd></div>
              <div><dt>Marca</dt><dd>${esc(e.marca)}</dd></div>
              <div><dt>Modelo</dt><dd>${esc(e.modelo || '—')}</dd></div>
              <div><dt>Unidad</dt><dd>${esc(e.unidad || '—')}</dd></div>
              <div><dt>Ubicación</dt><dd>${esc(e.ubicacion || '—')}</dd></div>
              <div><dt>Fecha de alta</dt><dd>${fmtDate(e.fechaAlta)}</dd></div>
              <div><dt>Última actualización</dt><dd>${fmtDateTime(e.actualizado)}</dd></div>
              <div style="grid-column:1/-1"><dt>Observaciones</dt><dd>${esc(e.observaciones || '—')}</dd></div>
            </dl></div>
          </section>
          ${e.propiedad === 'Arrendado' ? `<section class="panel">
            <div class="panel-head"><h3>Contrato de arriendo</h3>${c ? `<span class="badge ${contratoStatus(c).cls}">${contratoStatus(c).label}</span>` : ''}</div>
            <div class="panel-body">${c ? `<dl class="dl">
              <div><dt>Código</dt><dd class="mono">${esc(c.codigo)}</dd></div>
              <div><dt>Proveedor</dt><dd>${esc(c.proveedor)}</dd></div>
              <div><dt>Inicio</dt><dd>${fmtDate(c.fechaInicio)}</dd></div>
              <div><dt>Término</dt><dd>${fmtDate(c.fechaTermino)}</dd></div>
              <div style="grid-column:1/-1"><dt>Contacto soporte</dt><dd>${esc(c.contacto || '—')}</dd></div></dl>` : '<span class="muted">Sin contrato asociado.</span>'}</div>
          </section>` : ''}
        </div>
        <div class="grid" style="align-content:start">
          <section class="panel">
            <div class="panel-head"><h3>Responsable</h3></div>
            <div class="panel-body">${p ? `<div class="holder"><span class="avatar">${initials(p.nombre)}</span><div><strong>${esc(p.nombre)}</strong>${p.activo ? '' : ' <span class="badge b-warn">Inactivo</span>'}<div class="muted" style="font-size:13.5px">${esc(p.rut)} · ${esc(p.cargo || '')}</div><div class="muted" style="font-size:13.5px">${esc(p.unidad || '')}</div><div style="font-size:13.5px">${esc(p.email || '')}</div></div></div>
              <p class="muted" style="margin:12px 0 0;font-size:13.5px">Asignado desde el ${fmtDate(e.fechaAsignacion)}</p>`
              : `<span class="muted">${baja ? 'Equipo dado de baja.' : 'Sin asignar.'}</span>`}</div>
          </section>
          <section class="panel">
            <div class="panel-head"><h3>Historial</h3><span class="muted" style="font-size:13px">${plural(hist.length, 'registro')}</span></div>
            <div class="panel-body"><ul class="timeline">${hist.map(m => `<li style="--tl:${tlColor(m.tipo)}"><div class="t-head"><span class="t-type">${esc(m.tipo)}</span><span class="t-date">${fmtDateTime(m.fecha)} · ${esc(m.usuario)}</span></div><div class="t-body">${esc(m.detalle)}</div></li>`).join('') || '<li>Sin movimientos.</li>'}</ul></div>
          </section>
        </div>
      </div>`;

    const handlers = {
      asignar: () => asignarModal(e), devolver: () => devolverModal(e), acta: () => printActa(e.personaId, [e.id]),
      reparar: () => reparacionModal(e, false), retorno: () => reparacionModal(e, true), editar: () => equipoForm(e),
      baja: () => bajaModal(e), aprobar: () => bajaModal(e), rechazar: () => rechazarBajaModal(e),
      'cancelar-sol': () => confirmDialog({ title: 'Retirar solicitud de baja', message: '¿Desea retirar la solicitud de baja de este equipo?', confirmLabel: 'Retirar solicitud', onConfirm: () => { e.solicitudBaja = null; log(e, 'Solicitud rechazada', 'Solicitud retirada por el usuario solicitante.'); save(); toast('Solicitud retirada.'); route(); } }),
      reactivar: () => confirmDialog({ title: 'Revertir baja', message: `El equipo <b>${esc(e.inventario)}</b> volverá a estar vigente con estado <b>Disponible</b>.`, confirmLabel: 'Revertir baja', onConfirm: () => { Object.assign(e, { estado: 'Disponible', fechaBaja: '', motivoBaja: '', detalleBaja: '' }); log(e, 'Reactivación', 'Se revierte la baja del equipo.'); save(); toast('Baja revertida.'); route(); } })
    };
    $$('[data-act]', el).forEach(b => b.addEventListener('click', () => handlers[b.dataset.act] && handlers[b.dataset.act]()));
  }

  /* =====================================================
     FUNCIONARIOS
     ===================================================== */
  const fuState = { q: '', region: '', activo: 'activos', page: 1 };

  function renderFuncionarios(el) {
    setTitle('Funcionarios', isAdmin() ? 'Todas las regiones' : 'Región ' + regionName(me.region));
    const f = fuState;
    el.innerHTML = `
      <div class="toolbar"><div class="page-actions">
        <button class="btn primary" id="btn-nuevo">${I('plus')}Nuevo funcionario</button>
        <button class="btn" id="btn-export">${I('download')}Exportar</button></div></div>
      <div class="filters" style="grid-template-columns:minmax(220px,2fr) repeat(2,minmax(0,1fr))">
        <div class="search">${I('search')}<input type="search" id="f-q" placeholder="Buscar por nombre, RUT, cargo o unidad…" value="${esc(f.q)}"></div>
        ${isAdmin() ? `<select id="f-region">${regionOptions(f.region, 'Todas las regiones')}</select>` : ''}
        <select id="f-activo">${opt('activos', 'Solo activos', f.activo)}${opt('inactivos', 'Solo inactivos', f.activo)}${opt('', 'Activos e inactivos', f.activo)}</select>
      </div>
      <div class="result-bar"><span id="fu-count"></span></div>
      <div id="fu-table"></div>`;
    let t;
    $('#f-q').addEventListener('input', e => { clearTimeout(t); t = setTimeout(() => { f.q = e.target.value; f.page = 1; draw(); }, 180); });
    if ($('#f-region')) $('#f-region').addEventListener('change', e => { f.region = e.target.value; f.page = 1; draw(); });
    $('#f-activo').addEventListener('change', e => { f.activo = e.target.value; f.page = 1; draw(); });
    $('#btn-nuevo').addEventListener('click', () => personaForm(null, isAdmin() ? '' : me.region, draw));

    const filtered = () => {
      let list = D().personas.filter(inScope);
      if (f.region) list = list.filter(p => p.region === f.region);
      if (f.activo === 'activos') list = list.filter(p => p.activo);
      if (f.activo === 'inactivos') list = list.filter(p => !p.activo);
      if (f.q) { const terms = norm(f.q).split(/\s+/); list = list.filter(p => { const h = norm([p.nombre, p.rut, rutClean(p.rut), p.cargo, p.unidad, p.email].join(' ')); return terms.every(x => h.includes(x)); }); }
      return list.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    };
    const eqCount = {};
    D().equipos.forEach(e => { if (e.personaId && e.estado === 'Asignado') eqCount[e.personaId] = (eqCount[e.personaId] || 0) + 1; });

    $('#btn-export').addEventListener('click', () => exportRows(filtered().map(p => ({ 'RUT': p.rut, 'Nombre': p.nombre, 'Cargo': p.cargo, 'Unidad': p.unidad, 'Región': regionName(p.region), 'Correo': p.email, 'Estado': p.activo ? 'Activo' : 'Inactivo', 'Equipos asignados': eqCount[p.id] || 0 })), 'funcionarios', 'Funcionarios'));

    function draw() {
      const list = filtered();
      const pg = paginate(list, f.page); f.page = pg.page;
      $('#fu-count').innerHTML = `<strong>${plural(list.length, 'funcionario')}</strong>`;
      const box = $('#fu-table');
      if (!list.length) { box.innerHTML = `<div class="table-wrap"><div class="empty"><strong>Sin resultados</strong>No hay funcionarios que coincidan.</div></div>`; return; }
      box.innerHTML = `<div class="table-wrap"><table><thead><tr><th>Nombre</th><th>RUT</th><th class="hide-sm">Cargo / unidad</th>${isAdmin() ? '<th class="hide-sm">Región</th>' : ''}<th>Equipos</th><th>Estado</th><th></th></tr></thead>
        <tbody>${pg.rows.map(p => `<tr class="clickable" data-id="${p.id}">
          <td><div style="display:flex;gap:10px;align-items:center"><span class="avatar" style="width:30px;height:30px;font-size:12px">${initials(p.nombre)}</span><div><strong>${esc(p.nombre)}</strong><span class="sub">${esc(p.email || '')}</span></div></div></td>
          <td class="mono nowrap">${esc(p.rut)}</td>
          <td class="hide-sm">${esc(p.cargo || '—')}<span class="sub">${esc(p.unidad || '')}</span></td>
          ${isAdmin() ? `<td class="hide-sm">${esc(regionName(p.region))}</td>` : ''}
          <td>${eqCount[p.id] ? `<span class="badge b-ok">${eqCount[p.id]}</span>` : '<span class="muted">0</span>'}</td>
          <td>${p.activo ? '<span class="badge b-ok">Activo</span>' : '<span class="badge b-neutral">Inactivo</span>'}</td>
          <td class="actions"><button class="icon-btn" data-edit="${p.id}" title="Editar" aria-label="Editar">${I('edit')}</button></td></tr>`).join('')}</tbody></table></div>${pagerHTML(pg)}`;
      $$('tr[data-id]', box).forEach(tr => tr.addEventListener('click', ev => { if (ev.target.closest('button')) return; personaDetalle(persona(tr.dataset.id), draw); }));
      $$('[data-edit]', box).forEach(b => b.addEventListener('click', () => personaForm(persona(b.dataset.edit), '', draw)));
      bindPager(box, p => { f.page = p; draw(); });
    }
    draw();
  }

  function personaForm(p, region, onDone) {
    const isNew = !p;
    const x = p || { rut: '', nombre: '', cargo: '', unidad: '', region: region || '', email: '', activo: true };
    openModal({
      title: isNew ? 'Nuevo funcionario' : 'Editar funcionario',
      body: `<div class="form-grid">
        <label class="field"><span>RUT <span class="req">*</span></span><input name="rut" value="${esc(x.rut)}" placeholder="12.345.678-9" class="mono"></label>
        <label class="field"><span>Nombre completo <span class="req">*</span></span><input name="nombre" value="${esc(x.nombre)}"></label>
        <label class="field"><span>Cargo</span><input name="cargo" value="${esc(x.cargo)}"></label>
        <label class="field"><span>Unidad / departamento</span><select name="unidad">${opt('', 'Seleccione…', x.unidad)}${UNIDADES.map(u => opt(u, u, x.unidad)).join('')}</select></label>
        <label class="field"><span>Región <span class="req">*</span></span><select name="region" ${isAdmin() ? '' : 'disabled'}>${regionOptions(x.region || (isAdmin() ? '' : me.region), 'Seleccione…')}</select></label>
        <label class="field"><span>Correo institucional</span><input type="email" name="email" value="${esc(x.email)}" placeholder="nombre.apellido@conaf.cl"></label>
        ${isNew ? '' : `<label class="check full"><input type="checkbox" name="activo" value="1" ${x.activo ? 'checked' : ''}> Funcionario activo</label>`}
      </div>`,
      onOpen: form => { form.elements.rut.addEventListener('blur', ev => { if (rutValid(ev.target.value)) ev.target.value = rutFormat(ev.target.value); }); },
      onSubmit: (fd, form) => {
        if (!rutValid(fd.rut)) return fieldError(form, 'rut', 'RUT inválido. Revise el dígito verificador.');
        const rut = rutFormat(fd.rut);
        if (D().personas.some(o => o !== p && rutClean(o.rut) === rutClean(rut))) return fieldError(form, 'rut', 'Ya existe un funcionario con este RUT.');
        if (!fd.nombre) return fieldError(form, 'nombre', 'Ingrese el nombre.');
        const reg = isAdmin() ? fd.region : me.region;
        if (!reg) return fieldError(form, 'region', 'Seleccione la región.');
        if (fd.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(fd.email)) return fieldError(form, 'email', 'Correo no válido.');
        const data = { rut, nombre: fd.nombre, cargo: fd.cargo, unidad: fd.unidad, region: reg, email: fd.email.toLowerCase(), activo: isNew ? true : !!fd.activo };
        if (isNew) { D().personas.push(Object.assign({ id: Store.uid('p') }, data)); toast('Funcionario registrado.'); }
        else {
          const asignados = D().equipos.filter(e => e.personaId === p.id && e.estado === 'Asignado');
          if (p.region !== reg && asignados.length) return fieldError(form, 'region', `Tiene ${plural(asignados.length, 'equipo')} asignado${asignados.length === 1 ? '' : 's'} en ${regionName(p.region)}. Regístrelos como devueltos antes de cambiar la región.`);
          Object.assign(p, data); toast('Cambios guardados.');
          if (!data.activo && asignados.length) toast(`Atención: mantiene ${plural(asignados.length, 'equipo')} asignado${asignados.length === 1 ? '' : 's'}.`, 'warn');
        }
        save();
        setTimeout(() => (onDone || route)(), 0);
      }
    });
  }

  function personaDetalle(p, onDone) {
    const eqs = D().equipos.filter(e => e.personaId === p.id && e.estado === 'Asignado');
    const hist = D().movimientos.filter(m => (m.tipo === 'Asignación' || m.tipo === 'Devolución') && m.detalle.includes(p.rut)).slice(-8).reverse();
    openModal({
      title: p.nombre, size: 'lg',
      body: `
        <div class="holder"><span class="avatar">${initials(p.nombre)}</span><div><div class="muted">${esc(p.rut)} · ${esc(p.cargo || '')} · ${esc(p.unidad || '')}</div><div class="muted">${esc(regionName(p.region))} · ${esc(p.email || '')} ${p.activo ? '' : '· <span class="badge b-warn">Inactivo</span>'}</div></div></div>
        <h3 style="font-size:15px;margin-top:6px">Equipos asignados (${eqs.length})</h3>
        ${eqs.length ? `<div class="table-wrap"><table><thead><tr><th>Inventario</th><th>Tipo</th><th>Marca / modelo</th><th>Serie</th><th>Desde</th></tr></thead><tbody>
          ${eqs.map(e => `<tr class="clickable" data-go="${e.id}"><td class="mono"><strong>${esc(e.inventario)}</strong></td><td>${esc(e.tipo)}</td><td>${esc(e.marca)} ${esc(e.modelo)}</td><td class="mono">${esc(e.serie)}</td><td>${fmtDate(e.fechaAsignacion)}</td></tr>`).join('')}
          </tbody></table></div>` : '<p class="muted" style="margin:0">No tiene equipos asignados.</p>'}
        ${hist.length ? `<h3 style="font-size:15px;margin-top:6px">Movimientos recientes</h3><ul class="timeline">${hist.map(m => `<li style="--tl:${tlColor(m.tipo)}"><div class="t-head"><span class="t-type">${esc(m.tipo)}</span><span class="mono">${esc(m.inventario)}</span><span class="t-date">${fmtDateTime(m.fecha)}</span></div></li>`).join('')}</ul>` : ''}`,
      footer: `<button type="button" class="btn" data-close>Cerrar</button>
        <button type="button" class="btn" id="pd-edit">${I('edit')}Editar</button>
        ${eqs.length ? `<button type="button" class="btn primary" id="pd-acta">${I('printer')}Acta con todos los equipos</button>` : ''}`,
      onOpen: form => {
        $$('[data-go]', form).forEach(tr => tr.addEventListener('click', () => { closeModal(); location.hash = '#/equipo/' + tr.dataset.go; }));
        $('#pd-edit', form).addEventListener('click', () => personaForm(p, '', onDone));
        if ($('#pd-acta', form)) $('#pd-acta', form).addEventListener('click', () => printActa(p.id, eqs.map(e => e.id)));
      }
    });
  }

  /* =====================================================
     CONTRATOS
     ===================================================== */
  function renderContratos(el) {
    setTitle('Contratos de arriendo', 'Equipos arrendados y vencimientos');
    const list = D().contratos.slice().sort((a, b) => a.fechaTermino.localeCompare(b.fechaTermino));
    el.innerHTML = `
      ${isAdmin() ? `<div class="toolbar"><button class="btn primary" id="btn-nuevo">${I('plus')}Nuevo contrato</button></div>` : ''}
      <div class="contracts">${list.map(c => {
        const st = contratoStatus(c);
        const eqs = D().equipos.filter(e => e.contratoId === c.id && inScope(e));
        const vig = eqs.filter(e => e.estado !== 'De baja');
        const total = Math.max(1, daysBetween(c.fechaInicio, c.fechaTermino));
        const elapsed = Math.min(100, Math.max(0, daysBetween(c.fechaInicio, todayISO()) / total * 100));
        return `<section class="panel contract">
          <div class="contract-top"><div><div class="code">${esc(c.codigo)}</div><h3>${esc(c.proveedor)}</h3></div><span class="badge ${st.cls}">${esc(st.label)}</span></div>
          <p class="muted" style="margin:0;font-size:14px">${esc(c.descripcion || '')}</p>
          <div><div style="display:flex;justify-content:space-between;font-size:12.5px;color:var(--muted);margin-bottom:4px"><span>${fmtDate(c.fechaInicio)}</span><span>${fmtDate(c.fechaTermino)}</span></div>
            <div class="progress"><i style="width:${elapsed}%;background:${st.left < 0 ? 'var(--danger)' : st.left <= 90 ? 'var(--accent)' : 'var(--primary)'}"></i></div></div>
          <div class="stats"><div><b>${vig.length}</b>vigentes</div><div><b>${vig.filter(e => e.estado === 'Asignado').length}</b>asignados</div><div><b>${eqs.length - vig.length}</b>devueltos / baja</div></div>
          <div class="contract-actions"><a class="btn sm" href="#/equipos?contrato=${c.id}&estado=todos">${I('eye')}Ver equipos</a>
            ${isAdmin() ? `<button class="btn sm" data-edit="${c.id}">${I('edit')}Editar</button>` : ''}</div>
        </section>`;
      }).join('') || '<div class="panel"><div class="empty"><strong>Sin contratos</strong>Registre el primer contrato de arriendo.</div></div>'}</div>`;
    if ($('#btn-nuevo')) $('#btn-nuevo').addEventListener('click', () => contratoForm(null));
    $$('[data-edit]', el).forEach(b => b.addEventListener('click', () => contratoForm(contrato(b.dataset.edit))));
  }

  function contratoForm(c) {
    const isNew = !c;
    const x = c || { codigo: '', proveedor: '', rutProveedor: '', descripcion: '', fechaInicio: todayISO(), fechaTermino: '', contacto: '' };
    openModal({
      title: isNew ? 'Nuevo contrato de arriendo' : 'Editar contrato',
      body: `<div class="form-grid">
        <label class="field"><span>Código / ID licitación <span class="req">*</span></span><input name="codigo" value="${esc(x.codigo)}" class="mono" placeholder="ARR-2026-001"></label>
        <label class="field"><span>RUT proveedor</span><input name="rutProveedor" value="${esc(x.rutProveedor)}" class="mono"></label>
        <label class="field full"><span>Proveedor <span class="req">*</span></span><input name="proveedor" value="${esc(x.proveedor)}"></label>
        <label class="field"><span>Fecha de inicio <span class="req">*</span></span><input type="date" name="fechaInicio" value="${esc(x.fechaInicio)}"></label>
        <label class="field"><span>Fecha de término <span class="req">*</span></span><input type="date" name="fechaTermino" value="${esc(x.fechaTermino)}"></label>
        <label class="field full"><span>Descripción</span><textarea name="descripcion" rows="2">${esc(x.descripcion)}</textarea></label>
        <label class="field full"><span>Contacto de soporte</span><input name="contacto" value="${esc(x.contacto)}" placeholder="Correo o teléfono de la mesa de ayuda"></label>
      </div>`,
      onSubmit: (fd, form) => {
        if (!fd.codigo) return fieldError(form, 'codigo', 'Ingrese el código.');
        if (D().contratos.some(o => o !== c && norm(o.codigo) === norm(fd.codigo))) return fieldError(form, 'codigo', 'Ya existe un contrato con este código.');
        if (!fd.proveedor) return fieldError(form, 'proveedor', 'Ingrese el proveedor.');
        if (fd.rutProveedor && !rutValid(fd.rutProveedor)) return fieldError(form, 'rutProveedor', 'RUT inválido.');
        if (!fd.fechaInicio) return fieldError(form, 'fechaInicio', 'Ingrese la fecha de inicio.');
        if (!fd.fechaTermino || fd.fechaTermino <= fd.fechaInicio) return fieldError(form, 'fechaTermino', 'Debe ser posterior a la fecha de inicio.');
        const data = { codigo: fd.codigo.toUpperCase(), proveedor: fd.proveedor, rutProveedor: fd.rutProveedor ? rutFormat(fd.rutProveedor) : '', descripcion: fd.descripcion, fechaInicio: fd.fechaInicio, fechaTermino: fd.fechaTermino, contacto: fd.contacto };
        if (isNew) D().contratos.push(Object.assign({ id: Store.uid('c') }, data)); else Object.assign(c, data);
        save(); toast(isNew ? 'Contrato registrado.' : 'Contrato actualizado.');
        setTimeout(route, 0);
      }
    });
  }

  /* =====================================================
     MOVIMIENTOS
     ===================================================== */
  const mvState = { q: '', tipo: '', region: '', desde: '', hasta: '', page: 1 };
  function renderMovimientos(el) {
    setTitle('Historial de movimientos', 'Trazabilidad de altas, asignaciones y bajas');
    const f = mvState;
    const tipos = [...new Set(D().movimientos.map(m => m.tipo))].sort();
    el.innerHTML = `
      <div class="toolbar"><button class="btn" id="btn-export">${I('download')}Exportar</button></div>
      <div class="filters">
        <div class="search">${I('search')}<input type="search" id="f-q" placeholder="Buscar inventario, detalle o usuario…" value="${esc(f.q)}"></div>
        <select id="f-tipo">${opt('', 'Todos los tipos', f.tipo)}${tipos.map(t => opt(t, t, f.tipo)).join('')}</select>
        ${isAdmin() ? `<select id="f-region">${regionOptions(f.region, 'Todas las regiones')}</select>` : ''}
        <label class="field"><input type="date" id="f-desde" value="${esc(f.desde)}" aria-label="Desde" title="Desde"></label>
        <label class="field"><input type="date" id="f-hasta" value="${esc(f.hasta)}" aria-label="Hasta" title="Hasta"></label>
      </div>
      <div class="result-bar"><span id="mv-count"></span></div>
      <div id="mv-table"></div>`;
    const filtered = () => {
      let list = D().movimientos.filter(inScope);
      if (f.tipo) list = list.filter(m => m.tipo === f.tipo);
      if (f.region) list = list.filter(m => m.region === f.region);
      if (f.desde) list = list.filter(m => m.fecha.slice(0, 10) >= f.desde);
      if (f.hasta) list = list.filter(m => m.fecha.slice(0, 10) <= f.hasta);
      if (f.q) { const terms = norm(f.q).split(/\s+/); list = list.filter(m => { const h = norm([m.inventario, m.detalle, m.usuario, m.tipo].join(' ')); return terms.every(x => h.includes(x)); }); }
      return list.slice().sort((a, b) => b.fecha.localeCompare(a.fecha));
    };
    function draw() {
      const list = filtered(), pg = paginate(list, f.page, 30); f.page = pg.page;
      $('#mv-count').innerHTML = `<strong>${plural(list.length, 'movimiento')}</strong>`;
      const box = $('#mv-table');
      if (!list.length) { box.innerHTML = '<div class="table-wrap"><div class="empty"><strong>Sin movimientos</strong>Ajuste los filtros.</div></div>'; return; }
      box.innerHTML = `<div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Tipo</th><th>Equipo</th>${isAdmin() ? '<th class="hide-sm">Región</th>' : ''}<th>Detalle</th><th class="hide-sm">Usuario</th></tr></thead><tbody>
        ${pg.rows.map(m => `<tr><td class="nowrap">${fmtDateTime(m.fecha)}</td><td class="nowrap"><span class="badge" style="background:color-mix(in srgb, ${tlColor(m.tipo)} 14%, white);color:${tlColor(m.tipo)}">${esc(m.tipo)}</span></td>
          <td class="nowrap"><a class="mono" href="#/equipo/${m.equipoId}">${esc(m.inventario)}</a></td>${isAdmin() ? `<td class="hide-sm nowrap">${esc(regionName(m.region))}</td>` : ''}
          <td style="min-width:260px">${esc(m.detalle)}</td><td class="hide-sm">${esc(m.usuario)}</td></tr>`).join('')}</tbody></table></div>${pagerHTML(pg)}`;
      bindPager(box, p => { f.page = p; draw(); });
    }
    let t;
    $('#f-q').addEventListener('input', e => { clearTimeout(t); t = setTimeout(() => { f.q = e.target.value; f.page = 1; draw(); }, 180); });
    [['tipo', 'change'], ['region', 'change'], ['desde', 'change'], ['hasta', 'change']].forEach(([k, ev]) => { const s = $('#f-' + k); if (s) s.addEventListener(ev, () => { f[k] = s.value; f.page = 1; draw(); }); });
    $('#btn-export').addEventListener('click', () => exportRows(filtered().map(m => ({ 'Fecha': fmtDateTime(m.fecha), 'Tipo': m.tipo, 'N° inventario': m.inventario, 'Región': regionName(m.region), 'Detalle': m.detalle, 'Usuario': m.usuario })), 'movimientos', 'Movimientos'));
    draw();
  }

  /* =====================================================
     USUARIOS (admin)
     ===================================================== */
  function renderUsuarios(el) {
    setTitle('Usuarios del sistema', 'Perfiles y alcance por región');
    const list = D().users.slice().sort((a, b) => (a.role === b.role ? a.name.localeCompare(b.name, 'es') : a.role === 'admin' ? -1 : 1));
    el.innerHTML = `
      <div class="toolbar"><button class="btn primary" id="btn-nuevo">${I('plus')}Nuevo usuario</button></div>
      <div class="callout info" style="margin-bottom:16px">${I('shield')}<div><b>Administrador:</b> ve y gestiona todas las regiones, aprueba bajas, administra contratos, usuarios, importaciones y respaldos.<br><b>Usuario:</b> gestiona equipos y funcionarios de su región (altas, asignaciones, devoluciones, reparaciones) y solicita bajas.</div></div>
      <div class="table-wrap"><table><thead><tr><th>Usuario</th><th>Nombre</th><th>Perfil</th><th>Región</th><th>Estado</th><th></th></tr></thead><tbody>
      ${list.map(u => `<tr><td class="mono">${esc(u.username)}</td><td>${esc(u.name)}<span class="sub">${esc(u.email || '')}</span></td>
        <td>${u.role === 'admin' ? '<span class="badge b-lease">Administrador</span>' : '<span class="badge b-own">Usuario</span>'}</td>
        <td>${u.role === 'admin' ? 'Todas' : esc(regionName(u.region))}</td>
        <td>${u.active ? '<span class="badge b-ok">Activo</span>' : '<span class="badge b-neutral">Deshabilitado</span>'}</td>
        <td class="actions"><button class="icon-btn" data-edit="${u.id}" title="Editar" aria-label="Editar">${I('edit')}</button></td></tr>`).join('')}
      </tbody></table></div>`;
    $('#btn-nuevo').addEventListener('click', () => usuarioForm(null));
    $$('[data-edit]', el).forEach(b => b.addEventListener('click', () => usuarioForm(D().users.find(u => u.id === b.dataset.edit))));
  }

  function usuarioForm(u) {
    const isNew = !u;
    const x = u || { username: '', name: '', email: '', role: 'usuario', region: '', active: true };
    const self = u && u.id === me.id;
    openModal({
      title: isNew ? 'Nuevo usuario' : 'Editar usuario',
      body: `<div class="form-grid">
        <label class="field"><span>Nombre de usuario <span class="req">*</span></span><input name="username" value="${esc(x.username)}" class="mono" ${isNew ? '' : 'disabled'} autocomplete="off"></label>
        <label class="field"><span>Nombre completo <span class="req">*</span></span><input name="name" value="${esc(x.name)}"></label>
        <label class="field full"><span>Correo</span><input type="email" name="email" value="${esc(x.email)}"></label>
        <label class="field"><span>Perfil <span class="req">*</span></span><select name="role" ${self ? 'disabled' : ''}>${opt('usuario', 'Usuario (regional)', x.role)}${opt('admin', 'Administrador (nacional)', x.role)}</select></label>
        <label class="field" id="row-region"><span>Región asignada <span class="req">*</span></span><select name="region">${regionOptions(x.region, 'Seleccione…')}</select></label>
        <label class="field full"><span>${isNew ? 'Contraseña inicial' : 'Nueva contraseña'} ${isNew ? '<span class="req">*</span>' : ''}</span><input type="password" name="password" autocomplete="new-password" placeholder="${isNew ? 'Mínimo 8 caracteres' : 'Dejar en blanco para mantener la actual'}"></label>
        ${self ? '' : `<label class="check full"><input type="checkbox" name="active" value="1" ${x.active ? 'checked' : ''}> Cuenta habilitada</label>`}
      </div>`,
      onOpen: form => {
        const sync = () => $('#row-region', form).classList.toggle('hidden', (form.elements.role.value || x.role) === 'admin');
        form.elements.role.addEventListener('change', sync); sync();
      },
      onSubmit: (fd, form) => {
        const role = self ? x.role : fd.role;
        const username = isNew ? fd.username.toLowerCase() : x.username;
        if (isNew) {
          if (!/^[a-z0-9._-]{3,}$/.test(username)) return fieldError(form, 'username', 'Mínimo 3 caracteres: letras, números, punto, guion.');
          if (D().users.some(o => o.username.toLowerCase() === username)) return fieldError(form, 'username', 'Este nombre de usuario ya existe.');
        }
        if (!fd.name) return fieldError(form, 'name', 'Ingrese el nombre.');
        if (role === 'usuario' && !fd.region) return fieldError(form, 'region', 'Seleccione la región del usuario.');
        if ((isNew || fd.password) && fd.password.length < 8) return fieldError(form, 'password', 'La contraseña debe tener al menos 8 caracteres.');
        const data = { name: fd.name, email: fd.email, role, region: role === 'admin' ? '' : fd.region, active: self ? true : !!fd.active };
        if (isNew) D().users.push(Object.assign({ id: Store.uid('u'), username, passHash: hashPass(username, fd.password) }, data));
        else { Object.assign(u, data); if (fd.password) u.passHash = hashPass(u.username, fd.password); }
        save(); toast(isNew ? 'Usuario creado.' : 'Usuario actualizado.');
        if (self) { $('#user-name').textContent = me.name; $('#user-avatar').textContent = initials(me.name); }
        setTimeout(route, 0);
      }
    });
  }

  /* =====================================================
     IMPORTAR / RESPALDO (admin)
     ===================================================== */
  function renderRespaldo(el) {
    setTitle('Importar y respaldar', 'Migración desde Excel y copias de seguridad');
    const d = D();
    el.innerHTML = `
      <div class="grid g-3">
        <section class="panel tool-card"><span class="ic">${I('upload')}</span><h3>Importar equipos desde Excel</h3>
          <p>Cargue la planilla actual (.xlsx o .csv). El sistema reconoce las columnas por su nombre, valida duplicados de inventario y serie, y crea los funcionarios responsables que no existan.</p>
          <div class="page-actions"><button class="btn primary" id="b-import">Importar planilla</button><button class="btn" id="b-template">${I('download')}Plantilla</button></div></section>
        <section class="panel tool-card"><span class="ic">${I('download')}</span><h3>Exportar catastro completo</h3>
          <p>Genera un Excel con todos los equipos (incluidas las bajas) de todas las regiones, en el formato de la planilla institucional.</p>
          <div class="page-actions"><button class="btn" id="b-export-all">Exportar a Excel</button></div></section>
        <section class="panel tool-card"><span class="ic">${I('database')}</span><h3>Respaldo del sistema</h3>
          <p>Descargue un archivo JSON con toda la información (equipos, funcionarios, contratos, usuarios e historial) o restaure uno previo.</p>
          <div class="page-actions"><button class="btn" id="b-backup">Descargar respaldo</button><button class="btn" id="b-restore">Restaurar</button></div></section>
      </div>
      <section class="panel" style="margin-top:18px">
        <div class="panel-head"><h3>Estado de la base de datos</h3></div>
        <div class="panel-body"><dl class="dl" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr))">
          <div><dt>Equipos</dt><dd>${d.equipos.length.toLocaleString('es-CL')}</dd></div>
          <div><dt>Funcionarios</dt><dd>${d.personas.length.toLocaleString('es-CL')}</dd></div>
          <div><dt>Contratos</dt><dd>${d.contratos.length}</dd></div>
          <div><dt>Usuarios</dt><dd>${d.users.length}</dd></div>
          <div><dt>Movimientos</dt><dd>${d.movimientos.length.toLocaleString('es-CL')}</dd></div>
          <div><dt>Excel</dt><dd>${window.XLSX ? 'Disponible (.xlsx)' : 'Sin conexión: solo CSV'}</dd></div>
        </dl></div>
      </section>
      <section class="panel tool-card danger" style="margin-top:18px;flex-direction:row;align-items:center;flex-wrap:wrap">
        <span class="ic">${I('refresh')}</span>
        <div style="flex:1;min-width:240px"><h3>Restablecer datos de demostración</h3><p>Borra toda la información guardada en este navegador y vuelve a cargar los datos ficticios de ejemplo.</p></div>
        <button class="btn danger" id="b-reset">Restablecer</button>
      </section>`;
    $('#b-import').addEventListener('click', importEquiposModal);
    $('#b-template').addEventListener('click', downloadTemplate);
    $('#b-export-all').addEventListener('click', () => exportRows(D().equipos.slice().sort((a, b) => a.inventario.localeCompare(b.inventario, 'es', { numeric: true })).map(equipoRow), 'catastro_equipos_nacional', 'Catastro'));
    $('#b-backup').addEventListener('click', () => { downloadBlob(JSON.stringify(D(), null, 1), `respaldo_catastro_${todayISO()}.json`, 'application/json'); toast('Respaldo descargado.'); });
    $('#b-restore').addEventListener('click', restoreModal);
    $('#b-reset').addEventListener('click', () => confirmDialog({
      title: 'Restablecer datos de demostración', danger: true, confirmLabel: 'Borrar y restablecer',
      message: 'Se eliminará <b>toda</b> la información registrada en este navegador. Descargue un respaldo antes si desea conservarla. Las contraseñas vuelven a ser las de demostración.',
      onConfirm: () => { Store.reset(); me = D().users.find(u => u.id === 'u_admin'); try { sessionStorage.setItem(SESSION_KEY, me.id); } catch (e) { /* */ } toast('Datos restablecidos.'); startApp(); setTimeout(route, 0); }
    }));
  }

  function downloadTemplate() {
    const rows = [{
      'N° inventario': 'CONAF-20001', 'N° serie': 'PF3ABC12', 'Tipo': 'Notebook', 'Marca': 'Lenovo', 'Modelo': 'ThinkPad E14 Gen 5',
      'Propiedad': 'Arrendado', 'Contrato': D().contratos[0] ? D().contratos[0].codigo : '', 'Región': 'Maule', 'Unidad': 'Dirección Regional',
      'Ubicación': 'Oficina 12', 'Estado': 'Asignado', 'RUT responsable': '12.345.678-5', 'Responsable': 'Nombre Apellido Apellido',
      'Fecha alta': fmtDate(todayISO()), 'Observaciones': ''
    }, {
      'N° inventario': 'CONAF-20002', 'N° serie': '5CG1234XYZ', 'Tipo': 'Monitor', 'Marca': 'HP', 'Modelo': 'P24 G5',
      'Propiedad': 'Propio', 'Contrato': '', 'Región': 'Metropolitana', 'Unidad': '', 'Ubicación': 'Bodega TI', 'Estado': 'Disponible',
      'RUT responsable': '', 'Responsable': '', 'Fecha alta': fmtDate(todayISO()), 'Observaciones': ''
    }];
    exportRows(rows, 'plantilla_importacion', 'Equipos');
  }

  function restoreModal() {
    openModal({
      title: 'Restaurar respaldo', submitLabel: 'Restaurar', submitClass: 'danger',
      body: `<div class="callout warn">${I('alert')}<div>La información actual será <b>reemplazada</b> por la del respaldo.</div></div>
        <label class="field"><span>Archivo de respaldo (.json)</span><input type="file" name="file" accept=".json,application/json"></label>`,
      onSubmit: (fd, form) => {
        const file = form.elements.file.files[0];
        if (!file) return fieldError(form, 'file', 'Seleccione un archivo.');
        const fr = new FileReader();
        fr.onload = () => {
          try {
            const obj = JSON.parse(fr.result);
            if (!Array.isArray(obj.equipos) || !Array.isArray(obj.users) || !Array.isArray(obj.personas)) throw new Error('formato');
            obj.contratos = obj.contratos || []; obj.movimientos = obj.movimientos || [];
            if (!obj.users.some(u => u.role === 'admin' && u.active)) throw new Error('sin admin');
            Store.replace(obj);
            const still = D().users.find(u => u.id === me.id && u.active);
            if (!still) { toast('Respaldo restaurado. Inicie sesión nuevamente.'); logout(); return; }
            me = still; toast('Respaldo restaurado.'); route();
          } catch (e) { toast('El archivo no es un respaldo válido del catastro.', 'error'); }
        };
        fr.readAsText(file);
      }
    });
  }

  /* ---------- Importación de equipos ---------- */
  function mapHeader(h) {
    const n = norm(h).replace(/[^a-z0-9]/g, '');
    if (!n) return null;
    if (n.includes('inventario') || n === 'inv' || n === 'ninv') return 'inventario';
    if (n.includes('serie') || n === 'sn' || n.includes('serial')) return 'serie';
    if (n.includes('rut')) return 'rut';
    if (n.includes('responsable') || n.includes('asignado') || n.includes('funcionario') || n === 'usuario' || n.includes('nombre')) return 'responsable';
    if (n.includes('contrato') || n.includes('licitacion')) return 'contrato';
    if (n.includes('propiedad') || n.includes('arriendo') || n.includes('arrendado') || n.includes('propio') || n.includes('tenencia')) return 'propiedad';
    if (n.includes('tipo') || n.includes('equipo') || n.includes('categoria')) return 'tipo';
    if (n.includes('marca') || n.includes('fabricante')) return 'marca';
    if (n.includes('modelo')) return 'modelo';
    if (n.includes('region')) return 'region';
    if (n.includes('unidad') || n.includes('depto') || n.includes('departamento') || n.includes('area')) return 'unidad';
    if (n.includes('ubicacion') || n.includes('oficina')) return 'ubicacion';
    if (n.includes('estado')) return 'estado';
    if (n.includes('fecha') && (n.includes('alta') || n.includes('ingreso') || n.includes('adquisicion'))) return 'fechaAlta';
    if (n.includes('observ') || n.includes('comentario') || n.includes('nota')) return 'observaciones';
    return null;
  }
  function matchRegion(v) {
    const n = norm(v).replace(/^region (de |del |de la )?/, '').replace(/[^a-z0-9 ']/g, '').trim();
    if (!n) return '';
    const byCode = REGIONES.find(r => norm(r.code) === n);
    if (byCode) return byCode.code;
    const byName = REGIONES.find(r => norm(r.name) === n) || REGIONES.find(r => norm(r.name).includes(n) || n.includes(norm(r.name)));
    if (byName) return byName.code;
    if (n.includes('santiago') || n === 'rm') return 'RM';
    if (n.includes('central') || n === 'nivel central') return 'OC';
    if (n.includes('bernardo') || n.includes('ohiggins')) return 'VI';
    return '';
  }
  function matchTipo(v) {
    const n = norm(v);
    if (!n) return 'Otro';
    const exact = TIPOS.find(t => norm(t) === n);
    if (exact) return exact;
    if (/notebook|laptop|portatil/.test(n)) return 'Notebook';
    if (/escritorio|desktop|cpu|pc\b|computador/.test(n)) return 'Computador de escritorio';
    if (/monitor|pantalla/.test(n)) return 'Monitor';
    if (/impres|multifunc|scanner|escaner/.test(n)) return 'Impresora / Multifuncional';
    if (/tablet/.test(n)) return 'Tablet';
    if (/celular|telefono|movil|smartphone/.test(n)) return 'Teléfono móvil';
    if (/proyector|data/.test(n)) return 'Proyector';
    if (/servidor|server/.test(n)) return 'Servidor';
    if (/switch|router|firewall|red|access point|ap\b/.test(n)) return 'Equipo de red';
    return 'Otro';
  }
  function matchEstado(v) {
    const n = norm(v);
    if (/baja/.test(n)) return 'De baja';
    if (/repar|servicio tecnico|falla/.test(n)) return 'En reparación';
    if (/asign|en uso|uso/.test(n)) return 'Asignado';
    if (/dispon|bodega|stock|libre/.test(n)) return 'Disponible';
    return '';
  }

  function analyzeImport(rawRows, opts) {
    const res = { nuevos: [], actualizar: [], errores: [], personasNuevas: 0, total: rawRows.length };
    if (!rawRows.length) return res;
    const headers = Object.keys(rawRows[0]);
    const map = {}; headers.forEach(h => { const k = mapHeader(h); if (k && !Object.values(map).includes(k)) map[h] = k; });
    res.columnas = Object.entries(map).map(([h, k]) => `${h} → ${k}`);
    const fields = new Set(Object.values(map));
    if (!fields.has('inventario') || !fields.has('serie')) {
      res.errores.push('No se encontraron las columnas obligatorias "N° inventario" y "N° serie".');
      return res;
    }
    const seenInv = new Set(), seenSerie = new Set();
    const tmpPersonas = [];
    rawRows.forEach((raw, i) => {
      const line = i + 2;
      const r = {}; Object.entries(map).forEach(([h, k]) => { r[k] = String(raw[h] ?? '').trim(); });
      if (!r.inventario && !r.serie) return;
      if (!r.inventario) return res.errores.push(`Fila ${line}: falta N° de inventario.`);
      if (!r.serie) return res.errores.push(`Fila ${line}: falta N° de serie (${r.inventario}).`);
      const inv = r.inventario.toUpperCase(), serie = r.serie.toUpperCase();
      if (seenInv.has(norm(inv))) return res.errores.push(`Fila ${line}: inventario ${inv} repetido en la planilla.`);
      if (seenSerie.has(norm(serie))) return res.errores.push(`Fila ${line}: serie ${serie} repetida en la planilla.`);
      seenInv.add(norm(inv)); seenSerie.add(norm(serie));
      const region = matchRegion(r.region) || opts.regionDefault;
      if (!region) return res.errores.push(`Fila ${line}: región "${r.region || '(vacía)'}" no reconocida.`);
      const existing = D().equipos.find(e => norm(e.inventario) === norm(inv));
      const serieOwner = D().equipos.find(e => norm(e.serie) === norm(serie));
      if (serieOwner && serieOwner !== existing) return res.errores.push(`Fila ${line}: la serie ${serie} ya pertenece a ${serieOwner.inventario}.`);
      if (existing && !opts.actualizar) return res.errores.push(`Fila ${line}: ${inv} ya existe (active "Actualizar existentes" para sobrescribir).`);
      let propiedad = /arr|leasing|renta/.test(norm(r.propiedad)) ? 'Arrendado' : (r.contrato ? 'Arrendado' : 'Propio');
      let contratoId = '';
      if (propiedad === 'Arrendado') {
        const c = D().contratos.find(c => norm(c.codigo) === norm(r.contrato)) || D().contratos.find(c => r.contrato && norm(c.proveedor).includes(norm(r.contrato)));
        if (c) contratoId = c.id;
        else if (r.contrato) res.errores.push(`Fila ${line}: contrato "${r.contrato}" no existe; se importa como arrendado sin contrato.`);
      }
      // Responsable
      let personaRef = null;
      if (r.rut || r.responsable) {
        if (r.rut && !rutValid(r.rut)) res.errores.push(`Fila ${line}: RUT "${r.rut}" inválido; se omite el responsable.`);
        else {
          const found = (r.rut && (D().personas.find(p => rutClean(p.rut) === rutClean(r.rut)) || tmpPersonas.find(p => rutClean(p.rut) === rutClean(r.rut))))
            || (!r.rut && r.responsable && (D().personas.find(p => p.region === region && norm(p.nombre) === norm(r.responsable)) || tmpPersonas.find(p => p.region === region && norm(p.nombre) === norm(r.responsable))));
          if (found) personaRef = found;
          else if (r.rut && r.responsable) { personaRef = { id: Store.uid('p'), rut: rutFormat(r.rut), nombre: r.responsable, cargo: '', unidad: r.unidad || '', region, email: '', activo: true, _new: true }; tmpPersonas.push(personaRef); }
          else res.errores.push(`Fila ${line}: responsable "${r.responsable || r.rut}" no encontrado (se requiere RUT y nombre para crearlo).`);
        }
      }
      let estado = matchEstado(r.estado) || (personaRef ? 'Asignado' : 'Disponible');
      if (estado === 'Asignado' && !personaRef) estado = 'Disponible';
      const item = {
        existing, data: {
          inventario: inv, serie, tipo: matchTipo(r.tipo), marca: r.marca || 'Sin marca', modelo: r.modelo || '', propiedad, contratoId, region,
          unidad: UNIDADES.find(u => norm(u) === norm(r.unidad)) || r.unidad || '', ubicacion: r.ubicacion || '', estado,
          personaId: estado === 'Asignado' && personaRef ? personaRef.id : '', fechaAlta: parseFlexDate(r.fechaAlta) || todayISO(),
          observaciones: r.observaciones || ''
        }, persona: estado === 'Asignado' ? personaRef : null
      };
      (existing ? res.actualizar : res.nuevos).push(item);
    });
    res.personas = tmpPersonas;
    res.personasNuevas = tmpPersonas.length;
    return res;
  }

  function importEquiposModal() {
    let rows = null, fileName = '';
    const form = openModal({
      title: 'Importar equipos desde Excel', size: 'lg', submitLabel: 'Importar',
      body: `
        <label class="dropzone" id="dz"><input type="file" id="imp-file" accept=".xlsx,.xls,.csv" hidden>
          <strong>Seleccione o arrastre la planilla aquí</strong>Formatos .xlsx, .xls o .csv · Columnas mínimas: N° inventario y N° serie</label>
        <div class="form-grid">
          <label class="field"><span>Región por defecto</span><select name="regionDefault">${regionOptions('', 'Ninguna (usar columna Región)')}</select><small>Se usa cuando la fila no indica región.</small></label>
          <div class="field" style="justify-content:center"><label class="check"><input type="checkbox" name="actualizar" value="1"> Actualizar equipos existentes (mismo N° inventario)</label></div>
        </div>
        <div id="imp-result"></div>`,
      onOpen: f => {
        const dz = $('#dz', f), inp = $('#imp-file', f);
        const handle = async file => {
          fileName = file.name;
          $('#imp-result', f).innerHTML = '<p class="muted">Leyendo archivo…</p>';
          try { rows = await readTableFile(file); preview(); }
          catch (err) { rows = null; $('#imp-result', f).innerHTML = `<p class="form-error">${esc(err.message)}</p>`; }
        };
        inp.addEventListener('change', () => inp.files[0] && handle(inp.files[0]));
        dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('over'); });
        dz.addEventListener('dragleave', () => dz.classList.remove('over'));
        dz.addEventListener('drop', e => { e.preventDefault(); dz.classList.remove('over'); if (e.dataTransfer.files[0]) handle(e.dataTransfer.files[0]); });
        f.elements.regionDefault.addEventListener('change', () => rows && preview());
        f.elements.actualizar.addEventListener('change', () => rows && preview());
      },
      onSubmit: (fd, f) => {
        if (!rows) { toast('Seleccione un archivo primero.', 'warn'); return false; }
        const res = analyzeImport(rows, { regionDefault: fd.regionDefault, actualizar: !!fd.actualizar });
        if (!res.nuevos.length && !res.actualizar.length) { toast('No hay filas válidas para importar.', 'error'); return false; }
        (res.personas || []).forEach(p => { delete p._new; D().personas.push(p); });
        res.nuevos.forEach(it => {
          const e = Object.assign({ id: Store.uid('e'), fechaAsignacion: it.data.personaId ? it.data.fechaAlta : '', fechaBaja: it.data.estado === 'De baja' ? todayISO() : '', motivoBaja: it.data.estado === 'De baja' ? 'Otro' : '', detalleBaja: it.data.estado === 'De baja' ? 'Importado como dado de baja.' : '', solicitudBaja: null }, it.data);
          D().equipos.push(e);
          log(e, 'Alta', `Importado desde ${fileName}. ${e.tipo} ${e.marca} ${e.modelo}, ${e.propiedad.toLowerCase()}.`);
          if (it.persona) log(e, 'Asignación', `Asignado a ${it.persona.nombre} (${it.persona.rut}) según planilla.`);
        });
        res.actualizar.forEach(it => {
          const e = it.existing;
          const before = e.personaId;
          Object.assign(e, it.data);
          if (e.personaId && e.personaId !== before) e.fechaAsignacion = todayISO();
          if (e.estado === 'De baja' && !e.fechaBaja) { e.fechaBaja = todayISO(); e.motivoBaja = 'Otro'; }
          log(e, 'Modificación', `Actualizado desde ${fileName}.`);
        });
        save();
        toast(`Importación lista: ${res.nuevos.length} nuevos, ${res.actualizar.length} actualizados.`);
        setTimeout(route, 0);
      }
    });
    function preview() {
      const res = analyzeImport(rows, { regionDefault: form.elements.regionDefault.value, actualizar: form.elements.actualizar.checked });
      $('#imp-result', form).innerHTML = `
        <p style="margin:0 0 10px"><b>${esc(fileName)}</b> · ${plural(res.total, 'fila')} leída${res.total === 1 ? '' : 's'}</p>
        <div class="import-stats">
          <div><b style="color:var(--ok)">${res.nuevos.length}</b><span>equipos nuevos</span></div>
          <div><b style="color:var(--info)">${res.actualizar.length}</b><span>a actualizar</span></div>
          <div><b>${res.personasNuevas}</b><span>funcionarios nuevos</span></div>
          <div><b style="color:${res.errores.length ? 'var(--danger)' : 'inherit'}">${res.errores.length}</b><span>observaciones</span></div>
        </div>
        ${res.columnas ? `<p class="muted" style="font-size:13px;margin:10px 0 0">Columnas reconocidas: ${esc(res.columnas.join(' · '))}</p>` : ''}
        ${res.errores.length ? `<ul class="err-list" style="margin-top:10px">${res.errores.slice(0, 200).map(e => `<li>${esc(e)}</li>`).join('')}</ul>` : ''}`;
    }
  }

  /* =====================================================
     Arranque
     ===================================================== */
  function init() {
    Store.load();
    $('#menu-btn').innerHTML = I('menu');

    $('#login-form').addEventListener('submit', e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      if (tryLogin(fd.get('username'), fd.get('password'))) startApp();
      else { $('#login-error').classList.remove('hidden'); e.target.elements.password.select(); }
    });
    $$('.demo-acc').forEach(b => b.addEventListener('click', () => {
      const f = $('#login-form'); f.elements.username.value = b.dataset.u; f.elements.password.value = b.dataset.p; f.requestSubmit();
    }));

    $('#menu-btn').addEventListener('click', () => $('#app-view').classList.toggle('nav-open'));
    $('#sidebar-scrim').addEventListener('click', () => $('#app-view').classList.remove('nav-open'));
    $('#user-btn').addEventListener('click', e => { e.stopPropagation(); $('#user-dropdown').classList.toggle('hidden'); });
    document.addEventListener('click', () => $('#user-dropdown').classList.add('hidden'));
    $('#user-dropdown').addEventListener('click', e => {
      const act = e.target.dataset.act;
      if (act === 'logout') logout();
      if (act === 'password') changePasswordModal();
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#modal-root').innerHTML) closeModal(); });
    window.addEventListener('hashchange', route);

    let sid = null;
    try { sid = sessionStorage.getItem(SESSION_KEY); } catch (e) { /* */ }
    const u = sid && D().users.find(x => x.id === sid && x.active);
    if (u) { me = u; startApp(); } else showLogin();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
