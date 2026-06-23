# Motor de paginacion documental en laboratorio

## Objetivo

Construir un motor propio de paginacion para documentos operativos de VentaMas
con HTML, CSS, JavaScript y React. El motor debe repetir header y footer por
pagina, aceptar alturas dinamicas de chrome, distribuir el body por altura real
medida en el DOM, bloquear impresion cuando hay riesgo de cortes, y vivir
primero en una ruta de laboratorio aislada del flujo actual de facturas.
El nucleo reusable vive en `src/components/DocumentPagination`; la ruta de
laboratorio solo lo consume para probarlo con datos controlados antes de llevarlo
a facturas reales.

## Decision provisional

La decision actual es mantener el flujo actual de facturas como default y
fallback, mientras se integra el motor nuevo de forma limitada detras del flag
fiscal `features.fiscal.printPaginationEnabled` y como plantilla seleccionable
`template_paginated_dom` para pruebas explicitas. CSS Paged Media, Vivliostyle y
motores PDF siguen siendo referencias utiles, pero no son el camino principal
para esta fase porque el problema central de VentaMas es medir chrome React de
altura dinamica, partir el body en bloques atomicos y bloquear impresion cuando
un bloque real no cabe.

El laboratorio ahora tiene dos escenarios:

1. Demo generico: filas artificiales, header/footer expandibles, resumen final y
   bloque gigante de overflow.
2. Factura realista: datos con forma de `InvoiceData`, filas como bloques
   atomicos en CSS grid, encabezado de columnas repetido desde `renderHeader`,
   footer dinamico por pagina y fixtures de factura corta, factura larga, e-CF
   con QR textual y resumen grande.

Esta decision no autoriza todavia reemplazar la impresion productiva general de
facturas. Los negocios sin flag, las plantillas PDF programaticas y cualquier
documento que falle medicion/freeze vuelven al flujo actual.
La excepcion controlada es `template_paginated_dom`: si un negocio selecciona
esa plantilla, la estrategia de impresion fuerza `paginated-dom` aunque el flag
fiscal este apagado, para facilitar pruebas dirigidas sin activar el motor para
otras plantillas.
Agregar diagnostico o comparacion legacy no cambia ese estado: el motor sigue
en integracion limitada y reversible hasta cumplir los criterios de salida.

## Criterios de decision

| Alternativa | Corte exacto por alto real | Header/footer dinamico | Texto seleccionable | Peso operativo | Testabilidad | Decision |
| --- | --- | --- | --- | --- | --- | --- |
| CSS Paged Media puro | Media | Limitado por soporte real | Si | Bajo | Media | Usar solo como transporte basico (`@page`, saltos). |
| Vivliostyle/PagedJS | Alta en documentos paged-media | Media, depende del modelo | Si | Medio/alto | Media | No adoptar en esta fase; no resolvio el caso dinamico de VentaMas sin acoplamiento. |
| PDF engines | Alta dentro de su propio layout | Alta si se reescribe todo | Depende del engine | Alto | Media | Mantener solo flujos existentes; no usar para el motor nuevo. |
| DOM medido + bloques atomicos | Alta contra el layout React real | Alta por rol de pagina | Si | Bajo/medio | Alta | Camino principal. |
| DOM congelado antes de imprimir | No pagina por si solo | Conserva resultado ya paginado | Si | Medio | Alta | Complemento obligatorio antes de `window.print()`. |
| Imagen/raster/canvas | Alta visual si DPI correcto | Alta visual | No | Medio/alto | Baja/media | Fallback excepcional de investigacion, no camino principal ni reemplazo de bloques atomicos. |

La complejidad esencial es medir el DOM real, tener IDs estables, bloquear
overflow y repetir chrome dinamico. La complejidad accidental seria duplicar
facturas en otra libreria PDF o convertir todo a imagen antes de probar que el
contrato DOM resuelve el caso.

## Problema

El CSS de impresion no se comporta igual que el CSS de pantalla. El navegador
puede recalcular media queries, aplicar reglas de fragmentacion, ajustar color,
escalar al papel seleccionado por el usuario y cambiar el resultado al abrir el
preview. Por eso el motor no debe confiar solo en `@media print` ni en que
`break-inside: avoid` resuelva todos los casos. La estrategia actual es medir el
documento en pantalla, paginarlo en nodos atomicos, congelar una copia final del
DOM y solo imprimir si esa copia final no tiene overflow detectable.

