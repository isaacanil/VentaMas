# Ejecucion De Testing 2026-03-17

## Alcance De Esta Pasada

Objetivo de la ejecucion:

- estabilizar la suite actual
- separar frontend y `functions`
- agregar un primer bloque de tests de alto retorno
- dejar evidencia corrida y verificable

## Estado Inicial Detectado

- Frontend:
  - Vitest configurado, pero el pool por defecto estaba fallando en este entorno Windows para algunos tests con `forks`.
  - La suite inicial observada quedaba en `18` suites pasando y `1` fallando por un cambio local en navegación y el arranque de workers.
- Functions:
  - No habia suite de tests activa.
  - No habia config dedicada para correr tests de backend.

## Causa Raiz Que Se Corrigio

Durante la investigacion se detecto lo siguiente:

- [src/modules/navigation/components/MenuApp/Components/MenuLink.test.tsx](c:\Dev\VentaMas\src\modules\navigation\components\MenuApp\Components\MenuLink.test.tsx) ya no existia en el worktree.
- El test nuevo [src/modules/navigation/components/MenuApp/Components/SubMenu/SubMenu.test.tsx](c:\Dev\VentaMas\src\modules\navigation\components\MenuApp\Components\SubMenu\SubMenu.test.tsx) si existia, pero Vitest fallaba al levantar workers con el pool por defecto en este entorno.
- Se verifico que el test de `SubMenu` pasaba usando `threads`.

Accion tomada:

- se fijo `pool: 'threads'` en [vitest.config.ts](c:\Dev\VentaMas\vitest.config.ts)
- se limito el runner principal a `src/**` para que no ejecute tests de `functions`
- se creo [vitest.functions.config.ts](c:\Dev\VentaMas\vitest.functions.config.ts) para backend

## Cambios Aplicados

### Configuracion

- [package.json](c:\Dev\VentaMas\package.json)
  - `test:run:functions`
  - `test:run:all`
- [vitest.config.ts](c:\Dev\VentaMas\vitest.config.ts)
  - `pool: 'threads'`
  - `include` limitado a `src/**/*`
- [vitest.functions.config.ts](c:\Dev\VentaMas\vitest.functions.config.ts)
  - nueva configuracion para tests de backend en modo `node`

### Tests Nuevos Frontend

- ampliacion de [src/features/cart/cartSlice.test.ts](c:\Dev\VentaMas\src\features\cart\cartSlice.test.ts)
- [src/features/cart/utils/documentPricing.test.ts](c:\Dev\VentaMas\src\features\cart\utils\documentPricing.test.ts)
- [src/features/cart/utils/updateAllTotals.test.ts](c:\Dev\VentaMas\src\features\cart\utils\updateAllTotals.test.ts)
- [src/utils/accounting/lineMonetary.test.ts](c:\Dev\VentaMas\src\utils\accounting\lineMonetary.test.ts)
- [src/utils/accountsReceivable/creditLimit.test.ts](c:\Dev\VentaMas\src\utils\accountsReceivable\creditLimit.test.ts)
- [src/utils/pricing.test.ts](c:\Dev\VentaMas\src\utils\pricing.test.ts)
- [src/utils/inventory/productStockSelection.test.ts](c:\Dev\VentaMas\src\utils\inventory\productStockSelection.test.ts)
- [src/router/routes/routeVisibility.test.ts](c:\Dev\VentaMas\src\router\routes\routeVisibility.test.ts)
- [src/utils/firestore/commitChunkedBatch.test.ts](c:\Dev\VentaMas\src\utils\firestore\commitChunkedBatch.test.ts)
- [src/services/functionsApiClient.test.ts](c:\Dev\VentaMas\src\services\functionsApiClient.test.ts)
- [src/hooks/accountsReceivable/useCreditLimitRealtime.test.ts](c:\Dev\VentaMas\src\hooks\accountsReceivable\useCreditLimitRealtime.test.ts)
- ampliacion de [src/modules/settings/pages/subscription/subscription.utils.test.ts](c:\Dev\VentaMas\src\modules\settings\pages\subscription\subscription.utils.test.ts)
- ampliacion de [src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/utils/validateInvoiceSubmissionGuards.test.ts](c:\Dev\VentaMas\src\modules\sales\pages\Sale\components\Cart\components\InvoicePanel\utils\validateInvoiceSubmissionGuards.test.ts)
- ampliacion de [src/utils/accountsReceivable/generateInstallments.test.ts](c:\Dev\VentaMas\src\utils\accountsReceivable\generateInstallments.test.ts)

