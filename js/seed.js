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

    // Modelos de PC por formato y pantallas para los equipos de escritorio
    const catalogo = {
      'AIO': [['HP', 'ProOne 440 G9'], ['LENOVO', 'ThinkCentre neo 50a'], ['DELL', 'OptiPlex 7410 AIO']],
      'DESKTOP': [['HP', 'ProDesk 400 G9'], ['DELL', 'OptiPlex 7010'], ['LENOVO', 'ThinkCentre M70s']],
      'NOTEBOOK': [['LENOVO', 'ThinkPad E14 Gen 5'], ['HP', 'ProBook 440 G10'], ['DELL', 'Latitude 5440']]
    };
    const pantallas = [['HP', 'P24 G5'], ['DELL', 'P2422H'], ['LG', '24MK430H'], ['SAMSUNG', 'S24R350']];
    const serialFor = marca => ({
      LENOVO: 'PF' + alnum(6), HP: '5CG' + int(1000, 9999) + alnum(3), DELL: alnum(7),
      SAMSUNG: 'R' + alnum(10), LG: int(100, 999) + 'NT' + alnum(6)
    }[marca] || alnum(10));
    const oficinas = ['Dirección Regional', 'Oficina Provincial', 'Unidad de Administración y Finanzas', 'Depto. Protección contra Incendios', 'Depto. Áreas Silvestres Protegidas', 'Depto. Fiscalización', 'Central de Coordinación'];

    // Ponderación de equipos por región
    const peso = { OC: 3, RM: 2, VIII: 2, IX: 2, VII: 2, X: 1.5, V: 1.5 };

    /* ---- Usuarios del sistema ---- */
    const users = cuentasDemo();

    /* ---- Contratos de arriendo (fechas relativas a hoy) ---- */
    const contratos = [
      { id: 'c1', codigo: 'ARR-2024-014', proveedor: 'PROVEEDOR DEMO COMPUTACIÓN', rutProveedor: '111111', descripcion: 'Arriendo de computadores AIO a nivel nacional', fechaInicio: addDays(today, -580), fechaTermino: addDays(today, 520), contacto: 'mesadeayuda@computacion-demo.example' },
      { id: 'c2', codigo: 'ARR-2023-007', proveedor: 'PROVEEDOR DEMO NOTEBOOKS', rutProveedor: '222222', descripcion: 'Arriendo de notebooks para equipos de terreno', fechaInicio: addDays(today, -1050), fechaTermino: addDays(today, 50), contacto: 'soporte@impresion-demo.example' },
      { id: 'c3', codigo: 'ARR-2022-021', proveedor: 'PROVEEDOR DEMO EQUIPOS AIO', rutProveedor: '333333', descripcion: 'Arriendo de computadores AIO para oficinas provinciales', fechaInicio: addDays(today, -1490), fechaTermino: addDays(today, -27), contacto: 'contratos@aio-demo.example' }
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
    // Cada equipo tiene las 13 columnas de la planilla oficial más los datos internos del sistema
    const equipos = [], movimientos = [];
    let inv = 10001, orden = 1;
    const mv = (eq, fecha, tipo, detalle, usuario) => movimientos.push({
      id: 'm' + (movimientos.length + 1), fecha, equipoId: eq.id, inventario: eq.inventario,
      region: eq.region, tipo, detalle, usuario: usuario || 'Carga inicial'
    });

    REGIONES.forEach(r => {
      const n = Math.round(7 + (peso[r.code] || 1) * 7 + int(0, 4));
      const gente = personas.filter(p => p.region === r.code);
      for (let i = 0; i < n; i++) {
        const formato = rnd() < 0.55 ? 'AIO' : rnd() < 0.6 ? 'DESKTOP' : 'NOTEBOOK';
        const [marca, modelo] = pick(catalogo[formato]);
        // ¿Arrendado?
        let contratoId = '';
        if (formato === 'AIO' && rnd() < 0.5) contratoId = rnd() < 0.6 ? 'c1' : 'c3';
        else if (formato === 'NOTEBOOK' && rnd() < 0.5) contratoId = 'c2';
        const c = contratos.find(x => x.id === contratoId);
        const fechaAlta = c ? dateBetween(c.fechaInicio, addDays(c.fechaInicio, 90)) : dateBetween('2018-03-01', addDays(today, -20));
        const pant = formato === 'DESKTOP' ? pick(pantallas) : null;

        const eq = {
          id: 'e' + inv,
          inventario: 'CONAF-' + inv,
          orden: orden++,
          rut: '', nombre: 'DISPONIBLE',
          region: r.code,
          oficina: pick(oficinas),
          marca, modelo, formato,
          serie: serialFor(marca),
          propiedad: c ? 'ARRIENDO' : 'CONAF',
          proveedor: c ? c.proveedor : '',
          fechaArriendo: c ? (rnd() < 0.6 ? fechaAlta : fechaAlta.slice(0, 4)) : '',
          pantallaModelo: pant ? pant.join(' ') : '',
          pantallaSerie: pant ? serialFor(pant[0]) : '',
          contratoId,
          estado: 'Disponible',
          personaId: '',
          fechaAlta,
          fechaAsignacion: '',
          fechaBaja: '', motivoBaja: '', detalleBaja: '',
          solicitudBaja: null,
          reparacion: null,
          observaciones: '',
          actualizado: stamp(fechaAlta)
        };
        inv++;
        mv(eq, stamp(fechaAlta, 9), 'Alta', `Ingreso al inventario: ${formato} ${marca} ${modelo}, propiedad ${eq.propiedad}${c ? ' (contrato ' + c.codigo + ')' : ''}.`);

        const viejo = !c && fechaAlta < '2020-06-01';
        const vencido = c && c.fechaTermino < today;
        const roll = rnd();
        if (vencido && roll < 0.35) {
          // Arriendo de un contrato vencido: devuelto al proveedor
          const f = dateBetween(c.fechaTermino, today);
          eq.estado = 'Término de contrato'; eq.nombre = 'TÉRMINO DE CONTRATO';
          eq.termino = { fecha: f, motivo: 'Vencimiento del contrato', detalle: 'Retirado por el proveedor según acta de devolución.' };
          mv(eq, stamp(f), 'Término de contrato', `${eq.termino.motivo}. ${eq.termino.detalle}`);
        } else if ((viejo && roll < 0.45) || (!c && roll < 0.05)) {
          eq.estado = 'Baja'; eq.nombre = 'BAJA';
          eq.fechaBaja = vencido ? dateBetween(c.fechaTermino, today) : dateBetween(addDays(fechaAlta, 900), addDays(today, -5));
          if (eq.fechaBaja > today) eq.fechaBaja = addDays(today, -3);
          eq.motivoBaja = vencido ? 'Devolución a proveedor (fin de arriendo)' : pick(['Obsolescencia técnica', 'Obsolescencia técnica', 'Daño irreparable', 'Robo o hurto']);
          eq.detalleBaja = vencido ? 'Retirado por el proveedor según acta de devolución.' : 'Res. Exenta N° DEMO-' + int(100, 999) + '/' + eq.fechaBaja.slice(0, 4);
          mv(eq, stamp(eq.fechaBaja), 'Baja', `${eq.motivoBaja}. ${eq.detalleBaja}`);
        } else if (roll < 0.8 && gente.length) {
          const p = pick(gente.filter(g => g.activo).length ? gente.filter(g => g.activo) : gente);
          eq.estado = 'Asignado';
          eq.personaId = p.id; eq.nombre = p.nombre; eq.rut = p.rut;
          eq.fechaAsignacion = dateBetween(addDays(fechaAlta, 1), addDays(fechaAlta, 60));
          if (eq.fechaAsignacion > today) eq.fechaAsignacion = today;
          mv(eq, stamp(eq.fechaAsignacion), 'Asignación', `Asignado a ${p.nombre} (${p.rut}).`);
        } else if (roll < 0.86) {
          // En servicio técnico: sigue Disponible, con la marca de reparación
          const f = stamp(dateBetween(addDays(today, -60), addDays(today, -2)));
          eq.reparacion = { desde: f, falla: 'Enviado a servicio técnico por falla de hardware.' };
          eq.nombre = 'SERVICIO TÉCNICO';
          mv(eq, f, 'Reparación', eq.reparacion.falla);
        }
        eq.actualizado = movimientos[movimientos.length - 1].fecha;
        equipos.push(eq);
      }
    });

    /* ---- Solicitudes de baja y de término de contrato de los usuarios regionales: pendientes y respondidas ---- */
    const solicitudes = [];
    const TERMINO = 'Término de contrato';
    const vigenteSeed = e => e.estado !== 'Baja' && e.estado !== TERMINO && !e.reparacion && !e.solicitudBaja;
    // Equipos vigentes de la región (propios para las bajas, en arriendo para los términos), los más antiguos primero
    const candidatos = (r, prop) => equipos.filter(e => vigenteSeed(e) && e.propiedad === prop && e.region === r)
      .sort((a, b) => a.fechaAlta < b.fechaAlta ? -1 : 1);
    const rm = candidatos('RM', 'CONAF'), vii = candidatos('VII', 'CONAF');
    const solicitar = (e, u, motivo, detalle, f, tipo = 'Baja') => {
      const s = { id: 's' + (solicitudes.length + 1), tipo, equipoId: e.id, inventario: e.inventario, region: e.region, motivo, detalle, fecha: stamp(f), usuario: u.name, usuarioId: u.id, estado: 'Pendiente', resolucion: null, visto: true };
      solicitudes.push(s);
      e.solicitudBaja = { id: s.id, tipo, motivo, detalle, fecha: s.fecha, usuario: u.name, usuarioId: u.id };
      mv(e, s.fecha, tipo === TERMINO ? 'Solicitud de término de contrato' : 'Solicitud de baja', `${motivo}. ${detalle}`, u.name);
      e.actualizado = s.fecha;
      return s;
    };
    // La respuesta queda sin leer (visto: false) para que el solicitante reciba el aviso
    const responder = (s, e, estado, comentario, f) => {
      const admin = users[0], termino = s.tipo === TERMINO;
      s.estado = estado; s.visto = false;
      s.resolucion = { fecha: stamp(f), usuario: admin.name, usuarioId: admin.id, comentario };
      e.solicitudBaja = null;
      if (estado === 'Rechazada') mv(e, s.resolucion.fecha, 'Solicitud rechazada', comentario, admin.name);
      else {
        const p = personas.find(x => x.id === e.personaId);
        if (p) mv(e, s.resolucion.fecha, 'Devolución', `Devuelto por ${p.nombre} por ${termino ? 'término de contrato' : 'baja del equipo'}.`, admin.name);
        Object.assign(e, { rut: '', personaId: '', fechaAsignacion: '' });
        if (termino) {
          Object.assign(e, { estado: TERMINO, nombre: 'TÉRMINO DE CONTRATO', termino: { fecha: f, motivo: s.motivo, detalle: comentario } });
          mv(e, s.resolucion.fecha, TERMINO, `${s.motivo}. ${comentario} (solicitado por ${s.usuario})`, admin.name);
        } else {
          Object.assign(e, { estado: 'Baja', nombre: 'BAJA', fechaBaja: f, motivoBaja: s.motivo, detalleBaja: comentario });
          mv(e, s.resolucion.fecha, 'Baja', `${s.motivo}. ${comentario} (solicitada por ${s.usuario})`, admin.name);
        }
      }
      e.actualizado = s.resolucion.fecha;
    };
    if (rm[0]) solicitar(rm[0], users[2], 'Obsolescencia técnica', 'Equipo no soporta sistema operativo vigente.', addDays(today, -1));
    if (rm[1]) solicitar(rm[1], users[2], 'Daño irreparable', 'Pantalla y placa madre dañadas; reparación no conveniente según informe técnico.', addDays(today, -4));
    if (vii[0]) solicitar(vii[0], users[1], 'Obsolescencia técnica', 'Equipo no soporta sistema operativo vigente.', addDays(today, -2));
    if (vii[1]) responder(solicitar(vii[1], users[1], 'Obsolescencia técnica', 'Equipo lento; no soporta las aplicaciones actuales.', addDays(today, -12)), vii[1], 'Rechazada', 'El equipo aún cumple los requisitos mínimos. Se recomienda ampliar la memoria y reasignarlo.', addDays(today, -10));
    if (vii[2]) responder(solicitar(vii[2], users[1], 'Daño irreparable', 'Placa madre dañada según informe técnico IT-DEMO-044.', addDays(today, -9)), vii[2], 'Aprobada', `Res. Exenta N° DEMO-512/${today.slice(0, 4)}.`, addDays(today, -6));

    // Términos de contrato solicitados por los usuarios regionales (equipos en arriendo)
    const rmA = candidatos('RM', 'ARRIENDO'), viiA = candidatos('VII', 'ARRIENDO');
    if (rmA[0]) solicitar(rmA[0], users[2], 'Vencimiento del contrato', 'El proveedor coordinó el retiro del equipo para el viernes.', addDays(today, -2), TERMINO);
    if (viiA[0]) solicitar(viiA[0], users[1], 'Reemplazo por el proveedor', 'El proveedor reemplaza el equipo por uno nuevo según el contrato.', addDays(today, -1), TERMINO);
    if (viiA[1]) responder(solicitar(viiA[1], users[1], 'Vencimiento del contrato', 'Equipo retirado por el proveedor.', addDays(today, -8), TERMINO), viiA[1], 'Aprobada', 'Acta de devolución DEMO-AD-031.', addDays(today, -7));
    if (viiA[2]) responder(solicitar(viiA[2], users[1], 'Término anticipado del contrato', 'La oficina ya no requiere el equipo.', addDays(today, -15), TERMINO), viiA[2], 'Rechazada', 'El contrato sigue vigente; reasigne el equipo a otro funcionario de la región.', addDays(today, -13));

    movimientos.sort((a, b) => a.fecha < b.fecha ? -1 : 1);
    movimientos.forEach((m, i) => { m.id = 'm' + (i + 1); });

    return { version: DB_VERSION, demo: true, creado: new Date().toISOString(), nextInventario: inv, nextOrden: orden, users, personas, contratos, equipos, movimientos, solicitudes };
  }
};
