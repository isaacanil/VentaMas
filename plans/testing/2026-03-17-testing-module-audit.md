# Auditoria Completa De Modulos Para Testing

Fecha: 2026-03-17

## Objetivo

Cerrar la lista de dominios top-level del repo para que el plan de testing no deje familias fuera por omision. Este documento audita modulos raiz, features, capas de acceso a datos, servicios, hooks y Cloud Functions. No reemplaza el plan principal: lo complementa con inventario.

## Criterio De Estado

- `Mapeado`: ya existe fase o archivo objetivo dentro del plan principal.
- `Parcial`: ya hay algo cubierto o planificado dentro de la familia, pero todavia no existe checklist suficiente para considerar el dominio completo.
- `Pendiente`: el dominio sigue sin desglose concreto dentro del plan.

## Frontend

### `src/modules`

- `Parcial`: `accountsReceivable`, `auth`, `checkout`, `inventory`, `invoice`, `navigation`, `products`, `sales`, `settings`
- `Pendiente`: `app`, `authorizations`, `cashReconciliation`, `contacts`, `controlPanel`, `dev`, `expenses`, `home`, `insurance`, `notification`, `orderAndPurchase`, `utility`, `welcome`

### `src/features`

- `Mapeado`: `cart`
- `Pendiente`: `abilities`, `accountsReceivable`, `activeIngredients`, `addOrder`, `Alert`, `appModes`, `auth`, `barcodePrintModalSlice`, `business`, `Cancel`, `cashCount`, `category`, `client`, `clientAccountsReceivable`, `clientCart`, `creditNote`, `customProducts`, `display`, `doctors`, `expense`, `files`, `filterProduct`, `Firestore`, `imageViewer`, `insurance`, `invoice`, `loader`, `modals`, `nav`, `navigation`, `noteModal`, `notification`, `productBrands`, `productOutflow`, `productStock`, `productWeightEntryModalSlice`, `purchase`, `search`, `setting`, `taxReceipt`, `theme`, `updateProduct`, `uploadImg`, `UserNotification`, `usersManagement`, `warehouse`

### `src/router`

- `Parcial`: `routes`, `AppRouterLayout.tsx`, `GlobalListeners.tsx`, `utils`

### `src/firebase`

- `Parcial`: `accountsReceivable`, `billing`, `cashCount`, `warehouse`
- `Pendiente`: `app`, `AppUpdate`, `Auth`, `authorization`, `authorizations`, `barcode`, `businessInfo`, `categories`, `client`, `creditNotes`, `dev`, `doctors`, `emulator`, `errors`, `expenses`, `firebaseconfig.tsx`, `firebaseOperations.ts`, `functions`, `img`, `insurance`, `inventory`, `inventoryDataCleaner`, `invoices`, `order`, `presence`, `proccessAccountsReceivablePayments`, `ProductOutflow`, `products`, `provider`, `purchase`, `quotation`, `rnc`, `Settings`, `taxReceipt`, `Tools`, `tranfer`, `users`, `utils`

### `src/services`

- `Parcial`: `functionsApiClient.ts`, `invoice/invoice.service.ts`, `invoice/invoiceV2Admin.service.ts`
- `Pendiente`: `dynamicPermissions.ts`, `accountsReceivable/audit.service.ts`, `invoice/autoCompletePreorderInvoice.ts`, `invoice/logInvoiceAuthorizations.ts`, `invoice/types.ts`, `invoice/useInvoice.ts`

### `src/hooks`

