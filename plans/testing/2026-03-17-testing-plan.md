# Plan De Testing Del Repo

Fecha: 2026-03-17

## Objetivo

Definir un plan realista y progresivo para agregar tests en VentaMas sin intentar cubrir todo de golpe. La prioridad es proteger la logica de negocio con mayor riesgo de regresion: facturacion, carrito, stock, cuentas por cobrar, permisos, suscripciones y Cloud Functions criticas.

## Estado Actual Detectado

- Frontend con Vitest configurado en [vitest.config.ts](c:\Dev\VentaMas\vitest.config.ts).
- Suite actual ejecutada con `npm run test:run`.
- Resultado observado: `18` archivos pasaron, `1` suite fallo por resolucion de modulo en [src/modules/navigation/components/MenuApp/Components/MenuLink.test.tsx](c:\Dev\VentaMas\src\modules\navigation\components\MenuApp\Components\MenuLink.test.tsx).
- Tests detectados en `src`: `19`.
- Tests detectados en `functions/src`: `0`.
- Areas con mas volumen sin cobertura suficiente:
  - `src/modules/settings`: `172` archivos, `1` test.
  - `src/modules/inventory`: `145` archivos, `0` tests.
  - `src/modules/sales`: `120` archivos, `3` tests.
  - `src/modules/invoice`: `109` archivos, `0` tests.
  - `src/modules/accountsReceivable`: `32` archivos, `0` tests.
- Cobertura por area:
  - `src/utils`: `138` archivos, `7` tests.
  - `src/hooks`: `63` archivos, `2` tests.
  - `src/features`: `75` archivos, `1` test.
  - `src/router`: `34` archivos, `0` tests.
  - `src/firebase`: `288` archivos, `3` tests.
  - `functions/src/app/modules`: `84` archivos, `0` tests.
  - `functions/src/app/versions/v2`: `68` archivos, `0` tests.

## Estructura Recomendada

### Frontend

- Tests unitarios y de componentes: junto al archivo probado.
- Tests de integracion: en `tests/integration/`.
- Tests e2e: en `tests/e2e/`.

Ejemplo:

```txt
src/
  utils/
    invoice/
      totals.ts
      totals.test.ts
  modules/
    sales/
      ...

tests/
  integration/
  e2e/
```

### Functions

- Tests unitarios de servicios y utilidades: junto al archivo en `functions/src/...`.
- Si luego se agregan pruebas mas integradas con emuladores, usar `functions/tests/integration/`.

## Regla De Prioridad

Primero probar:

1. Logica de negocio que mueve dinero.
2. Validaciones que bloquean o permiten operaciones.
3. Permisos, membresias y suscripciones.
4. Sincronizaciones de stock y CxC.
5. Flujos criticos end-to-end.

No empezar por snapshots grandes ni por componentes puramente visuales.

## Fase 0: Estabilizar La Base

- [ ] Corregir la suite que hoy falla en [src/modules/navigation/components/MenuApp/Components/MenuLink.test.tsx](c:\Dev\VentaMas\src\modules\navigation\components\MenuApp\Components\MenuLink.test.tsx).
- [ ] Asegurar que `npm run test:run` quede en verde antes de expandir cobertura.
- [ ] Definir convencion de nombres:
- [x] Corregir la suite que hoy falla en [src/modules/navigation/components/MenuApp/Components/MenuLink.test.tsx](c:\Dev\VentaMas\src\modules\navigation\components\MenuApp\Components\MenuLink.test.tsx).
- [x] Asegurar que `npm run test:run` quede en verde antes de expandir cobertura.
- [x] Definir convencion de nombres:
  - `*.test.ts` y `*.test.tsx` junto al archivo probado.
  - `tests/integration/*.test.ts`.
  - `tests/e2e/*.spec.ts`.
- [x] Agregar infraestructura de tests en `functions`:
  - script de test en [functions/package.json](c:\Dev\VentaMas\functions\package.json)
  - setup base para mocks o emuladores
  - criterio claro para tests unitarios vs integracion

