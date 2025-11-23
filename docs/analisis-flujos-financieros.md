# Análisis de Flujos Financieros: Facturación, Cuadre de Caja y Cuentas por Cobrar

Este documento detalla el funcionamiento técnico y las interacciones entre los módulos de Facturación, Cuadre de Caja y Cuentas por Cobrar (CXC) en la aplicación VentaMas.

## 1. Facturación (Invoices)

### Flujo de Creación
1.  **Frontend (`src/views/pages/Sale`):**
    *   El usuario finaliza una venta en el componente `InvoicePanel`.
    *   Se invoca el hook `useInvoice` -> `submitInvoice`.
    *   Se llama a la Cloud Function `createInvoiceV2`.
2.  **Backend (`functions/src/versions/v2/invoice/controllers/createInvoice.controller.js`):**
    *   **Validación:** Verifica que el usuario tenga un **Cuadre de Caja Abierto** (`checkOpenCashCount`). Sin esto, la factura no se crea.
    *   **Transacción:**
        *   Genera el documento de la factura en `businesses/{bid}/invoices/{id}`.
        *   **Vinculación:** Añade una *referencia* de la factura al array `cashCount.sales` del documento de cuadre de caja activo (`addBillToCashCountById`).
        *   **Inventario:** Descuenta el stock.
        *   **CXC:** Si la factura es a crédito (`isAddedToReceivables: true`), invoca `manageReceivableAccounts`.

### Datos Clave
*   Las facturas guardan un array `paymentMethod` (ej: cash, card, credit).
*   La factura queda vinculada al ID del cuadre de caja (`cashCountId`).

---

## 2. Cuentas por Cobrar (Accounts Receivable)

### Creación
*   Manejado por `manageReceivableAccounts` en el backend durante la creación de la factura.
*   Crea documentos en `businesses/{bid}/accountsReceivable` y sus cuotas en `accountsReceivableInstallments`.

### Flujo de Pago (Cobros)
1.  **Frontend (`src/views/component/modals/ARInfoModal`):**
    *   El usuario selecciona "Pagar" -> Abre `PaymentForm`.
    *   Al enviar, llama a `fbProcessClientPaymentAR` (`src/firebase/proccessAccountsReceivablePayments`).
2.  **Lógica de Pago (`fbPayActiveInstallmentForAccount.js`):**
    *   **Escritura Directa:** Ejecuta un `writeBatch` en Firestore.
    *   **Actualizaciones:**
        *   Reduce el balance de la cuota (`accountsReceivableInstallments`).
        *   Reduce el balance de la cuenta (`accountsReceivable`).
        *   Crea un registro de pago en `accountsReceivableInstallmentPayments`.
        *   Crea un recibo de pago en `accountsReceivablePayments`.
        *   Actualiza el `pendingBalance` del cliente.
        *   Actualiza los totales de la factura original (`amountPaid`, `paymentMethods`).
    *   **⚠️ Nota Importante:** Este proceso **NO actualiza ni vincula el pago al Cuadre de Caja actual**. No existe un trigger ni una llamada explícita que registre este ingreso de dinero en el documento `cashCount`.

---

## 3. Cuadre de Caja (Cash Count)

### Estructura y Cálculo
*   El cuadre de caja mantiene un array `sales` con referencias a las facturas creadas durante el turno.
*   **Cálculo de Totales (`src/views/pages/CashReconciliation/.../CashCountMetaData.jsx`):**
    *   El cálculo se realiza en el **Frontend** al momento del cierre.
    *   Fórmula actual:
        ```javascript
        System (Esperado) = TotalVentas (charged) + FondoCaja (openBank) - Gastos
        Register (Real) = EfectivoEnCaja (closeBank) + Tarjetas + Transferencias
        Discrepancy = Register - System
        ```
    *   `TotalVentas (charged)`: Suma el `totalPurchase.value` de **todas** las facturas del turno, sin distinguir si fueron a crédito o contado.

### Problemas Identificados en el Flujo
1.  **Ventas a Crédito (Falsos Faltantes):**
    *   Al sumar el total de la factura a `charged` (dinero esperado), el sistema espera que ese dinero esté en la caja (o en vouchers de tarjeta).
    *   Como es a crédito, el dinero no entra.
    *   Resultado: El sistema reporta un **faltante** igual al monto de la venta a crédito.

2.  **Cobros de CXC (Falsos Sobrantes):**
    *   Cuando se realiza un cobro de una deuda antigua, el dinero entra a la caja física.
    *   Sin embargo, el cálculo de `CashCountMetaData` no consulta la colección `accountsReceivablePayments`.
    *   Resultado: El sistema reporta un **sobrante** (dinero extra no justificado).

### Recomendación Técnica
Para corregir el flujo financiero, se requiere:
1.  **Ajustar `CashCountMetaData.jsx`:**
    *   Restar las ventas a crédito del total `charged`.
    *   O sumar las ventas a crédito a una nueva categoría "Cuentas por Cobrar" en el `Register`.
2.  **Integrar Cobros:**
    *   Modificar el flujo de pago de CXC para que añada una referencia del pago al `cashCount` activo (similar a como se hace con las facturas).
    *   O bien, que el cierre de caja consulte las colecciones de pagos (`accountsReceivablePayments`) filtrando por fecha y cajero.

## 4. El Problema Crítico de la Mutación de Datos (Data Mutation)

**Hallazgo:**
El sistema actual actualiza el documento original de la factura (`invoices/{id}`) cada vez que se realiza un pago de una deuda (CXC). Específicamente, las funciones en `arPaymentUtils.js` modifican:
*   `paymentMethod`: Se fusionan los nuevos métodos de pago con los existentes.
*   `totalPaid`: Se incrementa con el nuevo pago.
*   `change`: Se recalcula.

**Consecuencia:**
Esto destruye la integridad histórica de la factura.
*   **Ejemplo:** Una factura creada el Día 1 con pago $0 (crédito) se ve correctamente como "Pendiente". El Día 5 se paga $100. El documento de la factura ahora dice "Total Pagado: $100".
*   **Impacto en Cuadre de Caja:** Si hoy (Día 10) revisamos el Cuadre de Caja del Día 1, el sistema leerá la factura y verá "$100 Pagados". Asumirá erróneamente que esos $100 entraron en la caja el Día 1, generando un falso sobrante o distorsionando la realidad de ese día.

**Conclusión:**
No podemos confiar en el estado *actual* de la factura para calcular un Cuadre de Caja del *pasado*. Se requiere una estrategia de "Snapshot" (Foto fija) del estado inicial de la factura para los reportes de caja.
