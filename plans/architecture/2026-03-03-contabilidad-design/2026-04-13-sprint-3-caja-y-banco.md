# Sprint 3: caja y banco

Fecha: `2026-04-13`

Estado: `propuesto para ejecucion`

## Problema

El repo ya tiene `bankAccounts`, `cashAccounts`, `cashCounts`, `cashMovements`, pagos y gastos. El hueco no es falta total de entidades, sino falta de una regla uniforme:

- banco y caja no se comportan todavia como **fuentes reales de tesoreria** en todos los flujos
- algunos write paths siguen usando `cashCountId` o `cashRegister` como si fueran sustituto de cuenta de liquidez
- `expenses` permite `cash` sin exigir una fuente explicita
- pagos a suplidor siguen modelando efectivo con `cashCountId` como referencia principal

Eso deja una inconsistencia conceptual:

- `cashCount` es una sesion operativa
- `cashAccount` debe ser la fuente de efectivo
- `bankAccount` debe ser la fuente bancaria

Mientras eso no quede cerrado, tesoreria sigue mezclando operacion de caja con liquidez real.

## Objetivo

Formalizar `cashAccount` y `bankAccount` como fuentes obligatorias de tesoreria, de forma que:

- todo ingreso o egreso apunte a una fuente real de liquidez
- `cashCount` quede como contexto operativo, no como sustituto de cuenta
- `expenses`, `accountsPayablePayments` y futuros ajustes usen la misma regla
- las validaciones de frontend y backend queden alineadas

## Estado actual del repo

### Lo que ya existe

- `cashAccounts` como entidad configurable en frontend
- `bankAccounts` como entidad configurable en frontend
- `cashCounts` como flujo operativo de apertura/cierre/cuadre
- `cashMovements` como ledger operativo
- `createInternalTransfer` en backend para mover liquidez entre caja/banco

### Huecos actuales

#### 1. `cashAccount` existe, pero no domina los flujos

`src/modules/treasury/hooks/useCashAccounts.ts` ya permite crear y mantener `cashAccounts`.

Pero el resto del dominio todavia no obliga a usarla como fuente primaria de efectivo.

#### 2. `expense` sigue aceptando efectivo sin cuenta formal

En `src/utils/expenses/payment.ts`:

- `cash` produce `sourceType = 'cash'`
- `open_cash` produce `sourceType = 'cash_drawer'`

En `src/validates/expenseValidate.tsx`:

- pagos bancarios requieren `bankAccountId`
- `open_cash` requiere `cashRegister`
- `cash` simple no exige ni `cashAccountId` ni `cashRegister`

Eso permite sacar efectivo sin amarrarlo a una cuenta real.

#### 3. Pagos a suplidor dependen de `cashCountId`

En `functions/src/app/modules/purchase/functions/payablePayments.shared.js`:

- `cash` requiere `cashCountId`
- no aparece `cashAccountId` como requisito formal del medio efectivo

Eso deja el pago amarrado a la sesion de caja, no a la fuente de liquidez.

## Restricciones

- No romper ventas ni cuadre de caja actual.
- No reemplazar `cashCounts`.
- No introducir otro modelo paralelo de cuentas de liquidez.
- No aceptar flujos ambiguos donde el dinero sale “de caja” sin identificar la cuenta concreta.

## Decision recomendada

### Regla principal

Todo ingreso/egreso que impacte tesoreria debe apuntar a una **fuente real de liquidez**:

- efectivo -> `cashAccountId`
- banco -> `bankAccountId`

### Regla de contexto operativo

`cashCountId` puede seguir existiendo, pero solo como:

- contexto de turno
- evidencia operativa
- control de caja abierta

No debe ser el sustituto de `cashAccountId`.

### Regla de shape financiero

Los documentos que mueven tesoreria deben poder responder siempre:

- de que cuenta salio o entro el dinero
- que documento produjo el movimiento
- quien lo registro
- cuando ocurrio

## Modelo de dominio recomendado

### 1. Cash Account

Se conserva `cashAccounts` como catalogo maestro de efectivo.

Campos minimos vigentes recomendados:

```ts
type CashAccount = {
  id: string;
  businessId: string;
  name: string;
  currency: string;
  status: 'active' | 'inactive';
  type?: 'register' | 'petty_cash' | 'vault' | 'other' | null;
  location?: string | null;
  openingBalance?: number | null;
  openingBalanceDate?: TimestampLike | null;
  notes?: string | null;
};
```

### 2. Bank Account

Se conserva `bankAccounts` como catalogo maestro bancario.

Campos minimos vigentes recomendados:

```ts
type BankAccount = {
  id: string;
  businessId: string;
  name: string;
  currency: string;
  status: 'active' | 'inactive';
  type?: 'checking' | 'savings' | 'credit_card' | 'other' | null;
  institutionName?: string | null;
  accountNumberLast4?: string | null;
  openingBalance?: number | null;
  openingBalanceDate?: TimestampLike | null;
  notes?: string | null;
};
```

### 3. Cash Count

`cashCounts` sigue vivo, pero debe quedar subordinado a una cuenta de caja:

```ts
type CashCount = {
  id: string;
  businessId: string;
  cashAccountId: string;
  state: 'open' | 'closed';
  opening: Record<string, unknown>;
  closing?: Record<string, unknown> | null;
};
```

Regla:

- toda caja abierta debe quedar asociada a una `cashAccountId`