## Fase 1: Tests De Mayor Retorno Inmediato

### Carrito, Totales y Facturacion

- [ ] [src/features/cart/cartSlice.ts](c:\Dev\VentaMas\src\features\cart\cartSlice.ts)
- [x] [src/features/cart/cartSlice.ts](c:\Dev\VentaMas\src\features\cart\cartSlice.ts)
  - cargar carrito
  - normalizacion de moneda
  - merge de lineas
  - productos por peso
  - seleccion de `cid`
- [x] [src/features/cart/utils/updateAllTotals.ts](c:\Dev\VentaMas\src\features\cart\utils\updateAllTotals.ts)
  - subtotal
  - impuestos
  - delivery
  - descuento general
  - cambio
  - venta mixta por moneda
- [x] [src/features/cart/utils/documentPricing.ts](c:\Dev\VentaMas\src\features\cart\utils\documentPricing.ts)
  - precio directo
  - precio por `selectedSaleUnit`
  - moneda funcional
  - moneda mixta
  - producto inelegible por falta de tasa
- [x] [src/utils/pricing.ts](c:\Dev\VentaMas\src\utils\pricing.ts)
  - calculo por cantidad
  - calculo por peso
  - descuentos porcentuales
  - descuentos fijos
  - impuestos habilitados y deshabilitados
- [x] [src/utils/accounting/lineMonetary.ts](c:\Dev\VentaMas\src\utils\accounting\lineMonetary.ts)
  - snapshot monetario
  - conversion por tasa manual
  - producto en moneda funcional
  - falta de tasa
  - montos display por moneda del documento
- [ ] [src/utils/invoice/totals.ts](c:\Dev\VentaMas\src\utils\invoice\totals.ts)
  - snapshot coherente con el contenido de la factura
- [ ] [src/utils/invoiceValidation.ts](c:\Dev\VentaMas\src\utils\invoiceValidation.ts)
  - faltantes obligatorios
  - reglas invalidas de envio

### Guardas De Venta y Stock

- [x] [src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/utils/validateInvoiceSubmissionGuards.ts](c:\Dev\VentaMas\src\modules\sales\pages\Sale\components\Cart\components\InvoicePanel\utils\validateInvoiceSubmissionGuards.ts)
  - usuario incompleto
  - caja cerrada
  - caja en closing
  - producto sin seleccion fisica
  - error consultando inventario
- [x] [src/utils/inventory/productStockSelection.ts](c:\Dev\VentaMas\src\utils\inventory\productStockSelection.ts)
  - conteo de ubicaciones
  - conteo de stock disponible
  - mensaje de seleccion faltante

## Fase 2: Cuentas Por Cobrar, Permisos y Configuracion

### Accounts Receivable

- [x] [src/utils/accountsReceivable/generateInstallments.ts](c:\Dev\VentaMas\src\utils\accountsReceivable\generateInstallments.ts)
  - cuotas iguales
  - ajuste de redondeo en ultima cuota
  - fechas segun frecuencia
  - cero cuotas
- [x] [src/utils/accountsReceivable/creditLimit.ts](c:\Dev\VentaMas\src\utils\accountsReceivable\creditLimit.ts)
  - disponible
  - excedido
  - nulos y defaults
- [ ] [src/utils/accountsReceivable/getMaxInstallments.ts](c:\Dev\VentaMas\src\utils\accountsReceivable\getMaxInstallments.ts)
- [ ] [src/utils/sorts/sortAccountsReceivable.ts](c:\Dev\VentaMas\src\utils\sorts\sortAccountsReceivable.ts)

### Suscripciones, Permisos y Rutas

- [x] [src/modules/settings/pages/subscription/subscription.utils.ts](c:\Dev\VentaMas\src\modules\settings\pages\subscription\subscription.utils.ts)
  - timestamps
  - status labels
  - ownership
  - provider label
  - parseo JSON
  - normalizacion de estados de pago
