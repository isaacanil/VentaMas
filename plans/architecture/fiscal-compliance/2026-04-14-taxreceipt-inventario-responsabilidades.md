# Inventario de responsabilidades actuales de `taxReceipt`

> Fecha: `2026-04-14`
>
> Etapa: `Etapa 1`
>
> Paso: `Paso 1. Inventariar responsabilidades actuales`

Este inventario aterriza el estado actual del módulo `taxReceipt` con foco en
ownership funcional y deuda inmediata. La meta de este paso no es decidir la
arquitectura final completa, sino dejar claro qué hace hoy el módulo y qué
pieza debería ser dueña de cada responsabilidad.

## Tabla de responsabilidades

| Responsabilidad | Archivo actual principal | Módulo dueño correcto | Acción sugerida |
| --- | --- | --- | --- |
| Configuración de secuencias, tipos y autorizaciones fiscales | `src/modules/settings/pages/setting/subPage/TaxReceipts/TaxReceIptSetting.tsx`, `src/modules/settings/pages/setting/subPage/TaxReceipts/components/TaxReceiptAuthorizationModal/TaxReceiptAuthorizationModal.tsx`, `src/firebase/taxReceipt/fbUpdateTaxReceipt.ts` | `Settings > Fiscal > Documentos fiscales` | Mantener en settings como superficie UI, pero consolidar acceso a datos y shape del documento. |
| Activación o desactivación de capacidad documental fiscal | `functions/src/app/modules/business/functions/createBusiness.js`, `src/features/taxReceipt/taxReceiptSlice.ts`, `src/modules/settings/pages/setting/subPage/TaxReceipts/components/ReceiptSettingsSection/*` | `Settings > Fiscal` | Mantener como configuración del negocio y dejar de expandir su semántica fuera de capacidad documental. |
| Seeds y plantillas por país o tipo fiscal | `functions/src/app/modules/business/functions/createBusiness.js`, `src/firebase/taxReceipt/taxReceiptsDefault.ts`, `src/firebase/taxReceipt/taxReceiptTemplates.ts`, `src/firebase/taxReceipt/fbAutoCreateDefaultReceipt.ts` | `Fiscal localization catalogs` + `business provisioning` | Mover el seed operativo al backend y dejar `taxReceiptTemplates.ts` como catálogo reusable por jurisdicción. |
| Generación y avance de secuencia fiscal en frontend | `src/features/taxReceipt/taxReceiptSlice.ts`, `src/features/taxReceipt/increaseSequence.ts`, `src/firebase/taxReceipt/fbGetAndUpdateTaxReceipt.ts`, `src/utils/taxReceipt.ts` | `Fiscal documents` backend | Congelar. No debe crecer ni seguir siendo ruta oficial de numeración. |
| Generación y reserva de NCF en backend legacy | `functions/src/app/modules/taxReceipt/services/taxReceiptAdmin.service.js`, `functions/src/app/modules/taxReceipt/services/taxReceiptService.ts`, `functions/src/app/modules/taxReceipt/utils/generateNCFCode.ts`, `functions/src/app/modules/taxReceipt/utils/rncUtils.ts` | `Fiscal documents` backend | Mantener compatibilidad legacy mientras se converge a un motor único. |
| Reserva transaccional moderna y ledger de uso | `functions/src/app/versions/v2/invoice/services/ncf.service.js`, `functions/src/app/versions/v2/invoice/services/ncfLedger.service.js`, `functions/src/app/versions/v2/invoice/controllers/rebuildNcfLedger.controller.js` | `Fiscal documents` + `Fiscal operations` | Tratar esta ruta como base candidata del motor canónico y del soporte operacional. |
| Integración con ventas y emisión de facturas | `functions/src/app/modules/invoice/services/invoice.service.js`, `functions/src/app/versions/v2/invoice/services/orchestrator.service.js`, `src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/utils/submitInvoicePanel.ts`, `src/services/invoice/invoice.service.ts` | `Ventas / Facturación` consumiendo `Fiscal documents` | Refactorizar para que ventas consuma el servicio fiscal y no defina reglas de secuencia. |
| Integración con notas de crédito y ajustes comerciales | `src/components/modals/CreditNoteModal/CreditNoteModal.tsx`, `src/firebase/creditNotes/fbAddCreditNote.ts` | `Ventas / Ajustes comerciales` consumiendo `Fiscal documents` | Mantener el consumo documental, pero separar el cálculo tributario de la habilitación de NCF. |
| Alertas, reconstrucción de ledger, auditoría y saneamiento | `src/firebase/taxReceipt/rebuildNcfLedger.ts`, `src/firebase/taxReceipt/getNcfLedgerInsights.ts`, `src/firebase/taxReceipt/logSequenceWarning.ts`, `src/firebase/taxReceipt/removeDuplicateTaxReceipts.ts` | `Fiscal / Compliance operations` | Mantener y endurecer como herramientas de soporte, observabilidad y migración. |
| Cálculo de impuestos y pricing condicionado por `taxReceiptEnabled` | `src/utils/pricing.ts`, `src/features/cart/utils/updateAllTotals.ts`, `src/components/ui/Product/Product/hooks/useProductHandling.tsx`, `src/components/modals/ProductForm/components/sections/PriceCalculator.tsx` | `Tax calculation` | Separar con prioridad. Este acoplamiento no pertenece a `taxReceipt`. |
| Etiquetas visuales y render documental hardcodeadas a `B01/B02` | `functions/src/app/modules/invoice/templates/template2/builders/header.js`, `src/pdf/creditNote/templates/template1/builders/header.ts` | `Document rendering` consumiendo catálogos fiscales | Reemplazar condicionales rígidos por catálogos documentales. |

## Acoplamientos peligrosos observados en este paso

1. `taxReceiptEnabled` afecta impuestos y totales, no solo la emisión de
   comprobantes.
2. Existen varios motores de numeración entre frontend, backend legacy e
   `invoice v2`.
3. El cliente todavía puede sembrar recibos por defecto y mutar secuencias.
4. La UI de settings concentra reglas de negocio que deberían vivir en servicios.
5. Las plantillas visuales siguen asumiendo `NCF` tradicional serie `B`.

## Evidencia mínima revisada

- Frontend de datos fiscales:
  - `src/firebase/taxReceipt/*`
- Backend fiscal legacy:
  - `functions/src/app/modules/taxReceipt/*`
- Emisión moderna:
  - `functions/src/app/versions/v2/invoice/services/ncf.service.js`
- Integraciones consumidoras:
  - `functions/src/app/modules/invoice/*`
  - `src/services/invoice/*`
  - `src/components/modals/CreditNoteModal/*`
- Acoplamiento de pricing:
  - `src/utils/pricing.ts`
  - `src/features/cart/utils/updateAllTotals.ts`

## Salida del paso

El módulo `taxReceipt` hoy mezcla al menos cinco responsabilidades distintas:
configuración fiscal, seeds y catálogos, numeración documental, soporte
operacional de ledger y decisiones tributarias de pricing. Con este inventario ya
queda delimitado qué piezas son settings, cuáles son emisión fiscal, cuáles son
operación fiscal y cuáles son deuda accidental fuera de ownership.
