# Catastro de Equipos Informáticos · CONAF

Sistema web para administrar el inventario de computadores de CONAF (propios y en arriendo) por región, con perfiles de administrador y usuario regional. Desde la versión 2.0 cada equipo se registra con las mismas 13 columnas de la planilla **«Catastro Nacional UIA Unificado»**, y la planilla se importa y exporta con el mismo formato.

## Cómo usarlo

1. Descomprima el archivo `.zip`.
2. Abra `index.html` con Chrome, Edge o Firefox (doble clic). No requiere instalación ni servidor.
3. Ingrese con una de las cuentas de demostración:

| Usuario         | Contraseña  | Perfil                                  |
|-----------------|-------------|-----------------------------------------|
| `admin`         | `admin123`  | Administrador (todas las regiones)      |
| `usuario.maule` | `usuario123`| Usuario regional (Región del Maule)     |
| `usuario.rm`    | `usuario123`| Usuario regional (Región Metropolitana) |

Para partir desde la planilla real: **Importar / respaldo → Importar planilla**, marque *Reemplazar el catastro actual por esta planilla* y seleccione el archivo `.xlsx`. Para conocer el sistema sin datos reales use **Cargar datos de ejemplo**.

## Perfiles

**Administrador** (nivel nacional)
- Ve y gestiona los equipos y funcionarios de todas las regiones.
- Da de baja equipos directamente y aprueba o rechaza las solicitudes de baja de los usuarios.
- Traslada equipos entre regiones.
- Administra contratos de arriendo, usuarios del sistema, importación desde Excel y respaldos.

**Usuario** (regional)
- Ve solo los equipos, funcionarios y movimientos de su región.
- Registra altas, asignaciones, devoluciones, reasignaciones y envíos a reparación.
- Solicita bajas (quedan pendientes hasta que un administrador las aprueba).

## Funcionalidades

- **Panel**: indicadores (vigentes, asignados, disponibles, en servicio técnico, en arriendo, bajas del año), distribución por región u oficina, por formato, alertas y últimos movimientos.
- **Equipos**: tres estados (Asignado, Disponible, Baja); un equipo Disponible puede estar además *en servicio técnico* mientras se repara. Búsqueda por trabajador, RUT, oficina, serie, modelo, proveedor o pantalla; filtros por región, formato, propiedad, contrato y estado; ordenamiento; exportación en el formato de la planilla.
- **Ciclo de vida**: Alta → Asignación → Devolución / Reasignación → Reparación → Baja (o solicitud de baja). Cada acción queda registrada en el historial con fecha y usuario.
- **Validaciones**: al ingresar un equipo, N° de serie único, formato y marca obligatorios, y proveedor para los equipos en arriendo; RUT de funcionarios con dígito verificador.
- **Acta de entrega** imprimible (por equipo o con todos los equipos de un funcionario).
- **Funcionarios**: registro con RUT, cargo, unidad y región; equipos asignados a cada persona; alerta de equipos en manos de funcionarios inactivos.
- **Contratos de arriendo**: vigencia, días restantes, equipos vigentes y devueltos; alertas de contratos por vencer (90 días) o vencidos con equipos aún en uso.
- **Importar planilla**: lee todas las hojas regionales del `.xlsx` (o un `.csv` con los mismos encabezados), muestra una vista previa con observaciones (series repetidas, RUT inválidos, filas sin formato…) y crea los funcionarios con RUT válido. Hay una plantilla vacía descargable.
- **Respaldo**: exportar/restaurar toda la base en JSON.

## Estructura

```
index.html        Página única (login + aplicación)
css/styles.css    Estilos
js/xlsx.js        Lectura y escritura de archivos .xlsx (sin librerías externas)
js/planilla.js    Formato de la planilla oficial: columnas, hojas, estilos y resumen
js/store.js       Catálogos (regiones, formatos, unidades), RUT, contraseñas y persistencia
js/seed.js        Datos ficticios de demostración
js/app.js         Interfaz y lógica de negocio
```

La lectura y escritura de Excel está integrada (`js/xlsx.js`): funciona sin conexión a internet y no depende de librerías externas. Requiere un navegador actual (Chrome, Edge o Firefox).

## Formato de la planilla

La exportación genera el mismo libro que «AAAA_Catastro_Nacional_UIA_Unificado_DD.MM.AAAA.xlsx»:

- Hoja **RESUMEN** con las fórmulas por hoja (Total equipos, CONAF, ARRIENDO, Otra propiedad, AIO, DESKTOP) y la fila TOTAL.
- Una hoja por región, en el orden oficial (PC OC, Arica, Tarapaca … Magallanes), con título combinado, encabezados en azul, filtros, panel inmovilizado y los mismos anchos de columna.
- Columnas: RUT · NOMBRE DEL TRABAJADOR · REGION · OFICINA · MARCA PC · MODELO PC · FORMATO · NUMERO DE SERIE · PROPIEDAD · PROVEEDOR (ARRIENDO) · FECHA ARRIENDO · PANTALLA MODELO · PANTALLA (N°Serie).

Reglas de equivalencia con el sistema:

- El **estado** sale de NOMBRE DEL TRABAJADOR: «BAJA» → Baja; «DISPONIBLE», «BODEGA…», «Stock…», «REASIGNAR…», «sin usuario» o vacío → Disponible; «SERVICIO TÉCNICO» → Disponible en servicio técnico; cualquier nombre → Asignado. Al devolver, reparar o dar de baja un equipo, el sistema escribe ese texto en la columna y deja el RUT en blanco.
- El **N° de inventario** (CONAF-#####) es interno del sistema y no se exporta.
- La pantalla de un DESKTOP se registra en PANTALLA MODELO y PANTALLA (N°Serie) del mismo equipo.
- FECHA ARRIENDO admite una fecha (se exporta como fecha dd-mm-aaaa), un año (como número) o un texto.
- Los valores se conservan tal como vienen: importar la planilla y volver a exportarla produce el mismo contenido, celda por celda.

## Importante: alcance de esta versión

Esta versión es un **prototipo funcional**: los datos se guardan en el almacenamiento local del navegador (`localStorage`), por lo que cada computador/navegador tiene su propia copia. Sirve para validar el flujo con los equipos de trabajo y para migrar la planilla actual.

Para uso institucional multiusuario se recomienda:

1. **Backend y base de datos central** (por ejemplo PostgreSQL o SQL Server) con una API; basta con reemplazar `Store.load()` / `Store.save()` en `js/store.js` y las escrituras de `js/app.js` por llamadas a la API.
2. **Autenticación institucional** (Active Directory / Microsoft Entra ID) en lugar de las contraseñas locales.
3. **Permisos validados en el servidor**, no solo en la interfaz.
4. **Adjuntar documentos** (actas firmadas, resoluciones de baja, facturas) a cada movimiento.
5. Respaldos automáticos de la base de datos.
