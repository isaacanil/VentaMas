# Pruebas E2E de Coherencia de Datos (Negocio de pruebas)

- Fecha: 2026-02-08
- BusinessId: `X63aIFwHzk3r0gmT8w6P`
- Objetivo: validar coherencia y relaciones entre **Inventario**, **Factura**, **Preventa**, **CxC**, **Nota de credito** y **Cuadre de caja**.
- Resultado esperado: detectar descuadres (o confirmar cuadre) y dejar evidencia exportada (pack + analisis).

## Reglas de juego (importante)

1. Todo lo haremos dentro del **negocio de pruebas**.
2. Evitar “mezclar sesiones”: abrimos un **cuadre nuevo**, hacemos todas las operaciones, y lo cerramos.
3. Registrar IDs durante la prueba (abajo) para poder auditar luego con scripts.
4. No usar `TESTMODE` (Developer Modal) a menos que se indique: el objetivo es que **si escriba** en Firestore para validar.

## Bitacora (rellenar mientras pruebas)

Pega aqui (o en un bloc) los IDs exactos:

- `cashCountId` (cuadre de hoy): `________________________`
- Cajero/usuario que opera (uid o nombre): `________________________`
- Productos usados (IDs / nombres):
  - Producto A (inventariable): `________________________`
  - Producto B (inventariable): `________________________`
  - Servicio C (no inventario): `________________________`
- Facturas (IDs):
  - Factura 1 efectivo: `________________________`
  - Factura 2 tarjeta: `________________________`
  - Factura 3 transferencia: `________________________`
  - Factura 4 credito (CxC): `________________________`
  - Factura 5 cancelada: `________________________`
- CxC:
  - AR id (si se ve): `________________________`
  - Pago CxC id (si se ve): `________________________`
  - Recibo pago CxC id (si se genera): `________________________`
- Nota de credito:
  - CreditNote id: `________________________`
  - Application id: `________________________`
- Preventa:
  - Preorder id: `________________________`

## Colecciones y relaciones a vigilar

Rutas esperadas (Firestore):

- Cuadre: `businesses/{bid}/cashCounts/{cashCountId}`
- Facturas canonicas (legacy/canonic): `businesses/{bid}/invoices/{invoiceId}`
- Facturas pipeline: `businesses/{bid}/invoicesV2/{invoiceId}`
- CxC: `businesses/{bid}/accountsReceivable/{arId}`
- Pagos CxC: `businesses/{bid}/accountsReceivablePayments/{paymentId}`
- Nota de credito: `businesses/{bid}/creditNotes/{noteId}`
- Aplicaciones NC: `businesses/{bid}/creditNoteApplications/{appId}`
- Inventario (stock por lote/ubicacion): `businesses/{bid}/productsStock/{productStockId}`
- Gastos (para cuadre): `businesses/{bid}/expenses/{expenseId}`
- Preventa: vive dentro de `invoices` con `data.type='preorder'` (no es coleccion aparte).

## Pre-chequeos (antes de abrir el cuadre)

1. Confirmar que el negocio tiene al menos:
   - 2 productos inventariables con stock disponible (en `productsStock`).
   - 1 item tipo servicio/no inventario.
2. Confirmar que NO hay un cuadre abierto (si hay, cerrarlo o usar otro usuario).
3. Verificar que el modulo de gastos esta disponible (lo usaremos para probar descuadre).

Si te falta inventario/productos: usa el DevTools `ProductStudio` para crear 1 producto inventariable y asignarle stock, y 1 servicio (sin inventario).

## Escenario A: Cuadre de caja “limpio” (sin discrepancia)

### Paso 1: Abrir cuadre de caja (opening)

Accion (UI):
- Abrir **Cuadre de caja**.
- Crear/abrir un cuadre nuevo con fondo inicial:
  - Efectivo inicial sugerido: `1000.00`
  - Distribucion (si la UI pide billetes): usa algo simple (ej. 10x100).

Registra:
- `cashCountId`.

Checks esperados:
- En `cashCounts/{cashCountId}`:
  - `cashCount.opening.*` presente (fecha, empleado, banknotes).
  - `cashCount.closing` aun vacio o no presente.
  - Totales iniciales en 0 (o calculados con opening).

### Paso 2: Factura contado (efectivo)

Accion:
- Crear una factura con:
  - 1 unidad de Producto A (inventariable)
  - 1 unidad de Servicio C (no inventario)
  - Pago: efectivo (con o sin cambio, ideal con cambio para probar `change`)

Checks esperados:
- En `invoicesV2/{invoiceId}`:
  - Existe doc (pipeline).
  - Estado indica finalizacion (segun modelo).