- [x] [src/utils/runtime/frontendFeatureAccess.ts](c:\Dev\VentaMas\src\utils\runtime\frontendFeatureAccess.ts)
  - host restringido
  - staging/local
  - flags por feature
- [x] [src/router/routes/routeVisibility.ts](c:\Dev\VentaMas\src\router\routes\routeVisibility.ts)
  - ocultar por `HIDDEN`
  - ocultar por `DISABLED`
  - `hideInMenu`
  - match de rutas registradas
- [ ] [src/router/routes/routes.tsx](c:\Dev\VentaMas\src\router\routes\routes.tsx)
  - generacion de ids
  - filtro por entorno
  - exclusiones `devOnly`
  - exclusiones `hideInProd`

## Fase 3: Importacion, Firebase Frontend y Servicios

### Importacion y Escrituras

- [x] [src/utils/import/processMappedData.ts](c:\Dev\VentaMas\src\utils\import\processMappedData.ts)
  - transformaciones secuenciales
  - `source`
  - nested fields
  - manejo de errores de transformacion
- [ ] [src/utils/import/mapData.ts](c:\Dev\VentaMas\src\utils\import\mapData.ts)
- [ ] [src/utils/import/product/transformFunctions.ts](c:\Dev\VentaMas\src\utils\import\product\transformFunctions.ts)
- [x] [src/utils/firestore/commitChunkedBatch.ts](c:\Dev\VentaMas\src\utils\firestore\commitChunkedBatch.ts)
  - cero operaciones
  - multiples chunks
  - commit por lote

### Hooks y Servicios Frontend

- [ ] [src/hooks/useRncSearch.ts](c:\Dev\VentaMas\src\hooks\useRncSearch.ts)
  - ya existe cobertura parcial; ampliar a flujos de error y escritura en form
- [ ] [src/hooks/useTaxReceiptsFix.ts](c:\Dev\VentaMas\src\hooks\useTaxReceiptsFix.ts)
- [x] [src/hooks/accountsReceivable/useCreditLimitRealtime.ts](c:\Dev\VentaMas\src\hooks\accountsReceivable\useCreditLimitRealtime.ts)
- [ ] [src/hooks/useProductStockData.ts](c:\Dev\VentaMas\src\hooks\useProductStockData.ts)
- [x] [src/services/functionsApiClient.ts](c:\Dev\VentaMas\src\services\functionsApiClient.ts)
- [ ] [src/services/invoice/invoice.service.ts](c:\Dev\VentaMas\src\services\invoice\invoice.service.ts)
- [ ] [src/services/invoice/invoiceV2Admin.service.ts](c:\Dev\VentaMas\src\services\invoice\invoiceV2Admin.service.ts)
- [ ] Revisar la carpeta [src/firebase](c:\Dev\VentaMas\src\firebase) y priorizar:
  - billing
  - cashCount
  - accountsReceivable
  - warehouse
  - auth v2

## Fase 4: Cloud Functions Criticas

### Invoice V2

- [x] [functions/src/app/versions/v2/invoice/services/orchestrator.service.js](c:\Dev\VentaMas\functions\src\app\versions\v2\invoice\services\orchestrator.service.js)
  - idempotencia
  - derivacion de `dueDate`
  - derivacion de comentarios
  - reserva NCF
  - bloqueo por limites de uso
- [x] [functions/src/app/versions/v2/invoice/services/finalize.service.js](c:\Dev\VentaMas\functions\src\app\versions\v2\invoice\services\finalize.service.js)
  - outbox pendiente
  - fallos no bloqueantes
  - fallos bloqueantes
  - committed
  - consumo de NCF reservado