### Tests Nuevos Functions

- [functions/src/app/versions/v2/billing/services/usage.service.test.js](c:\Dev\VentaMas\functions\src\app\versions\v2\billing\services\usage.service.test.js)
- [functions/src/app/versions/v2/billing/utils/subscriptionAccess.util.test.js](c:\Dev\VentaMas\functions\src\app\versions\v2\billing\utils\subscriptionAccess.util.test.js)
- [functions/src/app/versions/v2/auth/utils/membershipContext.util.test.js](c:\Dev\VentaMas\functions\src\app\versions\v2\auth\utils\membershipContext.util.test.js)
- [functions/src/app/versions/v2/auth/pin/pin.crypto.test.js](c:\Dev\VentaMas\functions\src\app\versions\v2\auth\pin\pin.crypto.test.js)
- [functions/src/app/versions/v2/invoice/services/finalize.service.test.js](c:\Dev\VentaMas\functions\src\app\versions\v2\invoice\services\finalize.service.test.js)
- [functions/src/app/versions/v2/invoice/services/orchestrator.service.test.js](c:\Dev\VentaMas\functions\src\app\versions\v2\invoice\services\orchestrator.service.test.js)
- [functions/src/app/versions/v2/invoice/services/idempotency.service.test.js](c:\Dev\VentaMas\functions\src\app\versions\v2\invoice\services\idempotency.service.test.js)
- [functions/src/app/versions/v2/invoice/services/failurePolicy.service.test.js](c:\Dev\VentaMas\functions\src\app\versions\v2\invoice\services\failurePolicy.service.test.js)
- [functions/src/app/versions/v2/invoice/services/ncf.service.test.js](c:\Dev\VentaMas\functions\src\app\versions\v2\invoice\services\ncf.service.test.js)
- [functions/src/app/modules/Inventory/services/productStock.service.test.js](c:\Dev\VentaMas\functions\src\app\modules\Inventory\services\productStock.service.test.js)

## Cobertura Nueva Agregada

### Frontend

Se agregaron o ampliaron casos sobre:

- cambio de moneda documental y funcional
- venta mixta por moneda
- snapshot monetario por producto
- visualizacion de montos convertidos
- recalculo total del carrito
- pricing puro:
  - descuentos
  - impuestos
  - productos por peso
  - conteo de items
- visibilidad de rutas y metadata
- chunking de batches Firestore
- normalizacion de utilidades de suscripcion
- generacion de cuotas
- reglas de limite de credito
- autenticacion y parseo para cliente HTTP de Cloud Functions
- listener realtime de limite de credito
- guardas de facturacion
- seleccion fisica de stock
- reducer del carrito:
  - timestamps legacy
  - moneda mixta
  - productos por peso
  - pagos con notas de credito
  - reset de seguros

### Functions

Se agregaron o ampliaron casos sobre:

- limites de uso y escrituras de billing
- control de acceso a billing y suscripciones
- normalizacion de membresias y permisos
- cifrado/descifrado de PIN
- finalize de invoice v2:
  - committed
  - non-blocking failures
- orchestrator de invoice v2:
  - idempotencia
  - derivacion de `dueDate`
  - derivacion de comentario
  - validacion de `ncfType`
  - chequeo de limites para planes strict
- servicio de idempotencia:
  - lectura
  - upsert con merge
  - referencia reusable
- politica de fallos:
  - normalizacion de outbox
  - deteccion de non-blocking failures
  - resumen de errores
- reserva NCF:
  - salto de codigos duplicados
  - decremento unico de cantidad
  - validaciones de configuracion
- servicio de stock:
  - validaciones
  - lectura exitosa
  - errores envueltos con contexto

## Resultados Verificados

### Baseline aproximado antes de esta pasada

- Frontend: `19` archivos de test, `72` tests.
- Functions: `0` archivos de test activos.

### Estado final verificado

Comando ejecutado:

```powershell
npm run test:run:all
```

Resultado final:

- Frontend:
  - `29` archivos de test
  - `128` tests
  - `29` archivos pasando
- Functions:
  - `10` archivos de test
  - `40` tests
  - `10` archivos pasando

