# Cash count audit plan

## Objetivo
- Recalcular un cuadre de caja y comparar contra los totales guardados en Firestore para detectar diferencias y posibles fuentes de error.
- Permitir escoger negocio, cajero y cuadre especifico para auditar.

## Como calcula hoy el cierre (referencia `src/views/pages/CashReconciliation/page/CashRegisterClosure/components/Body/RightSide/CashCountMetaData.jsx`)
- Entradas: `cashCount.opening.banknotes`, `cashCount.closing.banknotes`, `cashCount.receivablePayments`, facturas cargadas por `data.cashCountId`, gastos con `expense.payment.method === "open_cash"`.
- Sumatorias:
  - Tarjeta y transferencia: desde `paymentMethod` de cada factura (solo items con `status` truthy) mas `method` de `receivablePayments`.
  - Cobrado: `payment.value` de la factura (no distingue contado vs credito); Cobrado CxC: `amount` de `receivablePayments`.
  - Sistema: (Cobrado facturas + Cobrado CxC + fondo inicial) - gastos.
  - Registro: efectivo contado en cierre (`closing.banknotes`) + tarjeta + transferencia.
  - Discrepancia: Registro - Sistema.
  - `totalCharged` usa `payment.value`, no `totalPurchase.value`.

## Datos disponibles en Firestore
- `businesses/{bid}/cashCounts/{id}` (`cashCount`): estado, `opening`/`closing` (empleados, fecha, billetes), `sales` (refs a facturas), `receivablePayments` (agregados al cobrar CxC), totales (`totalCard`, `totalTransfer`, `totalCharged`, `totalReceivables`, `totalDiscrepancy`, `totalRegister`, `totalSystem`), `stateHistory`.
- Facturas canonicas `businesses/{bid}/invoices/{invoiceId}`: campo `data` con `payment` (snapshot del cobro inicial), `paymentMethod` (metodos con `value` y `status`), `totalPurchase`, `cashCountId`, `accumulatedPaid` y `paymentHistory` (mutables por CxC).
- Facturas pipeline `businesses/{bid}/invoicesV2/{invoiceId}`: `snapshot.totals` (copia del `cart.payment` usado al crear), metadatos de cuadre, estado y tareas ejecutadas.
- Pagos CxC `businesses/{bid}/accountsReceivablePayments`: `paymentMethods`, `totalPaid`, `createdUserId`, `createdAt`; usados por `usePaymentsForCashCount` pero no se mezclan en `CashCountMetaData`.
- Gastos `businesses/{bid}/expenses`: usan `expense.payment.cashRegister` para apuntar al cuadre.
- Utilidades de recalc existentes: `src/firebase/cashCount/fbRecalculateClosedCashCout.js` y `src/firebase/cashCount/fbUpdateMultipleCashCount.js` (ambas basadas en facturas, no consideran gastos ni pagos CxC recientes).

## Riesgos hallados
- El UI de cierre muestra "Total facturado" con `payment.value`; las ventas a credito quedan fuera y pueden parecer faltantes cuando se compara contra inventario/ingresos.
- `CashCountMetaData` ignora el argumento `arPayments` y solo usa `cashCount.receivablePayments`; si el pago CxC no se escribio ahi (cuadres antiguos o error en batch) no se suma.
- Al pagar CxC se actualiza `accumulatedPaid` y `paymentHistory` de la factura; no se tocan `payment` ni `totalPaid`, por lo que el calculo de auditoria debe elegir el campo correcto segun se quiera snapshot inicial o estado actual.
- Posibles desalineaciones entre `cashCount.sales` y facturas cuyo `data.cashCountId` apunta a otro ID (o viceversa); la outbox intenta relinkear pero no se valida en el cierre.
- El recalc legado (`fbRecalculateClosedCashCout`) usa `totalPurchasePrice` y no contempla gastos ni pagos CxC, por lo que puede desviar los totales guardados.

## Plan de recalculo y cotejo
1) Seleccion: UI/simple script que pida negocio, cajero (uid) y cuadre (ID o rango de fechas) para acotar consultas.
2) Cargar origenes:
   - Documento del cuadre (`cashCount`) para abrir/cierre, fondo inicial, totales guardados y refs `sales`/`receivablePayments`.
   - Facturas: leer por `cashCount.sales`; si faltan, complementar con query `data.cashCountId == cashCountId`. Guardar tanto `data.payment/paymentMethod/totalPurchase` como `accumulatedPaid/paymentHistory`.
   - Pagos CxC: fusionar `cashCount.receivablePayments` con query a `accountsReceivablePayments` filtrando `createdUserId` y `createdAt` entre apertura y cierre; deduplicar por `paymentId`.
   - Gastos: query por `expense.payment.cashRegister == cashCountId`.
3) Normalizar datos numericos y timestamps (coercion a numero, `value` de metodos solo cuando `status` sea true).
4) Recalcular:
   - Tarjeta/transferencia: sumar por metodo en facturas + pagos CxC.
   - Cobrado facturas: usar `data.payment.value` (snapshot) para reproducir la logica actual; opcionalmente calcular variante "facturado" usando `totalPurchase.value` para detectar ventas a credito.
   - Cobrado CxC: `amount` o `totalPaid` normalizado de pagos CxC.
   - Sistema = cobrado facturas + cobrado CxC + fondo inicial - gastos; Registro = efectivo cierre + tarjeta + transferencia; Discrepancia = Registro - Sistema.
5) Comparar con guardados (`cashCount.total*`) y generar diffs por categoria (tarjeta, transfer, receivables, gastos, sistema, registro, discrepancia). Incluir flags si:
   - Hay facturas en `sales` que no apuntan al cashCountId (o viceversa).
   - Pagos CxC de la ventana temporal que no estan en `receivablePayments`.
   - Variacion entre `payment.value` y `totalPurchase.value` que explique faltantes por ventas a credito.
6) Salida: reporte por cuadre con resumen, detalle por factura/pago/gasto divergente y sugerencia de ajuste (p.ej. reenlazar factura, agregar receivablePayment faltante, o recalcular totales almacenados).

## Sugerencias rapidas
- Incluir un switch en la herramienta para calcular con "snapshot inicial" (`payment.value`) vs "monto facturado" (`totalPurchase.value`) para ver impacto de creditos.
- Para cuadres cerrados antes de guardar `receivablePayments`, reconstruirlos desde `accountsReceivablePayments` y anotarlos como hallazgos sin escribir aun en Firestore.
- Registrar en el reporte los IDs usados (cashCountId, invoiceIds, paymentIds) para facilitar auditorias manuales o scripts de reparacion futura.
