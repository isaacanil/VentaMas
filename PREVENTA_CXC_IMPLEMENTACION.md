# Preventa con abonos en CxC (sin factura fiscal) — Plan de implementación

## Objetivo
Permitir registrar pagos parciales (abonos) a **preventas** sin emitir factura fiscal en ese momento, pero **mostrándolas dentro del módulo normal de CxC**, con una indicación de que se trata de una preventa/prepago.

## Decisiones confirmadas
- Las preventas con abonos **deben aparecer en CxC** como una cuenta normal, con un indicador visual de “Preventa”.
- Los pagos deben comportarse **igual que una CxC normal**, pero marcando que son pagos de preventa (prepago).
- **Deben contar para el límite de crédito** del cliente.
- Se registrará dinero en caja, pero **sin comprobante fiscal** hasta que se decida generar la factura.

## Enfoque recomendado
Reutilizar **accountsReceivable** para preventas (sin crear colección nueva), agregando metadatos para distinguir el origen.

### Campos nuevos (accountsReceivable)
Agregar (en doc principal de AR):
- `sourceType: 'invoice' | 'preorder'`
- `sourceId: string` (id de preventa o factura)
- `invoiceId?: string | null` (null cuando es preventa)
- `preorderNumber?: string | number`
- `preorderStatus?: string` (ej. pending)

### Campos denormalizados en preventa (invoices/{id}.data)
Para mostrar rápido en lista de preventas:
- `preorderDetails.totalPaid?: number`
- `preorderDetails.balance?: number`
- `preorderDetails.paymentStatus?: 'unpaid' | 'partial' | 'paid'`
- `preorderDetails.lastPaymentDate?: Timestamp`

> Nota: El detalle del historial puede residir en `accountsReceivablePayments` y no en la preventa, pero sí conviene denormalizar balance/estado.

## Flujo de pagos (CxC sobre preventa)
1. Usuario entra a Preventas y elige **Abonar**.
2. Se crea o reutiliza **accountsReceivable** con `sourceType='preorder'` y `invoiceId=null`.
3. Se registra el pago en `accountsReceivablePayments`.
4. Se actualiza el balance en AR y se denormaliza en `preorderDetails`.
5. Se registra en caja: `cashCount.receivablePayments[]` con `sourceType='preorder'` y `preorderId`.

### Importante: evitar doble conteo en caja
Cuando se genere la factura desde preventa:
- **No** volver a sumar el total de la factura al cash count si ya se registraron abonos.
- Debe existir un flag en el payload/servicio para **omitir addBillToCashCountById**.

## Configuración: ¿Cuándo se genera la factura fiscal?
Agregar en `settings/billing` un campo configurable:
- `invoiceGenerationTrigger: 'first_payment' | 'full_payment' | 'manual' | 'never'`

### Comportamientos
- **A) first_payment**: al registrar el primer abono → generar factura fiscal. Si queda balance, crear AR ligada a la factura.
- **B) full_payment**: acumular abonos en preventa hasta saldo 0 → generar factura pagada.
- **C) manual**: al abonar, preguntar si se emite factura ahora o se mantiene preventa.
- **D) never**: nunca generar factura (control interno).

## Cambios principales por capa

### Backend (Functions)
1. **Receivables**
   - Permitir `invoiceId` nulo y `sourceType='preorder'`.
   - Ajustar validaciones que asumen factura.

2. **Pagos AR**
   - En `updateInvoiceTotals`, **no actualizar factura** cuando `sourceType='preorder'`.
   - Registrar pagos con `sourceType` en `cashCount.receivablePayments`.

3. **Generación factura desde preventa**
   - `generateInvoiceFromPreorder`: permitir `skipCashCount=true` si ya hubo abonos.
   - Migrar/denormalizar `totalPaid`, `balance` y `paymentHistory` a la factura.

### Frontend
1. **Preorders UI**
   - Agregar columna/badge de “Saldo / Pagado / Estado de pago”.
   - Botón “Abonar” en `PreSaleTable`.

2. **CxC UI**
   - Mostrar etiqueta “Preventa” cuando `sourceType='preorder'`.
   - En AR Summary modal, si no hay factura, mostrar “Preventa #” y usar datos de preventa.

3. **Payment Form**
   - Reutilizar flujo actual de CxC para pagos, pero aceptar `sourceType='preorder'`.

4. **Settings UI**
   - Agregar selector de “¿Cuándo se genera la factura fiscal?” en Configuración → Facturación.

## Tareas sugeridas (orden)
1. **Modelo y funciones**: soportar AR con `sourceType='preorder'` y pagos sin factura.
2. **UI CxC**: soporte visual + carga de preventa cuando no hay factura.
3. **Preorders**: botón Abonar + ver saldo/estado.
4. **Settings**: guardar/leer `invoiceGenerationTrigger`.
5. **Reglas de generación de factura** según configuración.
6. **QA**: validación de caja, saldo, límites de crédito, sin doble conteo.

## Pruebas clave
- Abonar a preventa sin factura → aparece en CxC + caja.
- Crear 2 abonos → balance correcto + historial.
- Opción A: factura se genera en primer abono y **no duplica caja**.
- Opción B: factura se genera al completar pago y queda status pagado.
- Opción C: usuario elige generar o no.
- Opción D: nunca se genera factura.

---

Si quieres, en el próximo paso preparo un checklist técnico con archivos exactos por modificar y los cambios de datos detallados.