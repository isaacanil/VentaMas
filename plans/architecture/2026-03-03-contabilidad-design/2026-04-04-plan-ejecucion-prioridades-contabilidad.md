# Plan de ejecucion por prioridades - contabilidad

Fecha original: `2026-04-04`
Actualizado con estado real del repo: `2026-04-05`

Estado: `activo`

## Problema

El repo ya no esta en fase "sin contabilidad". Hoy ya existen piezas fuertes en codigo, pero la cadena todavia no esta cerrada ni endurecida:

- productor `invoice.committed`
- productor `purchase.committed`
- proyector `accountingEvents -> journalEntries`
- mutaciones backend para asiento manual, reverso y cierre de periodo
- reportes backend para mayor, balanza y EEFF base

El drift actual ya no esta en "falta de pantallas". Los huecos reales hoy son estos:

- politica de periodo todavia no decidida
- reglas Firestore siguen con fallback global amplio
- trazabilidad bidireccional documento <-> asiento todavia es parcial en cobertura
- conciliacion bancaria todavia no pasa de diseno a workflow operativo
- el mayor sigue teniendo debilidad de performance en aperturas historicas
- la exportacion del mayor no es estable para resultados grandes
- `pending_account_mapping` y la cobertura residual del mapeo contable siguen requiriendo endurecimiento
- datos reales del piloto y lecturas legacy siguen sin validacion completa

## Objetivo

Resolver la deuda en orden de riesgo real, no por pantalla.

La prioridad es:

1. blindar operacion y control interno
2. cerrar el pipeline contable real
3. volver navegable y auditable la capa nueva
4. endurecer reportes y performance

## Restricciones

- No mezclar refactors cosmeticos con cambios de integridad contable.
- No abrir reportes "reales" nuevos antes de cerrar `journalEntries` trazables e idempotentes.
- No permitir reglas de negocio criticas solo en frontend.
- Mantener rollout gradual con compatibilidad legacy mientras se estabiliza la nueva capa.

## Decision recomendada

Trabajar en cuatro prioridades:

- `P0`: blindaje operativo y control interno
- `P1`: cierre del pipeline contable real
- `P2`: trazabilidad UX y separacion modular
- `P3`: reporting backend y escalabilidad

## No alcance inicial

Queda fuera de esta primera ola:

- impairment IFRS 9
- FX no realizado avanzado
- conciliacion bancaria completa estilo ERP
- balances materializados complejos
- limpieza exhaustiva de todo alias legacy del router

## P0. Blindaje operativo y control interno

Objetivo: eliminar duplicados, edicion insegura y cambios sin rastro.

### P0-A. Idempotencia de cobros CxC

Estado: `implementado en codigo / pendiente validacion funcional`

- [x] Agregar `idempotencyKey` a `processAccountsReceivablePayment`
- [x] Persistir dedupe en coleccion canonica por negocio
- [x] Reusar respuesta si la llave ya fue aplicada con el mismo payload
- [x] Rechazar la misma llave si llega con payload distinto

Avance `2026-04-05`:

- backend CxC ya guarda y reutiliza `accountsReceivablePaymentIdempotency`
- el helper frontend del callable ya envia `idempotencyKey`
- el submit de CxC ya reutiliza la misma llave por intento para cubrir doble click del mismo flujo

Criterios de aceptacion:

- un doble click no duplica pago
- un retry del cliente no duplica recibo
- un retry del runtime no duplica cash movements ni eventos

Referencias:

- `functions/src/app/modules/accountReceivable/functions/processAccountsReceivablePayment.js`

### P0-B. Cierre de caja idempotente y mas estricto

Estado: `implementado en codigo / pendiente validacion funcional`

- [x] Evitar que un segundo cierre vuelva a mutar `stateHistory`
- [x] Hacer early-return si la caja ya esta `closed`
- [x] Mantener la metrica `openCashRegisters` consistente ante reintentos

Avance `2026-04-05`:

- `closeCashCount` ya devuelve exito idempotente si la caja estaba cerrada
- el segundo intento ya no vuelve a escribir `stateHistory`
- el segundo intento ya no vuelve a decrementar `openCashRegisters`

Criterios de aceptacion:

- el segundo click no cambia nada material
- no se degrada la metrica de uso

Referencias:

- `functions/src/app/modules/cashCount/functions/closeCashCount.js`

