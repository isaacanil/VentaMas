# Propuesta de Solución: Corrección de Flujos Financieros (Estrategia Snapshot)

Este documento actualiza la propuesta anterior para abordar el problema crítico de la mutación de datos en las facturas.

## Resumen del Problema
Actualmente, cuando se paga una deuda (CXC), se sobrescribe la información de la factura original (`totalPaid`, `paymentMethod`). Esto hace que sea imposible saber cuánto se pagó *realmente* el día que se creó la factura, corrompiendo los cuadres de caja históricos.

## Estrategia Técnica: "Snapshot + Transacciones"

### 1. Detener la "Hemorragia" (Snapshot en Creación)
Debemos guardar el estado financiero inicial de la factura en campos inmutables (que nunca se editen).

**Backend (`createInvoiceV2`):**
Al crear la factura, además de guardar `totalPaid` y `paymentMethod`, guardaremos:
*   `snapshot.initialPaymentMethods`: Copia exacta de los métodos de pago al momento de la creación.
*   `snapshot.initialTotalPaid`: Monto pagado al momento de la creación.
*   `snapshot.isCreditSale`: Booleano para identificar fácilmente si nació como crédito.

**Impacto:** Cambio menor en la estructura de la factura (campos aditivos, no rompe compatibilidad).

---

### 2. Corrección del Cuadre de Caja (Frontend)

Modificaremos `CashCountMetaData.jsx` para que use una lógica de prioridad:

**Lógica Nueva:**
1.  **Dinero por Ventas (Invoices):**
    *   Iterar sobre las facturas del cuadre.
    *   **¿Tiene campos `snapshot`?**
        *   **SÍ:** Usar `snapshot.initialTotalPaid` y `snapshot.initialPaymentMethods`.
        *   **NO (Datos viejos):** Usar lógica de contingencia (ver abajo).
    *   Sumar al "Dinero Esperado" según el método (Efectivo, Tarjeta, etc.). **Ignorar métodos de crédito.**

2.  **Dinero por Cobros (CXC Payments):**
    *   Usar el hook `usePaymentsForCashCount` (propuesto anteriormente) para buscar pagos de CXC realizados *durante el turno*.
    *   Sumar estos pagos al "Dinero Esperado".

---

### 3. Manejo de Datos Viejos (Contingencia)
Para las facturas antiguas que ya fueron "mutadas" y no tienen snapshot:

*   **Escenario A (Factura 100% pagada hoy):** El sistema verá `totalPaid` completo. Asumirá que se pagó el día 1. **Error inevitable sin backup.**
*   **Mitigación:** Podemos intentar inferir si fue crédito mirando si existe un documento en `accountsReceivable` vinculado a esa factura.
    *   Si existe `accountsReceivable` para esa factura -> Asumir que el pago inicial fue **$0** (o el `initialAmount` del AR si existe).
    *   Esto requiere leer la colección de AR, lo cual es costoso.
*   **Decisión Pragmática:** Aceptar que los cuadres históricos antiguos pueden tener imprecisiones, pero garantizar que **desde hoy** los cuadres sean perfectos.

---

### 4. Pasos de Implementación

1.  **Backend (Cloud Function):**
    *   Editar `functions/src/modules/invoice/services/invoiceGeneration.service.js` (o donde se arme el objeto) para incluir los campos `snapshot`.
2.  **Frontend (Hook de Pagos):**
    *   Crear `usePaymentsForCashCount` para leer `accountsReceivablePayments` por rango de fecha.
3.  **Frontend (Calculadora):**
    *   Editar `CashCountMetaData.jsx` para:
        *   Implementar la lógica de prioridad (Snapshot > Actual).
        *   Sumar los pagos provenientes del hook de CXC.

## Conclusión
Esta estrategia soluciona el problema de raíz (la pérdida de información histórica) sin requerir una migración compleja de datos antiguos, simplemente mejorando la estructura de los datos nuevos ("Schema-on-write evolution").