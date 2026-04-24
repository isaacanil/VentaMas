# Mapa de refactor seguro del módulo `taxReceipt` / `NCF`

> Estado: `proposal`
>
> Fecha: `2026-04-14`
>
> Este documento aterriza el diagnóstico del módulo actual de `NCF/taxReceipt`
> en VentaMas y propone un refactor incremental, compatible con producción,
> alineado con el diseño de `fiscal/compliance` extensible.

## Propósito

Definir:

- qué hace hoy el módulo `taxReceipt`
- qué parte del comportamiento actual es correcta y reusable
- qué parte está mal ubicada o mal acoplada
- a qué dominio debe pertenecer cada pieza
- en qué orden intervenir sin romper facturación, pricing ni secuencias activas

## Decisión principal

`NCF/e-NCF` no debe seguir viviendo como un feature de UI del punto de venta, ni
como una extensión informal de contabilidad.

La frontera correcta es:

- `Settings > Fiscal > Documentos fiscales`: configuración y autorización
- `Fiscal / Compliance`: secuencias, reservación, ledger, reporting y autoridad
- `Ventas / Compras / Notas de crédito`: consumen documentos fiscales
- `Accounting`: consume el resultado fiscal y tributario, pero no es dueño de la numeración
- `Treasury`: no debe tener ownership sobre `NCF/e-NCF`

## Resumen ejecutivo

El módulo actual ya tiene activos valiosos:

- colección `taxReceipts` por negocio
- setting `settings/taxReceipt`
- flujo backend para reservar o consumir `NCF`
- ledger de uso `ncfUsage`
- pantalla de configuración con validaciones y reconstrucción de ledger

Pero hoy mezcla cuatro cosas distintas:

1. autorización y secuencias fiscales
2. cálculo de impuestos y precios
3. UI de settings
4. emisión operativa de ventas/notas de crédito

Ese cruce genera complejidad accidental y hace difícil:

- introducir `e-NCF`
- soportar `606/607/608`
- mantener consistencia entre `invoice v1`, `invoice v2` y settings
- migrar sin riesgo a un dominio fiscal más serio

## Hallazgos principales

### 1. El toggle de comprobantes afecta impuestos y pricing

Hallazgo crítico.

Hoy `taxReceiptEnabled` no solo controla si se emite un comprobante fiscal. También
altera el cálculo de impuesto y precio final.

Archivos:

- `src/utils/pricing.ts`
- `src/components/ui/Product/Product/hooks/useProductHandling.tsx`
- `src/components/modals/ProductForm/components/sections/PriceInfo.tsx`
- `src/components/modals/ProductForm/components/sections/PriceCalculator.tsx`
- `src/components/modals/CreditNoteModal/CreditNoteModal.tsx`
- `src/features/cart/utils/updateAllTotals.ts`

Problema:

- deshabilitar comprobantes no debería equivaler a vender sin impuesto
- `ITBIS` y demás reglas tributarias pertenecen a `tax-calculation`, no a `fiscal-sequences`

Decisión:

- separar `taxReceiptEnabled` de cualquier cálculo tributario
- crear una fuente de verdad distinta para reglas de impuesto aplicables por producto/documento

### 2. Existen varios motores de numeración y actualización de secuencia

Hallazgo crítico.

Hoy hay lógica de secuencia en frontend y backend, con variantes de longitud,
padding, tipos y actualización de cantidades.

Archivos:

- `src/features/taxReceipt/taxReceiptSlice.ts`
- `src/features/taxReceipt/increaseSequence.ts`
- `src/firebase/taxReceipt/fbGetAndUpdateTaxReceipt.ts`
- `src/utils/taxReceipt.ts`
- `functions/src/app/modules/taxReceipt/services/taxReceiptAdmin.service.js`
- `functions/src/app/modules/taxReceipt/utils/generateNCFCode.ts`
- `functions/src/app/versions/v2/invoice/services/ncf.service.js`

Problema:

- más de un lugar puede “saber” cómo se incrementa una secuencia
- no todas las rutas manejan igual `sequenceLength`, `quantity` y duplicados
- cualquier cambio futuro para `e-NCF` se multiplicaría

Decisión:

- dejar el backend como autoridad canónica de secuencias
- congelar creación de nueva lógica de numeración en frontend
- usar `reserveNcf` de `invoice v2` como candidato a núcleo canónico

### 3. El módulo actual está bien ubicado visualmente en settings, pero mal delimitado funcionalmente

Hallazgo importante.

La pantalla de configuración tiene sentido en `Settings`, pero el dominio no debe
seguir definido por un `slice` de frontend ni por helpers sueltos de Firestore.

Archivos:

- `src/modules/settings/pages/setting/subPage/TaxReceipts/*`
- `src/features/taxReceipt/*`
- `src/firebase/Settings/taxReceipt/*`
- `src/firebase/taxReceipt/*`

Decisión:

- mantener la pantalla en settings
- mover ownership funcional a `Fiscal / Compliance`
- reducir el `slice` a selección y estado UI transitorio, no a reglas de negocio

### 4. El seed y las plantillas siguen centrados en `NCF` tradicional serie `B`

Hallazgo esperado, pero hay que hacerlo explícito.

Archivos:

- `functions/src/app/modules/business/functions/createBusiness.js`
- `src/firebase/taxReceipt/taxReceiptsDefault.ts`
- `src/firebase/taxReceipt/taxReceiptTemplates.ts`
- `functions/src/app/modules/invoice/templates/template2/builders/header.js`

Problema:

- el sistema nace configurado para `B01/B02`
- la localización está mezclada con defaults operativos y con plantilla visual

Decisión:

- mantener `serie B` como operación actual
- preparar catálogos para `traditional` y `electronic`
- sacar códigos hardcoded de plantillas y lógica visual

### 5. Ya existe una base más sana en `invoice v2`

Hallazgo favorable.

`functions/src/app/versions/v2/invoice/services/ncf.service.js` ya hace una
reserva transaccional de NCF, registra `ncfUsage` y evita duplicados sin depender
de Redux ni de helpers del frontend.

Decisión:

- no rehacer este patrón
- convertirlo en base del futuro `fiscal document issuance service`

## Comparación con Odoo y patrón objetivo

El patrón de Odoo es útil como referencia conceptual:

- la numeración de factura pertenece al dominio documental/contable, no al carrito
- la localización fiscal cuelga de una capa de `accounting localization`
- POS y ventas consumen la configuración, pero no son dueños de la regla
- la validación de secuencia y huecos es un problema documental/auditable

Aplicado a VentaMas:

- `NCF/e-NCF` debe vivir como `localización fiscal` o `fiscal documents`
- la UI de settings se conserva
- el cálculo de impuesto se separa
- la reserva/emisión queda en backend

## Mapa actual por capas

### Capa 1. Configuración y seeds

- `functions/src/app/modules/business/functions/createBusiness.js`
- `src/firebase/taxReceipt/taxReceiptsDefault.ts`
- `src/firebase/taxReceipt/taxReceiptTemplates.ts`
- `src/firebase/Settings/taxReceipt/fbEnabledTaxReceipt.tsx`
- `src/firebase/Settings/taxReceipt/fbGetTaxReceiptToggleStatus.tsx`

### Capa 2. Estado y lectura en frontend

- `src/features/taxReceipt/taxReceiptSlice.ts`
- `src/features/taxReceipt/useHydrateTaxReceiptSettings.ts`
- `src/firebase/taxReceipt/fbGetTaxReceipt.ts`
- `src/firebase/taxReceipt/fbAutoCreateDefaultReceipt.ts`

### Capa 3. Edición operativa de settings

- `src/modules/settings/pages/setting/subPage/TaxReceipts/TaxReceIptSetting.tsx`
- `src/modules/settings/pages/setting/subPage/TaxReceipts/taxConfigTable.tsx`
- `src/modules/settings/pages/setting/subPage/TaxReceipts/components/*`
- `src/firebase/taxReceipt/addTaxReceipt.ts`
- `src/firebase/taxReceipt/fbCreateTaxReceipt.ts`
- `src/firebase/taxReceipt/fbUpdateTaxReceipt.ts`
- `src/firebase/taxReceipt/fbDeteteTaxReceipt.ts`

### Capa 4. Ledger, validaciones e inspección de secuencia

