# Catastro de Equipos Informáticos · CONAF

Sistema web para administrar el inventario de equipos informáticos propios y arrendados por región, con perfiles de administrador y usuario regional.

## Cómo usarlo

1. Descomprima el archivo `.zip`.
2. Abra `index.html` con Chrome, Edge o Firefox (doble clic). No requiere instalación ni servidor.
3. Ingrese con una de las cuentas de demostración:

| Usuario         | Contraseña  | Perfil                                  |
|-----------------|-------------|-----------------------------------------|
| `admin`         | `admin123`  | Administrador (todas las regiones)      |
| `usuario.maule` | `usuario123`| Usuario regional (Región del Maule)     |
| `usuario.rm`    | `usuario123`| Usuario regional (Región Metropolitana) |

El sistema viene cargado con datos ficticios de ejemplo. Para partir desde la planilla real: **Importar / respaldo → Restablecer** (opcional) y luego **Importar planilla**.

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

- **Panel**: indicadores (vigentes, asignados, disponibles, en reparación, arrendados, bajas del año), distribución por región o unidad, por tipo, alertas y últimos movimientos.
- **Equipos**: búsqueda por inventario, serie, modelo, funcionario o RUT; filtros por región, tipo, propiedad, contrato y estado; ordenamiento; exportación a Excel.
- **Ciclo de vida**: Alta → Asignación → Devolución / Reasignación → Reparación → Baja (o solicitud de baja). Cada acción queda registrada en el historial con fecha y usuario.
- **Validaciones**: N° de inventario y N° de serie únicos; RUT con dígito verificador; los equipos arrendados exigen contrato.
- **Acta de entrega** imprimible (por equipo o con todos los equipos de un funcionario).
- **Funcionarios**: registro con RUT, cargo, unidad y región; equipos asignados a cada persona; alerta de equipos en manos de funcionarios inactivos.
- **Contratos de arriendo**: vigencia, días restantes, equipos vigentes y devueltos; alertas de contratos por vencer (90 días) o vencidos con equipos aún en uso.
- **Importar desde Excel/CSV**: reconoce las columnas por nombre (N° inventario, serie, tipo, marca, modelo, propiedad, contrato, región, unidad, estado, RUT, responsable, fecha de alta…), muestra una vista previa con observaciones y crea los funcionarios faltantes. Hay una plantilla descargable.
- **Respaldo**: exportar/restaurar toda la base en JSON.

## Estructura

```
index.html        Página única (login + aplicación)
css/styles.css    Estilos
js/store.js       Catálogos (regiones, tipos, unidades), RUT, contraseñas y persistencia
js/seed.js        Datos ficticios de demostración
js/app.js         Interfaz y lógica de negocio
```

La lectura/escritura de archivos `.xlsx` usa la librería SheetJS desde CDN; si el equipo no tiene internet, el sistema funciona igual e importa/exporta en CSV.

## Importante: alcance de esta versión

Esta versión es un **prototipo funcional**: los datos se guardan en el almacenamiento local del navegador (`localStorage`), por lo que cada computador/navegador tiene su propia copia. Sirve para validar el flujo con los equipos de trabajo y para migrar la planilla actual.

Para uso institucional multiusuario se recomienda:

1. **Backend y base de datos central** (por ejemplo PostgreSQL o SQL Server) con una API; basta con reemplazar `Store.load()` / `Store.save()` en `js/store.js` y las escrituras de `js/app.js` por llamadas a la API.
2. **Autenticación institucional** (Active Directory / Microsoft Entra ID) en lugar de las contraseñas locales.
3. **Permisos validados en el servidor**, no solo en la interfaz.
4. **Adjuntar documentos** (actas firmadas, resoluciones de baja, facturas) a cada movimiento.
5. Respaldos automáticos de la base de datos.
