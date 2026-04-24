# Auditoria QA Frontend: Finanzas, Contabilidad y Vitest

Alcance: React, Redux, Vite, hooks, componentes, llamadas API y pruebas Vitest/React Testing Library para Contabilidad, CxP, CxC, Banco, Caja, Tasa de Cambio, Ventas POS, Gastos, Cuadre de Caja, Compras y Tesoreria.

Este documento complementa `2026-04-22-auditoria-qa-finanzas-contabilidad-vitest.md`, que cubrio backend/Firebase Functions.

## Resultado Ejecutivo

El frontend tiene guardas utiles en puntos criticos, pero no cierra el contrato operativo de punta a punta. La UI bloquea parte de caja abierta, moneda faltante y seleccion bancaria, pero varios bloqueos dependen de validaciones tardias, defaults silenciosos o utilidades compartidas que pueden resolver cuentas equivocadas.

Riesgos principales:

1. **P0 - Cuenta bancaria equivocada por modulo.** `resolveConfiguredBankAccountId` recibe `moduleKey`, pero en el tramo de resolucion principal usa metodo y default global antes de considerar override modular. Ventas, CxC, CxP, Compras y Gastos pueden mostrar/mandar una cuenta bancaria global en vez de la cuenta configurada para el modulo.
2. **P0 - Venta multi-moneda sin frescura de tasa.** POS bloquea moneda extranjera si no hay tasa, pero no exige tasa del dia. `cartSlice.setDocumentExchangeRate` cae a `1` si recibe tasa invalida o ausente.
3. **P0 - Gasto en efectivo no operable correctamente.** UI ofrece metodo `cash`, pero no renderiza selector de `cashAccountId`; la validacion exige `cashAccountId`. Resultado: usuario entra a un callejon sin salida o ve error incompleto.
4. **P1 - Cierre de caja tiene carrera de estado.** UI cambia caja a `closing` sin `await` antes de abrir autorizacion. Si falla el cambio, el modal de autorizacion igual puede avanzar.
5. **P1 - Estados parciales contables no tienen recuperacion visible.** POS y visor contable muestran notificaciones/estados genericos, pero no hay superficie clara para dead-letter, replay, tarea fallida o factura operativa sin asiento.

## Evidencia Revisada

Pruebas enfocadas ejecutadas:

```powershell
npm run test:run -- src/features/cart/cartSlice.test.ts src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/utils/validateInvoiceSubmissionGuards.test.ts src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/components/Body/components/DocumentCurrencySelector/useDocumentCurrencyConfig.test.ts src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/components/Body/components/ReceivableManagementPanel/ReceivableManagementPanel.test.tsx src/modules/accounting/pages/AccountingWorkspace/hooks/useAccountingWorkspace.test.ts src/modules/accounting/pages/AccountingWorkspace/utils/accountingWorkspace.test.ts src/modules/accountsPayable/pages/AccountsPayable/utils/accountsPayableDashboard.test.ts src/firebase/cashCount/closing/fbCashCountClosed.test.ts src/firebase/expenses/Items/fbAddExpense.test.ts src/firebase/expenses/Items/fbUpdateExpense.test.ts src/utils/payments/bankPaymentPolicy.test.ts src/modules/treasury/utils/bankStatementMatching.test.ts
```

Resultado: `12 passed files`, `59 passed tests`.

Archivos fuente clave revisados:

- `src/app/store.ts`
- `src/features/cart/cartSlice.ts`
- `src/utils/payments/bankPaymentPolicy.ts`
- `src/modules/sales/pages/Sale/Sale.tsx`
- `src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/utils/submitInvoicePanel.ts`
- `src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/utils/validateInvoiceSubmissionGuards.ts`
- `src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/components/Body/components/DocumentCurrencySelector/DocumentCurrencySelector.tsx`
- `src/modules/accountsReceivable/components/PaymentForm/**`
- `src/firebase/proccessAccountsReceivablePayments/fbProccessClientPaymentAR.ts`
- `src/modules/accountsPayable/pages/AccountsPayable/**`
- `src/modules/orderAndPurchase/pages/OrderAndPurchase/Compra/components/PurchasesTable/RegisterSupplierPaymentModal.tsx`
- `src/modules/orderAndPurchase/pages/OrderAndPurchase/Compra/components/PurchasesTable/utils/supplierPaymentMethods.ts`
- `src/modules/expenses/pages/Expenses/ExpensesForm/**`
- `src/validates/expenseValidate.tsx`
- `src/modules/cashReconciliation/pages/CashReconciliation/page/CashRegisterClosure/**`
- `src/modules/treasury/**`
- `src/modules/accounting/pages/AccountingWorkspace/**`

