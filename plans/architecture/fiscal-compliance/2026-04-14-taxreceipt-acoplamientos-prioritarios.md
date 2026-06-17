# Acoplamientos peligrosos prioritarios de `taxReceipt`

> Fecha: `2026-04-14`
>
> Etapa: `Etapa 1`
>
> Paso: `Paso 3. Identificar acoplamientos peligrosos`

Este paso aterriza la deuda prioritaria del módulo actual `taxReceipt` antes de
seguir con rollout o modelo nuevo. La meta no es todavía cambiar runtime, sino
dejar una lista corta, priorizada y con evidencia concreta de qué acoplamientos
hay que romper primero para reducir riesgo productivo.

## Resumen ejecutivo

La deuda más peligrosa no es visual ni de naming. Es de frontera de dominio:

1. `taxReceiptEnabled` todavía altera impuestos y totales.
2. La numeración fiscal sigue repartida entre frontend, backend legacy y
   `invoice v2`.
3. El cliente todavía siembra, muta y normaliza secuencias fiscales.
4. Ventas y notas de crédito siguen cargando reglas fiscales locales en la UI.
5. El catálogo documental y el render siguen sesgados a `NCF` tradicional serie
   `B`.

El orden recomendado de ruptura debe empezar por lo que puede cambiar montos o
duplicar numeración. Lo cosmético o preparatorio para `e-CF` viene después.

## Lista priorizada de acoplamientos a romper primero

| Prioridad | Acoplamiento | Evidencia principal | Riesgo operativo | Decisión recomendada |
| --- | --- | --- | --- | --- |
| `P1` | `taxReceiptEnabled` controla impuestos, pricing y totales | `src/utils/pricing.ts:16`, `src/utils/pricing.ts:48`, `src/features/cart/utils/updateAllTotals.ts:35`, `src/features/cart/utils/updateAllTotals.ts:76`, `src/components/modals/CreditNoteModal/CreditNoteModal.tsx:447` | Un cambio en capacidad documental puede alterar `ITBIS`, subtotales, total a cobrar y total de nota de crédito. Mezcla `Fiscal documents` con `Tax calculation`. | Separar primero la fuente de verdad de tributación. `taxReceiptEnabled` debe significar solo capacidad documental. |
| `P2` | Coexisten varios motores de numeración fiscal | `src/features/taxReceipt/taxReceiptSlice.ts:41`, `src/features/taxReceipt/taxReceiptSlice.ts:49`, `src/firebase/taxReceipt/fbGetAndUpdateTaxReceipt.ts:57`, `functions/src/app/modules/taxReceipt/services/taxReceiptAdmin.service.js:138`, `functions/src/app/versions/v2/invoice/services/ncf.service.js:74` | Riesgo de secuencias divergentes, duplicados, saltos y comportamiento distinto según el flujo que emita. | Declarar backend canónico y congelar cualquier motor cliente-side a solo preview o tooling temporal. |
| `P3` | Cliente siembra y muta secuencias/autorizaciones operativas | `src/firebase/taxReceipt/fbAutoCreateDefaultReceipt.ts:54`, `src/firebase/taxReceipt/fbAutoCreateDefaultReceipt.ts:74`, `src/utils/taxReceipt.ts:67`, `functions/src/app/modules/business/functions/createBusiness.js:195` | El frontend todavía crea recibos, asigna series y sanea colisiones locales. Eso dificulta rollback, auditoría y consistencia entre negocios. | Mover provisioning y alta de recibos al backend. El cliente debe pasar a consumir catálogos y formularios, no sembrar secuencias. |
| `P4` | Ventas y UI local cargan reglas fiscales de disponibilidad y locking | `src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/utils/submitInvoicePanel.ts:105`, `src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/utils/submitInvoicePanel.ts:108`, `src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/utils/submitInvoicePanel.ts:188`, `src/components/modals/CreditNoteModal/CreditNoteModal.tsx:206`, `src/components/modals/CreditNoteModal/CreditNoteModal.tsx:218` | La UI decide demasiado sobre agotamiento, tipos y habilitación de notas de crédito. Eso vuelve frágil el checkout y hace difícil pilotear reglas nuevas por backend. | Mantener ventas como consumidor de capacidad fiscal, pero extraer disponibilidad y elegibilidad a servicios fiscales/backend. |
| `P5` | Catálogo y render documental hardcodeados a `NCF` tradicional serie `B` | `src/domain/fiscal/taxReceiptTemplates.ts:14`, `functions/src/app/modules/taxReceipt/utils/generateNCFCode.ts:35`, `functions/src/app/modules/invoice/templates/template2/builders/header.js:9`, `src/utils/taxReceipt.ts:80` | El sistema sigue asumiendo `B01/B02/B15/B04`, longitud fija y títulos rígidos. Eso bloquea soporte dual `traditional/electronic` y vuelve costosa la expansión jurisdiccional. | Después de estabilizar impuestos y secuencia, migrar a catálogos documentales versionables y render basado en metadata. |