### P0-C. Inmutabilidad de `journalEntries`

Estado: `avance parcial fuerte`

- [x] Cortar escritura directa del workspace contable a `journalEntries`
- [x] Mover alta de asiento manual a callable/backend
- [x] Definir regla: asiento `posted` no se edita
- [x] Correccion solo por reverso

Criterios de aceptacion:

- el frontend no puede hacer `setDoc` directo a `journalEntries`
- no existe flujo de edicion directa de un asiento posteado
- existe contrato para `reversalOfEntryId` o `reversalOfEventId`

Referencias:

- `src/modules/accounting/pages/AccountingWorkspace/hooks/useAccountingWorkspace.ts`
- `firestore.rules`

Avance `2026-04-05`:

- el alta manual ya sale por callable backend `createManualJournalEntry`
- el workspace ya no hace `setDoc` directo a `journalEntries` para ese flujo
- el workspace expone `Reversar asiento` para registros `posted`
- `reverseJournalEntry` crea el asiento inverso y marca el original como `reversed`
- no queda flujo de UI para editar `journalEntries`; el workspace solo crea asientos manuales nuevos o reversa asientos `posted`
- falta cerrar mas colecciones sensibles por reglas y migrar mutaciones que todavia no deben vivir en cliente

### P0-D. Bitacora de cambios criticos

Estado: `implementado en primer corte / pendiente endurecimiento`

- [x] Mantener bitacora en `settings/accounting/history` para configuracion monetaria
- [x] Crear bitacora equivalente para `accountingPostingProfiles`
- [x] Crear bitacora equivalente para `chartOfAccounts`
- [x] Crear bitacora equivalente para `bankAccounts`
- [x] Registrar actor, timestamp y `previous/next` en esas bitacoras
- [x] Exponer consulta visible y normalizada de la bitacora en UI

Criterios de aceptacion:

- todo cambio critico deja rastro visible
- el historial puede consultarse sin depender de logs de consola

Referencias:

- `src/modules/settings/components/GeneralConfig/configs/AccountingConfig/hooks/useAccountingConfig.ts`
- `src/modules/settings/components/GeneralConfig/configs/AccountingConfig/hooks/useAccountingPostingProfiles.ts`
- `src/modules/settings/components/GeneralConfig/configs/AccountingConfig/hooks/useChartOfAccounts.ts`

Avance `2026-04-05`:

- los cambios de `accountingPostingProfiles` ya escriben subcolecciones `history`
- `chartOfAccounts` ya registra historial `created/updated/status_changed/seeded`
- `bankAccounts` ya registra historial `created/updated/status_changed` y deja `lastChangeId/lastChangedAt` en el documento raiz
- `settings/accounting` ya conserva historial tecnico de cambios monetarios
- `AccountingSettingsForm` ya abre una `Bitacora contable` visible con `AccountingHistoryList`
- el primer corte ya unifica lectura de `settings`, `bankAccounts`, `chartOfAccounts` y `postingProfiles`
- sigue pendiente endurecer cobertura historica vieja y evitar depender de fallback por `lastChangeId` para documentos legacy

### P0-E. Reglas Firestore

Estado: `avance parcial`

- [ ] Salir de `allow read, write: if request.auth != null`
- [x] Cerrar escritura directa cliente en `journalEntries`
- [x] Cerrar escritura directa cliente en `accountingEvents`
- [x] Cerrar escritura directa cliente en `accountingPeriodClosures`
- [ ] Extender el endurecimiento al resto de colecciones contables sensibles
- [ ] Dejar backend como autoridad para mutaciones contables relevantes
- [x] Mover cierre de periodo a callable/backend

Criterios de aceptacion:

- usuario autenticado no puede mutar cualquier documento arbitrariamente
- reglas reflejan la politica de inmutabilidad

Avance `2026-04-05`:

- `accountingPeriodClosures` ya no se escribe directo desde `useAccountingWorkspace`
- el cierre de periodo sale por `closeAccountingPeriod` callable
- `firestore.rules` ya bloquea escrituras directas cliente en `journalEntries`, `accountingEvents` y `accountingPeriodClosures`
- el resto de colecciones sigue temporalmente con fallback relajado hasta migrar sus mutaciones a backend

## P1. Cierre del pipeline contable real