## Mapa De Vulnerabilidades UI/Estado

| Prioridad | Modulo / flujo | Evidencia | Vulnerabilidad | Impacto |
|---|---|---|---|---|
| P0 | Banco en Ventas, CxC, CxP, Gastos | `src/utils/payments/bankPaymentPolicy.ts:311`, `:317`, `:321`, `:331` | `moduleKey` entra en la firma, pero la resolucion principal prioriza config por metodo y default global. La cuenta por modulo puede quedar ignorada. | Pagos de tarjeta/transferencia pueden impactar banco equivocado. Descuadra tesoreria, conciliacion y contabilidad. |
| P0 | POS multi-moneda | `DocumentCurrencySelector.tsx:76-83`, `:126-132`, `cartSlice.ts:409-413` | UI bloquea solo si falta `sale`; no valida fecha/frescura. Si la tasa se pierde, Redux normaliza a `1`. | Venta USD puede salir con AR, caja/banco y asiento en moneda funcional incorrecta. |
| P0 | Gastos efectivo | `ExpensesForm.tsx:223`, `:228`, `:279-291`, `expenseValidate.tsx:52-55` | UI ofrece metodo `cash`, pero solo renderiza cuenta bancaria o cuadre abierto. No renderiza `cashAccountId`, aunque validador lo exige. | Gasto de caja general no se puede completar correctamente, o error queda invisible/no accionable. |
| P1 | Cuadre de caja cierre | `CashRegisterClosure.tsx:157-167` | `fbCashCountChangeState(..., 'closing')` no se espera antes de abrir autorizacion. | Usuario puede autorizar cierre aunque el estado remoto no haya cambiado. Riesgo de doble cierre o error tardio. |
| P1 | Cuadre de caja autorizacion | `completeCashRegisterClosure.ts:21-68` | Cierre backend corre antes de registrar autorizacion. Si falla bitacora de autorizacion, UI devuelve error generico aunque caja pudo cerrar. | Estado parcial: caja cerrada, UI dice fallo. Operador puede reintentar y crear confusion. |
| P1 | POS dead-letter / outbox | `submitInvoicePanel.ts:220-241`, `:257-286` | Estados no `committed` solo muestran info generica; `failedTask` se loguea en consola, no se convierte en recuperacion visible. | Venta puede quedar operativa con asiento/efecto lateral fallido y usuario sin ruta de reparacion. |
| P1 | CxC + notas credito | `fbProccessClientPaymentAR.ts:229` | Consumo de notas de credito ocurre despues del cobro AR. Si falla, el cobro puede quedar exitoso y la nota sin consumir. | UI puede comunicar exito aunque el saldo de credito quede inconsistente. |
| P1 | Pago proveedor cash gate | `RegisterSupplierPaymentModal.tsx:123`, `:273`, `:325`, `supplierPaymentMethods.ts:305` | Modal muestra gate de caja, pero submit solo se deshabilita por rollout/submitting. El bloqueo real queda en validacion tardia. | UX permite intentar accion imposible. Riesgo menor de backend, alto de operacion confusa. |
| P1 | Gastos doble submit | `ExpensesForm.tsx:99`, `:113` | Boton de guardar no esta ligado explicitamente a `loading.isOpen`; solo aparece loader. | Si loader no bloquea eventos, hay riesgo de doble click/doble write. |
| P2 | Tesoreria write-off | `ResolveBankStatementLineModal.tsx:116-178`, `useTreasuryWorkspace.ts:781-782` | Write-off exige razon, pero no comunica impacto contable ni link a asiento/evento. | Ajustes bancarios quedan visibles en tesoreria, pero trazabilidad contable queda debil para auditoria. |
| P2 | Caja abierta por usuario | `useIsOpenCashReconciliation.ts` y `validateInvoiceSubmissionGuards.ts:77` | La pagina distingue estado global y estado del usuario. Otro usuario con caja abierta puede verse como `closed` para el usuario actual. | Copy puede confundir: no es "no hay caja abierta", es "este usuario no tiene caja abierta". |

## Revision Por Modulo

### Contabilidad

Pantallas revisadas:

- `AccountingWorkspace`
- `JournalBookPanel`
- `JournalEntryDetailDrawer`
- `ManualEntriesPanel`
- `GeneralLedgerPanel`
- `FinancialReportsPanel`
- `PeriodClosePanel`
- `FiscalCompliancePanel`

Hallazgos:

- `useAccountingWorkspace` suscribe `accountingEvents`, `journalEntries`, cierres, catalogo y perfiles. Limpia arrays cuando no hay `businessId`, bien.
- `saveManualEntry` valida periodo cerrado, minimo 2 lineas y partida doble antes de callable. Correcto.
- `reversePostedEntry` usa reverso para asientos posteados. Correcto.
- `accountingWorkspace.ts` clasifica eventos `posted`, `preview`, `Sin mapeo`, `Pendiente`. No hay estado especifico para dead-letter/outbox fallido con accion de replay.
- `JournalEntryDetailDrawer` permite abrir origen y reversar, pero no muestra causa tecnica de proyeccion fallida ni tarea fallida asociada.

Riesgo UI: contabilidad puede ver "Pendiente" o "Sin mapeo", pero no distingue entre espera normal, mapping faltante, error permanente y dead-letter recuperable.

### Cuentas Por Cobrar

Hallazgos:

- `PaymentForm` limpia estado con `closePaymentModal`, `form.resetFields` y estados locales. Bien.
- `PaymentFields` bloquea tarjeta/transferencia si no hay banco activo/configurado. Bien en intencion.
- La resolucion de banco usa `resolveConfiguredBankAccountId({ moduleKey: 'accountsReceivable' })`, afectada por el bug compartido de cuenta bancaria por modulo.
- `fbProccessClientPaymentAR` consume notas de credito despues del pago AR. Si esa llamada falla, el cobro ya puede estar aplicado.

Riesgo UI: estado local se limpia bien, pero la UI no diferencia "cobro aplicado, nota de credito pendiente de consumir". Eso debe ser un warning recuperable, no exito plano.

### Cuentas Por Pagar / Compras

Hallazgos:

- CxP reutiliza `RegisterSupplierPaymentModal` desde Compras. Buena separacion: CxP es vista derivada, pago vive en dominio de compra/proveedor.
- `RegisterSupplierPaymentModal` usa `useIsOpenCashReconciliation` y `SupplierPaymentGateState`.
- Validacion exige `cashCountId` para cash y `bankAccountId` para tarjeta/transferencia.
- Submit no se deshabilita cuando cash gate no esta apto; falla despues.
- Banco configurado usa `moduleKey: 'purchases'`, tambien afectado por `resolveConfiguredBankAccountId`.

Riesgo UI: flujo es funcional, pero permite llegar al submit con precondicion visualmente fallida.

### Banco / Tesoreria

Hallazgos:

- `TreasuryBankAccountsWorkspace` tiene modales separados para cuenta, transferencia, conciliacion, linea bancaria, importacion y resolucion.
- Transferencia interna valida cuentas activas, distinta cuenta, misma moneda y sobregiro.
- Conciliacion y resolucion usan callables y feedback via `message`.
- Write-off exige razon y notas opcionales. Bien como UI minima.

Brecha: write-off debe mostrar impacto contable esperado o link al evento/asiento cuando exista. Hoy el feedback final solo dice `Diferencia bancaria ajustada.`

### Caja / Cuadre De Caja

Hallazgos:

- POS bloquea alta de productos si caja del usuario esta en estado bloqueante.
- `validateInvoiceSubmissionGuards` vuelve a validar caja abierta justo antes de facturar. Correcto.
- Cierre de caja cambia a `closing` antes de autorizacion, pero no espera respuesta.
- Cancelar si esta `closing/open` intenta devolver a `open`, bien.
- `completeCashRegisterClosure` puede cerrar caja y fallar al registrar aprobacion.

Riesgo UI: cierre puede quedar parcial y el usuario no recibe mensaje diferenciado. Necesita estado "cierre completado, aprobacion no registrada" o recuperacion especifica.

### Tasa De Cambio

Hallazgos:

- `DocumentCurrencySelector` carga config, permite moneda funcional y monedas manuales.
- Si moneda extranjera no tiene tasa de venta, setea `blockedReason`.
- Cuando config falla, texto indica que se emitira en moneda funcional hasta recuperar config.
- No valida fecha de tasa. No usa `effectiveAt`/`updatedAt` para bloquear tasa vieja.
- Redux cae a tasa `1` si `setDocumentExchangeRate` recibe valor invalido.