## Evidencia sintetizada por acoplamiento

### 1. `taxReceiptEnabled` mezclado con impuestos

- `src/utils/pricing.ts:16` devuelve impuesto `0` cuando `taxReceiptEnabled`
  es falso.
- `src/utils/pricing.ts:48` anula `taxPercentage` cuando
  `taxReceiptEnabled` es falso.
- `src/features/cart/utils/updateAllTotals.ts:76` recalcula `taxes` usando
  `getFunctionalProductTax(product, taxReceiptEnabled)`.
- `src/components/modals/CreditNoteModal/CreditNoteModal.tsx:447` y `:456`
  recalculan totales e impuestos de la nota usando ese mismo flag.

Conclusión: hoy apagar comprobantes fiscales puede cambiar montos, no solo
documentación.

### 2. Múltiples motores para la misma secuencia

- `src/features/taxReceipt/taxReceiptSlice.ts:41` y `:49` construyen `ncfCode`
  e incrementan secuencia en Redux.
- `src/firebase/taxReceipt/fbGetAndUpdateTaxReceipt.ts:57` incrementa secuencia
  y actualiza Firestore desde cliente.
- `functions/src/app/modules/taxReceipt/services/taxReceiptAdmin.service.js:138`
  busca un `NCF` no duplicado y actualiza `quantity`.
- `functions/src/app/versions/v2/invoice/services/ncf.service.js:74` repite la
  lógica con otra implementación y otro shape de secuencia.

Conclusión: la autoridad real de numeración todavía no es única.

### 3. Provisioning fiscal repartido entre backend y frontend

- `functions/src/app/modules/business/functions/createBusiness.js:195` crea
  recibos por defecto al crear negocio.
- `src/firebase/taxReceipt/fbAutoCreateDefaultReceipt.ts:54` también crea
  recibos por defecto desde cliente si faltan series.
- `src/utils/taxReceipt.ts:67` genera series locales nuevas y `:80` crea un
  comprobante nuevo con defaults `type: 'B'`.

Conclusión: el alta de recibos y la normalización de series sigue repartida
entre varias superficies.

### 4. Reglas fiscales en la UI de ventas y notas de crédito

- `submitInvoicePanel.ts:105` calcula `effectiveTaxReceiptEnabled` en UI.
- `submitInvoicePanel.ts:108` bloquea envío por agotamiento antes de delegar.
- `submitInvoicePanel.ts:188` decide enviar `ncfType` o `null` según el flag.
- `CreditNoteModal.tsx:206` identifica el recibo de nota de crédito por nombre
  o `serie === '04'`.
- `CreditNoteModal.tsx:218` habilita notas de crédito con
  `taxReceiptEnabled && isCreditNoteReceiptConfigured`.

Conclusión: la UI conoce demasiado de semántica fiscal local y series
dominicanas.

### 5. Sesgo estructural a `NCF` tradicional serie `B`

- `src/domain/fiscal/taxReceiptTemplates.ts:14` declara filtro temporal
  solo para tipos `B`.
- `functions/src/app/modules/taxReceipt/utils/generateNCFCode.ts:35` usa
  longitud fija `10`.
- `functions/src/app/modules/invoice/templates/template2/builders/header.js:9`
  y `:12` clasifican títulos con `B01` y `B02`.
- `src/utils/taxReceipt.ts:80` crea nuevos comprobantes cliente-side con
  `type: 'B'` y secuencia `0000000000`.

Conclusión: incluso las utilidades básicas siguen modeladas alrededor del carril
tradicional.

## Orden recomendado de ruptura

1. Separar `Tax calculation` de `taxReceiptEnabled`.
2. Declarar backend como motor único de secuencia.
3. Cortar provisioning/mutación operativa desde cliente.
4. Mover elegibilidad y disponibilidad fiscal fuera de la UI transaccional.
5. Abrir catálogos y render a metadata documental reusable.

## Regla práctica para la próxima etapa

Mientras no se ejecute el paso siguiente, no se debe:

- introducir nuevas lecturas de `taxReceiptEnabled` para decidir impuestos
- agregar otro helper de numeración en frontend o en módulos de ventas
- sembrar nuevas series desde cliente
- hardcodear más condicionales `B01/B02/B04/B15` en templates o formularios

## Salida del paso

Queda priorizada la deuda de fronteras del módulo actual con foco en cinco
acoplamientos concretos, archivos ancla y riesgo operativo. El siguiente paso ya
no es análisis de ownership, sino congelar explícitamente el alcance legado para
impedir que esta deuda siga creciendo mientras se prepara la fase técnica
aditiva.