Objetivo: dejar de tener una cadena parcial y volverla consistente, reprocesable y auditable.

### P1-A. Formalizar `AccountingEvent`

Estado: `implementado en primer corte / pendiente cobertura final`

- [x] Existen tipos base para `AccountingEvent` en frontend
- [x] `projection.status` ya existe y se usa en el proyector
- [x] `sourceDocumentType/sourceDocumentId` ya aparecen en productores y trazabilidad
- [x] Cerrar shape comun obligatorio
- [x] Formalizar `dedupeKey`
- [x] Formalizar `idempotencyKey`
- [ ] Cerrar catalogo final de eventos y cobertura
- [x] Alinear productores, normalizadores y reportes al mismo contrato

Criterios de aceptacion:

- contrato unico para ventas, cobros, pagos, gastos y transferencias

### P1-B. Emitir productores reales faltantes

Estado: `implementado en primer corte / pendiente expansion puntual`

- [x] `invoice.committed`
  Estado `2026-04-05`: implementado en `finalize.service`; cuando la factura V2 queda `committed`, la misma transaccion persiste `businesses/{businessId}/accountingEvents/invoice.committed__{invoiceId}` si el rollout contable y `generalAccountingEnabled` estan activos.
- [x] `purchase.committed`
  Estado `2026-04-05`: implementado con trigger sobre `businesses/{businessId}/purchases/{purchaseId}`; cuando la compra transiciona a `workflowStatus/status` de finalizacion (`completed` legado/moderno), persiste `businesses/{businessId}/accountingEvents/purchase.committed__{purchaseId}` si el rollout contable y `generalAccountingEnabled` estan activos.
- [x] `accounts_payable.payment.recorded`
- [x] `accounts_payable.payment.voided`
- [x] `expense.recorded`

Nota:

En esta pasada de verificacion ya existe cobertura real para esos productores.

Lo que sigue pendiente ya no es ese primer corte, sino eventos complementarios fuera del slice:

- `expense.voided` si se decide tratarlo como evento propio
- familia contable propia de `supplierCreditNote` fuera de aplicacion via pago

Criterios de aceptacion:

- cada operacion fuerte emite un evento contable backend
- el evento queda ligado al documento origen correcto

### P1-C. Proyector `accountingEvents -> journalEntries`

Estado: `implementado en primer corte / pendiente endurecimiento`

- [x] Implementar trigger dedicado
- [x] Resolver perfil contable aplicable
- [x] Construir lineas balanceadas
- [x] Persistir `journalEntries`
- [x] Guardar `projection.journalEntryId`
- [x] Marcar errores de proyeccion sin duplicar en el primer corte

Criterios de aceptacion:

- un evento genera 0 o 1 asiento deterministico
- la creacion repetida del mismo evento no duplica asientos
- los fallos quedan marcados para reproceso futuro

Avance `2026-04-05`:

- `projectAccountingEventToJournalEntry` escucha creaciones en `accountingEvents`
- resuelve el perfil contable activo aplicable usando condiciones base (`paymentTerm`, `settlementKind`, `taxTreatment`)
- persiste `journalEntries/{eventId}` como asiento canonico cuando las lineas cuadran
- actualiza `projection.status`, `projection.journalEntryId` y `metadata.journalEntryId`
- marca `pending_account_mapping` cuando no hay perfil o faltan cuentas
- marca `failed` cuando el perfil produce lineas invalidas o no balanceadas
- el primer corte usa `onDocumentCreated`; el replay/manual retry sigue pendiente en `P1-D`

### P1-D. Replay y dead letters

Estado: `implementado en primer corte / pendiente endurecimiento operativo`

- [x] Definir estrategia minima de reintento
- [x] Crear cola de errores reprocesables
- [x] Habilitar replay manual seguro por evento

Criterios de aceptacion:

- un fallo de proyeccion no obliga a parche manual en Firestore

Avance `2026-04-05`:

- existe `replayAccountingEventProjection` como callable seguro
- los fallos de proyeccion generan `dead letters`
- una proyeccion exitosa limpia el `dead letter`
- sigue pendiente una superficie visible de operacion y un flujo de backfill masivo controlado

## P2. Trazabilidad UX y separacion modular

Objetivo: hacer usable la capa nueva sin aumentar deuda accidental.

### P2-A. Navegacion documento <-> asiento