- `src/firebase/taxReceipt/rebuildNcfLedger.ts`
- `src/firebase/taxReceipt/getNcfLedgerInsights.ts`
- `src/firebase/taxReceipt/logSequenceWarning.ts`
- `src/firebase/taxReceipt/removeDuplicateTaxReceipts.ts`
- `src/modules/settings/pages/setting/subPage/TaxReceipts/components/TaxReceiptForm/utils/*`
- `functions/src/app/versions/v2/invoice/controllers/rebuildNcfLedger.controller.js`
- `functions/src/app/modules/taxReceipt/services/getTaxReceipt.js`

### Capa 5. Emisión y consumo operativo

- `functions/src/app/modules/invoice/services/invoice.service.js`
- `functions/src/app/versions/v2/invoice/services/orchestrator.service.js`
- `functions/src/app/versions/v2/invoice/services/ncf.service.js`
- `src/firebase/creditNotes/fbAddCreditNote.ts`
- `src/components/modals/CreditNoteModal/*`

### Capa 6. Acoplamiento incorrecto con impuestos

- `src/utils/pricing.ts`
- `src/components/ui/Product/Product/*`
- `src/components/modals/ProductForm/components/sections/PriceInfo.tsx`
- `src/components/modals/ProductForm/components/sections/PriceCalculator.tsx`
- `src/features/cart/cartSlice.ts`
- `src/features/cart/utils/updateAllTotals.ts`

## Clasificación por archivo o grupo

La regla usada aquí es:

- `se queda`: mantener ubicación y responsabilidad con ajustes menores
- `se mueve`: cambia de ownership o módulo
- `se congela`: no agregar comportamiento nuevo ahí
- `se refactoriza`: intervenir pronto por deuda o riesgo
- `se reemplaza luego`: convivirá un tiempo hasta migración completa

