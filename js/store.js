/* =========================================================
   store.js — Catálogos, utilidades y persistencia
   Los datos se guardan en el navegador (localStorage).
   Para producción, reemplazar Store.load/save por llamadas a una API.
   ========================================================= */
'use strict';

const DB_KEY = 'conaf_catastro_v1';
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

const TIPOS = [
  'Notebook', 'Computador de escritorio', 'Monitor', 'Impresora / Multifuncional',
  'Tablet', 'Teléfono móvil', 'Proyector', 'Servidor', 'Equipo de red', 'Otro'
];

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

const ESTADOS = ['Asignado', 'Disponible', 'En reparación', 'De baja'];

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
function rutFormat(r) {
  const c = rutClean(r);
  if (c.length < 2) return String(r || '');
  return c.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '-' + c.slice(-1);
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

/* ---------- Persistencia ---------- */
const Store = {
  data: null,
  load() {
    try {
      const raw = localStorage.getItem(DB_KEY);
      this.data = raw ? JSON.parse(raw) : null;
    } catch (e) { this.data = null; }
    if (!this.data || !Array.isArray(this.data.equipos)) {
      this.data = Seed.generate();
      this.save();
    }
  },
  save() {
    try { localStorage.setItem(DB_KEY, JSON.stringify(this.data)); return true; }
    catch (e) { console.error(e); return false; }
  },
  reset() { this.data = Seed.generate(); this.save(); },
  replace(obj) { this.data = obj; this.save(); },
  uid(prefix) { return (prefix || 'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
};