- `Parcial por familias`: `accountsReceivable`
- `Parcial`: `accountsReceivable/useCreditLimitRealtime.ts`, `useProductStockData.ts`, `useRncSearch.ts`, `useTaxReceiptsFix.ts`
- `Pendiente dentro de accountsReceivable`: `accountsReceivable/useCheckAccountReceivable.ts`, `accountsReceivable/useCheckAccountReceivable.tsx`, `accountsReceivable/useDueDatesReceivable.ts`
- `Pendiente por familias`: `abilities`, `barcode`, `cashCount`, `creditNote`, `date`, `expense`, `exportToExcel`, `image`, `inventory`, `path`, `product`, `products`, `routes`, `search`, `warehouse`, `windows`
- `Pendiente por hooks raiz`: `useAppNavigation.ts`, `useAuthorizationModules.ts`, `useAuthorizationPin.ts`, `useBusiness.ts`, `useCheckForInternetConnection.ts`, `useClickOutSide.tsx`, `useCompareArrays.ts`, `useDeveloperCommands.ts`, `useElementSize.ts`, `useFiscalReceiptsAlerts.ts`, `useFormatTime.tsx`, `useInsuranceEnabled.ts`, `useInsuranceFormComplete.ts`, `useLoadingStatus.tsx`, `useLocationNames.ts`, `useMediaQuery.ts`, `useOrders.tsx`, `useOverflowCollapse.ts`, `usePersistentDeveloperBusiness.ts`, `usePrefersReducedMotion.ts`, `useProductStock.ts`, `usePurchases.tsx`, `useScroll.tsx`, `useSearchFilter.ts`, `useStockAlertThresholds.ts`, `useTruncate.tsx`, `useWindowWidth.tsx`

### `src/utils`

- `Parcial`: `accounting`, `accountsReceivable`, `barcode`, `firestore`, `import`, `inventory`, `invoice`, `pricing.ts`, `runtime`, `sorts`
- `Pendiente`: `access`, `array`, `cashCount`, `data`, `date`, `expenses`, `file`, `format`, `number`, `object`, `order`, `pdf`, `perf`, `performance`, `products`, `provider`, `purchase`, `roles`, `scroll`, `serialization`, `taxReceipt`, `text`, `url`, `users`
- `Pendiente por archivos raiz`: `auth-adapter.ts`, `createLazyLoader.ts`, `files.ts`, `fileUtils.ts`, `filterUtils.ts`, `fiscalReceiptsUtils.ts`, `flowTrace.ts`, `formatDate.ts`, `formatNumber.ts`, `formatters.ts`, `formRules.ts`, `invoiceValidation.ts`, `lazyWithRetry.ts`, `lodash-minimal.ts`, `menuAccess.ts`, `normalizeMatch.ts`, `printPdf.ts`, `reactScan.ts`, `reduxStateUtils.ts`, `refereceUtils.ts`, `sales.ts`, `taxReceipt.ts`, `text.ts`, `userValidation.ts`, `validators.ts`

## Cloud Functions

### `functions/src/app/versions/v2`

- `Parcial`: `auth`, `billing`, `invoice`
- `Pendiente`: `accounting`, `accountsReceivable`, `cashCount`, `inventory`

### `functions/src/app/modules`

- `Parcial`: `accountReceivable`, `Inventory`, `taxReceipt`, `warehouse`
- `Pendiente`: `ai`, `business`, `cashCount`, `client`, `insurance`, `invoice`, `products`, `provider`, `quotation`, `supabase`

## Huecos Nuevos Detectados En Esta Revision

Respecto al barrido anterior, se detectaron dominios que todavia no estaban puestos por escrito como pendientes:

- frontend: `app`, `auth`, `checkout`, `dev`, `inventory`, `invoice`, `navigation`, `products`
- redux/features: casi todo `src/features` salvo `cart`
- acceso a datos: gran parte de `src/firebase`
- hooks: familias completas como `abilities`, `creditNote`, `exportToExcel`, `product`, `warehouse`, `windows`
- backend legacy: `ai`, `client`, `invoice`, `products`, `provider`

## Regla Operativa

Ningun dominio de esta auditoria se debe considerar "cubierto" solo por tener uno o dos tests aislados. Para cerrar una familia hace falta:

- al menos una entrada explicita en el plan principal
- al menos un caso de negocio o regresion real protegido
- si el dominio toca dinero, permisos, stock o escritura remota, casos de borde negativos

## Siguiente Uso

Este inventario se usa como lista de control para no olvidar familias cuando se sigan agregando tests por fases. Antes de declarar que el plan esta "completo", hay que volver a contrastar el repo contra este archivo.
