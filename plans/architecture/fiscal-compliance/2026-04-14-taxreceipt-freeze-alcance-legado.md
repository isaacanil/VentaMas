# Congelación de alcance legado de `taxReceipt`

> Fecha: `2026-04-14`
>
> Etapa: `Etapa 1`
>
> Paso: `Paso 4. Congelar alcance legado`

Este documento fija la regla operativa para el módulo legado `taxReceipt`
mientras se prepara la fase técnica aditiva. La intención no es frenar fixes
productivos necesarios, sino evitar que siga creciendo la deuda de frontera ya
identificada en los pasos anteriores.

## Decisión operativa

Desde esta fecha, el módulo legacy `taxReceipt` entra en estado de
`scope freeze`.

Eso significa:

- se permiten fixes de estabilidad, soporte y corrección puntual
- no se permiten nuevas responsabilidades ni nuevas rutas de negocio
- cualquier necesidad nueva debe aterrizarse ya en la frontera objetivo:
  `Fiscal documents`, `Tax calculation` o `Fiscal / Compliance`

## Reglas vigentes desde ya

### 1. No agregar nuevas dependencias a `taxReceiptSlice`

Archivos ancla:

- `src/features/taxReceipt/taxReceiptSlice.ts`
- `src/features/taxReceipt/*`

Regla:

- no agregar nuevos reducers, flags ni selectors para resolver lógica nueva de
  pricing, impuestos, eligibility comercial o workflow operacional
- si una pantalla necesita estado nuevo de dominio fiscal, debe vivir fuera del
  slice legacy o quedar modelado como estado transitorio de UI local

Motivo:

- el slice todavía muta secuencias y construye `NCF`, por lo que seguir
  centralizando lógica ahí agranda el acoplamiento cliente-side

### 2. `taxReceiptEnabled` no puede usarse para decisiones nuevas de impuestos o pricing

Archivos ancla:

- `src/utils/pricing.ts`
- `src/features/cart/utils/updateAllTotals.ts`
- `src/components/modals/CreditNoteModal/CreditNoteModal.tsx`

Regla:

- queda prohibido introducir lecturas nuevas de `taxReceiptEnabled` para alterar
  `ITBIS`, subtotales, descuentos, total a cobrar o total de nota de crédito
- cualquier ajuste futuro de tributación debe entrar por una fuente de verdad
  separada de capacidad documental

Motivo:

- hoy ese flag ya mezcla `Fiscal documents` con `Tax calculation`
- si se sigue expandiendo esa semántica, el desacople posterior se vuelve más
  costoso y riesgoso

### 3. No implementar nuevos generadores de secuencia fuera del backend

Archivos ancla:

- `src/firebase/taxReceipt/fbGetAndUpdateTaxReceipt.ts`
- `src/utils/taxReceipt.ts`
- `src/features/taxReceipt/taxReceiptSlice.ts`
- `functions/src/app/modules/taxReceipt/services/taxReceiptAdmin.service.js`
- `functions/src/app/versions/v2/invoice/services/ncf.service.js`

Regla:

- no crear helpers nuevos de numeración en frontend, slices, hooks, formularios
  ni utilidades de ventas
- si se necesita preview, debe ser explícitamente no canónico
- la autoridad final de numeración se considera backend, aunque la convergencia a
  un motor único todavía no esté cerrada

Motivo:

- la secuencia ya está fragmentada entre varias superficies
- otra ruta nueva aumentaría el riesgo de duplicados, saltos y divergencia

### 4. No sembrar ni normalizar series nuevas desde cliente

Archivos ancla:

- `src/firebase/taxReceipt/fbAutoCreateDefaultReceipt.ts`
- `src/firebase/taxReceipt/taxReceiptTemplates.ts`
- `src/firebase/taxReceipt/taxReceiptsDefault.ts`

Regla:

- no agregar nuevos flujos donde el cliente cree recibos por defecto, sanee
  colisiones o invente series/autorizaciones operativas
- cualquier expansión de catálogos o provisioning debe planificarse del lado
  backend

Motivo:

- el cliente todavía conserva responsabilidad operativa sobre seeds y
  normalización, que es deuda existente pero no debe crecer más

### 5. No endurecer más la UI con reglas fiscales locales de serie `B`

Archivos ancla:

- `src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/utils/submitInvoicePanel.ts`
- `src/components/modals/CreditNoteModal/CreditNoteModal.tsx`
- `functions/src/app/modules/invoice/templates/template2/builders/header.js`

Regla:

- no agregar nuevos condicionales específicos `B01/B02/B04/B15` en formularios,
  modales, templates o validadores de checkout
- si aparece una necesidad puntual, debe resolverse con metadata o quedar
  documentada como deuda explícita, no con otro hardcode local

Motivo:

- el módulo actual sigue sesgado a `NCF` tradicional
- aumentar esa semántica en UI haría más costosa la apertura a modelo dual
  `traditional/electronic`

## Qué sí está permitido durante el freeze

- correcciones de bugs que afecten emisión actual
- saneamiento defensivo de datos o duplicados
- mejoras de observabilidad, logging o auditoría
- refactors internos que reduzcan riesgo sin cambiar contratos
- documentación de fronteras y preparación de la capa nueva

## Qué debe considerarse fuera de alcance del legacy

- nuevos flags de negocio dentro de `taxReceiptSlice`
- nuevas reglas tributarias basadas en `taxReceiptEnabled`
- nuevas rutas de generación oficial de `NCF`
- nuevos seeds fiscales cliente-side
- nuevos hardcodes documentales locales en checkout o rendering

## Checklist de revisión para cambios futuros cerca de `taxReceipt`

Antes de aprobar cambios en superficies legacy, validar:

1. ¿El cambio agrega una responsabilidad nueva al módulo legacy?
2. ¿La lógica nueva depende de `taxReceiptEnabled` para algo distinto de
   capacidad documental?
3. ¿Se está creando o mutando secuencia fuera del backend?
4. ¿La UI está tomando una decisión que debería tomar `Fiscal documents`?
5. ¿Se está introduciendo otro hardcode `Bxx` evitable?

Si cualquiera de estas respuestas es `sí`, el cambio debe redirigirse a la capa
objetivo o dejarse bloqueado hasta diseñar la frontera correcta.

## Salida del paso

Queda congelado el crecimiento funcional del módulo legado `taxReceipt`. A partir
de aquí, el siguiente avance ya no debe sumar reglas nuevas sobre esta base, sino
abrir la fase técnica aditiva: introducir el modelo nuevo sin borrar el viejo.
