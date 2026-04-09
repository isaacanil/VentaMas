# Propuesta: Preventa + CxC + Conversión a Factura

Fecha: 2026-01-20

## Objetivo

Definir cómo permitir pagos parciales a una preventa usando CxC y cuándo convertirla en factura, reutilizando componentes existentes.

## Escenarios a cubrir

1. **Preventa pendiente, sin CxC, pago parcial**

- Crear CxC ligada a la preventa (`invoiceId = preorderId`).
- Registrar pago con el formulario de CxC.
- La preventa sigue pendiente.

2. **Preventa pendiente, sin CxC, pago total**

- Opción A: crear CxC + pago total (para recibo) y luego convertir a factura.
- Opción B: abrir `InvoicePanel` directo para facturar (si se quiere factura inmediata).

3. **Preventa con CxC existente, pago parcial adicional**

- Abrir formulario de pago de CxC y registrar pago.
- Mantener preventa pendiente.

4. **Preventa con CxC existente, pago total**

- Habilitar “Convertir a factura”.
- Conversión final con `InvoicePanel`.

5. **Preventa cancelada/completada**

- Bloquear pagos y conversión.

6. **Cliente genérico / límites de crédito**

- Bloquear creación de CxC (mismo criterio que ventas).

## Recomendación técnica

**No modificar `InvoicePanel` para pagos parciales.**
Reusar el flujo actual de CxC:

- `PaymentForm` de CxC.
- `fbAddAR` + `fbAddInstallmentAR` para crear la cuenta.
- Las funciones de pago ya actualizan el documento en `/invoices`.

## Por qué no usar `InvoicePanel`

- `InvoicePanel` crea factura V2, inventario, cash count, NCF.
- Para abonos parciales no se necesita generar factura.
- El flujo de CxC ya existe y actualiza el documento de la factura/preventa.

## Componentes a reusar

- **PaymentForm** (CxC): `src/modules/accountsReceivable/components/PaymentForm/PaymentForm.tsx`
- **Cuentas por cobrar** (creación): `src/firebase/accountsReceivable/fbAddAR.ts`
- **Cuotas CxC**: `src/firebase/accountsReceivable/fbAddInstallmentAR.ts`
- **Acciones preventa**: `src/modules/sales/pages/PreorderSale/components/PreSaleTable/tableCells.tsx`

## Cambios mínimos propuestos (UI)

1. Nuevo botón en preventas: **“Abonar / Pago parcial”**
   - Si ya existe CxC → abre PaymentForm.
   - Si no existe → crea CxC y luego abre PaymentForm.

2. Botón **“Convertir a factura”**
   - Visible cuando saldo = 0 (CxC pagada).
   - Abre `InvoicePanel` para facturar.

## Decisiones pendientes

1. ¿Conversión a factura automática o manual cuando el pago total llega a 0?
2. ¿Configuración de CxC con defaults (1 cuota) o abrir panel para configurar?

## Notas

- Si usamos `invoiceId = preorderId`, el flujo de pagos de CxC actualizará el mismo doc en `/invoices`.
- Esto evita backend nuevo y mantiene trazabilidad.