- En `invoices/{invoiceId}` (canonica):
  - `data.totalPurchase.value` correcto.
  - `data.payment.value` y `data.change.value` coherentes.
  - `data.paymentMethod[]` con item efectivo `status=true` y `value`.
  - `data.cashCountId == cashCountId`.
- En `cashCounts/{cashCountId}`:
  - La venta aparece (por `cashCount.sales[]` o por totales).
- Inventario:
  - `productsStock` del Producto A refleja disminucion (si el producto se controla por stocks).

### Paso 3: Factura tarjeta

Accion:
- Crear factura con Producto A o B (cantidad pequena).
- Pago: tarjeta.

Checks:
- `invoices/{invoiceId}.data.paymentMethod` incluye tarjeta `status=true`.
- En cuadre: suma a `totalCard` (o equivalente).

### Paso 4: Factura transferencia

Accion:
- Crear factura con Producto B.
- Pago: transferencia.

Checks:
- `paymentMethod` incluye transferencia.
- En cuadre: suma a `totalTransfer`.

### Paso 5: Factura a credito (CxC)

Accion:
- Crear factura a credito (sin pago en caja o con pago parcial si la UI lo permite).

Checks:
- `invoices/{invoiceId}`:
  - `data.paymentStatus` deberia ser `unpaid` o `partial`.
  - `data.accumulatedPaid` y `data.balanceDue` consistentes.
  - `data.isAddedToReceivables` (si existe) true.
- `accountsReceivable/{arId}`:
  - Existe registro ligado a la factura (`invoiceId == invoiceId` o campo equivalente).
  - `totalReceivable` y `balance` consistentes.
- Cuadre:
  - Esta factura NO deberia inflar efectivo/tarjeta/transfer si no hubo cobro POS.
  - OJO: si el sistema usa `payment.value` como “totalCharged”, puede provocar percepcion de descuadre; lo vamos a detectar en analisis.

### Paso 6: Abono a CxC (cobro en caja)

Accion:
- Ir a CxC y registrar un pago parcial a la factura a credito.
- Metodo: efectivo.
- Monto sugerido: el 30% del total (para dejar balance pendiente).

Checks:
- `accountsReceivablePayments/{paymentId}`:
  - Existe doc de pago con `totalPaid` y/o `paymentMethods`.
- `accountsReceivablePaymentReceipt/{receiptId}` (si el sistema genera recibos):
  - Existe un doc de recibo vinculado al pago / AR / cliente.
- `invoices/{invoiceId}`:
  - `accumulatedPaid` sube, `balanceDue` baja.
  - Puede registrar `paymentHistory` (si aplica).
- `cashCounts/{cashCountId}`:
  - Debe reflejarse como `cashCount.receivablePayments[]` (o al menos sumar a totalReceivables).

### Paso 6.1 (opcional pero recomendado): Pago CxC multi-metodo (tarjeta + transferencia)

Accion:
- Registrar un segundo pago a la misma CxC usando 2 metodos (si la UI lo permite):
  - Parte en tarjeta
  - Parte en transferencia

Checks:
- `accountsReceivablePayments/{paymentId}`:
  - `paymentMethods[]` incluye ambos metodos con montos.
- `cashCounts/{cashCountId}`:
  - El total de tarjeta/transfer del cuadre debe incluir estos pagos (via `receivablePayments`).

### Paso 7: Nota de credito sobre una factura (y aplicacion)

Accion:
- Crear Nota de credito contra la Factura 1 (efectivo) o una factura simple.
- Aplicar parcialmente (si permite) y guardar.

Checks:
- `creditNotes/{noteId}` existe.
- `creditNoteApplications/{appId}` existe y referencia:
  - `creditNoteId == noteId`
  - `invoiceId == factura objetivo`
- En `invoices/{invoiceId}` (segun implementacion):
  - Puede reflejar balance/estado actualizado o quedar solo en colecciones NC.

### Paso 7.1 (opcional): Nota de credito total + ver “saldo acreditable”

Accion:
- Crear una NC por el total de una factura (o aplicar la NC hasta el maximo permitido).

Checks:
- No debe permitir aplicar mas de lo acreditable (si lo permite, es hallazgo).
- En el analisis, esto deberia aparecer como inconsistencia si `amount` aplicado excede lo razonable.

### Paso 7.2 (opcional): Usar Nota de credito como “metodo de pago” en una venta nueva

Si la UI lo soporta:
Accion:
- Crear una factura nueva y pagar parte con Nota de credito (y el resto en efectivo/tarjeta).

Checks:
- Debe existir rastro de consumo de NC (tipicamente via `creditNoteApplications` u otro log).
- En cuadre:
  - El componente “nota de credito” NO debe contarse como dinero real en caja.
  - Solo el restante pagado en efectivo/tarjeta/transfer deberia sumar a totales monetarios.