| Ruta | Rol actual | Acción | Ownership recomendado | Nota |
| --- | --- | --- | --- | --- |
| `functions/src/app/modules/business/functions/createBusiness.js` | seed de settings y recibos | `se refactoriza` | `business provisioning` + `fiscal bootstrap` | Mantener seed mínimo, pero mover catálogo fiscal a una capa reusable por jurisdicción. |
| `functions/src/app/modules/taxReceipt/services/getTaxReceipt.js` | lectura transaccional de recibo | `se queda` | `fiscal document service` | Es una pieza sana y reutilizable. |
| `functions/src/app/modules/taxReceipt/services/taxReceiptAdmin.service.js` | generación y uso de NCF en v1 | `se reemplaza luego` | `fiscal sequence engine` | Convivirá mientras exista `invoice v1`, pero no debe seguir creciendo. |
| `functions/src/app/modules/taxReceipt/services/taxReceiptService.ts` | wrapper adicional de generación | `se congela` | `legacy compatibility` | Parece redundante frente a `taxReceiptAdmin.service.js` y `ncf.service.js`. |
| `functions/src/app/modules/taxReceipt/utils/generateNCFCode.ts` | util de incremento y NCF | `se congela` | `legacy compatibility` | Duplicado funcional. No debe usarse para nuevas rutas. |
| `functions/src/app/modules/taxReceipt/config/ncfTypes.ts` | catálogo de tipos | `se mueve` | `fiscal catalogs` | Debe formar parte de catálogos de documento fiscal por jurisdicción. |
| `functions/src/app/modules/taxReceipt/utils/rncUtils.ts` | soporte de generación/consultas | `se revisa y se mueve` | `fiscal identity` o `legacy` | Mantener solo si aporta a validación RNC o lookup reusable. |
| `functions/src/app/modules/invoice/services/invoice.service.js` | emisión v1 con NCF | `se refactoriza` | `sales invoice orchestration` | Debe consumir un servicio fiscal canónico, no lógica propia. |
| `functions/src/app/versions/v2/invoice/services/ncf.service.js` | reserva transaccional de NCF | `se queda` | `fiscal issuance backend` | Mejor candidato para base canónica. |
| `functions/src/app/versions/v2/invoice/services/orchestrator.service.js` | crea factura v2 y reserva NCF | `se queda` | `sales orchestration` | Ya trata NCF como subsistema, no como lógica de UI. |
| `functions/src/app/versions/v2/invoice/controllers/rebuildNcfLedger.controller.js` | reparación de ledger | `se queda` | `fiscal operations` | Útil para soporte y migración. |
| `src/types/taxReceipt.ts` | tipos del módulo | `se refactoriza` | `shared fiscal types` | Debe evolucionar a `fiscalDocument` y separar `traditional/electronic`. |
| `src/features/taxReceipt/taxReceiptSlice.ts` | estado, selección y generación | `se refactoriza` | `fiscal ui state` | Sacar lógica de secuencia; dejar solo selección/config UI. |
| `src/features/taxReceipt/increaseSequence.ts` | incremento local | `se congela` | `legacy compatibility` | No usar para nuevas rutas. |
| `src/features/taxReceipt/useHydrateTaxReceiptSettings.ts` | hidratación desde localStorage | `se queda temporalmente` | `settings hydration` | Mantener durante transición, luego mover a settings fiscal v2. |
| `src/firebase/taxReceipt/fbGetTaxReceipt.ts` | lectura realtime de recibos | `se queda` | `settings data access` | Útil para settings; no debe ser fuente de verdad de emisión. |
| `src/firebase/taxReceipt/fbGetAndUpdateTaxReceipt.ts` | consume y avanza secuencia desde frontend | `se reemplaza luego` | `legacy compatibility` | Riesgoso como patrón; backend debe ser la única autoridad. |
| `src/firebase/taxReceipt/addTaxReceipt.ts` | alta de comprobante | `se refactoriza` | `settings fiscal data access` | Normalizar IDs y shape. |
| `src/firebase/taxReceipt/fbCreateTaxReceipt.ts` | alta con `nanoid` | `se refactoriza` | `settings fiscal data access` | Hoy compite con IDs por `serie`. Debe unificarse. |
| `src/firebase/taxReceipt/fbUpdateTaxReceipt.ts` | batch de actualización | `se refactoriza` | `settings fiscal data access` | No debe asumir que `serie` siempre es el ID final. |
| `src/firebase/taxReceipt/fbDeteteTaxReceipt.ts` | borrado | `se queda` | `settings fiscal data access` | Mantener con guardas de integridad. |
| `src/firebase/taxReceipt/fbAutoCreateDefaultReceipt.ts` | auto seed desde cliente | `se reemplaza luego` | `legacy bootstrap` | El seed debe consolidarse en backend/provisioning. |
| `src/firebase/taxReceipt/taxReceiptsDefault.ts` | defaults locales | `se mueve` | `fiscal localization catalogs` | Convertir en catálogo inicial, no seed operativo disperso. |
| `src/firebase/taxReceipt/taxReceiptTemplates.ts` | plantillas por país | `se queda y evoluciona` | `fiscal localization catalogs` | Buena base para localización; ampliar a `traditional/electronic`. |
| `src/firebase/taxReceipt/rebuildNcfLedger.ts` | wrapper callable de reconstrucción | `se queda` | `fiscal operations` | Útil para soporte y migración. |
| `src/firebase/taxReceipt/getNcfLedgerInsights.ts` | wrapper callable de insights | `se queda` | `fiscal operations` | Útil para UX de secuencia segura. |
| `src/firebase/taxReceipt/logSequenceWarning.ts` | warnings de secuencia | `se queda` | `fiscal operations` | Mantener como observabilidad. |
| `src/firebase/taxReceipt/removeDuplicateTaxReceipts.ts` | limpieza de duplicados | `se queda temporalmente` | `migration support` | Mantener mientras exista deuda histórica. |
| `src/utils/taxReceipt.ts` | normalización, formato y nuevos recibos | `se refactoriza` | `shared fiscal helpers` | Conservar solo helpers puros; sacar defaults y numeración operativa. |
| `src/utils/pricing.ts` | cálculo de impuesto/precio ligado a NCF | `se refactoriza urgente` | `tax calculation` | Es el acoplamiento más peligroso del frontend. |
| `src/features/cart/cartSlice.ts` | usa `taxReceiptEnabled` en totales | `se refactoriza urgente` | `cart pricing` | Debe depender de `tax policy`, no de comprobantes. |
| `src/features/cart/utils/updateAllTotals.ts` | totales ligados a NCF | `se refactoriza urgente` | `cart pricing` | Igual que arriba. |
| `src/components/ui/Product/Product/*` | muestra precio condicionado por NCF | `se refactoriza` | `sales ui` | Debe leer impuestos calculados, no toggle fiscal. |
| `src/components/modals/ProductForm/components/sections/PriceInfo.tsx` | mensaje de impuesto condicionado por NCF | `se refactoriza` | `catalog/product pricing ui` | El copy actual refuerza un modelo incorrecto. |
| `src/components/modals/ProductForm/components/sections/PriceCalculator.tsx` | cálculo condicional local | `se refactoriza` | `catalog/product pricing ui` | Debe alinearse con un motor tributario aparte. |
| `src/components/modals/CreditNoteModal/*` | depende de receipts y taxes | `se refactoriza` | `sales adjustments` | Mantener consumo de documentos fiscales, no cálculo tributario basado en toggle. |
| `src/modules/settings/pages/setting/subPage/TaxReceipts/TaxReceIptSetting.tsx` | pantalla principal | `se queda y se renombra luego` | `Settings > Fiscal > Documentos fiscales` | Buena ubicación. Cambia el framing, no necesariamente la ruta inicial. |
| `src/modules/settings/pages/setting/subPage/TaxReceipts/taxConfigTable.tsx` | tabla de configuración | `se queda` | `settings fiscal ui` | Reusable con modelo v2. |
| `src/modules/settings/pages/setting/subPage/TaxReceipts/components/AddReceiptModal/*` | alta de plantillas | `se queda` | `settings fiscal ui` | Consumirá catálogos v2. |
| `src/modules/settings/pages/setting/subPage/TaxReceipts/components/DisabledReceiptsModal/*` | gestión de deshabilitados | `se queda` | `settings fiscal ui` | Mantener como UI. |
| `src/modules/settings/pages/setting/subPage/TaxReceipts/components/FiscalReceiptsAlertSettings/*` | alertas | `se queda` | `settings fiscal ui` | Encaja con settings fiscal. |
| `src/modules/settings/pages/setting/subPage/TaxReceipts/components/FiscalReceiptsAlertWidget/*` | widget de alertas | `se queda` | `settings fiscal ui` | Encaja con settings fiscal. |
| `src/modules/settings/pages/setting/subPage/TaxReceipts/components/ReceiptSettingsSection/*` | toggle y ajustes | `se refactoriza` | `settings fiscal ui` | Separar “activar secuencias” de “política de impuesto”. |
| `src/modules/settings/pages/setting/subPage/TaxReceipts/components/ReceiptTableSection/*` | listado editable | `se queda` | `settings fiscal ui` | Mantener. |
| `src/modules/settings/pages/setting/subPage/TaxReceipts/components/TableTaxReceipt/*` | tabla | `se queda` | `settings fiscal ui` | Mantener. |
| `src/modules/settings/pages/setting/subPage/TaxReceipts/components/TaxReceiptAuthorizationModal/*` | autorización y secuencias | `se queda y evoluciona` | `settings fiscal ui` | Punto natural para autorizaciones futuras y e-CF. |
| `src/modules/settings/pages/setting/subPage/TaxReceipts/components/TaxReceiptForm/*` | edición de secuencia y preview | `se queda y se simplifica` | `settings fiscal ui` | Mantener UX; mover reglas finales al backend. |
| `functions/src/app/modules/invoice/templates/template2/builders/header.js` | etiqueta visual `B01/B02` | `se refactoriza` | `document rendering` | Usar catálogo/configuración, no condicional hardcoded. |