## Alternativas evaluadas

1. CSS Paged Media puro.
   - Ventaja: usa el modelo nativo de paginas, `@page`, margenes y tamano.
   - Limite: el soporte de headers/footers dinamicos y contenido corrido no
     cubre por si solo el caso de VentaMas, especialmente cuando el header y
     footer cambian de alto por pagina.

2. Vivliostyle u otro motor paged media.
   - Ventaja: resuelve muchas reglas de paginacion avanzada.
   - Limite: ya existe evidencia practica de que no resolvio el problema del
     header/footer dinamico para este flujo. Tambien agrega acoplamiento y
     bundle/operacion que el laboratorio actual evita.

3. Medicion DOM propia.
   - Ventaja: usa el layout real de React/CSS antes de imprimir, permite tratar
     cada bloque como atomico y soporta header/footer dinamicos por rol de
     pagina: `single`, `first`, `middle`, `last`.
   - Limite: requiere contrato estricto de medicion, IDs estables y bloqueo
     cuando un bloque no cabe en la capacidad disponible.

4. Snapshot DOM congelado antes de `window.print()`.
   - Ventaja: reduce cambios de ultimo minuto del CSS de impresion. El helper
     clona el subtree paginado, conserva hojas de estilo, fija variables y
     estilos runtime criticos, espera fuentes e imagenes, escribe un iframe de
     impresion y valida overflow antes de llamar `print()`.
   - Limite: no reemplaza al motor de paginacion; solo congela el resultado ya
     validado.

5. Convertir a imagen.
   - Ventaja: maxima rigidez visual.
   - Limite: pierde texto seleccionable, puede degradar nitidez si no se maneja
     DPI, pesa mas y hoy depende de APIs o librerias que no conviene adoptar
     como camino principal. El uso de HTML-in-Canvas aun no es soporte estable
     general; debe quedar como investigacion/fallback futuro. No debe usarse
     para evitar modelar bloques atomicos ni activarse automaticamente cuando
     falle la paginacion.

## Freeze DOM vs imagen antes de imprimir

Si el problema es que el CSS cambia al entrar en impresion, el camino principal
es congelar el DOM final, no rasterizar la factura completa. El flujo correcto
es: React renderiza, el motor mide, pagina en bloques atomicos, renderiza
header/footer por pagina, clona la raiz `[data-print-pagination-pages]`,
conserva las hojas `link/style`, copia variables `--paginated-*` y estilos
runtime criticos al clon, espera fuentes e imagenes, valida overflow dentro del
iframe y solo entonces llama `print()`.

Esto reduce la diferencia entre pantalla y preview porque el navegador recibe
un documento ya paginado y con dimensiones cerradas. Aun asi no promete control
absoluto: el dialogo de impresion, la escala elegida por el usuario, margenes
del dispositivo y decisiones del user agent pueden seguir afectando el resultado.
Por eso el helper usa `@page`, dimensiones A4, `print-color-adjust: exact` como
hint, y validacion de overflow como ultimo gate verificable.

La version actual no inlinea todos los estilos computados de cada nodo. El
snapshot depende de las hojas de estilo cargadas y solo fija los estilos
criticos que cambian el contexto de paginacion (`--paginated-*`, direccion,
fuente, tamano de fuente y line-height). Tambien bloquea la impresion si alguna
imagen del source no confirma carga antes de congelar, porque aun no existe una
clasificacion entre imagen critica y opcional.

El helper browser-only tambien puede producir una snapshot HTML validada con
`createFrozenPaginatedDocumentHtml`. Esa salida devuelve `html`, `blob`,
`pageCount`, `source` y `title`; nunca llama `print()` y valida el mismo HTML en
un iframe oculto antes de entregarlo. Es una salida neutral para descarga,
diagnostico o export futuro, no un PDF ni una imagen. Como conserva `link/style`
y URLs normalizadas, no debe tratarse como archivo offline autosuficiente si los
assets o estilos no son accesibles desde el entorno donde se abra.

Convertir cada pagina a imagen queda como fallback de investigacion, no como
salida automatica. Canvas/imagen puede servir para casos extremos, pero pierde
texto seleccionable, complica accesibilidad, depende de limites de canvas/origen
limpio, fija DPI y puede ocultar errores reales de paginacion que el motor debe
reportar. Si el iframe congelado falla, el comportamiento correcto es fallar
cerrado o volver al flujo legacy, no esconder el fallo rasterizando.