Riesgo UI: para un POS multi-moneda, "tasa existente" no basta. Debe ser "tasa vigente para la fecha/documento".

### Ventas POS

Hallazgos:

- `Sale.tsx` reinicia `cart`, cliente y comprobante al entrar, salvo preorder/preserveCart. Bien para evitar fuga basica.
- `InvoicePanel` valida caja abierta antes de llamar backend.
- Si `monetaryContext.blockedReason` existe, bloquea submit con warning.
- Si backend devuelve `frontend_ready`, muestra "Factura en proceso".
- Si falla outbox/task, detalles quedan en consola (`failedTask`) mas que en UI.

Riesgo UI: falta panel de estado operacional para ventas en proceso/fallidas. El operador necesita saber si puede reintentar, imprimir, cobrar, anular o escalar.

### Gastos

Hallazgos:

- `useExpenseForm` normaliza pago y resetea form en success.
- `open_cash` muestra selector de cuadre abierto.
- Tarjeta/transferencia muestran banco configurado como input deshabilitado.
- `cash` requiere `cashAccountId`, pero UI no lo muestra.
- Guardar no esta explicitamente deshabilitado por loading.

Riesgo UI: gastos desde caja general vs cuadre abierto no estan claramente separados. `cash` y `open_cash` deben tener controles distintos y errores visibles.

## Auditoria De Estado Global

| Store / estado | Limpieza actual | Riesgo |
|---|---|---|
| `cartSlice` | `resetCart` preserva settings/billing y limpia venta al entrar a POS. | `setDocumentExchangeRate` cae a `1`; riesgo si moneda extranjera pierde tasa. |
| `taxReceiptSlice` | POS limpia al entrar y bloquea/desbloquea tipo durante submit. | En errores tempranos se desbloquea; bien. Falta test RTL de ruta completa. |
| `clientCartSlice` | POS llama `deleteClient()` al entrar. | Bien para venta nueva; revisar preorder/preserveCart con cliente anterior. |
| `accountsReceivablePaymentSlice` | `closePaymentModal` resetea detalles, errores y extra. | Bien. Riesgo externo: nota credito post-pago. |
| `expenseManagement` / formulario gasto | `handleReset` tras success. | No evita doble submit de forma explicita; `cash` deja estado invalido no corregible. |
| `cashCountManagementSlice` | `clearCashCount` limpia estados principales. | Hay duplicidad con `cashStateSlice`; revisar si pantallas usan fuentes distintas. |
| `treasury` hooks locales | Modales cierran y limpian draft al completar. | Correcto. Falta conectar write-off a contabilidad visible. |

## Cobertura Actual De Pruebas Frontend

Cobertura util encontrada:

- `cartSlice.test.ts`
- `documentPricing.test.ts`
- `updateAllTotals.test.ts`
- `validateInvoiceSubmissionGuards.test.ts`
- `useDocumentCurrencyConfig.test.ts`
- `ReceivableManagementPanel.test.tsx`
- `useAccountingWorkspace.test.ts`
- `accountingWorkspace.test.ts`
- `accountsPayableDashboard.test.ts`
- `fbCashCountClosed.test.ts`
- `fbAddExpense.test.ts`
- `fbUpdateExpense.test.ts`
- `bankPaymentPolicy.test.ts`
- `bankStatementMatching.test.ts`
- `records.test.ts`

Brecha principal: predominan unit tests de utils/hooks. Faltan pruebas RTL de flujos reales con botones, selects, mensajes, submit bloqueado y estado sucio.

## Plan De Pruebas Frontend Faltantes

### P0

1. **Banco por modulo respeta override.**
   - Archivo: `src/utils/payments/bankPaymentPolicy.test.ts`
   - Caso: policy con default global `bank-global`, override `sales=bank-sales`, `expenses=bank-expenses`.
   - Esperado: `resolveConfiguredBankAccountId({ moduleKey: 'sales' }) === 'bank-sales'`; expenses devuelve `bank-expenses`.

2. **POS no permite venta USD con tasa vieja o ausente.**
   - Archivo nuevo sugerido: `DocumentCurrencySelector.staleRate.test.tsx`
   - Simular config con `USD.sale`, pero `effectiveAt` fuera del dia operativo.
   - Esperado: submit deshabilitado o `blockedReason`; `runInvoice` no llamado; no se despacha tasa `1`.