## Qué podemos reutilizar sin miedo

- la colección `businesses/{businessId}/taxReceipts`
- `settings/taxReceipt` como punto de compatibilidad temporal
- `ncfUsage` como ledger de reservación/consumo
- `rebuildNcfLedger` como herramienta de reparación y migración
- la pantalla de settings como cascarón de producto
- `taxReceiptTemplates.ts` como semilla de localizaciones
- `invoice v2` y `reserveNcf` como base de emisión futura

## Qué no debe crecer más

- lógica de secuencia en Redux
- avance de secuencia desde frontend
- defaults fiscales sembrados desde cliente
- uso de `taxReceiptEnabled` para desactivar impuestos
- condicionales visuales hardcoded solo para `B01/B02`

## Ownership objetivo

### 1. `fiscal-settings`

Responsable de:

- activar capacidades fiscales del negocio
- catálogo de tipos documentales
- autorizaciones, secuencias y alertas
- preferencias por jurisdicción

### 2. `fiscal-documents`

Responsable de:

- reservar secuencia
- emitir documento fiscal
- registrar uso, anulación y corrección
- soportar `traditional` y `electronic`

### 3. `tax-calculation`

Responsable de:

- `ITBIS`
- exento
- descuentos tributarios
- retenciones y base imponible

No debe depender de:

- `taxReceiptEnabled`
- que la secuencia fiscal esté activa o no

### 4. `fiscal-reporting`

Responsable de:

- `606`
- `607`
- `608`
- base mensual `IT-1`
- conciliación con contabilidad

## Orden seguro de refactor

### Fase 0. Congelación táctica

- no agregar nueva lógica de secuencia en frontend
- no reutilizar `taxReceiptEnabled` para decisiones tributarias nuevas
- toda nueva emisión fiscal debe pasar por backend

### Fase 1. Desacople tributario

Objetivo:

- sacar `taxReceiptEnabled` del pricing y totales

Impacto:

- alto valor
- riesgo controlable si se hace con flags y pruebas de totales

Resultado esperado:

- impuestos calculados por política tributaria
- comprobantes controlados por política documental

### Fase 2. Autoridad backend única

Objetivo:

- formalizar un único servicio canónico de reservación/consumo

Recomendación:

- usar `functions/src/app/versions/v2/invoice/services/ncf.service.js` como base
- hacer que `invoice v1` consuma esa misma lógica o un wrapper común

### Fase 3. Limpieza de settings

Objetivo:

- convertir `taxReceiptSlice` en estado UI y selección, no en motor de negocio
- dejar `TaxReceiptSetting` como pantalla de `Settings > Fiscal`

### Fase 4. Preparación de `fiscal-reporting`

Objetivo:

- reutilizar catálogo, secuencias y ledger para `606/607/608`
- introducir modelo canónico `fiscalDocumentFormat = traditional | electronic`

### Fase 5. Preparación de `e-NCF`

Objetivo:

- soportar `serie B` y `serie E`
- agregar estados de autoridad sin bloquear operación actual

## Riesgos de producción

### Riesgo 1. Cambiar pricing sin feature flag

Consecuencia:

- diferencias visibles en carrito, POS, factura y notas de crédito

Mitigación:

- flag por negocio
- pruebas de snapshot monetario
- comparación dual de totales antes de activar

### Riesgo 2. Migrar secuencias sin backend canónico

Consecuencia:

- duplicados o saltos de NCF

Mitigación:

- mantener `ncfUsage`
- usar transacciones
- reconstrucción con `rebuildNcfLedger`

### Riesgo 3. Borrar seeds o flows viejos demasiado pronto

Consecuencia:

- negocios existentes sin configuración mínima

Mitigación:

- transición aditiva
- backfill
- limpieza solo tras piloto y comparación

## Recomendaciones inmediatas

1. Crear un `feature flag` para desacoplar impuestos de `taxReceiptEnabled`.
2. Declarar `reserveNcf` como base del nuevo backend canónico.
3. Congelar `fbGetAndUpdateTaxReceipt.ts` para nuevas integraciones.
4. Renombrar conceptualmente el módulo en documentación interna a `fiscal documents`.
5. Continuar `606/607/608` solo después de cerrar Fase 1 y Fase 2.

## Decisión final

Sí vale la pena reutilizar buena parte del módulo actual.

Pero no conviene seguir evolucionándolo como “feature taxReceipt del POS”.
La ruta correcta es:

- conservar UI y herramientas útiles
- mover ownership a `Fiscal / Compliance`
- consolidar secuencias en backend
- separar impuestos de comprobantes
- usar esa base para reportes mensuales y luego `e-NCF`
