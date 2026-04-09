# Billing Hibrido + Azul - Notas de Diseno Inicial

Fecha: 2026-02-21  
Estado: borrador validado en conversacion (base para implementacion)

## 1) Objetivo

Definir una arquitectura de suscripciones y pagos escalable para VentaMas que:

- Permita anti-abuso en Demo.
- Quite el comportamiento "infinito" actual en Plus con limites reales.
- Mantenga a usuarios actuales sin impacto (legacy).
- Use Azul ahora, pero con diseno desacoplado para poder cambiar/agregar proveedores (CardNET, Stripe, PayPal) sin rehacer el dominio.
- Incluya panel para developers y experiencia clara para clientes (que pagan, por que pagan, estado y trazabilidad).

## 2) Decisiones cerradas

1. Modelo de suscripcion: **hibrido**, con base por cuenta owner y capacidad por negocio cuando aplique.
2. En esta etapa: cuentas actuales se mantienen en **legacy** (sin impacto inmediato); migracion manual despues.
3. Activacion inicial de planes no-legacy: **solo por panel de desarrollador**.
4. Proveedor activo inicial: **Azul**, con arquitectura desacoplada por adaptadores.
5. Politica por exceso de negocios: mostrar mensaje de limite alcanzado y recomendacion de actualizar plan.
6. `maxUsers` debe ser **por negocio** (no global por cuenta).
7. Enforcement inicial:
   - `demo` y `plus`: bloqueo duro por limites.
   - `legacy`: sin bloqueo por limites (modo continuidad).
8. Tipo de bloqueo: **selectivo**; bloquear solo operaciones que incrementan uso.
9. Dunning: **3 reintentos + 7 dias de gracia**, luego `past_due` con restricciones.

## 3) Limites Plus v1 (aprobados)

- `maxBusinesses`: 1 (por cuenta)
- `maxUsers`: 12 (por negocio)
- `maxProducts`: 20000
- `maxMonthlyInvoices`: 25000
- `maxClients`: 10000
- `maxSuppliers`: 3000
- `maxWarehouses`: 4
- `maxOpenCashRegisters`: 12

Nota: Plus debe ser "justo por RD$1,500", sin convertirse en plan ilimitado.

## 4) Politica de cambios de plan (operacion enterprise)

1. Cambios versionados; no se edita en vivo el plan activo.
2. Estados de version: `draft -> scheduled -> active -> deprecated`.
3. Publicacion con `effectiveAt` global (no por renovacion individual).
4. Ventana de aviso configurable: `7 | 15 | 30` dias (default: `30`).
5. Formulario de cambios con validacion estricta de tipos, rangos y consistencia.
6. Previa de impacto (preflight) antes de activar version.

## 5) Infraestructura requerida (alto nivel)

1. Dominio canonico de billing:
   - `billingAccounts`
   - `subscriptions`
   - `paymentMethods`
   - `paymentHistory`
   - `businessLinks`
2. Catalogo de planes versionado.
3. Motor de enforcement de limites y features.
4. Adaptador de proveedor de pago:
   - interfaz comun
   - implementacion inicial Azul
   - extensible a CardNET/Stripe/PayPal.
5. Mantenimiento/operacion:
   - reconciliacion de estado de suscripciones
   - reset de contadores periodicos
   - verificacion de dunning
   - auditoria de cambios de plan y overrides.

## 6) Requisitos UX / control

1. Panel developer para administrar suscripciones, planes, politicas y programacion de cambios.
2. Portal cliente para transparencia:
   - plan activo
   - limites y consumo
   - estado de pago
   - historial de pagos
   - motivos de cobro y advertencias por limites.

## 7) Restriccion de rollout

Cambios no deben afectar usuarios actuales mientras permanezcan en `legacy`.

## 8) Temas explicitamente en backlog

1. Add-on por negocio extra sobre limite de `maxBusinesses` (no en fase inicial).
2. Politica comercial final para coexistencia de plan por cuenta y plan por negocio.
3. Definicion final de package Demo v1 (numeros exactos).