3. **POS caja cerrada bloquea cobro antes de backend.**
   - Archivo nuevo sugerido: `InvoicePanel.closedCashGuard.test.tsx`
   - Mock `checkOpenCashReconciliation` o `validateInvoiceSubmissionGuards` con `cash-count/closed`.
   - Esperado: boton/accion queda bloqueada o abre modal de caja; `runInvoice` no llamado.

4. **Gasto metodo `cash` renderiza cuenta de caja o no se ofrece.**
   - Archivo nuevo sugerido: `ExpensesForm.cashPayment.test.tsx`
   - Seleccionar `cash`.
   - Esperado: aparece selector `cashAccountId` con error visible si falta, o metodo no aparece si no hay cuentas de caja activas.

5. **Gasto loading bloquea doble submit.**
   - Archivo nuevo sugerido: `ExpensesForm.submitGuard.test.tsx`
   - Doble click en guardar mientras promise no resuelve.
   - Esperado: `fbAddExpense` se llama una vez.

### P1

6. **Pago proveedor sin caja abierta no permite submit cash.**
   - `RegisterSupplierPaymentModal.cashGate.test.tsx`
   - Esperado: boton deshabilitado o metodo cash bloqueado; callable no llamado.

7. **Pago proveedor transferencia usa banco por modulo.**
   - `RegisterSupplierPaymentModal.bankPolicy.test.tsx`
   - Esperado: payload tiene `bankAccountId` del override `purchases`, no default global.

8. **Cobro CxC transferencia usa banco por modulo.**
   - `PaymentForm.bankPolicy.test.tsx`
   - Esperado: metodo transferencia queda ligado a override `accountsReceivable`.

9. **CxC pago aplicado + nota credito falla.**
   - Test de UI o servicio: mock pago success y `fbConsumeCreditNotes` reject.
   - Esperado: warning visible "cobro aplicado, nota pendiente", no exito silencioso.

10. **Cierre caja no abre autorizacion si cambiar a `closing` falla.**
    - `CashRegisterClosure.authorizationRace.test.tsx`
    - Esperado: `fbCashCountChangeState` reject mantiene modal cerrado y muestra error.

11. **Cierre caja cerrado + aprobacion falla muestra estado parcial.**
    - `completeCashRegisterClosure.test.ts`
    - Esperado: resultado diferenciado, no error generico.

12. **JournalBook muestra dead-letter/replay.**
    - `JournalBookPanel.deadLetter.test.tsx`
    - Evento con `projection.status=failed` o task fallida.
    - Esperado: etiqueta recuperable, causa, accion "Reintentar" si aplica.

13. **Treasury write-off muestra impacto contable.**
    - `ResolveBankStatementLineModal.writeOff.test.tsx`
    - Esperado: razon requerida, boton bloqueado sin razon, mensaje de impacto contable visible.

### P2

14. **POS `preserveCart=1` no conserva cliente indebidamente.**
    - Caso preorder/preserveCart.
    - Esperado: cliente/metodo pago se preserva solo cuando hay intencion explicita.

15. **Invoice status `frontend_ready` renderiza seguimiento.**
    - Mock `runInvoice` devuelve `frontend_ready`.
    - Esperado: UI muestra estado de proceso y ruta a factura/cola, no solo toast transitorio.

16. **Accounting period close bloquea con transacciones pendientes visibles.**
    - `PeriodClosePanel.pendingTransactions.test.tsx`
    - Esperado: no cierra si resumen indica pendientes criticos.

## Codigo De Ejemplo: RTL Para Caja Cerrada En POS

Ejemplo propuesto para agregar como:

`src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/utils/submitInvoicePanel.closedCashGuard.test.tsx`

Este test no prueba todo `Sale.tsx`; usa un harness React pequeno para validar el contrato UI mas importante: accion de cobrar no llega a backend cuando la guarda de caja devuelve `closed`.