## Contrato del motor actual

- Entrada: `blocks`, `geometry`, `renderHeader`, `renderFooter`.
- Cada bloque debe tener `id` unico y representa una unidad atomica.
- Se miden alturas reales con `ResizeObserver` y `getBoundingClientRect()`.
- Se miden cuatro roles de chrome: `single`, `first`, `middle`, `last`.
- La capacidad del body se calcula restando padding, gaps, header y footer.
- Si la paginacion por roles oscila, se usa capacidad conservadora y se marca
  `stable: false`.
- La impresion solo se habilita si:
  - el DOM fue medido,
  - el layout esta estable,
  - no hay IDs duplicados,
  - no hay bloques mas altos que la capacidad de su pagina,
  - la copia congelada en iframe tampoco tiene overflow.

Limitacion actual: el motor pagina por `PaginatedBlock`, no por cualquier nodo
interno. Para facturas reales, la tabla debe modelar filas o secciones como
bloques atomicos; si se entrega una tabla completa como un solo bloque, el motor
solo podra moverla completa o bloquearla por overflow. Header/footer pueden
cambiar por rol de pagina, pero no deben cambiar su altura segun
`pageBlockCount` hasta agregar una segunda pasada de medicion por paginas reales.

El escenario de factura del laboratorio usa filas `grid` y no `table`,
`thead`, `tfoot` ni `table-header-group`. Esto es intencional: el header de
columnas vive en `renderHeader`, cada producto es un bloque medible y el resumen
final vive en el body para que el motor pueda moverlo completo.

## Contrato neutral de `@/components/DocumentPagination`

`DocumentPagination` es un motor React neutral para documentos paginados. No
conoce facturas, notas, ventas ni rutas del laboratorio. El consumidor entrega
`blocks`, `geometry`, `renderHeader` y `renderFooter`; el motor mide el DOM real
con `ResizeObserver` y `getBoundingClientRect()`, distribuye los bloques por
capacidad disponible y expone `PaginationRuntimeState` mediante
`onPaginationStateChange`.

El barrel principal `@/components/DocumentPagination` exporta el componente y
tipos de render. El helper browser-only de impresion congelada se importa desde
`@/components/DocumentPagination/browser` para evitar que consumidores de solo
render arrastren codigo que toca `window`, `document`, iframes o `print()`.
Ese subpath exporta:

- `printFrozenPaginatedDocument`: valida y manda a imprimir el iframe congelado.
- `createFrozenPaginatedDocumentHtml`: valida y devuelve el HTML congelado como
  string y `Blob`, sin disparar impresion.

Cada `PaginatedBlock` debe tener un `id` unico y representar una unidad atomica
de paginacion. El motor no parte contenido interno de un bloque: si una tabla
completa se entrega como un solo bloque, la tabla no se divide por filas. Para
facturas, las filas, resumenes, notas y secciones firmables deben modelarse como
bloques separados segun la granularidad que se quiera permitir.

`renderHeader` y `renderFooter` reciben `PaginatedDocumentContext`:
`pageNumber`, `totalPages`, `isFirstPage`, `isLastPage` y `pageBlockCount`. Hoy
el motor mide el chrome por rol de pagina (`single`, `first`, `middle`, `last`)
usando `pageBlockCount: 0`, y luego renderiza cada pagina con el conteo real de
bloques. Por eso `pageBlockCount` debe tratarse como dato informativo o visual
que no cambia la altura del header/footer. Si un caso real necesita que el alto
del chrome dependa de `pageBlockCount`, antes debe agregarse una segunda
medicion por paginas reales.

La impresion o exportacion debe intentarse solo cuando `readyToPrint === true`.
Ese estado exige DOM medido, layout estable, IDs unicos, bloques medidos,
ausencia de overflow de bloques y header/footer dentro de la pagina. Aun asi,
`readyToPrint` es condicion necesaria, no autorizacion final para llamar
`print()`: el ultimo gate es la validacion del iframe congelado, con documento
clonado, fuentes e imagenes listas, estilos aplicados y cero overflow detectable.
El helper de freeze clona el DOM paginado y reduce cambios de `@media print`,
pero no sustituye la paginacion ni garantiza control absoluto sobre el motor de
impresion del navegador.