## 9) Plan por prioridades (P0..P5)

### P0 - Contrato y seguridad base (bloqueante tecnico)

- Definir modelo canonico de billing (`billingAccount`, `subscription`, `planSnapshot`).
- Definir adapter interface para proveedores y contrato Azul v1.
- Definir modelo de auditoria de billing y cambios de planes.
- Definir reglas de validacion de payloads de billing (backend).

### P1 - Catalogo versionado y politicas de vigencia

- Implementar catalogo versionado de planes con estado `draft/scheduled/active/deprecated`.
- Implementar validacion estricta para publicacion.
- Implementar politica de vigencia con `effectiveAt` y aviso configurable `7|15|30` (default 30).
- Implementar simulacion de impacto previa (preflight).

### P2 - Core de suscripcion/pagos y mantenimiento

- Implementar servicios backend para crear/actualizar/cancelar suscripciones.
- Implementar dunning (`3` reintentos + `7` dias de gracia).
- Implementar jobs de mantenimiento:
  - reconciliacion de estado de suscripciones,
  - sincronizacion de consumo,
  - reset mensual de contadores,
  - auditoria de desalineaciones.

### P3 - UX y operacion (trabajando)

Estado: **in progress**

- Panel developer para administrar suscripcion/cuenta/plan/politicas.
- Portal cliente de transparencia (plan, consumo, estado, historial de pagos).
- Ajustes de UX en configuracion para consistencia visual.
- Primer entregable en ejecucion: **pantalla de crear negocio alineada al diseno de editar negocio**.

### P4 - Enforcement y rollout controlado

- Aplicar enforcement selectivo por plan:
  - `demo`/`plus`: bloqueo en operaciones que incrementan uso.
  - `legacy`: continuidad sin bloqueo de limites.
- Publicar mensajes claros de exceso de limite y CTA de upgrade.
- Telemetria de bloqueos y excedentes para ajuste fino.

### P5 - Migracion comercial y extensibilidad de proveedores

- Migracion manual de cuentas legacy a planes nuevos.
- Habilitar add-ons (por ejemplo negocio extra) cuando se apruebe negocio/producto.
- Agregar adaptadores adicionales (`CardNET`, `Stripe`, `PayPal`) sin romper dominio.

## 10) Estado de implementacion en esta sesion

Estado general: **P0..P5 completados para rollout interno** (sin afectar usuarios actuales en legacy).

- P0:
  - Modelo canonico creado (`billingAccounts`, `subscriptions`, `paymentHistory`, `businessLinks`).
  - Contrato de adaptadores de pago y adaptador Azul v1.
  - Validaciones backend para payloads de planes/suscripciones.
- P1:
  - Catalogo versionado con `draft/scheduled/active/deprecated`.
  - Publicacion con `effectiveAt` + `noticeWindowDays` (7/15/30).
  - Preflight de impacto para limites (cuentas/negocios) via callable dev.
- P2:
  - Servicios de suscripcion/checkout/portal desacoplados por proveedor.
  - Mantenimiento programado: activar versiones, reconciliar mirrors, reset mensual, dunning.
- P3:
  - Pantalla de crear negocio alineada visualmente con editar negocio.
  - Centro de suscripcion con estado, limites/uso, historial y panel developer.
- P4:
  - Enforcement activo por plan estricto (`demo`, `plus`) en:
    - creacion de negocios (`maxBusinesses`);
    - facturacion mensual (`maxMonthlyInvoices`).
  - Mensajeria clara de upgrade al exceder limite.
  - Telemetria de bloqueos via logs estructurados en endpoints de negocio/factura.
- P5:
  - Script de migracion manual legacy -> billing account owner-level.
  - Arquitectura lista para agregar adaptadores `cardnet`, `stripe`, `paypal` sin romper dominio.

Notas de rollout:
- Usuarios actuales permanecen en `legacy` sin enforcement duro.
- Nuevas cuentas pueden gestionarse por panel dev usando asignacion de plan.