### Paso 8: Preventa (guardar)

Accion:
- En modulo Preventas, crear una preventa con Producto A/B.
- Guardar sin facturar.

Checks:
- Se crea un doc en `invoices/{preorderId}` con:
  - `data.type == 'preorder'` o `data.preorderDetails.isOrWasPreorder == true`
  - `status == 'pending'` (lifecycle)
  - `preorderDetails.paymentStatus` (si existe)
- No debe existir `invoicesV2/{preorderId}` (salvo que el flujo haya cambiado).

### Paso 9: Completar preventa (convertir a factura)

Accion:
- Usar la accion “Completar/Convertir” para facturar la preventa.
- Pagar en caja (elige tarjeta o efectivo).

Checks:
- La factura final debe:
  - Crear `invoicesV2/{invoiceId}` + `invoices/{invoiceId}`.
  - Ejecutar tarea `closePreorder` (si existe en outbox) y el preorder queda cerrado (estado cambia a `preorder_closed` o similar).
- Cuadre: suma al metodo usado.

### Paso 10: Gasto ligado al cuadre

Accion:
- Registrar un gasto (monto pequeno, ej. `50.00`) y asignarlo al cuadre abierto.
- Metodo: “caja abierta / open_cash” (o equivalente en UI).

Checks:
- `expenses/{expenseId}` existe.
- Debe apuntar al `cashCountId` (frecuente: `expense.payment.cashRegister == cashCountId`).
- En cuadre: afecta el “sistema” (resta) en el analisis.

### Paso 11: Cancelar una factura (si el sistema lo permite)

Accion:
- Cancelar la Factura 2 (tarjeta) o una factura creada solo para esto.

Checks:
- `invoices/{invoiceId}.data.status == 'cancelled'` (o equivalente).
- Ver si el cuadre ajusta totales o no:
  - Si NO ajusta: quedara como hallazgo (cierre vs auditoria).
- Inventario: si fue inventariable, verificar si hay compensacion (puede existir worker de compensacion).

### Paso 12: Cerrar cuadre de caja (closing)

Accion:
- Cerrar el cuadre.
- Contar efectivo para que la discrepancia sea 0 (ideal) o una discrepancia controlada.

Sugerencia para “discrepancia 0”:
- Usa el resumen de la UI para calcular cuanto deberia haber en efectivo y pon exactamente eso en cierre.

Checks:
- `cashCounts/{cashCountId}.cashCount.closing.*` presente.
- Totales guardados `totalCard/totalTransfer/totalCharged/totalSystem/totalRegister/totalDiscrepancy`.

## Export + analisis (al terminar)

### 1) Export pack (carpeta nueva)
```powershell
cd C:\Dev\VentaMas\functions

node .\scripts\data-audit\export-business-data.mjs `
  --keyPath=C:\Dev\keys\VentaMas\ventamaxpos-firebase-adminsdk-r55lp-41498ebe9e.json `
  --businessId=X63aIFwHzk3r0gmT8w6P `
  --includeSensitive=1 `
  --outDirBase=C:\Dev\test\VentaMas\firebase\X63aIFwHzk3r0gmT8w6P\sessions `
  --withExpenses=1 --withInventory=1 --withInvoicesV2=1 `
  --limitInvoices=500 --limitInvoicesV2=500 --limitAR=500 --limitARPayments=2000 `
  --limitCashCounts=200 --limitCreditNotes=500 --limitCreditNoteApplications=1000 `
  --limitExpenses=500 --limitProducts=2000 --limitProductsStock=8000 --limitBatches=8000 `
  --limitBackOrders=2000 --limitInventorySessions=300 --limitInventorySessionCounts=3000
```

El comando imprime `outDir`. Copia esa ruta (termina en `...\raw`).

### 2) Analizar SOLO el cuadre de hoy
```powershell
cd C:\Dev\VentaMas\functions

node .\scripts\data-audit\analyze-business-pack.mjs `
  --inDir="RUTA_DEL_RAW_QUE_IMPRIMIO_EL_EXPORT" `
  --cashCountId="TU_CASHCOUNT_ID"
```

Revisar:
- `...\analysis\analysis.md`
- `...\analysis\cash-count-audit.json`
- `...\analysis\invariants.json`

## Audit de componentes (duplicados)

```powershell
cd C:\Dev\VentaMas
node .\tools\component-audit.mjs --outDir=C:\Dev\test\VentaMas\components-audit --maxPairs=150
```

Revisar:
- `component-duplicates.md` (exact duplicates + likely duplicates)
