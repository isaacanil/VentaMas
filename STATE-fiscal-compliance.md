# STATE Fiscal Compliance

## Estado actual

- Documento guía: `plans/architecture/2026-03-03-contabilidad-design/2026-04-14-diseno-modulo-fiscal-compliance-extensible.md`
- Etapa actual: `Etapa 3. Arranque seguro de 606/607/608`
- Paso actual: `Pasos 13-16 cerrados en backend para DGII_607`

## Qué sí quedó hecho

- `Paso 6` quedó avanzado con autoridad backend para el primer flujo real:
  - existe `reserveCreditNoteNcf` en `functions/`
  - reutiliza `reserveNcf`
  - `src/firebase/creditNotes/fbAddCreditNote.ts` reserva el NCF por backend
- `Paso 7` quedó avanzado:
  - se creó `src/utils/fiscal/fiscalRollout.ts`
  - el cálculo de impuestos en superficies críticas ya no depende directamente de `taxReceiptEnabled`
  - `taxReceiptEnabled` queda más acotado a capacidad documental
- `Paso 8` quedó avanzado:
  - `createBusiness` provisiona defaults fiscales por negocio
  - frontend y backend pueden resolver el mismo shape de flags fiscales
- `Paso 9` quedó cubierto para el flujo backend activo de notas de crédito:
  - `reserveCreditNoteNcf` escribe auditoría transaccional en `businesses/{businessId}/fiscalSequenceAudit/{usageId}`
  - la auditoría usa el mismo `usageId` de la reserva para correlación directa con `ncfUsage`
- `Paso 10` quedó cerrado:
  - `reserveCreditNoteNcf` ahora lee el negocio, resuelve `resolveBusinessFiscalRollout` y bloquea la reserva si `sequenceEngineV2Enabled` está apagado
  - el negocio piloto `X63aIFwHzk3r0gmT8w6P` quedó activado con:
    - `domainV2Enabled: true`
    - `sequenceEngineV2Enabled: true`
    - `reportingEnabled: true`
    - `monthlyComplianceEnabled: true`
  - el usuario confirmó que `reserveCreditNoteNcf` ya quedó desplegada
- `Etapa 3` ya arrancó en backend:
  - existe `functions/src/app/modules/compliance/config/dgiiMonthlyReports.config.js` con la fuente de verdad y campos requeridos para `DGII_606`, `DGII_607` y `DGII_608`
  - existe `functions/src/app/modules/compliance/services/dgiiMonthlyReportValidation.service.js` para validar datasets contra esas definiciones
  - hay tests de config y validación para esa capa base
- `Paso 13` avanzó con un primer lector real para `DGII_607`:
  - existe `functions/src/app/modules/compliance/services/dgii607MonthlyReport.service.js`
  - lee `businesses/{businessId}/invoices` por `periodKey`
  - ahora también lee `businesses/{businessId}/creditNotes` por `createdAt` dentro del mismo período
  - normaliza el shape legacy `{ data: ... }` al dataset requerido por `dgiiMonthlyReportValidation.service.js`
  - normaliza notas de crédito reales (`totalAmount`, `invoiceId`, `ncf`, `client`) al shape validable del preview `607`
  - cruza cada `creditNote.invoiceId` contra su factura real fuera o dentro del período
  - reporta `linked-invoice-not-found`, `linked-invoice-out-of-period`, `missing-linked-invoice-ncf` y `linked-invoice-ncf-mismatch`
  - enriquece cada issue con `recordId`, `sourcePath`, `documentNumber` y `documentFiscalNumber`
  - devuelve `issueSummary`, `sourceSnapshots` y `sourceRecords` para que la corrida auditable no dependa solo de índices posicionales
- `Paso 14` quedó cerrado para `DGII_607`:
  - existe `functions/src/app/modules/compliance/services/taxReportRun.service.js`
  - persiste corridas auditables en `businesses/{businessId}/taxReportRuns/{runId}`
  - versiona por `reportCode + periodKey` en `taxReportRunVersions`
  - guarda `sourceSnapshot`, `validationSummary`, `issues`, `generatedArtifacts` y actor de creación
- `Paso 15` quedó cerrado en backend:
  - existe callable `runMonthlyComplianceReport`
  - la corrida mensual solo se permite cuando `fiscal.reportingEnabled` y `fiscal.monthlyComplianceEnabled` están activos
  - la salida devuelve `reportRunId`, `version`, `status` e `issueSummary` para operar el piloto por negocio
- `Paso 16` quedó preparado en backend:
  - existe `monthlyCompliancePreviewRegistry.service.js` como dispatcher de builders mensuales
  - `DGII_607` ya corre por registry y la function exportada no queda hardcodeada a un único flujo privado
- hay tests unitarios para este corte backend de `DGII_607` y `TaxReportRun`

## Qué no quedó cerrado todavía

- `Etapa 3` quedó cerrada solo para backend `DGII_607`:
  - todavía no existe builder real para `DGII_606`
  - todavía no existe builder real para `DGII_608`
  - todavía no existe exportación de artefactos DGII (`txt/csv/xml`) dentro de `generatedArtifacts`
