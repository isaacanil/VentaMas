# 🔍 Auditoría de Cuentas por Cobrar e Integración con Facturación

## 📋 Contexto
El equipo necesita garantizar que toda factura marcada para crédito produzca una cuenta por cobrar coherente, que los pagos liquiden cuotas y facturas asociadas y que el balance general mostrado al usuario final siempre refleje Firestore. Actualmente existen reportes de facturas sin CxC o saldos congelados (ver `docs/problem-analysis/explanation/account-receivable-balance-avendys-lockhart.md`), por lo que se documenta el flujo completo y se proponen puntos de auditoría.

## 🎯 Objetivos
- Mapear el pipeline desde el POS hasta las colecciones de Firestore involucradas en CxC.
- Identificar los mecanismos de sincronización (functions, cron, hooks de UI) y los huecos actuales.
- Proponer una pantalla y checklist de auditoría para detectar facturas, cuotas o pagos fuera de sincronía.

## ⚙️ Diseño / Arquitectura

### Flujo de alta (POS → backend)
- El usuario activa CxC desde `MarkAsReceivableButton` (`src/views/pages/Sale/.../MarkAsReceivableButton.jsx`), lo que marca `cart.data.isAddedToReceivables` y abre `ReceivableManagementPanel` (`ReceivableManagementPanel.jsx`). Ese panel gestiona frecuencia, cantidad de cuotas, fecha de primer pago y comentarios usando el slice `accountsReceivable` (`src/features/accountsReceivable/accountsReceivableSlice.js`). También consulta el balance actual del cliente mediante `usePendingBalance` (`src/firebase/accountsReceivable/fbGetPendingBalance.js`).
- Al facturar, `InvoicePanel.jsx` usa `useInvoice` (`src/services/invoice/useInvoice.js`). El hook construye un payload normalizado (`buildInvoiceRequestPayload` en `src/services/invoice/invoice.service.js`) y ejecuta la callable `createInvoiceV2`.
- En backend, `createInvoiceV2` orquesta la transacción inicial y encola tareas en `invoicesV2/{id}/outbox`. La tarea `setupAR` del worker (`functions/src/versions/v2/invoice/triggers/outbox.worker.js#L700-L810`) invoca `addAccountReceivable` y `addInstallmentReceivable` dentro de la misma `tx`, garantizando que la factura, el inventario y la CxC se creen de forma atómica. El worker detecta AR duplicadas comparando `invoiceId`.
- El pipeline legacy (`src/services/invoice/invoiceService.js`) aún existe para modo prueba o scripts viejos, pero el flujo en producción depende del worker V2. La herramienta de recuperación (`src/views/pages/DevTools/InvoiceV2Recovery/`) consume los endpoints `repairInvoiceV2Http` y `autoRepairInvoiceV2Http` para reprogramar tareas (`functions/src/versions/v2/invoice/controllers/autoRepairInvoiceHttp.controller.js` y `services/repairTasks.service.js`) cuando una factura quedó sin CxC.

### Modelo de datos y colecciones
- **accountsReceivable** (`businesses/{bid}/accountsReceivable/{arId}`) – referencia a la factura (`invoiceId`), cliente (`clientId`), correlativo `numberId`, `arBalance`, `totalReceivable`, `totalInstallments`, `paidInstallments`, `isActive/isClosed` y tipos especiales (`type: 'insurance'`). Ver payload generado en `functions/src/modules/accountReceivable/services/addAccountReceivable.js` y esquema `src/schema/accountsReceivable/accountsReceivable.js`.
- **accountsReceivableInstallments** – cuotas generadas por `generateInstallments` (`functions/src/modules/accountReceivable/utils/generateInstallments.js` y `src/utils/accountsReceivable/generateInstallments.js`). Cada doc guarda `installmentBalance`, `installmentDate`, `installmentNumber` y flags de actividad.
- **accountsReceivablePayments** – registros principales creados por `fbAddPayment`/`createPaymentRecord` cuando se cobra (ver `src/firebase/accountsReceivable/payment/fbAddPayment.js` y `src/firebase/proccessAccountsReceivablePayments/arPaymentUtils.js`).
- **accountsReceivableInstallmentPayments** – desglose por cuota de cada pago, alimentado por `processInstallmentPayment` y los flujos multi-pago de aseguradoras.
- **accountsReceivablePaymentReceipt** – recibos listos para impresión enviados por `fbAddAccountReceivablePaymentReceipt`.
- **invoices** vs **invoicesV2** – las facturas definitivas siguen viviendo en `businesses/{bid}/invoices/{invoiceId}` (`fbAddInvoice.js`), mientras que `invoicesV2` aloja el snapshot, estado de orquestación y outbox (consumido por `waitForInvoiceResult`).
- **clients/{id}.client.pendingBalance** – acumulador mantenido por `updatePendingBalance` (`functions/src/versions/v1/modules/accountsReceivable/triggers/updatePendingBalance.js`). La UI lee este campo mediante `useClientPendingBalance` y el panel de pagos (`ReceivableManagementPanel`).