- [x] [functions/src/app/versions/v2/invoice/services/idempotency.service.js](c:\Dev\VentaMas\functions\src\app\versions\v2\invoice\services\idempotency.service.js)
- [x] [functions/src/app/versions/v2/invoice/services/failurePolicy.service.js](c:\Dev\VentaMas\functions\src\app\versions\v2\invoice\services\failurePolicy.service.js)
- [x] [functions/src/app/versions/v2/invoice/services/ncf.service.js](c:\Dev\VentaMas\functions\src\app\versions\v2\invoice\services\ncf.service.js)

### Billing

- [x] [functions/src/app/versions/v2/billing/utils/subscriptionAccess.util.js](c:\Dev\VentaMas\functions\src\app\versions\v2\billing\utils\subscriptionAccess.util.js)
  - acceso owner/admin/dev
  - membresia inactiva
  - lectura vs escritura
  - falta de subscription node
  - modulo/addon requerido
- [x] [functions/src/app/versions/v2/billing/services/usage.service.js](c:\Dev\VentaMas\functions\src\app\versions\v2\billing\services\usage.service.js)
  - limites ilimitados
  - limite exacto
  - exceso de limite
  - incremento en transaccion
  - reset mensual

### Auth y Membresias

- [x] [functions/src/app/versions/v2/auth/utils/membershipContext.util.js](c:\Dev\VentaMas\functions\src\app\versions\v2\auth\utils\membershipContext.util.js)
  - normalizacion
  - fallback legacy
  - filtro de activos
  - assert de membresia
  - assert de roles
- [x] [functions/src/app/versions/v2/auth/pin/pin.crypto.js](c:\Dev\VentaMas\functions\src\app\versions\v2\auth\pin\pin.crypto.js)
  - clave ausente
  - clave invalida
  - cifrado
  - descifrado
  - error por payload alterado

### Inventory y Accounts Receivable Backend

- [ ] [functions/src/app/modules/Inventory/functions/recalculateProductStockTotals.js](c:\Dev\VentaMas\functions\src\app\modules\Inventory\functions\recalculateProductStockTotals.js)
- [ ] [functions/src/app/modules/Inventory/functions/reconcileBatchStatusFromStocks.js](c:\Dev\VentaMas\functions\src\app\modules\Inventory\functions\reconcileBatchStatusFromStocks.js)
- [x] [functions/src/app/modules/Inventory/services/productStock.service.js](c:\Dev\VentaMas\functions\src\app\modules\Inventory\services\productStock.service.js)
- [ ] [functions/src/app/versions/v2/inventory/syncProductsStockCron.js](c:\Dev\VentaMas\functions\src\app\versions\v2\inventory\syncProductsStockCron.js)
- [ ] [functions/src/app/modules/accountReceivable/functions/createAccountsReceivable.js](c:\Dev\VentaMas\functions\src\app\modules\accountReceivable\functions\createAccountsReceivable.js)
- [ ] [functions/src/app/modules/accountReceivable/functions/processAccountsReceivablePayment.js](c:\Dev\VentaMas\functions\src\app\modules\accountReceivable\functions\processAccountsReceivablePayment.js)
- [ ] [functions/src/app/versions/v2/accountsReceivable/reconcilePendingBalanceCron.js](c:\Dev\VentaMas\functions\src\app\versions\v2\accountsReceivable\reconcilePendingBalanceCron.js)

## Fase 5: Integracion Frontend

- [ ] Flujo de login y seleccion de negocio.
- [ ] Flujo de crear venta simple en efectivo.
- [ ] Flujo de venta con producto que exige seleccion fisica.
- [ ] Flujo de venta a credito con generacion de cuotas.
- [ ] Flujo de configuracion o visualizacion de suscripcion.
- [ ] Flujo de redirect de checkout en [src/modules/checkout/pages/CheckoutRedirect/CheckoutRedirect.test.tsx](c:\Dev\VentaMas\src\modules\checkout\pages\CheckoutRedirect\CheckoutRedirect.test.tsx), ampliando cobertura.

## Fase 6: E2E Minimo Inicial

- [ ] E2E 1: iniciar sesion y crear una venta.
- [ ] E2E 2: crear venta con stock restringido y validar bloqueo.
- [ ] E2E 3: crear venta a credito y validar cuentas por cobrar.