Estado: `implementado en primer corte / pendiente cobertura total`

- [x] Contrato comun de referencia para mayor, diario y detalle
- [x] Boton `Ver origen`
- [x] Boton `Ver asiento contable`
- [x] Resolver por `sourceDocumentType/sourceDocumentId`

Criterios de aceptacion:

- desde libro mayor se puede abrir el documento origen sin heuristica fragil
- desde documento operativo se puede abrir el asiento relacionado

Avance `2026-04-05`:

- `JournalEntryDetailDrawer` ya expone `Ver origen` tanto desde libro diario como desde libro mayor
- la resolucion del origen sale de un helper comun basado en `sourceDocumentType/sourceDocumentId` y `payload`
- esta primera pasada ya abre factura real por preview global, compra por ruta de detalle, gasto por ruta de edicion y CxC asociada para cobros
- ya existe `useOpenAccountingEntry` y un contrato comun de navegacion
- ya existe `Ver asiento contable` al menos en `CxC`, compras y pagos proveedor del primer corte
- sigue pendiente ampliar cobertura a otros tipos de documento sin ruta/detail estable

### P2-B. `CxP` como submodulo navegable

Estado: `implementado en primer corte / pendiente profundizacion`

- [x] Ruta propia de `CxP`
- [x] Listado de obligaciones con acciones principales
- [x] Historial de pagos reutilizando los modales existentes
- [x] Detalle propio por compra/proveedor
- [x] `aging`
- [x] trazabilidad a compra, recibo y asiento

Criterios de aceptacion:

- operar `CxP` no depende de modales enterrados dentro de compras

Avance `2026-04-05`:

- existe la ruta propia `/accounts-payable/list` con pagina dedicada de `Cuentas por Pagar`
- el modulo nuevo reutiliza filtros de proveedor/condicion y lista solo compras `completed` con balance pendiente
- el listado de `CxP` ya concentra `Registrar pago` y `Ver pagos` usando los modales existentes
- la pantalla de compras deja de exponer esas acciones para no seguir mezclando operacion de compra con deuda del suplidor
- ya existe drawer propio con `aging`, pagos recientes, evidencia y acceso a contabilidad
- quedan pendientes una lectura mas profunda por proveedor, mejor explotacion analitica y limpieza de compras legacy con poca trazabilidad

### P2-C. Reemplazo del detalle legacy de CxC

Estado: `implementado`

- [x] Degradar `/account-receivable/info/:id` a compatibilidad
- [x] Rehacer el detalle usando la capa moderna del modal
- [x] Unificar fetches y acciones

Criterios de aceptacion:

- una sola experiencia moderna para detalle CxC
- menos consultas y menos codigo duplicado

Avance `2026-04-05`:

- la ruta legacy `/account-receivable/info/:id` ya no renderiza una pantalla propia; redirige a `/account-receivable/list?arId=...`
- el listado de CxC ahora consume `arId` desde query string para abrir `ARSummaryModal` como experiencia principal
- al cerrar el modal se limpia `arId` de la URL para evitar reaperturas fantasmas
- se eliminaron el loader legacy y el fetch duplicado que solo alimentaban la pantalla vieja

### P2-D. Reducir aliases legacy del router

Estado: `pendiente`

- [ ] Inventariar aliases realmente usados
- [ ] Mantener solo los necesarios
- [ ] Evitar crecimiento nuevo de redirects ad hoc

Criterios de aceptacion:

- tabla de redirects acotada y documentada

## P3. Reporting backend y escalabilidad

Objetivo: sacar el peso contable del cliente y endurecer la lectura del mayor.

### P3-A. Libro mayor y balanza desde backend

Estado: `implementado en primer corte / pendiente endurecimiento`

- [x] Crear consultas backend sobre `journalEntries`
- [x] Soportar filtros por periodo y cuenta
- [x] Paginar mayor por movimientos

### P3-B. Estado de resultados y balance general

Estado: `implementado en primer corte`

- [x] Calcular sobre `journalEntries` reales
- [x] Evitar mezclar preview con asientos posteados en esos paneles

### P3-C. Estrategia de performance

Estado: `pendiente`

- [ ] Evaluar materializacion de saldos por periodo
- [ ] Definir limites para vistas anuales
- [ ] Diseñar exportacion estable
- [ ] Decidir si el libro diario tambien debe migrar a un modelo backend equivalente