```tsx
import { useState } from 'react';
import { Form, notification } from 'antd';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { submitInvoicePanel } from './submitInvoicePanel';

const handleCashCountConfirm = vi.fn();
const runInvoice = vi.fn();
const dispatch = vi.fn();

vi.mock('./validateInvoiceSubmissionGuards', () => ({
  validateInvoiceSubmissionGuards: vi.fn().mockResolvedValue({
    ok: false,
    code: 'cash-count',
    cashCountState: 'closed',
    message: 'Caja cerrada',
    description:
      'No hay un cuadre de caja abierto para el usuario actual. Abre una caja antes de cobrar.',
  }),
}));

vi.mock('@/notification/cashCountNotification/cashCountNotificacion', () => ({
  getCashCountStrategy: vi.fn(() => ({
    handleConfirm: handleCashCountConfirm,
  })),
}));

vi.mock('@/features/taxReceipt/taxReceiptSlice', () => ({
  lockTaxReceiptType: () => ({ type: 'taxReceipt/lockTaxReceiptType' }),
  unlockTaxReceiptType: () => ({ type: 'taxReceipt/unlockTaxReceiptType' }),
}));

vi.mock('@/features/productStock/productStockSimpleSlice', () => ({
  openProductStockSimple: (product: unknown) => ({
    type: 'productStock/openProductStockSimple',
    payload: product,
  }),
}));

vi.mock('@/services/invoice/logInvoiceAuthorizations', () => ({
  default: vi.fn(),
}));

function ClosedCashCheckoutHarness() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState({ status: false, message: '' });
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setError(null);

    await submitInvoicePanel({
      accountsReceivable: {},
      business: { id: 'business-1' },
      cart: {
        id: 'cart-1',
        products: [{ id: 'product-1', name: 'Producto prueba' }],
        totalPurchase: { value: 100 },
        paymentMethod: [{ method: 'cash', value: 100, status: true }],
      },
      client: null,
      dispatch,
      duePeriod: null,
      form,
      handleAfterPrint: vi.fn(),
      handleInvoicePrinting: vi.fn(),
      hasDueDate: false,
      idempotencyKey: 'test-idempotency-key',
      insuranceAR: null,
      insuranceAuth: null,
      insuranceEnabled: false,
      invoiceComment: null,
      isTestMode: false,
      monetaryContext: null,
      ncfType: null,
      resolvedBusinessId: 'business-1',
      runInvoice,
      setInvoice: vi.fn(),
      setLoading,
      setSubmitted: vi.fn(),
      setTaxReceiptModalOpen: vi.fn(),
      shouldPrintInvoice: false,
      taxReceiptData: [],
      taxReceiptEnabled: false,
      user: {
        uid: 'user-1',
        businessID: 'business-1',
      } as any,
    });

    if (!runInvoice.mock.calls.length) {
      setError('No se puede cobrar: caja cerrada para este usuario.');
    }
  };

  return (
    <Form form={form}>
      {error ? <div role="alert">{error}</div> : null}
      <button
        type="button"
        disabled={loading.status}
        onClick={() => {
          void handleCheckout();
        }}
      >
        Cobrar
      </button>
    </Form>
  );
}

describe('submitInvoicePanel caja cerrada', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(notification, 'warning').mockImplementation(vi.fn());
  });

  it('bloquea el cobro y no llama runInvoice cuando la caja esta cerrada', async () => {
    const user = userEvent.setup();

    render(<ClosedCashCheckoutHarness />);

    await user.click(screen.getByRole('button', { name: /cobrar/i }));

    await waitFor(() => {
      expect(handleCashCountConfirm).toHaveBeenCalledTimes(1);
    });

    expect(runInvoice).not.toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith({
      type: 'taxReceipt/unlockTaxReceiptType',
    });
    expect(
      screen.getByRole('alert', {
        name: '',
      }),
    ).toHaveTextContent('No se puede cobrar: caja cerrada');
  });
});
```

Nota QA: este ejemplo valida el contrato actual de `submitInvoicePanel`. Para una prueba UI mas fuerte, conviene extraer la disponibilidad de caja a un estado visible del boton de cobrar y probar que el boton nace deshabilitado antes del click. Hoy parte del bloqueo vive en el submit, no en el estado visual permanente del boton.

## Recomendacion De Orden De Trabajo

1. Corregir y testear `resolveConfiguredBankAccountId` con prioridad P0.
2. Agregar guard de tasa vigente en selector de moneda y submit POS. Prohibir fallback `1` para moneda extranjera.
3. Arreglar `ExpensesForm` para `cash`: selector de cuenta de caja o remover metodo si no hay cuenta.
4. Hacer caja cerrada un estado visual de checkout, no solo validacion tardia.
5. Crear superficie frontend de estados parciales: factura en proceso, outbox fallido, accounting projection failed, replay disponible.
6. Endurecer cierre de caja: esperar `closing`, diferenciar cierre exitoso con autorizacion fallida.
7. Subir pruebas RTL P0/P1 antes de ampliar flujos contables.