- la superficie oficial de UI/workspace de compliance sigue pendiente:
  - no se creó ruta nueva de operación mensual
  - no se conectó frontend al callable `runMonthlyComplianceReport`

## Archivos modificados en esta etapa reciente

- `functions/src/app/modules/taxReceipt/functions/reserveCreditNoteNcf.js`
- `functions/src/app/modules/taxReceipt/functions/reserveCreditNoteNcf.test.js`
- `functions/src/app/modules/taxReceipt/services/fiscalSequenceAudit.service.js`
- `functions/src/app/modules/compliance/config/dgiiMonthlyReports.config.js`
- `functions/src/app/modules/compliance/config/dgiiMonthlyReports.config.test.js`
- `functions/src/app/modules/compliance/services/dgiiMonthlyReportValidation.service.js`
- `functions/src/app/modules/compliance/services/dgiiMonthlyReportValidation.service.test.js`
- `functions/src/app/modules/compliance/services/dgii607MonthlyReport.service.js`
- `functions/src/app/modules/compliance/services/dgii607MonthlyReport.service.test.js`
- `functions/src/app/modules/compliance/services/monthlyCompliancePreviewRegistry.service.js`
- `functions/src/app/modules/compliance/services/taxReportRun.service.js`
- `functions/src/app/modules/compliance/services/taxReportRun.service.test.js`
- `functions/src/app/modules/compliance/functions/runMonthlyComplianceReport.js`
- `functions/src/app/modules/compliance/functions/runMonthlyComplianceReport.test.js`
- `functions/src/index.js`

## Verificación reciente

- Pruebas ejecutadas:
  - `npm run test:run:functions -- functions/src/app/modules/compliance/config/dgiiMonthlyReports.config.test.js functions/src/app/modules/compliance/services/dgiiMonthlyReportValidation.service.test.js functions/src/app/modules/taxReceipt/functions/reserveCreditNoteNcf.test.js`
- Pruebas ejecutadas en esta corrida:
  - `npm run test:run:functions -- functions/src/app/modules/compliance/services/dgiiMonthlyReportValidation.service.test.js functions/src/app/modules/compliance/services/dgii607MonthlyReport.service.test.js`
- Pruebas ejecutadas en esta corrida:
  - `npm run test:run:functions -- functions/src/app/modules/compliance/config/dgiiMonthlyReports.config.test.js functions/src/app/modules/compliance/services/dgiiMonthlyReportValidation.service.test.js functions/src/app/modules/compliance/services/dgii607MonthlyReport.service.test.js functions/src/app/modules/compliance/services/taxReportRun.service.test.js functions/src/app/modules/compliance/functions/runMonthlyComplianceReport.test.js`
- Resultado:
  - `3` archivos de test
  - `10` tests pasando
  - `2` archivos de test
  - `7` tests pasando
  - `2` archivos de test
  - `8` tests pasando
  - `5` archivos de test
  - `17` tests pasando

## Higiene del repo

- `STATE-fiscal-compliance.md` se mantiene fuera de Git a propósito como bitácora local de esta automatización
- El árbol contiene cambios reales pendientes en `functions/` que corresponden al avance de `Etapa 2` y `Etapa 3`

## Próximo paso exacto

- Abrir `Etapa 3` siguiente sin reabrir `DGII_607`
- Próxima subtarea exacta:
  - construir builder real de `DGII_608` reutilizando `TaxReportRun` y el registry mensual ya montado

## Bitácora 2026-04-14 13:47 - UI fiscal settings

- Se ajustó la pantalla [`C:\Dev\VentaMas\src\modules\settings\pages\setting\subPage\TaxReceipts\TaxReceIptSetting.tsx`](C:\Dev\VentaMas\src\modules\settings\pages\setting\subPage\TaxReceipts\TaxReceIptSetting.tsx) para que la sección visible deje de hablar de autorizaciones genéricas y pase a `Alertas y secuencias DGII`.
- `Configuración de Alertas de Comprobantes` dejó de abrir en drawer y ahora abre en modal centrado desde [`C:\Dev\VentaMas\src\modules\settings\pages\setting\subPage\TaxReceipts\components\FiscalReceiptsAlertWidget\FiscalReceiptsAlertWidget.tsx`](C:\Dev\VentaMas\src\modules\settings\pages\setting\subPage\TaxReceipts\components\FiscalReceiptsAlertWidget\FiscalReceiptsAlertWidget.tsx).
- El flujo de autorizaciones se reescribió visualmente como registro de secuencia/rango DGII:
  - CTA principal: `Registrar secuencia DGII`
  - header del modal: `Registrar secuencia autorizada`
  - labels/formulario orientados a rango autorizado, no a autorización genérica
  - selector y ficha del comprobante ahora hablan de `serie`, `código DGII`, `inicio del rango` y `cantidad autorizada`