No agregar muchos e2e al inicio. Con 2 o 3 flujos criticos basta para empezar.

## Auditoria De Huecos Detectados

Revision hecha contra:

- `src/modules`
- `src/utils`
- `src/services`
- `src/hooks`
- `functions/src/app/modules`
- `functions/src/app/versions/v2`

Inventario top-level consolidado en [2026-03-17-testing-module-audit.md](c:\Dev\VentaMas\plans\testing\2026-03-17-testing-module-audit.md).

### Modulos Frontend Que Aun No Estan Mapeados Explicitamente En El Plan

- [ ] `src/modules/authorizations`
- [ ] `src/modules/cashReconciliation`
- [ ] `src/modules/contacts`
- [ ] `src/modules/controlPanel`
- [ ] `src/modules/expenses`
- [ ] `src/modules/home`
- [ ] `src/modules/insurance`
- [ ] `src/modules/notification`
- [ ] `src/modules/orderAndPurchase`
- [ ] `src/modules/utility`
- [ ] `src/modules/welcome`

### Familias De Utilidades Frontend Aun No Mapeadas Explicitamente

- [ ] `src/utils/barcode`
- [ ] `src/utils/format`
- [ ] `src/utils/number`
- [ ] `src/utils/object`
- [ ] `src/utils/order`
- [ ] `src/utils/purchase`
- [ ] `src/utils/serialization`
- [ ] `src/utils/users`
- [ ] `src/utils/scroll`
- [ ] `src/utils/pdf`

### Servicios Y Hooks Aun No Mapeados Explicitamente

- [ ] [src/services/dynamicPermissions.ts](c:\Dev\VentaMas\src\services\dynamicPermissions.ts)
- [ ] [src/services/accountsReceivable/audit.service.ts](c:\Dev\VentaMas\src\services\accountsReceivable\audit.service.ts)
- [ ] [src/services/invoice/autoCompletePreorderInvoice.ts](c:\Dev\VentaMas\src\services\invoice\autoCompletePreorderInvoice.ts)
- [ ] [src/services/invoice/logInvoiceAuthorizations.ts](c:\Dev\VentaMas\src\services\invoice\logInvoiceAuthorizations.ts)
- [ ] [src/services/invoice/useInvoice.ts](c:\Dev\VentaMas\src\services\invoice\useInvoice.ts)
- [ ] [src/hooks/useAuthorizationModules.ts](c:\Dev\VentaMas\src\hooks\useAuthorizationModules.ts)
- [ ] [src/hooks/useAuthorizationPin.ts](c:\Dev\VentaMas\src\hooks\useAuthorizationPin.ts)
- [ ] [src/hooks/useBusiness.ts](c:\Dev\VentaMas\src\hooks\useBusiness.ts)
- [ ] [src/hooks/useFiscalReceiptsAlerts.ts](c:\Dev\VentaMas\src\hooks\useFiscalReceiptsAlerts.ts)
- [ ] [src/hooks/useInsuranceEnabled.ts](c:\Dev\VentaMas\src\hooks\useInsuranceEnabled.ts)
- [ ] [src/hooks/barcode/useBarcodeScanner.tsx](c:\Dev\VentaMas\src\hooks\barcode\useBarcodeScanner.tsx)
- [ ] [src/hooks/cashCount/useInvoicesForCashCount.tsx](c:\Dev\VentaMas\src\hooks\cashCount\useInvoicesForCashCount.tsx)
- [ ] [src/hooks/products/useGetProductsWithBatch.ts](c:\Dev\VentaMas\src\hooks\products\useGetProductsWithBatch.ts)
- [ ] [src/hooks/routes/useNavigationTracker.ts](c:\Dev\VentaMas\src\hooks\routes\useNavigationTracker.ts)

### Modulos De Functions Aun No Mapeados Explicitamente

