/* =========================================================
   store.js — Catálogos, utilidades y persistencia
   Los datos se guardan en el navegador (localStorage).
   Para producción, reemplazar Store.load/save por llamadas a una API.
   ========================================================= */
'use strict';

const DB_KEY = 'conaf_catastro_v1';
const DB_VERSION = 2;
const SESSION_KEY = 'conaf_catastro_session';

const REGIONES = [
  { code: 'OC',   name: 'Oficina Central' },
  { code: 'XV',   name: 'Arica y Parinacota' },
  { code: 'I',    name: 'Tarapacá' },
  { code: 'II',   name: 'Antofagasta' },
  { code: 'III',  name: 'Atacama' },
  { code: 'IV',   name: 'Coquimbo' },
  { code: 'V',    name: 'Valparaíso' },
  { code: 'RM',   name: 'Metropolitana' },
  { code: 'VI',   name: "O'Higgins" },
  { code: 'VII',  name: 'Maule' },
  { code: 'XVI',  name: 'Ñuble' },
  { code: 'VIII', name: 'Biobío' },
  { code: 'IX',   name: 'La Araucanía' },
  { code: 'XIV',  name: 'Los Ríos' },
  { code: 'X',    name: 'Los Lagos' },
  { code: 'XI',   name: 'Aysén' },
  { code: 'XII',  name: 'Magallanes' }
];

// Formatos de computador usados en la planilla (columna FORMATO). AIO = "todo en uno".
const FORMATOS = ['AIO', 'DESKTOP', 'NOTEBOOK', 'SERVER'];
// Propiedad (columna PROPIEDAD): CONAF, ARRIENDO u otra institución (texto libre)
const PROPIEDADES = ['CONAF', 'ARRIENDO'];
// Tipos de la versión 1 y su formato equivalente en la planilla
const TIPOS_V1 = { 'AIO': 'AIO', 'Desktop': 'DESKTOP', 'Computador de escritorio': 'DESKTOP', 'Notebook': 'NOTEBOOK', 'Monitor': 'MONITOR', 'Impresora': 'IMPRESORA', 'Impresora / Multifuncional': 'IMPRESORA' };

// Textos que el sistema escribe en NOMBRE DEL TRABAJADOR cuando el equipo no está asignado
const NOMBRE_DISPONIBLE = 'DISPONIBLE';
const NOMBRE_BAJA = 'BAJA';
const NOMBRE_REPARACION = 'SERVICIO TÉCNICO';