### Procesamiento de pagos y recibos
- `PaymentForm.jsx` dispara `fbProcessClientPaymentAR` (`src/firebase/proccessAccountsReceivablePayments/fbProccessClientPaymentAR.js`), que enruta según `paymentScope` (balance de cliente vs cuenta individual) y `paymentOption` (cuota, balance total, abono parcial).
- Cada handler (`fbPayBalanceForAccounts`, `fbPayActiveInstallmentForAccount`, `fbPayAllInstallmentsForAccount`, `fbApplyPartialPaymentToAccount`) reutiliza `arPaymentUtils.js`. Se valida que la cuenta exista y tenga balance (`validateAccountHasPendingBalance`), se crean registros en `accountsReceivablePayments`, se generan documentos en `accountsReceivableInstallmentPayments`, se actualizan las cuotas (`installmentBalance`, `isActive`) y el documento principal (`arBalance`, `paidInstallments`, `lastPaymentDate`, `isClosed`). Adicionalmente se actualizan los totales de la factura (`fbGetInvoice` + `updateInvoiceTotals`) y se intenta ajustar `client.pendingBalance` con `increment` inmediato (fallback en el trigger agregado).
- Cobros de aseguradoras usan el modal `MultiPaymentModal` → `fbProcessMultiplePaymentsAR`, que replica la lógica anterior pero aplicando un lote de cuentas filtradas por `insuranceId` y generando un recibo global.
- Todos los flujos concluyen llamando a `fbAddAccountReceivablePaymentReceipt` para dejar evidencia de usuario, métodos de pago y cuotas liquidadas.

### Sincronización de saldos
- **Trigger reactivo**: `updatePendingBalance` se ejecuta en cada `onDocumentWritten` de `accountsReceivable`. Para cada cliente suma solamente las cuentas activas (`isActive=true`) mediante `AggregateField.sum('arBalance')` y escribe `client.pendingBalance`, borrando el campo legacy `pendingBalance`.
- **Cron nocturno**: `reconcilePendingBalanceCron` (`functions/src/versions/v2/accountsReceivable/reconcilePendingBalanceCron.js`) recorre todos los negocios, recalcula los pendientes cuenta por cuenta y limpia clientes cuyo `pendingBalance` quedó en cero aunque no tengan CxC activas.
- **Lecturas en UI**: `fbGetPendingBalance` y hooks derivados (`usePendingBalance`, `useGetPendingBalance`) escuchan cambios para mostrar el balance en tiempo real en POS y en `ReceivableManagementPanel`. La lista de CxC (`AccountReceivableList.jsx`) usa `useListenAccountsReceivable`, que enriquece cada cuenta con cliente e invoice via `fbGetClient` y `fbGetInvoice`.

### Operaciones de soporte y dev tools
- `docs/problem-analysis/explanation/account-receivable-balance-avendys-lockhart.md` documenta un caso real de saldo congelado y sirve como checklist para incidentes similares.
- `InvoiceV2Recovery` (UI en `src/views/pages/DevTools/InvoiceV2Recovery/`) y los endpoints `repairInvoiceV2Http.controller.js` / `autoRepairInvoiceHttp.controller.js` permiten reevaluar facturas: si una factura espera CxC (`cart.isAddedToReceivables` + `totalInstallments>0`) pero no existe documento en `accountsReceivable`, se reprograma la tarea `setupAR`. También re-crean la factura canonical si falta en `invoices/`.