- Archivos modificados en esta tanda:
  - `src/modules/settings/pages/setting/subPage/TaxReceipts/TaxReceIptSetting.tsx`
  - `src/modules/settings/pages/setting/subPage/TaxReceipts/components/FiscalReceiptsAlertWidget/FiscalReceiptsAlertWidget.tsx`
  - `src/modules/settings/pages/setting/subPage/TaxReceipts/components/FiscalReceiptsAlertSettings/FiscalReceiptsAlertSettings.tsx`
  - `src/modules/settings/pages/setting/subPage/TaxReceipts/components/TaxReceiptAuthorizationModal/TaxReceiptAuthorizationModal.tsx`
  - `src/modules/settings/pages/setting/subPage/TaxReceipts/components/TaxReceiptAuthorizationModal/components/ModalHeader.tsx`
  - `src/modules/settings/pages/setting/subPage/TaxReceipts/components/TaxReceiptAuthorizationModal/components/AuthorizationFields.tsx`
  - `src/modules/settings/pages/setting/subPage/TaxReceipts/components/TaxReceiptAuthorizationModal/components/SelectedReceiptDetails.tsx`
  - `src/modules/settings/pages/setting/subPage/TaxReceipts/components/TaxReceiptAuthorizationModal/components/ReceiptSelectField.tsx`
  - `src/utils/fiscalReceiptsUtils.ts`
- Verificación ejecutada:
  - `npm run build`
  - validación visual con `agent-browser` en `http://localhost:5173/settings/tax-receipt`

## Próximo paso UI exacto

- Mantener el criterio Odoo/DGII ya validado: no seguir expandiendo un modal global genérico de autorizaciones.
- Próxima subtarea exacta de UI:
  - mover `Registrar secuencia DGII` desde CTA global a acción contextual por fila/serie y empezar a separar `secuencia operativa` vs `metadata de autorización` dentro del modelo.
  - conectar `creditNotes` al preview de `DGII_607`
  - normalizar su shape real a dataset validable
  - reportar notas sin `invoiceId`, sin `ncf` o con montos incompletos
  - dejar el preview 607 listo como entrada directa para una futura `TaxReportRun`

## Bitácora 2026-04-15 02:08 - DGII 607 credit notes

- Se completó una sola subtarea de `Paso 13`:
  - el preview `DGII_607` ya consulta `creditNotes` del período en backend
  - las notas se normalizan al shape validable con `invoiceId`, `ncf`, `createdAt` y `totals.total`
  - los issues de `creditNotes` quedan enriquecidos con `recordId`, `sourcePath` y `documentNumber`
- Archivos modificados en esta tanda:
  - `functions/src/app/modules/compliance/services/dgii607MonthlyReport.service.js`
  - `functions/src/app/modules/compliance/services/dgii607MonthlyReport.service.test.js`
- Verificación ejecutada:
  - `npm run test:run:functions -- functions/src/app/modules/compliance/services/dgiiMonthlyReportValidation.service.test.js functions/src/app/modules/compliance/services/dgii607MonthlyReport.service.test.js`
- Próximo paso exacto de la siguiente hora:
  - cruzar `creditNotes` con `invoices` en el preview `DGII_607` para marcar notas con factura inexistente, fuera de contexto o con `invoiceNcf` inconsistente

## Bitácora 2026-04-15 02:35 - DGII 607 run pipeline

- Se cerró el tramo backend de `Pasos 13-16` para `DGII_607`.
- Avance aplicado:
  - el preview `DGII_607` ahora cruza `creditNotes` con `invoices` y genera issues de contexto/referencia
  - se agregó registry de previews mensuales para que la corrida no quede amarrada a un solo builder interno
  - se agregó `taxReportRun.service.js` para persistir corridas auditables versionadas
  - se agregó callable `runMonthlyComplianceReport` gated por `reportingEnabled` + `monthlyComplianceEnabled`
  - la nueva function quedó exportada en `functions/src/index.js`
- Archivos modificados en esta tanda:
  - `functions/src/app/modules/compliance/services/dgii607MonthlyReport.service.js`
  - `functions/src/app/modules/compliance/services/dgii607MonthlyReport.service.test.js`
  - `functions/src/app/modules/compliance/services/monthlyCompliancePreviewRegistry.service.js`
  - `functions/src/app/modules/compliance/services/taxReportRun.service.js`
  - `functions/src/app/modules/compliance/services/taxReportRun.service.test.js`
  - `functions/src/app/modules/compliance/functions/runMonthlyComplianceReport.js`
  - `functions/src/app/modules/compliance/functions/runMonthlyComplianceReport.test.js`
  - `functions/src/index.js`
- Verificación ejecutada:
  - `npm run test:run:functions -- functions/src/app/modules/compliance/config/dgiiMonthlyReports.config.test.js functions/src/app/modules/compliance/services/dgiiMonthlyReportValidation.service.test.js functions/src/app/modules/compliance/services/dgii607MonthlyReport.service.test.js functions/src/app/modules/compliance/services/taxReportRun.service.test.js functions/src/app/modules/compliance/functions/runMonthlyComplianceReport.test.js`
- Próximo paso exacto de la siguiente hora:
  - implementar `DGII_608` sobre el mismo registry y persistir su primera corrida auditable
