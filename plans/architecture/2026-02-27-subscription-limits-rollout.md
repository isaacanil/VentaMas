# Plan de Rollout de Límites de Suscripción (2026-02-27)

## Objetivo
Implementar un sistema de limitación por plan con complejidad esencial, rollout gradual y compatibilidad total con clientes en plan `legacy` (ilimitado).

## Estado actual auditado
- Ya existe validación de estado de suscripción (`active`, `trialing`, `past_due`, etc.) en backend.
- Ya existe enforcement cuantitativo para facturas mensuales (`monthlyInvoices`) en flujo de creación de facturas.
- Ya existe limitación de `maxBusinesses` en creación de negocio.
- El resto de métricas del catálogo (`maxUsers`, `maxProducts`, `maxClients`, `maxSuppliers`, `maxWarehouses`, `maxOpenCashRegisters`) están definidas, pero su enforcement transversal aún es parcial/no uniforme.

## Decisiones de arquitectura
1. Un solo punto de verdad para operaciones limitables:
- Archivo de catálogo: `billing/config/limitOperations.config.js`.
- Cada operación de negocio se mapea a una métrica (`metricKey`) + delta (`incrementBy`).

2. Un solo guard reutilizable:
- `assertBusinessSubscriptionAccess` acepta `operation` y resuelve `usageDelta` desde catálogo.
- Se permite override explícito con `usageDelta` para casos especiales.

3. Rollout seguro:
- Nuevo modo de enforcement por entorno:
  - `BILLING_LIMIT_ENFORCEMENT_MODE=enforce` (default)
  - `BILLING_LIMIT_ENFORCEMENT_MODE=observe` (no bloquea; solo loguea excesos)

4. Compatibilidad `legacy`:
- `legacy` se mantiene con límites `-1` (ilimitado), por lo que no se bloquean clientes actuales.

## Fases de implementación
### Fase 1 (base técnica)
- [x] Catálogo central de operaciones limitables.
- [x] Integración del catálogo en `assertBusinessSubscriptionAccess`.
- [x] Modo `observe` para rollout progresivo.
- [x] Migración del flujo de facturas a operación catalogada (`invoice.create`).

### Fase 2 (cobertura de operaciones críticas)
- [ ] Usuarios (`user.create`) con `maxUsers`.
- [ ] Productos (`product.create`) con `maxProducts`.
- [ ] Clientes (`client.create`) con `maxClients`.
- [ ] Suplidores (`supplier.create`) con `maxSuppliers`.
- [ ] Almacenes (`warehouse.create`) con `maxWarehouses`.
- [ ] Apertura de caja (`cashRegister.open`) con `maxOpenCashRegisters`.

### Fase 3 (consistencia de uso)
- [ ] Alinear actualización de contadores `usage/current` y `usage/monthly` para cada métrica.
- [ ] Agregar jobs de reconciliación para corregir desvíos entre uso real y snapshots.

### Fase 4 (UX y observabilidad)
- [ ] Mensajes de error user-friendly por límite excedido.
- [ ] Alertas preventivas en frontend (ej. 80%, 95%).
- [ ] Dashboard de auditoría de límites por negocio/cuenta.

## Principios aplicados
- Modularidad: catálogo de operaciones separado de guard lógico.
- Bajo acoplamiento: control central reutilizable por módulos.
- Simplicidad: contrato único (`operation`) en lugar de lógica duplicada por controlador.
- Evolución segura: `observe` antes de `enforce` en nuevas operaciones.