Criterios de aceptacion:

- un año fiscal no depende de cargar toda la coleccion por `onSnapshot`

Avance `2026-04-05`:

- `getAccountingReports` callable ya calcula en backend `Libro Mayor`, `Balanza de comprobacion`, `Estado de resultados` y `Balance general`
- el backend usa `journalEntries` posteados como fuente de verdad para estos paneles, no `accountingEvents` proyectados
- `GeneralLedgerPanel` y `FinancialReportsPanel` ya consumen la callable en vez de reconstruir snapshots desde `ledgerRecords` del cliente
- `useAccountingWorkspace` deja de suscribirse a `accountingEvents/journalEntries` cuando el panel activo es `libro mayor` o `reportes`, evitando esa carga completa en cliente para esos casos
- el mayor ya pagina server-side, pero la apertura sigue leyendo historico previo completo por periodo
- la exportacion actual del mayor sigue truncada en resultados grandes
- sigue pendiente decidir si el `libro diario` tambien debe migrar al mismo modelo

## Orden de ejecucion recomendado

1. `P0-E` quitar fallback global y endurecer reglas reales
2. politica de periodo y correccion operativa
3. conciliacion bancaria `Slice 1`
4. endurecimiento de `pending_account_mapping` y replay operativo
5. `P2-A` ampliar cobertura total de `Ver asiento contable`
6. `P3-C` aperturas/materializacion y exportacion estable del mayor
7. `Track B` validacion de piloto real y cohortes fuera del piloto

## Primer slice recomendado

Este es el primer paquete que conviene ejecutar ya:

- [ ] quitar fallback global de `firestore.rules`
- [ ] decidir politica de periodo
- [ ] implementar conciliacion bancaria `Slice 1`
- [ ] endurecer `pending_account_mapping` y replay operativo
- [ ] estabilizar aperturas/exportacion del mayor

## Riesgos

- Si se sigue documentando `P1` como si no existiera nada, el paquete pierde credibilidad frente al codigo real.
- Si se hace conciliacion bancaria sin usar `cashMovements` como base, se reintroduce duplicidad de fuentes entre modulos.
- Si no se endurecen reglas y politica de periodo, la politica de reversos queda incompleta desde control interno.

## Testing

- Tests unitarios para idempotencia y dedupe
- Tests de integracion para productores de eventos
- Tests de replay del proyector
- Tests de permisos/reglas sobre colecciones contables sensibles
- Prueba manual de doble click en:
  - cobro CxC
  - pago proveedor
  - cierre de caja

## Referencias del repo

- `functions/src/app/modules/accountReceivable/functions/processAccountsReceivablePayment.js`
- `functions/src/app/modules/cashCount/functions/closeCashCount.js`
- `functions/src/app/modules/accounting/functions/createManualJournalEntry.js`
- `functions/src/app/modules/accounting/functions/reverseJournalEntry.js`
- `functions/src/app/modules/accounting/functions/closeAccountingPeriod.js`
- `functions/src/app/modules/accounting/functions/getAccountingReports.js`
- `functions/src/app/modules/purchase/functions/syncPurchaseCommittedAccountingEvent.js`
- `functions/src/app/versions/v2/accounting/projectAccountingEventToJournalEntry.js`
- `functions/src/app/versions/v2/accounting/utils/accountingEvent.util.js`
- `functions/src/app/versions/v2/accounting/utils/journalEntry.util.js`
- `src/modules/accounting/pages/AccountingWorkspace/hooks/useAccountingWorkspace.ts`
- `src/modules/accounting/pages/AccountingWorkspace/hooks/useAccountingBackendReports.ts`
- `src/modules/accounting/pages/AccountingWorkspace/hooks/useAccountingOriginNavigation.ts`
- `src/modules/accountsPayable/pages/AccountsPayable/AccountsPayable.tsx`
- `src/modules/settings/components/GeneralConfig/configs/AccountingConfig/hooks/useAccountingConfig.ts`
- `src/modules/settings/components/GeneralConfig/configs/AccountingConfig/hooks/useAccountingPostingProfiles.ts`
- `src/modules/settings/components/GeneralConfig/configs/AccountingConfig/hooks/useChartOfAccounts.ts`
- `firestore.rules`