## Integracion futura con facturas reales

1. Mantener el lab como banco de prueba y no importar `modules/dev` desde
   facturas.
2. Crear adaptadores de datos de factura, nota de credito y nota de debito hacia
   `PaginatedBlock[]`.
3. Modelar filas y secciones de factura como bloques atomicos pequenos, no como
   una tabla gigante.
4. Implementar `renderHeader` y `renderFooter` con datos reales, usando
   principalmente `isFirstPage`, `isLastPage`, `pageNumber` y `totalPages`.
5. Validar fixtures reales: factura corta, factura de dos paginas, factura
   larga, nota de credito, nota de debito, resumen final grande y bloque
   deliberadamente demasiado alto.
6. Mantener el flujo actual de impresion de facturas hasta que el motor nuevo
   pase pruebas unitarias, frontera arquitectonica, build production sin
   contaminacion del lab y QA visual en navegador.
7. Usar `@/components/DocumentPagination/browser` solo en el punto exacto donde
   el usuario dispara impresion o exportacion.

## Avance hacia integracion real

Ya existe una primera capa productiva aislada:

- `src/modules/invoice/printPagination/documentModel.ts` convierte
  `InvoiceData` en un modelo neutral de impresion.
- `buildCreditNotePrintDocumentModel` y `buildDebitNotePrintDocumentModel`
  reutilizan `creditNoteToInvoicePrintData` y `debitNoteToInvoicePrintData`,
  por lo que nota de credito y nota de debito entran al mismo contrato.
- `src/modules/invoice/components/FiscalDocumentPagination/` renderiza ese
  modelo con `PaginatedDocument`, sin importar `modules/dev`, `modules/sales`,
  `services`, Redux, `react-to-print`, Vivliostyle ni librerias PDF.
- La excepcion de arquitectura permite `PaginatedDocument` dentro de
  `FiscalDocumentPagination` y dentro del host estrecho
  `InvoicePanel/components/PaginatedPrintHost/`; el resto del flujo real sigue
  bloqueado contra el laboratorio y Vivliostyle.
- `processInvoicePrint` decide estrategia con
  `features.fiscal.printPaginationEnabled`: plantillas PDF programaticas
  conservan su PDF actual, flag apagado conserva `react-to-print`, y flag
  encendido monta el host paginado oculto.
- La plantilla `template_paginated_dom` aparece como `Plantilla Carta Paginada`
  en el selector beta/developer y fuerza `paginated-dom` por `invoiceType`, sin
  depender de `features.fiscal.printPaginationEnabled`.
- La vista previa de esa plantilla renderiza `FiscalDocumentPagination`; el
  fallback legacy de `react-to-print` reutiliza la plantilla HTML V3.1 para no
  dejar al flujo sin salida si el motor paginado falla.
- `PaginatedInvoicePrintHost` renderiza el adaptador fiscal fuera del
  modal/drawer, espera `readyToPrint`, pasa el source exacto
  `[data-print-pagination-pages]` a `printFrozenPaginatedDocument`, y cae al
  flujo actual si hay timeout, overflow, source ausente o freeze bloqueado.
- Diagnostico de fallback: el host propaga razones con codigo y, cuando hay
  estado de paginacion, incluye `measured`, `stable`, `ready`, `pages`,
  `overflowBlocks`, `chromeOverflowRoles`, `duplicateBlocks` y
  `unmeasuredBlocks`. Esto permite saber si el fallback fue por timeout,
  layout bloqueado, source ausente, freeze bloqueado o error del helper.

Esta capa ya esta conectada de forma opcional alrededor de `processInvoicePrint`,
donde existen `business`, `invoiceType` e `InvoiceData` canonico. Sigue siendo
una integracion limitada y reversible: no reemplaza la impresion productiva
general hasta pasar comparacion lado a lado y criterios de salida.

## Barrera doble de impresion

Hay tres readiness gates distintos:

1. Elegibilidad: `features.fiscal.printPaginationEnabled === true`, plantilla
   no programatica PDF y documento soportado por el adaptador fiscal.
2. Backend operativo: `committed`, `frontend_ready`, `print_ready` o
   `print_ready_with_review` prueban que la factura canonica y sus
   prerequisitos fiscales y operativos estan listos para mostrarse al usuario.