## Resumen De Ganancia

- Frontend: `+10` archivos de test nuevos y `+56` tests respecto al baseline observado.
- Functions: se paso de `0` a `10` archivos de test y `40` tests.
- La suite quedo separada por dominio:
  - `src` por un lado
  - `functions` por otro

## Comandos Utiles

Frontend:

```powershell
npm run test:run
```

Functions:

```powershell
npm run test:run:functions
```

Todo:

```powershell
npm run test:run:all
```

## Pendiente Recomendado Para La Siguiente Fase

- [ ] [src/router/routes/routes.tsx](c:\Dev\VentaMas\src\router\routes\routes.tsx)
- [ ] [src/hooks/useProductStockData.ts](c:\Dev\VentaMas\src\hooks\useProductStockData.ts)
- [ ] [src/services/invoice/invoice.service.ts](c:\Dev\VentaMas\src\services\invoice\invoice.service.ts)
- [ ] [src/services/invoice/invoiceV2Admin.service.ts](c:\Dev\VentaMas\src\services\invoice\invoiceV2Admin.service.ts)
- [ ] [functions/src/app/versions/v2/inventory/syncProductsStockCron.js](c:\Dev\VentaMas\functions\src\app\versions\v2\inventory\syncProductsStockCron.js)
- [ ] [functions/src/app/modules/accountReceivable/functions/createAccountsReceivable.js](c:\Dev\VentaMas\functions\src\app\modules\accountReceivable\functions\createAccountsReceivable.js)
- [ ] [functions/src/app/modules/accountReceivable/functions/processAccountsReceivablePayment.js](c:\Dev\VentaMas\functions\src\app\modules\accountReceivable\functions\processAccountsReceivablePayment.js)

## Auditoria De Cobertura Del Plan

Despues de revisar el repo completo contra el plan, se detectaron familias que aun no estaban mapeadas de forma explicita. Ya quedaron añadidas al plan principal:

- modulos frontend faltantes:
  - `authorizations`
  - `cashReconciliation`
  - `contacts`
  - `controlPanel`
  - `expenses`
  - `home`
  - `insurance`
  - `notification`
  - `orderAndPurchase`
  - `utility`
  - `welcome`
- familias de utilidades faltantes:
  - `barcode`
  - `format`
  - `number`
  - `object`
  - `order`
  - `purchase`
  - `serialization`
  - `users`
  - `scroll`
  - `pdf`
- servicios y hooks faltantes:
  - `dynamicPermissions`
  - `autoCompletePreorderInvoice`
  - `useInvoice`
  - `useAuthorizationModules`
  - `useAuthorizationPin`
  - `useBusiness`
  - `useFiscalReceiptsAlerts`
  - `useInsuranceEnabled`
  - `useBarcodeScanner`
  - `useInvoicesForCashCount`
  - `useGetProductsWithBatch`
  - `useNavigationTracker`
- modulos de functions faltantes:
  - `business`
  - `insurance`
  - `quotation`
  - `supabase`

Tambien quedaron señalados dominios que ya estaban en el plan pero siguen con `0` tests en repo y deben entrar en la siguiente tanda.

## Ampliacion De Auditoria

En una revision posterior se amplio el barrido para no dejar huecos top-level fuera del inventario. Ademas del plan principal, ahora existe [2026-03-17-testing-module-audit.md](c:\Dev\VentaMas\plans\testing\2026-03-17-testing-module-audit.md), que deja auditados:

- `src/modules`
- `src/features`
- `src/firebase`
- `src/services`
- `src/hooks`
- `src/utils`
- `functions/src/app/modules`
- `functions/src/app/versions/v2`

Esa auditoria amplia detecto familias que todavia no habian quedado escritas como pendientes:

- frontend: `app`, `auth`, `checkout`, `dev`, `inventory`, `invoice`, `navigation`, `products`
- data layer: buena parte de `src/firebase`
- redux/features: casi todo `src/features` salvo `cart`
- backend legacy: `ai`, `client`, `invoice`, `products`, `provider`

Con eso, el plan ya no depende de memoria para saber que dominios faltan por entrar a pruebas.

## Nota Sobre Deploy

En esta pasada no se cambiaron implementaciones productivas desplegadas de Cloud Functions. Se agregaron tests y configuracion de testing, por lo que no hace falta desplegar funciones por este cambio.
