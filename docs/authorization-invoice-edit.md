# Autorizaciones para edición de facturas

Este documento describe el diseño, flujo y API del módulo de autorizaciones para permitir que usuarios con rol administrador (y superiores) aprueben la edición de facturas cuando no se cumplen ciertas reglas de negocio.

## Objetivo

- Evitar que cajeros editen facturas fuera de las reglas base.
- Permitir solicitar autorización a un administrador cuando:
  - La factura tiene más de 24 horas, y/o
  - El cuadre de caja asociado no está abierto.
- Centralizar la aprobación/rechazo en una pantalla de “Autorizaciones”.
- Registrar y auditar el estado de cada solicitud.

## Estado actual (2025-09)

- Servicio Firestore implementado para crear/gestionar solicitudes.
- Pantalla “Autorizaciones” implementada con filtro por estado.
- Modal “Solicitar autorización” desde el botón Editar (intercepción ya codificada, pero si está comentada no bloquea el flujo actual).

Archivos relevantes

- src/firebase/authorizations/invoiceEditAuthorizations.js
- src/views/pages/Authorizations/InvoiceEditAuthorizations.jsx
- src/views/component/modals/RequestInvoiceEditAuthorization/RequestInvoiceEditAuthorization.jsx
- src/routes/paths/Authorizations.jsx
- src/views/templates/MenuApp/MenuData/items/admin.jsx

## Flujo general

1. Cajero intenta editar una factura.
2. Validaciones base:
   - Factura dentro de 24 horas
   - Cuadre de caja “open”
   - Usuarios privilegiados (admin/owner/dev) ignoran las restricciones
3. Si no cumple:
   - Se busca si existe una autorización aprobada y vigente para esa factura.
     - Si existe: se marca como “used” y se permite editar.
     - Si no existe: se muestra un modal para “Solicitar autorización”.
4. Un administrador revisa la solicitud en la pantalla “Autorizaciones” y decide aprobar o rechazar.
5. Si aprueba:
   - La próxima vez que el cajero intente editar, la autorización se consume y la solicitud pasa a “used”.
6. Si no hay acción en 48 horas, la solicitud pasa a “expired”.

## Estados de una solicitud

- pending: creada y esperando decisión (expira en 48h)
- approved: aprobada y lista para ser usada por el cajero
- used: aprobada y consumida al intentar editar
- rejected: rechazada por un administrador
- expired: superó el tiempo límite sin decidirse (48h)

Nota sobre “Completadas” en la UI: es un filtro práctico que agrupa approved, rejected, used y expired.

## Estructura en Firestore

Colección por negocio:

- Ruta: businesses/{businessID}/invoiceEditAuthorizations/{requestId}
- Campos:
  - businessID: string
  - invoiceId: string
  - invoiceNumber: string | null
  - status: 'pending' | 'approved' | 'rejected' | 'used' | 'expired'
  - reasons: string[]
  - requestNote: string
  - createdAt: Timestamp
  - expiresAt: Timestamp (48h desde creación)
  - requestedBy: { uid, name, role }
  - approvedBy: { uid, name, role } | null
  - approvedAt: Timestamp | null
  - usedBy: { uid, name, role } | null
  - usedAt: Timestamp | null

## API del servicio (src/firebase/authorizations/invoiceEditAuthorizations.js)

- requestInvoiceEditAuthorization(user, invoice, reasons = [], note = '')
  - Crea una nueva solicitud (o devuelve la pendiente más reciente si aún no expira).
  - Retorna: { id } o { alreadyPending: true, id }

- approveInvoiceEditAuthorization(user, requestId, approver)
  - Marca status='approved', registra approvedBy/approvedAt.

- rejectInvoiceEditAuthorization(user, requestId, approver)
  - Marca status='rejected', registra approvedBy/approvedAt.

- expireIfNeeded(businessID, requestId)
  - Si está pending y expireAt < now, marca status='expired'.

- markAuthorizationUsed(user, requestId, usedBy)
  - Marca status='used' y registra usedBy/usedAt.

- getActiveApprovedAuthorizationForInvoice(user, invoice)
  - Busca la última autorización approved para esa factura (por id o numberID). No fuerza expiración en approved.
  - Retorna: { id, ...data } | null

- listPendingInvoiceEditAuthorizations(user)
  - Lista pendientes no-expiradas (aplica expiración automática al cargar).

- listInvoiceEditAuthorizations(user, { status='pending', limitCount=200 })
  - Permite listar por 'pending' | 'completed' | 'approved' | 'rejected' | 'used' | 'expired' | 'all'.
  - Aplica expiración automática para pending al cargar.

## UI de Solicitud (cajero)

Componente: src/views/component/modals/RequestInvoiceEditAuthorization/RequestInvoiceEditAuthorization.jsx

- Muestra motivos (24h, cuadre cerrado) y permite enviar una nota.
- Llama a requestInvoiceEditAuthorization.
- Mensajes: “Ya existe una solicitud pendiente” o “Solicitud enviada”.

## Pantalla de Autorizaciones (admin)

Componente: src/views/pages/Authorizations/InvoiceEditAuthorizations.jsx

- Tabla AdvancedTable con columnas: Factura, Solicitado por, Motivos, Creada, Expira, Estado, Acción.
- Barra superior MenuApp con búsqueda.
- Barra de filtro por estado (Select): Pendientes, Completadas, Aprobadas, Rechazadas, Usadas, Expiradas, Todas.
- Acciones Aprobar/Rechazar solo visibles en el filtro “Pendientes”.

Rutas y menú

- Ruta: /authorizations (src/routes/paths/Authorizations.jsx)
- Entrada de menú (admin): src/views/templates/MenuApp/MenuData/items/admin.jsx

## Integración con botón “Editar” de facturas (referencia)

Pseudocódigo del onClick:

1. if (user.role in ['admin','owner','dev']) -> permitir editar
2. calcular isOlderThan24h y isCashCountOpen
3. if (!isOlderThan24h && isCashCountOpen) -> permitir editar
4. else intentar getActiveApprovedAuthorizationForInvoice(user, invoice)
   - si existe: markAuthorizationUsed y permitir editar
   - si no existe: abrir RequestInvoiceEditAuthorization

Si prefieres desactivar temporalmente el chequeo, comenta la llamada anterior y deja solo proceedToEdit().

## Consideraciones de seguridad

- Verificar roles al aprobar/rechazar (actualmente UI filtra; se puede endurecer en servidores si se agrega backend).
- Evitar duplicados pendiente activos por factura (ya implementado: reusa la más reciente si no expiró).
- Registrar quién aprueba/usa la autorización.

## Posibles mejoras

- Parametrizar duración de expiración (48h → configurable por negocio).
- Notificaciones (toast, correo, WhatsApp) al admin cuando hay nuevas solicitudes.
- Tiempo real: migrar listados a onSnapshot para actualización en vivo.
- Auditoría adicional y reporting (por usuario, por periodo, por estado).
- Caducidad de aprobaciones si no se usan en X horas (aparte de pending).
- Filtros extra: por solicitante, por número de factura, por rango de fechas (UI ya tiene búsqueda global).

## Glosario rápido

- Pendiente: esperando decisión.
- Aprobada: lista para usar (editable por el cajero en el siguiente intento).
- Usada: autorización consumida.
- Rechazada: denegada.
- Expirada: caducada por tiempo.