3. Frontend visual: `readyToPrint === true` prueba que el layout medido esta
   estable, sin bloques duplicados, sin bloques no medidos, sin overflow y con
   header/footer dentro de la pagina.

El motor nuevo no debe imprimir si falla cualquiera de las dos barreras. Una
factura operativamente lista puede no estar visualmente lista si un bloque no
cabe; una factura visualmente lista no debe saltarse la barrera fiscal/backend.

## Checklist de salida a produccion

Actual automatizado:

- Motor neutral en `src/components/DocumentPagination`.
- Freeze DOM browser-only en `@/components/DocumentPagination/browser`.
- Snapshot HTML exportable y validada por iframe, sin PDF, raster ni llamada a
  `print()`.
- Lab dev-only con demo y factura realista.
- Modelo neutral para factura, credito y debito.
- Adaptador React `FiscalDocumentPagination`.
- Harness visual real `tools/qa/print-pagination-real-documents-visual.mjs` para
  factura corta, factura multipagina, factura e-CF, nota de credito, nota de
  debito y bloque imposible.
- Validacion visual real que presiona `Imprimir`, inspecciona el iframe
  congelado antes de `print()` y comprueba que no incluya controles del harness.
- QA visual del host productivo
  `tools/qa/print-pagination-host-integration-visual.mjs`, con happy path y
  fallback por overflow terminal, source ausente, freeze bloqueado, error del
  helper, timeout de layout y timeout de freeze/print; cada fallback prueba
  `printCalls=0` del motor nuevo cuando corresponde.
- Paridad semantica core entre `InvoiceTemplate2V3_1` y el motor paginado para
  identidad fiscal, negocio, cliente, productos, totales fiscales, pago y datos
  e-CF basicos.
- Soporte de modelo/render para `logoUrl`, lineas fiscales extendidas de
  negocio/cliente, `signatureAssets.signatureUrl`,
  `signatureAssets.stampUrl` y `previewSignatureAssets`; el QA visual valida
  que esos assets carguen y sobrevivan al iframe congelado.
- Feature flag fiscal `features.fiscal.printPaginationEnabled` con default
  apagado.
- Host oculto productivo `PaginatedInvoicePrintHost` conectado a
  `InvoicePanel`, con fallback inmediato al `react-to-print` actual.
- Timeout cubre tanto la espera del layout como un helper de freeze/print que
  nunca resuelva.
- Tests de modelo, adaptador, freeze/export HTML, engine, fronteras principales
  y costura controller hacia fallback legacy.

Pendiente automatizar:

- Fixtures reales adicionales con logo/firma/sello externos no-data-URL y
  comparacion visual aprobada contra datos reales de negocio.
- Capturar estrategia final y metricas historicas de fallback del host
  productivo para soporte/observabilidad, no solo para QA local.
- Metricas de bloqueo por `overflowBlockIds`, `chromeOverflowRoles` y
  `unmeasuredBlockIds`.

Pendiente producto:

- Ampliar comparacion legacy vs motor nuevo mas alla del contrato core actual:
  factura corta, multipagina, e-CF completo, credito, debito, resumen grande,
  firma/sello/logo con assets reales de negocio y bloque imposible; con
  criterios de diferencias aceptables, evidencia visual y decision explicita de
  no promocion si hay divergencias criticas.
- Mensaje de error que nombre pagina/bloque afectado.
- Politica visible para `print_ready_with_review`.

Criterio de rollback:

- Si el flag esta apagado, la plantilla no es elegible, falta configuracion, el
  motor alternativo no llega a `readyToPrint`, la copia congelada detecta
  overflow, alguna imagen del source no confirma carga o la barrera backend no
  esta en estado imprimible, se debe volver al flujo actual existente o bloquear
  la impresion con mensaje claro. Si la validacion del iframe congelado no puede
  completarse, falla cerrado; no debe caer automaticamente a rasterizacion.

## Aislamiento

La ruta de laboratorio es `/lab/print-pagination`. Debe permanecer:

- `devOnly: true`
- `requiresDevAccess: true`
- `hideInMenu: true`
- sin `isPublic`
- cargada de forma dinamica y gated por `import.meta.env.DEV` o
  `VITE_ENABLE_DEV_ROUTES === 'true'`

