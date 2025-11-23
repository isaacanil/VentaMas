# Solución Flujos Financieros 2: Inmutabilidad con Campos Computados

Este documento define la arquitectura técnica para resolver la inconsistencia en los reportes históricos (Cuadres de Caja), separando los datos de la venta original (Snapshot) del estado actual de la deuda (Current State).

## El Problema Raíz
El sistema actual sobrescribe el campo `totalPaid` de la factura cada vez que se recibe un abono de Cuentas por Cobrar (CXC).
* **Consecuencia:** Si se consulta un Cuadre de Caja de hace 3 meses, el sistema lee el `totalPaid` actual (modificado) y asume erróneamente que ese dinero entró aquel día, generando sobrantes fantasmas y destruyendo la integridad histórica.

## La Solución: Estrategia de "Doble Verdad"

En lugar de tener un solo campo que muta, mantendremos dos conjuntos de datos dentro del documento `invoices/{id}` con propósitos distintos:

1.  **La Foto (Inmutable):** Datos congelados del momento de la creación para reportes históricos.
2.  **La Realidad (Mutable):** Datos acumulados para operaciones del día a día y consultas.

---

## 1. Especificación del Esquema de Datos (`invoices/{id}`)

El documento de la factura tendrá la siguiente estructura de campos dividida por responsabilidad:

### A. Campos Inmutables (Para Cuadre de Caja y Auditoría)
Estos campos **NUNCA** deben modificarse después de crear la factura. Representan lo que ocurrió físicamente en el mostrador en el momento `t=0`.

* `totalPaid`: Monto recibido **exclusivamente** durante la creación de la factura. (Si es crédito puro, será 0).
* `paymentMethod`: Métodos de pago usados en la transacción inicial.
* `change`: Cambio entregado en ese momento.

> **Nota:** El reporte de `CashCountMetaData.jsx` seguirá leyendo estos campos. Como no cambian, los cierres pasados siempre cuadrarán.

### B. Campos Computados/Mutables (Para UI y Lógica de Negocio)
Estos campos se **ACTUALIZAN** (recalculan) cada vez que se registra un nuevo pago o abono.

* `accumulatedPaid`: La suma de `totalPaid` (inicial) + todos los abonos posteriores.
* `balance`: Calculado como `totalPurchase.value - accumulatedPaid`. Se usa para filtros rápidos (`where balance > 0`).
* `status`: Estado derivado (`PENDING`, `PARTIAL`, `PAID`).

### C. Historial de Eventos
* `paymentHistory` (Array): Lista "Append-Only" de los abonos posteriores.

```json
[
  {
    "date": "2023-10-24T15:00:00Z",
    "amount": 500,
    "method": "cash", // o transferencia, etc.
    "reference": "Pago de Cuota 1",
    "collectedBy": "user_id_cajero",
    "paymentId": "uuid_del_pago_maestro" 
  }
]
```

## 2. Integración con Cuadre de Caja y Transaccionalidad (Batch Write)

Para garantizar la integridad financiera, el registro del pago debe ser una **operación atómica** (todo o nada). Se utilizará un `WriteBatch` de Firestore para ejecutar simultáneamente las escrituras en tres ubicaciones:

1.  **Registro Maestro:** Crear el documento de pago en la colección global `accountsReceivablePayments`.
2.  **Actualización de Factura (`invoices/{id}`):**
    *   Agregar el pago al array `paymentHistory`.
    *   Actualizar contadores `accumulatedPaid`, `balance` y `status`.
3.  **Actualización de Cuadre de Caja (`cashCounts/{id}`):**
    *   Identificar el cuadre de caja **abierto** del usuario que realiza el cobro.
    *   Agregar el registro al array `receivablePayments` con los datos necesarios para el arqueo.

    **Datos a guardar en `cashCounts/{id}.receivablePayments`:**
    *   `amount`: Monto del pago.
    *   `method`: Forma de pago.
    *   `date`: Fecha y hora del pago.
    *   `paymentId`: ID del documento creado en `accountsReceivablePayments` (para trazabilidad).

    **Estructura resultante en el Cuadre de Caja:**
    ```json
    {
      "sales": ["ref_factura_1", "ref_factura_2"], // Ventas del día
      "receivablePayments": [ // Cobros de deudas antiguas recuperados hoy
        {
          "paymentId": "abc-123-uuid",
          "amount": 500,
          "method": "cash",
          "date": "2023-10-24T15:00:00Z"
        }
      ]
    }
    ```

## 3. Beneficios de la Transacción Atómica
*   **Consistencia:** No es posible que un pago se registre en la factura pero falte en la caja (o viceversa). Si falla una escritura, fallan todas.
*   **Eficiencia:** El cierre de caja no necesita buscar en colecciones externas; toda la información de ingresos ("sales" + "receivablePayments") reside dentro del documento del cuadre.
*   **Trazabilidad:** El `paymentId` conecta las tres entidades (Pago Global, Factura, Caja).

## 4. Próximos Pasos
1.  Modificar `createInvoice` para inicializar `paymentHistory: []` y `accumulatedPaid: 0`.
2.  Modificar el endpoint de cobros (CXC) para implementar el `WriteBatch` descrito arriba.
3.  Actualizar la UI de Facturas para mostrar el desglose de pagos desde `paymentHistory`.