// Estado del equipo según lo escrito en NOMBRE DEL TRABAJADOR (al importar la planilla)
function estadoDesdeNombre(nombre) {
  const n = String(nombre || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
  if (!n) return { estado: 'Disponible' };
  if (n === 'baja' || /^(dado de )?baja\b/.test(n)) return { estado: 'Baja' };
  if (/^(servicio tecnico|en reparacion|reparacion)\b/.test(n)) return { estado: 'Disponible', reparacion: true };
  if (/^(disponi|bodega|stock|reasignar|sin usuario|sin asignar|por asignar|libre)/.test(n)) return { estado: 'Disponible' };
  return { estado: 'Asignado' };
}

const UNIDADES = [
  'Dirección Regional',
  'Unidad de Administración y Finanzas',
  'Depto. Protección contra Incendios Forestales',
  'Depto. Áreas Silvestres Protegidas',
  'Depto. Desarrollo y Fomento Forestal',
  'Depto. Fiscalización y Evaluación Ambiental',
  'Oficina Provincial',
  'Unidad de Tecnologías de Información'
];

// La reparación no es un estado: un equipo Disponible puede estar en servicio técnico (campo `reparacion`)
const ESTADOS = ['Asignado', 'Disponible', 'Baja'];

const MOTIVOS_BAJA = [
  'Obsolescencia técnica',
  'Daño irreparable',
  'Robo o hurto',
  'Extravío',
  'Devolución a proveedor (fin de arriendo)',
  'Reemplazo por garantía',
  'Remate / donación',
  'Otro'
];

/* ---------- RUT chileno ---------- */
function rutClean(r) { return String(r || '').replace(/[^0-9kK]/g, '').toUpperCase(); }
function rutDV(num) {
  let s = 0, m = 2;
  for (let i = num.length - 1; i >= 0; i--) { s += (+num[i]) * m; m = m === 7 ? 2 : m + 1; }
  const r = 11 - (s % 11);
  return r === 11 ? '0' : r === 10 ? 'K' : String(r);
}
function rutValid(r) {
  const c = rutClean(r);
  if (c.length < 2 || !/^\d+$/.test(c.slice(0, -1))) return false;
  return rutDV(c.slice(0, -1)) === c.slice(-1);
}
// Formato de la planilla: sin puntos y con guion (12345678-9)
function rutFormat(r) {
  const c = rutClean(r);
  if (c.length < 2) return String(r || '');
  return c.slice(0, -1).replace(/^0+(?=\d)/, '') + '-' + c.slice(-1);
}

/* ---------- SHA-256 (síncrono, para contraseñas de la demo) ---------- */
function sha256(str) {
  const s = unescape(encodeURIComponent(str));
  const K = [], H = [];
  const frac = x => ((x - Math.floor(x)) * 4294967296) | 0;
  for (let p = 2, n = 0; n < 64; p++) {
    let prime = true;
    for (let f = 2; f * f <= p; f++) if (p % f === 0) { prime = false; break; }
    if (prime) { if (n < 8) H[n] = frac(Math.pow(p, 1 / 2)); K[n] = frac(Math.pow(p, 1 / 3)); n++; }
  }
  const words = [];
  for (let i = 0; i < s.length; i++) words[i >> 2] |= s.charCodeAt(i) << ((3 - i % 4) * 8);
  words[s.length >> 2] |= 0x80 << ((3 - s.length % 4) * 8);
  const nWords = ((s.length + 8) >> 6) * 16 + 16;
  for (let i = 0; i < nWords; i++) words[i] = words[i] | 0;
  words[nWords - 1] = s.length * 8;
  const ror = (v, a) => (v >>> a) | (v << (32 - a));
  let h = H.slice();
  for (let j = 0; j < nWords; j += 16) {
    const w = words.slice(j, j + 16), old = h.slice();
    for (let i = 0; i < 64; i++) {
      if (i >= 16) {
        const w15 = w[i - 15], w2 = w[i - 2];
        w[i] = (w[i - 16] + (ror(w15, 7) ^ ror(w15, 18) ^ (w15 >>> 3)) + w[i - 7] + (ror(w2, 17) ^ ror(w2, 19) ^ (w2 >>> 10))) | 0;
      }
      const a = h[0], e = h[4];
      const t1 = (h[7] + (ror(e, 6) ^ ror(e, 11) ^ ror(e, 25)) + ((e & h[5]) ^ (~e & h[6])) + K[i] + w[i]) | 0;
      const t2 = ((ror(a, 2) ^ ror(a, 13) ^ ror(a, 22)) + ((a & h[1]) ^ (a & h[2]) ^ (h[1] & h[2]))) | 0;
      h = [(t1 + t2) | 0].concat(h);
      h[4] = (h[4] + t1) | 0;
      h.pop();
    }
    for (let i = 0; i < 8; i++) h[i] = (h[i] + old[i]) | 0;
  }
  return h.map(x => (x >>> 0).toString(16).padStart(8, '0')).join('');
}
function hashPass(username, password) {
  return sha256(String(username).toLowerCase().trim() + '::' + password);
}

/* ---------- Fechas ---------- */
function isoDate(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function todayISO() { return isoDate(new Date()); }
function addDays(iso, n) { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return isoDate(d); }
function daysBetween(a, b) { return Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 86400000); }

/* ---------- Cuentas de ejemplo ---------- */
// Están siempre disponibles, con o sin datos de ejemplo; se pueden deshabilitar en Usuarios.
function cuentasDemo() {
  return [
    { id: 'u_admin', username: 'admin', name: 'Administrador General', email: 'admin@conaf.example', role: 'admin', region: '', active: true, passHash: hashPass('admin', 'admin123') },
    { id: 'u_maule', username: 'usuario.maule', name: 'Encargado TI Maule', email: 'ti.maule@conaf.example', role: 'usuario', region: 'VII', active: true, passHash: hashPass('usuario.maule', 'usuario123') },
    { id: 'u_rm', username: 'usuario.rm', name: 'Encargada TI Metropolitana', email: 'ti.rm@conaf.example', role: 'usuario', region: 'RM', active: true, passHash: hashPass('usuario.rm', 'usuario123') }
  ];
}
// Agrega las cuentas de ejemplo que falten (por nombre de usuario); las existentes no se tocan
function completarCuentasDemo(users) {
  let agregadas = 0;
  cuentasDemo().forEach(c => {
    if (!users.some(u => u.username.toLowerCase() === c.username)) {
      if (users.some(u => u.id === c.id)) c.id = c.id + '_' + Date.now().toString(36);
      users.push(c); agregadas++;
    }
  });
  return agregadas;
}

/* ---------- Persistencia ---------- */
const Store = {
  data: null,
  load() {
    try {
      const raw = localStorage.getItem(DB_KEY);
      this.data = raw ? JSON.parse(raw) : null;
    } catch (e) { this.data = null; }
    if (!this.data || !Array.isArray(this.data.equipos)) {
      this.data = this.empty();
      this.save();
    } else if (this.migrate()) this.save();
  },
  // Catastro sin datos: conserva las cuentas indicadas (con sus contraseñas) y agrega las de ejemplo que falten
  empty(users) {
    const cuentas = users ? users.slice() : [];
    completarCuentasDemo(cuentas);
    return {
      version: DB_VERSION, demo: false, creado: new Date().toISOString(), nextInventario: 10001, nextOrden: 1,
      users: cuentas, personas: [], contratos: [], equipos: [], movimientos: [], solicitudes: []
    };
  },
  // Datos de versiones anteriores.
  // Versión 2: cada equipo guarda las 13 columnas de la planilla oficial (RUT, NOMBRE DEL TRABAJADOR,
  // REGION, OFICINA, MARCA PC, MODELO PC, FORMATO, NUMERO DE SERIE, PROPIEDAD, PROVEEDOR (ARRIENDO),
  // FECHA ARRIENDO, PANTALLA MODELO y PANTALLA (N°Serie)) más los datos internos del sistema.
  migrate() {
    let changed = false;
    const d = this.data;
    if (Array.isArray(d.users) && completarCuentasDemo(d.users)) changed = true;
    d.personas = d.personas || []; d.contratos = d.contratos || []; d.movimientos = d.movimientos || [];
    if ((d.version || 1) < 2) {
      if (d.demo && typeof Seed !== 'undefined') {
        // Datos de demostración antiguos: se regeneran con el nuevo formato (se conservan las cuentas)
        const users = d.users;
        this.data = Seed.generate();
        users.forEach(u => { if (!this.data.users.some(x => x.username === u.username)) this.data.users.push(u); else Object.assign(this.data.users.find(x => x.username === u.username), { passHash: u.passHash, active: u.active, name: u.name, email: u.email }); });
        return true;
      }
      const persona = id => d.personas.find(p => p.id === id);
      const contrato = id => d.contratos.find(c => c.id === id);
      d.personas.forEach(p => { if (rutValid(p.rut)) p.rut = rutFormat(p.rut); });
      d.equipos.forEach((e, i) => {
        if (e.estado === 'De baja') e.estado = 'Baja';
        if (e.estado === 'En reparación') { e.estado = 'Disponible'; e.reparacion = { desde: e.actualizado || '', falla: e.observaciones || '' }; }
        const p = persona(e.personaId), c = contrato(e.contratoId);
        e.formato = TIPOS_V1[e.tipo] || String(e.tipo || '').toUpperCase();
        e.propiedad = e.propiedad === 'Arrendado' ? 'ARRIENDO' : e.propiedad === 'Propio' ? 'CONAF' : (e.propiedad || '');
        e.proveedor = c ? c.proveedor : '';
        e.fechaArriendo = '';
        e.oficina = [e.unidad, e.ubicacion].filter(Boolean).join(' · ');
        e.pantallaModelo = ''; e.pantallaSerie = '';
        if (e.estado === 'Asignado' && p) { e.nombre = p.nombre; e.rut = p.rut; }
        else { e.nombre = e.estado === 'Baja' ? NOMBRE_BAJA : e.reparacion ? NOMBRE_REPARACION : NOMBRE_DISPONIBLE; e.rut = ''; }
        e.orden = i + 1;
        delete e.tipo; delete e.unidad; delete e.ubicacion;
      });
      d.nextOrden = d.equipos.length + 1;
      d.version = DB_VERSION;
      changed = true;
    }
    if (!d.nextOrden) { d.nextOrden = d.equipos.reduce((m, e) => Math.max(m, e.orden || 0), 0) + 1; changed = true; }
    return changed;
  },
  save() {
    try { localStorage.setItem(DB_KEY, JSON.stringify(this.data)); return true; }
    catch (e) { console.error(e); return false; }
  },
  reset() { this.data = Seed.generate(); this.save(); },
  clear() { this.data = this.empty(this.data.users); this.save(); },
  replace(obj) { this.data = obj; this.migrate(); this.save(); },
  uid(prefix) { return (prefix || 'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
};
