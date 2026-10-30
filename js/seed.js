/* =========================================================
   seed.js — Datos ficticios de demostración
   Se generan la primera vez que se abre el sistema.
   Todo es inventado y se marca como tal: RUT bajo 1.000.000,
   correos con dominio reservado .example (RFC 2606) y
   proveedores con nombre "Demo".
   ========================================================= */
'use strict';

const Seed = {
  generate() {
    // Generador pseudoaleatorio con semilla fija (datos reproducibles)
    let seed = 20261027;
    const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    const pick = arr => arr[Math.floor(rnd() * arr.length)];
    const int = (a, b) => a + Math.floor(rnd() * (b - a + 1));
    const alnum = (n, chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789') => Array.from({ length: n }, () => pick(chars)).join('');
    const today = todayISO();
    const dateBetween = (a, b) => addDays(a, int(0, Math.max(0, daysBetween(a, b))));
    const stamp = (iso, h) => iso + 'T' + String(h ?? int(8, 18)).padStart(2, '0') + ':' + String(int(0, 59)).padStart(2, '0') + ':00';

    const nombres = ['Juan', 'María', 'José', 'Ana', 'Pedro', 'Carolina', 'Luis', 'Francisca', 'Carlos', 'Valentina', 'Jorge', 'Camila', 'Diego', 'Javiera', 'Felipe', 'Constanza', 'Rodrigo', 'Daniela', 'Cristián', 'Paula', 'Sebastián', 'Marcela', 'Andrés', 'Claudia', 'Patricio', 'Lorena', 'Matías', 'Fernanda', 'Gonzalo', 'Isabel'];
    const apellidos = ['González', 'Muñoz', 'Rojas', 'Díaz', 'Pérez', 'Soto', 'Contreras', 'Silva', 'Martínez', 'Sepúlveda', 'Morales', 'Rodríguez', 'López', 'Fuentes', 'Hernández', 'Torres', 'Araya', 'Flores', 'Espinoza', 'Valenzuela', 'Castillo', 'Tapia', 'Reyes', 'Gutiérrez', 'Castro', 'Pizarro', 'Álvarez', 'Vásquez', 'Sánchez', 'Fernández'];
    const cargos = ['Profesional', 'Técnico', 'Administrativo/a', 'Jefe/a de Departamento', 'Guardaparque', 'Encargado/a Provincial', 'Analista', 'Secretario/a', 'Jefe/a de Brigada', 'Director/a Regional'];
    const strip = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

    const catalogo = {
      'Notebook': [['Lenovo', 'ThinkPad E14 Gen 5'], ['HP', 'ProBook 440 G10'], ['Dell', 'Latitude 5440']],
      'Computador de escritorio': [['HP', 'ProDesk 400 G9 SFF'], ['Dell', 'OptiPlex 7010'], ['Lenovo', 'ThinkCentre M70q']],
      'Monitor': [['Samsung', 'S24R350'], ['LG', '24MK430H'], ['Dell', 'P2422H']],
      'Impresora / Multifuncional': [['HP', 'LaserJet Pro M404dn'], ['Brother', 'MFC-L6900DW'], ['Epson', 'EcoTank L6270']],
      'Tablet': [['Samsung', 'Galaxy Tab A8'], ['Lenovo', 'Tab M10']],
      'Teléfono móvil': [['Samsung', 'Galaxy A54'], ['Motorola', 'Moto G84']],
      'Proyector': [['Epson', 'PowerLite X49']],
      'Servidor': [['HPE', 'ProLiant DL380 Gen10']],
      'Equipo de red': [['Cisco', 'Catalyst 1000-24T'], ['Fortinet', 'FortiGate 60F']]
    };
    const serialFor = marca => ({
      Lenovo: 'PF' + alnum(6), HP: '5CG' + int(1000, 9999) + alnum(3), Dell: alnum(7),
      Samsung: 'R' + alnum(10), LG: int(100, 999) + 'NT' + alnum(6), Brother: 'U6' + alnum(8),
      Epson: 'X' + alnum(9), HPE: 'CZJ' + alnum(7), Cisco: 'FOC' + alnum(8), Fortinet: 'FGT60F' + alnum(8),
      Motorola: 'ZY' + alnum(8)
    }[marca] || alnum(10));

    // Ponderación de equipos por región
    const peso = { OC: 3, RM: 2, VIII: 2, IX: 2, VII: 2, X: 1.5, V: 1.5 };

    /* ---- Usuarios del sistema ---- */
    const users = [
      { id: 'u_admin', username: 'admin', name: 'Administrador General', email: 'admin@conaf.example', role: 'admin', region: '', active: true, passHash: hashPass('admin', 'admin123') },
      { id: 'u_maule', username: 'usuario.maule', name: 'Encargado TI Maule', email: 'ti.maule@conaf.example', role: 'usuario', region: 'VII', active: true, passHash: hashPass('usuario.maule', 'usuario123') },
      { id: 'u_rm', username: 'usuario.rm', name: 'Encargada TI Metropolitana', email: 'ti.rm@conaf.example', role: 'usuario', region: 'RM', active: true, passHash: hashPass('usuario.rm', 'usuario123') }
    ];

    /* ---- Contratos de arriendo (fechas relativas a hoy) ---- */
    const contratos = [
      { id: 'c1', codigo: 'ARR-2024-014', proveedor: 'Proveedor Demo Computación S.A.', rutProveedor: '111111', descripcion: 'Arriendo de notebooks y computadores de escritorio a nivel nacional', fechaInicio: addDays(today, -580), fechaTermino: addDays(today, 520), contacto: 'mesadeayuda@computacion-demo.example' },
      { id: 'c2', codigo: 'ARR-2023-007', proveedor: 'Proveedor Demo Impresión Ltda.', rutProveedor: '222222', descripcion: 'Servicio de impresión y multifuncionales con insumos incluidos', fechaInicio: addDays(today, -1050), fechaTermino: addDays(today, 50), contacto: 'soporte@impresion-demo.example' },
      { id: 'c3', codigo: 'ARR-2022-021', proveedor: 'Proveedor Demo Móviles SpA', rutProveedor: '333333', descripcion: 'Arriendo de tablets y equipos móviles para brigadas', fechaInicio: addDays(today, -1490), fechaTermino: addDays(today, -27), contacto: 'contratos@moviles-demo.example' }
    ];
    contratos.forEach(c => { c.rutProveedor = rutFormat(c.rutProveedor + rutDV(c.rutProveedor)); });

    /* ---- Funcionarios ---- */
    const personas = [];
    const usedRut = new Set();
    REGIONES.forEach(r => {
      const n = Math.round(4 + (peso[r.code] || 1) * 4);
      for (let i = 0; i < n; i++) {
        const nom = pick(nombres), ap1 = pick(apellidos), ap2 = pick(apellidos);
        // RUT bajo 1.000.000: fuera del rango de RUT de personas en uso, se reconoce como ficticio
        let num; do { num = String(int(100000, 999999)); } while (usedRut.has(num));
        usedRut.add(num);
        personas.push({
          id: 'p' + (personas.length + 1),
          rut: rutFormat(num + rutDV(num)),
          nombre: `${nom} ${ap1} ${ap2}`,
          cargo: i === 0 && r.code !== 'OC' ? 'Director/a Regional' : pick(cargos),
          unidad: i === 0 && r.code !== 'OC' ? 'Dirección Regional' : pick(UNIDADES),
          region: r.code,
          email: `${strip(nom)}.${strip(ap1)}@conaf.example`,
          activo: rnd() > 0.05
        });
      }
    });

    /* ---- Equipos y movimientos ---- */
    const equipos = [], movimientos = [];
    let inv = 10001;
    const mv = (eq, fecha, tipo, detalle, usuario) => movimientos.push({
      id: 'm' + (movimientos.length + 1), fecha, equipoId: eq.id, inventario: eq.inventario,
      region: eq.region, tipo, detalle, usuario: usuario || 'Carga inicial'
    });

    REGIONES.forEach(r => {
      const n = Math.round(7 + (peso[r.code] || 1) * 7 + int(0, 4));
      const gente = personas.filter(p => p.region === r.code);
      for (let i = 0; i < n; i++) {
        const tipo = rnd() < 0.42 ? 'Notebook' : pick(Object.keys(catalogo));
        const [marca, modelo] = pick(catalogo[tipo]);
        // ¿Arrendado?
        let contratoId = '';
        if (['Notebook', 'Computador de escritorio'].includes(tipo) && rnd() < 0.45) contratoId = 'c1';
        else if (tipo === 'Impresora / Multifuncional' && rnd() < 0.7) contratoId = 'c2';
        else if (['Tablet', 'Teléfono móvil'].includes(tipo) && rnd() < 0.75) contratoId = 'c3';
        const c = contratos.find(x => x.id === contratoId);
        const fechaAlta = c ? dateBetween(c.fechaInicio, addDays(c.fechaInicio, 90)) : dateBetween('2018-03-01', addDays(today, -20));

        const eq = {
          id: 'e' + inv,
          inventario: 'CONAF-' + inv,
          serie: serialFor(marca),
          tipo, marca, modelo,
          propiedad: c ? 'Arrendado' : 'Propio',
          contratoId,
          region: r.code,
          unidad: pick(UNIDADES),
          ubicacion: pick(['Edificio principal', 'Oficina 2° piso', 'Bodega TI', 'Central de Coordinación', 'Oficina Provincial', 'Sala de reuniones']),
          estado: 'Disponible',
          personaId: '',
          fechaAlta,
          fechaAsignacion: '',
          fechaBaja: '', motivoBaja: '', detalleBaja: '',
          solicitudBaja: null,
          observaciones: '',
          actualizado: stamp(fechaAlta)
        };
        inv++;
        mv(eq, stamp(fechaAlta, 9), 'Alta', `Ingreso al inventario como equipo ${eq.propiedad.toLowerCase()}${c ? ' (contrato ' + c.codigo + ')' : ''}.`);

        const viejo = !c && fechaAlta < '2020-06-01';
        const vencido = c && c.fechaTermino < today;
        const roll = rnd();
        if ((viejo && roll < 0.45) || (!c && roll < 0.05) || (vencido && roll < 0.35)) {
          eq.estado = 'De baja';
          eq.fechaBaja = vencido ? dateBetween(c.fechaTermino, today) : dateBetween(addDays(fechaAlta, 900), addDays(today, -5));
          if (eq.fechaBaja > today) eq.fechaBaja = addDays(today, -3);
          eq.motivoBaja = vencido ? 'Devolución a proveedor (fin de arriendo)' : pick(['Obsolescencia técnica', 'Obsolescencia técnica', 'Daño irreparable', 'Robo o hurto']);
          eq.detalleBaja = vencido ? 'Retirado por el proveedor según acta de devolución.' : 'Res. Exenta N° DEMO-' + int(100, 999) + '/' + eq.fechaBaja.slice(0, 4);
          mv(eq, stamp(eq.fechaBaja), 'Baja', `${eq.motivoBaja}. ${eq.detalleBaja}`);
        } else if (roll < 0.8 && gente.length && !['Servidor', 'Equipo de red'].includes(tipo)) {
          const p = pick(gente.filter(g => g.activo).length ? gente.filter(g => g.activo) : gente);
          eq.estado = 'Asignado';
          eq.personaId = p.id;
          eq.fechaAsignacion = dateBetween(addDays(fechaAlta, 1), addDays(fechaAlta, 60));
          if (eq.fechaAsignacion > today) eq.fechaAsignacion = today;
          mv(eq, stamp(eq.fechaAsignacion), 'Asignación', `Asignado a ${p.nombre} (${p.rut}).`);
        } else if (roll < 0.86) {
          eq.estado = 'En reparación';
          const f = dateBetween(addDays(today, -60), addDays(today, -2));
          eq.observaciones = 'Enviado a servicio técnico por falla de hardware.';
          mv(eq, stamp(f), 'Reparación', 'Enviado a servicio técnico por falla de hardware.');
        }
        eq.actualizado = movimientos[movimientos.length - 1].fecha;
        equipos.push(eq);
      }
    });

    /* ---- Solicitudes de baja de los usuarios regionales: pendientes y algunas ya respondidas ---- */
    const solicitudes = [];
    // Equipos propios vigentes de la región, los más antiguos primero
    const candidatos = r => equipos.filter(e => e.estado !== 'De baja' && e.propiedad === 'Propio' && e.region === r && !['Servidor', 'Equipo de red'].includes(e.tipo))
      .sort((a, b) => a.fechaAlta < b.fechaAlta ? -1 : 1);
    const rm = candidatos('RM'), vii = candidatos('VII');
    const solicitar = (e, u, motivo, detalle, f) => {
      const s = { id: 's' + (solicitudes.length + 1), tipo: 'Baja', equipoId: e.id, inventario: e.inventario, region: e.region, motivo, detalle, fecha: stamp(f), usuario: u.name, usuarioId: u.id, estado: 'Pendiente', resolucion: null, visto: true };
      solicitudes.push(s);
      e.solicitudBaja = { id: s.id, motivo, detalle, fecha: s.fecha, usuario: u.name, usuarioId: u.id };
      mv(e, s.fecha, 'Solicitud de baja', `${motivo}. ${detalle}`, u.name);
      e.actualizado = s.fecha;
      return s;
    };
    // La respuesta queda sin leer (visto: false) para que el solicitante reciba el aviso
    const responder = (s, e, estado, comentario, f) => {
      const admin = users[0];
      s.estado = estado; s.visto = false;
      s.resolucion = { fecha: stamp(f), usuario: admin.name, usuarioId: admin.id, comentario };
      e.solicitudBaja = null;
      if (estado === 'Rechazada') mv(e, s.resolucion.fecha, 'Solicitud rechazada', comentario, admin.name);
      else {
        const p = personas.find(x => x.id === e.personaId);
        if (p) mv(e, s.resolucion.fecha, 'Devolución', `Devuelto por ${p.nombre} por baja del equipo.`, admin.name);
        Object.assign(e, { estado: 'De baja', personaId: '', fechaAsignacion: '', fechaBaja: f, motivoBaja: s.motivo, detalleBaja: comentario });
        mv(e, s.resolucion.fecha, 'Baja', `${s.motivo}. ${comentario} (solicitada por ${s.usuario})`, admin.name);
      }
      e.actualizado = s.resolucion.fecha;
    };
    if (rm[0]) solicitar(rm[0], users[2], 'Obsolescencia técnica', 'Equipo no soporta sistema operativo vigente.', addDays(today, -1));
    if (rm[1]) solicitar(rm[1], users[2], 'Daño irreparable', 'Pantalla y placa madre dañadas; reparación no conveniente según informe técnico.', addDays(today, -4));
    if (vii[0]) solicitar(vii[0], users[1], 'Obsolescencia técnica', 'Equipo no soporta sistema operativo vigente.', addDays(today, -2));
    if (vii[1]) responder(solicitar(vii[1], users[1], 'Obsolescencia técnica', 'Equipo lento; no soporta las aplicaciones actuales.', addDays(today, -12)), vii[1], 'Rechazada', 'El equipo aún cumple los requisitos mínimos. Se recomienda ampliar la memoria y reasignarlo.', addDays(today, -10));
    if (vii[2]) responder(solicitar(vii[2], users[1], 'Daño irreparable', 'Placa madre dañada según informe técnico IT-DEMO-044.', addDays(today, -9)), vii[2], 'Aprobada', `Res. Exenta N° DEMO-512/${today.slice(0, 4)}.`, addDays(today, -6));

    movimientos.sort((a, b) => a.fecha < b.fecha ? -1 : 1);
    movimientos.forEach((m, i) => { m.id = 'm' + (i + 1); });

    return { version: 1, demo: true, creado: new Date().toISOString(), nextInventario: inv, users, personas, contratos, equipos, movimientos, solicitudes };
  }
};
