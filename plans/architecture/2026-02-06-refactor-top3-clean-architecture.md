# Refactor Top 3 Modulos (Clean Architecture)

Fecha: 2026-02-06

## Objetivo
Refactorizar 3 modulos en `src/` que mezclaban UI + acceso a datos (Firestore) + reglas de negocio, para:
- Eliminar imports directos de `firebase/firestore` desde React (componentes y hooks).
- Mover transformaciones/calculos a logica pura en `src/domain/**`.
- Centralizar acceso a datos en `src/firebase/**` como capa de infraestructura.
- Reducir riesgos en React (evitar "sincronizar estado" via `setState` en efectos cuando el valor es derivable).

## Alcance
- Invoice V2 Recovery (hook individual)
- Inventory Sessions List (pagina)
- Sync Diagnostics (dev tool)

No se cambia el modelo de datos externo: mismos ids, mismas colecciones, mismos campos relevantes.

## Estructura Resultante

### Invoice V2 Recovery
- Dominio: `src/domain/devtools/invoiceV2Recovery/invoiceV2RecoveryLogic.ts`
  - Parseo/format de timestamps y numeros.
  - Armado de opciones/lookup para sugerencias.
  - Armado de updates para sincronizar numero de factura.
- Infra: `src/firebase/dev/invoiceV2Recovery/invoiceV2Recovery.repository.ts`
  - Lecturas de `invoices`, `invoicesV2`, `counters/lastInvoiceId`.
  - Escrituras para contador y updates de numero en documentos.
- Presentacion: `src/modules/dev/pages/DevTools/InvoiceV2Recovery/hooks/useIndividualInvoiceRecovery.ts`
  - Orquesta la carga y mantiene estado del formulario, sin importar Firestore directamente.
  - Patrones de estado "keyed" para `loading` derivado (evita resets manuales).

### Inventory Sessions List
- Dominio: `src/domain/inventory/inventorySessionsLogic.ts`
  - Resolucion/normalizacion de nombres para display.
- Infra: `src/firebase/inventory/inventorySessions.repository.ts`
  - Listener a `inventorySessions`, lecturas de `counts`, query de sesion abierta, creacion, updates.
  - Resolucion de perfiles de usuario por paths alternativos.
- Presentacion: `src/hooks/inventory/useInventorySessionsList.ts` + `src/modules/inventory/pages/InventorySessionsList/InventorySessionsList.tsx`
  - La pagina queda enfocada en filtros + render.
  - El hook orquesta suscripciones, carga de editores y backfill de nombres.

### Sync Diagnostics
- Dominio: `src/domain/warehouse/syncDiagnosticsLogic.ts`
  - Calculo de mismatches y orphans (puro).
- Infra: `src/firebase/warehouse/syncDiagnostics.repository.ts`
  - Fetch de products/batches/productsStock.
- Presentacion: `src/modules/dev/pages/DevTools/SyncDiagnostics.tsx`
  - Ejecuta fetch (infra) y calcula resultados (dominio), sin Firestore directo.

## Reglas de Dependencia
- `src/domain/**`: sin imports de `react` ni `firebase`.
- `src/firebase/**`: acceso a Firestore, devuelve datos crudos o promesas.
- `src/modules/**` / `src/hooks/**`: compone infra + dominio.

## Pruebas Manuales Sugeridas
1. Invoice V2 Recovery:
   - Seleccionar negocio, ver sugerencias, consultar contador, actualizar contador, actualizar numero y correr repair tasks.
2. Inventory Sessions List:
   - Listado carga, filtros funcionan, creacion abre sesion existente o crea nueva, editores aparecen por sesion.
3. Sync Diagnostics:
   - Ejecutar diagnostico y verificar tablas (products/batches/orphans) y sync por producto.