- [ ] `functions/src/app/modules/business`
- [ ] `functions/src/app/modules/insurance`
- [ ] `functions/src/app/modules/quotation`
- [ ] `functions/src/app/modules/supabase`

### Dominios Que Tambien Faltaban En La Auditoria Inicial Y Ya Quedaron Registrados

- [ ] `src/modules/app`
- [ ] `src/modules/auth`
- [ ] `src/modules/checkout`
- [ ] `src/modules/dev`
- [ ] `src/modules/inventory`
- [ ] `src/modules/invoice`
- [ ] `src/modules/navigation`
- [ ] `src/modules/products`
- [ ] `src/features/*` salvo `cart`
- [ ] `src/firebase/*` salvo las prioridades ya anotadas
- [ ] `functions/src/app/modules/ai`
- [ ] `functions/src/app/modules/client`
- [ ] `functions/src/app/modules/invoice`
- [ ] `functions/src/app/modules/products`
- [ ] `functions/src/app/modules/provider`

### Modulos Ya Mapeados Pero Todavia Sin Tests En Repo

- [ ] `functions/src/app/versions/v2/accounting`
- [ ] `functions/src/app/versions/v2/accountsReceivable`
- [ ] `functions/src/app/versions/v2/cashCount`
- [ ] `functions/src/app/versions/v2/inventory`
- [ ] `functions/src/app/modules/accountReceivable`
- [ ] `functions/src/app/modules/taxReceipt`
- [ ] `functions/src/app/modules/warehouse`

## Orden Recomendado De Ejecucion

1. Dejar la suite actual en verde.
2. Cubrir carrito, totales, pricing y moneda.
3. Cubrir guardas de venta y CxC.
4. Cubrir permisos, suscripciones y rutas.
5. Cubrir importacion y servicios frontend.
6. Montar tests de `functions` para invoice, billing y auth.
7. Cerrar con integracion y e2e minimos.

## Criterio Para Cada PR

- Si se toca logica de negocio pura: agregar o actualizar test unitario.
- Si se toca una regla de permisos o validacion: agregar casos de borde.
- Si se corrige un bug: agregar test que reproduzca el bug.
- Si se toca `functions`: no desplegar sin al menos prueba local de la ruta afectada.

## Primera Lista Recomendada Para Empezar

- [x] [src/features/cart/utils/updateAllTotals.ts](c:\Dev\VentaMas\src\features\cart\utils\updateAllTotals.ts)
- [x] [src/features/cart/utils/documentPricing.ts](c:\Dev\VentaMas\src\features\cart\utils\documentPricing.ts)
- [x] [src/utils/pricing.ts](c:\Dev\VentaMas\src\utils\pricing.ts)
- [x] [src/utils/accounting/lineMonetary.ts](c:\Dev\VentaMas\src\utils\accounting\lineMonetary.ts)
- [x] [src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/utils/validateInvoiceSubmissionGuards.ts](c:\Dev\VentaMas\src\modules\sales\pages\Sale\components\Cart\components\InvoicePanel\utils\validateInvoiceSubmissionGuards.ts)
- [x] [src/utils/accountsReceivable/generateInstallments.ts](c:\Dev\VentaMas\src\utils\accountsReceivable\generateInstallments.ts)
- [x] [src/modules/settings/pages/subscription/subscription.utils.ts](c:\Dev\VentaMas\src\modules\settings\pages\subscription\subscription.utils.ts)
- [x] [functions/src/app/versions/v2/billing/services/usage.service.js](c:\Dev\VentaMas\functions\src\app\versions\v2\billing\services\usage.service.js)
- [x] [functions/src/app/versions/v2/auth/utils/membershipContext.util.js](c:\Dev\VentaMas\functions\src\app\versions\v2\auth\utils\membershipContext.util.js)
- [x] [functions/src/app/versions/v2/invoice/services/finalize.service.js](c:\Dev\VentaMas\functions\src\app\versions\v2\invoice\services\finalize.service.js)