## Mapa de ownership

- `cashAccounts` = donde vive el efectivo
- `bankAccounts` = donde vive la liquidez bancaria
- `cashCounts` = sesion operativa de caja
- `cashMovements` = ledger canonico

## Reglas uniformes por medio

### Efectivo

Debe requerir:

- `cashAccountId`

Puede requerir adicionalmente:

- `cashCountId`, cuando el flujo ocurra dentro de una caja abierta

### Banco

Debe requerir:

- `bankAccountId`

### Mixto

Si un documento usa multiples medios:

- cada metodo debe traer su propia fuente de liquidez
- no se acepta una suma global sin desglose por fuente

## Reglas por modulo

### Gastos

#### Regla objetivo

Si `expense` impacta tesoreria:

- `cash` exige `cashAccountId`
- `bank` exige `bankAccountId`
- `cashCountId` es opcional solo como contexto operativo

#### Cambio recomendado

`src/utils/expenses/payment.ts`

- dejar de usar `cashRegister` como referencia principal del efectivo
- introducir `cashAccountId`
- mantener `cashRegister` o `cashCountId` solo como contexto operativo si la UI todavia lo necesita

`src/validates/expenseValidate.tsx`

- el metodo `cash` debe fallar si no llega `cashAccountId`
- `open_cash` no debe validar solo `cashRegister`; debe exigir `cashAccountId` y opcionalmente `cashRegister`

### Pagos a suplidor

#### Regla objetivo

Todo `accountsPayablePayment` debe cumplir:

- `cash` exige `cashAccountId`
- `bank` exige `bankAccountId`
- si ademas existe caja abierta, `cashCountId` se guarda como contexto, no como sustituto

#### Cambio recomendado

`functions/src/app/modules/purchase/functions/payablePayments.shared.js`

- cambiar la semantica de `paymentMethodRequiresCashCount`
- introducir `paymentMethodRequiresCashAccount`
- permitir que el registro conserve `cashCountId`, pero exigir `cashAccountId`

`functions/src/app/modules/purchase/functions/addSupplierPayment.js`

- validar `cashAccountId` activo cuando el medio es efectivo
- si llega `cashCountId`, validar que corresponda a una caja abierta y, cuando aplique, que este alineada con la `cashAccountId`

### Transferencias internas

Regla:

- toda transferencia caja/banco debe referenciar fuente y destino reales
- si la transferencia involucra caja operativa, puede incluir `cashCountId` como contexto
- la identidad de liquidez sigue siendo `cashAccountId` o `bankAccountId`

### Conciliacion bancaria

Regla:

- solo puede existir sobre `bankAccountId`
- no usa `cashCountId`

## Invariantes

### Invariantes de liquidez

- todo ingreso/egreso real debe tener `cashAccountId` o `bankAccountId`
- no existe movimiento de tesoreria sin fuente
- no existe movimiento bancario sin `bankAccountId`
- no existe movimiento en efectivo sin `cashAccountId`

### Invariantes de caja operativa

- un `cashCount` abierto debe tener `cashAccountId`
- un `cashCountId` no sustituye una cuenta de caja
- si un flujo usa `cashCountId`, la caja debe estar abierta

### Invariantes de catalogo

- `cashAccount.status` debe ser `active` para aceptar movimientos
- `bankAccount.status` debe ser `active` para aceptar movimientos
- cuenta y movimiento deben compartir moneda o pasar por regla explicita de conversion futura

## Cambios tecnicos implicados

### Frontend

- ajustar formularios de gastos para seleccionar `cashAccountId` cuando el metodo sea efectivo
- revisar pantallas de tesoreria y pagos para que muestren fuente real de liquidez
- evitar nombres ambiguos como `cashRegister` cuando en realidad se refiere a cuenta

### Backend

- endurecer validaciones en pagos y gastos
- exigir `cashAccountId` o `bankAccountId` antes de crear `cashMovements`
- mantener `cashCountId` solo como metadata operativa

### Tipos compartidos

- revisar `src/types/accounting.ts`
- revisar `src/utils/expenses/types.ts`
- revisar contratos de pagos en compras/CxP

## Orden de implementacion recomendado

### Slice 1. Contratos

- agregar `cashAccountId` a los contratos que mueven efectivo
- revisar tipos y normalizadores

### Slice 2. Validaciones frontend

- gastos
- pagos en efectivo
- formularios que hoy permiten flujo ambiguo

### Slice 3. Validaciones backend

- `accountsPayablePayments`
- futuros comandos de tesoreria
- cualquier write path que termine en `cashMovements`

### Slice 4. Vinculo caja operativa

- hacer obligatorio `cashCount.cashAccountId`
- validar consistencia entre caja abierta y cuenta de caja

## No alcance de Sprint 3

- no se implementa conciliacion bancaria avanzada
- no se hace forecast de tesoreria
- no se resuelve multi-moneda en cuentas de liquidez
- no se reescribe todavia `CxC`

## Criterios de aceptacion

- `cashAccounts` y `bankAccounts` quedan definidos como fuentes reales de tesoreria
- todo egreso/ingreso requiere `cashAccountId` o `bankAccountId`
- `cashCountId` queda reducido a contexto operativo
- gastos en efectivo ya no pueden guardarse sin fuente explicita
- pagos a suplidor en efectivo ya no pueden guardarse sin fuente explicita
- las validaciones frontend y backend quedan alineadas
