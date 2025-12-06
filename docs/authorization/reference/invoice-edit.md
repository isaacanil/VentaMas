# Autorizaciones para edición de facturas

## 📘 Descripción

Las autorizaciones de edición permiten que un cajero solicite permiso para modificar facturas que ya no cumplen las reglas base (más de 24 h desde su creación o cuadre de caja cerrado). El flujo registra cada solicitud, muestra el estado en la pantalla de Autorizaciones y requiere aprobación de un rol privilegiado antes de liberar nuevamente la factura.

### Objetivos

- Evitar ediciones fuera de ventana o sin cuadre abierto.
- Centralizar solicitudes/aprobaciones en `/authorizations`.
- Mantener trazabilidad y consumos de cada autorización.

### Estado actual (2025-09)

- Servicio Firestore operativo (`invoiceEditAuthorizations.js`).
- Pantalla `AuthorizationsManager` con filtros y acciones.
- Modal de solicitud disponible desde el botón “Editar” (puede comentarse para pruebas).

### Flujo general

1. Cajero intenta editar.
2. Se validan ventana de 24h y estado de cuadre (usuarios admin/dev/owner omiten el check).
3. Si falla, se busca una autorización aprobada disponible:
   - Si existe → se marca como `used` y se permite editar.
   - Si no existe → se abre el modal para solicitar.
4. Admin revisa la tabla de solicitudes, aprueba o rechaza.
5. Tras aprobación, la próxima edición consume la autorización; si no se usa en 48 h, pasa a `expired`.

## Campos / parámetros

### Estados de una solicitud

- `pending`: creada, vence en 48 h.
- `approved`: aprobada, lista para consumirse.
- `used`: consumida tras abrir la factura.
- `rejected`: denegada por el supervisor.
- `expired`: superó la ventana de tiempo.

### Estructura en Firestore

- Ruta: `businesses/{businessId}/invoiceEditAuthorizations/{requestId}`
- Campos clave:
  - `businessID`, `invoiceId`, `invoiceNumber`
  - `status`, `reasons`, `requestNote`
  - `createdAt`, `expiresAt`
  - `requestedBy`, `approvedBy`, `usedBy`
  - `approvedAt`, `usedAt`

## APIs / rutas

### Servicios (`src/firebase/authorizations/invoiceEditAuthorizations.js`)

- `requestInvoiceEditAuthorization(user, invoice, reasons, note)`
- `approveInvoiceEditAuthorization(user, requestId, approver)`
- `rejectInvoiceEditAuthorization(user, requestId, approver)`
- `expireIfNeeded(businessId, requestId)`
- `markAuthorizationUsed(user, requestId, usedBy)`
- `getActiveApprovedAuthorizationForInvoice(user, invoice)`
- `listPendingInvoiceEditAuthorizations(user)`
- `listInvoiceEditAuthorizations(user, options)`

### UI de solicitud

- Modal `RequestInvoiceEditAuthorization`: muestra motivos (24h/cuadre), envía nota optional y maneja mensajes “pendiente” / “enviada”.

### Pantalla de Autorizaciones

- `Authorizations/InvoiceEditAuthorizations.jsx`: tabla con columnas (Factura, Solicitado por, Motivos, Creada, Expira, Estado, Acción) y filtros (Pendientes, Completadas, etc.).
- Ruta `/authorizations` (`src/routes/paths/Authorizations.jsx`), acceso desde menú Admin.

### Integración con botón “Editar”

Pseudoflujo:

1. Roles privilegiados editan sin restricciones.
2. Se calcula `isOlderThan24h` y `isCashCountOpen`.
3. Si cumple reglas → editar directamente.
4. Caso contrario → buscar autorización aprobada.
   - Si existe → `markAuthorizationUsed` y continuar.
   - Si no existe → abrir modal de solicitud.

## Versionado / compatibilidad

- Ventana y expiración fijas (48 h) desde la versión de septiembre 2025.
- Compatible con pantallas nuevas (`AuthorizationsManager`) y legacy (`InvoiceEditAuthorizations`), aunque la UI principal es la unificada.

### Consideraciones de seguridad

- Validar roles antes de aprobar/rechazar.
- Evitar múltiples `pending` por factura (el servicio ya reutiliza la más reciente).
- Registrar `approvedBy`/`usedBy` para auditoría.

### Posibles mejoras

- Expiración configurable por negocio.
- Notificaciones para admins al recibir nuevas solicitudes.
- Actualización en tiempo real mediante `onSnapshot`.
- Reportes por usuario o rango de fechas.

## Recursos relacionados

- `src/firebase/authorizations/invoiceEditAuthorizations.js`
- `src/views/pages/Authorizations/InvoiceEditAuthorizations.jsx`
- `src/views/component/modals/RequestInvoiceEditAuthorization/RequestInvoiceEditAuthorization.jsx`
- `src/routes/paths/Authorizations.jsx`
- `src/views/templates/MenuApp/MenuData/items/admin.jsx`

### Glosario rápido

- **Pendiente**: esperando decisión.
- **Aprobada**: se podrá editar; quedará `used` al consumirse.
- **Usada**: autorización consumida.
- **Rechazada**: denegada por el supervisor.
- **Expirada**: caducada por tiempo.