El laboratorio no debe importar Vivliostyle, jsPDF, pdfmake, react-pdf,
react-to-print ni flujo real de facturas. Tambien debe evitar imports privados
de `@/modules/invoice`, `@/modules/sales`, `@/services/invoice`, Redux y
plantillas productivas como `InvoiceTemplate2V3_1`. Facturas tampoco deben
importar desde `src/modules/dev/...`. Cualquier integracion futura con factura,
credito o debito debe importar solo desde `@/components/DocumentPagination` y
actualizar la guardia de arquitectura en el mismo cambio.

El adaptador productivo controlado es distinto del laboratorio: puede vivir en
`invoice/public` y en el host estrecho de `InvoicePanel`, pero no puede importar
`modules/dev`, `PrintPaginationLab`, Vivliostyle ni motores PDF externos.

## Validacion requerida antes de moverlo a facturas

1. Unit tests del engine:
   - roles `single/first/middle/last`,
   - overflow de bloques,
   - IDs duplicados,
   - oscilacion y fallback conservador,
   - capacidades por pagina.

2. Tests del freeze:
   - falla cerrado si no hay documento,
   - falla cerrado si no esta listo,
   - espera fuentes e imagenes,
   - exporta HTML congelado validado sin llamar `print()`,
   - bloquea export HTML cuando el documento no esta listo,
   - bloquea export HTML si el iframe validado sigue teniendo overflow,
   - imprime iframe congelado solo despues del callback de inspeccion,
   - permite inspeccionar el iframe antes de `print()`,
   - limpia el iframe al finalizar,
   - bloquea si el iframe final sigue teniendo overflow.

3. Tests de frontera:
   - lab sin dependencias PDF/print externas,
   - lab sin imports privados desde invoice,
   - ruta protegida por dev access,
   - build production normal sin chunk del lab.

4. Validacion visual:
   - preset de una pagina,
   - preset de dos paginas,
   - preset de tres o mas paginas,
   - header/footer presentes y numerados en cada pagina generada,
   - rol de pagina correcto: `single`, `first`, `middle`, `last`,
   - rectangulos sin overlap: header antes del body, body antes del footer y
     todo dentro del `article` de pagina,
   - header/footer expandido,
   - resumen final grande,
   - bloque gigante que fuerza overflow, reporta el bloque afectado y bloquea
     impresion.
   - factura corta de una pagina,
   - factura realista multipagina,
   - factura e-CF con QR/datos fiscales,
   - factura con resumen grande,
   - bloque gigante de factura que reporta `invoice-overflow-block`.
   - click real en `Imprimir` sobre el adaptador fiscal, con inspeccion del
     iframe congelado antes de `print()`: pagina/header/body/footer sin
     overflow, numeracion preservada, sin controles del harness y con una unica
     raiz `[data-print-pagination-pages]`.
   - fallback del host productivo: cada motivo debe probar que no llama
     `print()` por el motor nuevo cuando corresponde, vuelve a `react-to-print`
     o bloquea con mensaje claro, y deja diagnostico suficiente para soporte/QA.
     El harness actual cubre overflow, source ausente, freeze bloqueado, error
     del helper y timeout; el test unitario del host tambien cubre el caso en
     que el helper de freeze/print nunca resuelve.
   - documentos reales via:
     `node .\tools\qa\print-pagination-real-documents-visual.mjs`.
   - host productivo via:
     `node .\tools\qa\print-pagination-host-integration-visual.mjs`.

5. Build isolation:
   - build normal sin chunk ni strings del laboratorio,
   - build con `VITE_ENABLE_DEV_ROUTES=true` incluyendo la ruta del laboratorio,
   - ambos sin Vivliostyle.

## Evidencia de validacion actual

Ultima corrida registrada: 2026-06-22 en `C:\Dev\VentaMas`.

- `npm run test:run -- src\modules\invoice\services\autoCompletePreorderInvoice.test.ts`
  paso: 1 archivo, 4 tests.
- `npm run test:run:architecture:web` paso: 11 archivos, 106 tests. Cubre
  fronteras de `DocumentPagination`, lab dev-only, adaptador fiscal, rutas,
  barrels y aislamiento de facturas reales frente a Vivliostyle/lab.