### Escenarios de desincronización detectados
1. **Factura sin cuenta por cobrar** – ocurre si la tarea `setupAR` falló o fue cancelada. Detectable consultando `invoicesV2` con `snapshot.cart.isAddedToReceivables=true` y `accountsReceivable` vacío (`autoRepairInvoiceV2Http` ya expone esta lógica en `expectsAccountsReceivable()` y `hasAccountsReceivable()`).
2. **AR sin cuotas** – si `generateInstallments` no se ejecuta (ej. error al calcular fechas). Validar que cada `accountsReceivable` tenga al menos `totalInstallments` documentos activos en `accountsReceivableInstallments`.
3. **Saldo de factura vs arBalance** – `fbPayBalanceForAccounts` y similares actualizan `invoice.totalPaid`, pero un error previo dejaría `invoice.balanceDue` distinto a `arBalance`. Comparar `invoice.data.balanceDue` con `accountsReceivable.arBalance` tolerando un redondeo `±0.01`.
4. **pendingBalance del cliente vs suma de CxC activas** – si `updatePendingBalance` falló o el cron no corrió, el campo `client.pendingBalance` difiere de la suma real de `accountsReceivable` activos. El cron ya corrige, pero la auditoría debe alertar cuando la diferencia sea significativa o persista >24h.
5. **Pagos sin recibo o sin `accountsReceivablePayments`** – si `fbAddPayment` falla después de aplicar cuotas via `writeBatch`, se actualizarán las cuotas pero no quedará registro en `accountsReceivablePayments` ni recibo. Revisar lotes con `installmentPayments.paymentId` inexistente.
6. **Aseguradoras con cuentas huérfanas** – `MultiPaymentModal` filtra por `account.account.insurance`. Se han detectado cuentas marcadas con `type: 'insurance'` pero sin `insurance.insuranceId`, lo que impide agrupar en el modal y en reportes.

### Propuesta de pantalla de auditoría
Construir un dashboard (por ejemplo en `/account-receivable/audit`) alimentado por consultas batch en Firestore Admin SDK o por un Cloud Function HTTP que agregue los hallazgos. Secciones sugeridas:
1. **Facturas sin CxC** – columnas: `invoiceId`, `NCF`, cliente, fecha, total, `isAddedToReceivables`, botón “Reparar” que llama a `autoRepairInvoiceV2Http` con `setupAR`. Consulta base: `invoicesV2` con `snapshot.cart.isAddedToReceivables=true` y sin coincidencias en `accountsReceivable`.
2. **CxC inconsistentes** – comparar `accountsReceivable.arBalance` vs `Σ installments.installmentBalance` y `invoice.balanceDue`. Mostrar `diffBalance`, cuotas activas y botón “Abrir detalle” (`AccountReceivableInfo.jsx`).
3. **Clientes con pendingBalance divergente** – mostrar `clientId`, nombre, `client.client.pendingBalance`, `Σ arBalance`, diferencia y acciones (`Reconciliar ahora` que dispara el cron para ese negocio).
4. **Pagos incompletos** – detectar `accountsReceivableInstallmentPayments` cuyo `paymentId` no existe en `accountsReceivablePayments`, o recibos cuya suma de `accounts.totalPaid` difiere de `totalAmount`.
5. **Aseguradoras** – listado filtrable por `insuranceId` que indique cuentas donde `account.account.insurance` está incompleto o cuyo `invoice.data.insurance` no coincide con la CxC.

Cada sección debe soportar filtros por rango de fechas (`createdAt`), cliente y negocio, y exponer descargas CSV. La pantalla puede reutilizar `AdvancedTable` y `FilterAccountReceivable` para mantener consistencia visual.

## 📈 Impacto / Trade-offs
- ✅ Documentar y auditar el pipeline reduce los “balances fantasma” y acelera la resolución en soporte.
- ✅ El worker V2 y los jobs existentes ya ofrecen puntos de integración para automatizar reparaciones; la auditoría solo necesita exponerlos.
- ⚠️ Consultas cruzadas (`invoicesV2` ↔ `accountsReceivable`) son costosas en Firestore; se recomienda ejecutarlas server-side y paginar resultados para no bloquear la UI.
- ⚠️ Actualizar `client.pendingBalance` manualmente desde los pagos aporta inmediatez, pero duplica la lógica del trigger; cualquier cambio futuro debe considerar ambos caminos para evitar regresiones.

## 🔜 Seguimiento / Próximos pasos
- [ ] Implementar el endpoint/worker que compute los cuatro indicadores clave (facturas sin CxC, CxC inconsistentes, pendingBalance divergente y pagos incompletos) y exponerlo al dashboard.
- [ ] Agregar métricas/alerts cuando `updatePendingBalance` o `reconcilePendingBalanceCron` fallen (Metricas en Cloud Monitoring + alerta en Slack).
- [ ] Extender `fbProcessClientPaymentAR` para loguear en Sentry cualquier pago que actualice cuotas pero no cree `accountsReceivablePayments`, facilitando reconciliación.
- [ ] Documentar en `README` del módulo CxC cómo ejecutar `InvoiceV2Recovery` y el nuevo dashboard como parte del runbook de soporte.