- `npm run test:run -- src\modules\sales\pages\Sale\components\Cart\components\InvoicePanel\utils\resolveInvoicePrintStrategy.test.ts src\modules\sales\pages\Sale\components\Cart\components\InvoicePanel\utils\processInvoicePrint.test.ts src\modules\sales\pages\Sale\components\Cart\components\InvoicePanel\components\PaginatedPrintHost\PaginatedInvoicePrintHost.test.tsx src\modules\sales\pages\Sale\components\Cart\components\InvoicePanel\components\PaginatedPrintHost\paginatedPrintFallbackReason.test.ts src\modules\sales\pages\Sale\components\Cart\components\InvoicePanel\hooks\useInvoicePanelController.printing.test.ts src\components\DocumentPagination\utils\printFrozenPaginatedDocument.test.ts src\components\DocumentPagination\DocumentPagination.boundary.test.ts`
  paso: 7 archivos, 35 tests. Cubre export HTML congelado sin `print()`,
  estrategia de impresion, host paginado, boundary del barrel browser-only y
  costura controller de fallback a `react-to-print`.
- Suite enfocada del motor y host paso: 15 archivos, 74 tests, incluyendo
  engine, freeze, modelo fiscal, adaptador, paridad legacy, feature flag,
  estrategia de print y host oculto.
- `npm run typecheck:app`, `npm run lint:web` y `npm run lint:styles` pasaron.
- `node .\tools\qa\print-pagination-real-documents-visual.mjs` paso con:
  factura corta 1 pagina, factura 2 paginas con `printCalls=1`, factura larga
  5 paginas, factura e-CF 2 paginas con `printCalls=1`, nota de credito 1
  pagina y nota de debito 1 pagina. Capturas:
  `.tmp\print-pagination-real-documents`.
- `node .\tools\qa\print-pagination-lab-visual.mjs` paso con:
  default 4 paginas, 1 pagina, 2 paginas, 3+ paginas, resumen al borde,
  factura corta, factura 2 paginas, e-CF con QR y factura resumen grande;
  todos con `ready=true` y chrome repetido por pagina. Capturas:
  `.tmp\print-pagination-lab-*.png`.
- `node .\tools\qa\print-pagination-host-integration-visual.mjs` paso con:
  happy path `printCalls=1`; overflow, source ausente, freeze bloqueado, error
  del helper y timeout con fallback y `printCalls=0`. Capturas:
  `.tmp\print-pagination-host`.
- `npx.cmd vite build --mode staging --outDir .tmp\print-pagination-build-normal`
  paso. Auditoria de artefactos: sin filename/content hits para
  `/lab/print-pagination`, `PrintPaginationLab`, `loadPrintPaginationLabRoute`
  ni `pages/DevTools/PrintPaginationLab`.
- `$env:VITE_ENABLE_DEV_ROUTES = 'true'; npx.cmd vite build --mode staging --outDir .tmp\print-pagination-build-devroutes`
  paso. Auditoria de artefactos: incluye
  `.tmp\print-pagination-build-devroutes\assets\PrintPaginationLab-CaDoQUZD.js`
  y hits esperados de print lab en chunks dev.
- Ambos builds quedaron sin filename/content hits de `@vivliostyle`,
  `vivliostyle`, `Vivliostyle`, `printInvoiceWithVivliostyle` ni
  `.invoice-vivliostyle-root`; tampoco generaron sourcemaps `.map`.
- En esta maquina Playwright Chromium no estaba instalado; los harnesses
  usaron Google Chrome como fallback.

## Fuentes primarias consultadas

- MDN `@page`: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40page
- W3C CSS Paged Media Level 3: https://www.w3.org/TR/css-page-3/
- MDN printing guide: https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Media_queries/Printing
- MDN `break-inside`: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/break-inside
- MDN `print-color-adjust`: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/print-color-adjust
- MDN Resize Observer API: https://developer.mozilla.org/en-US/docs/Web/API/Resize_Observer_API
- Resize Observer spec: https://drafts.csswg.org/resize-observer-1/
- MDN `window.print()`: https://developer.mozilla.org/en-US/docs/Web/API/Window/print
- MDN `window.getComputedStyle()`: https://developer.mozilla.org/en-US/docs/Web/API/Window/getComputedStyle
- MDN `beforeprint`: https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeprint_event
- MDN `afterprint`: https://developer.mozilla.org/en-US/docs/Web/API/Window/afterprint_event
- MDN `HTMLCanvasElement.toDataURL()`: https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toDataURL
- Vite env and modes: https://vite.dev/guide/env-and-mode
- Vite dynamic import features: https://vite.dev/guide/features
