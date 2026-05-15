# Auditoria router con Navegador - 2026-05-13

## Metodologia

- Alcance: todo el router, con rutas criticas primero.
- Ciclo: abrir vista, capturar consola, interactuar minimo seguro, corregir, recargar y repetir.
- Entorno observado: `vite --mode staging` en `http://localhost:5173`, sin emuladores locales activos.

## /settings/tax-receipt

Estado: correccion aplicada. Indice Firestore desplegado en `ventamax-staging`.

Hallazgos:

- `Warning: [antd: Spin] tip is deprecated. Please use description instead.`
- `Warning: [antd: Drawer] classNames.content and styles.content is deprecated. Please use classNames.section and styles.section instead.`
- `styled-components: unknown prop "tone" is being sent through to the DOM`
- `Error al obtener datos del empleado: Documento de empleado no encontrado`
- `Accounts receivable snapshot error: The query requires an index`
- `session refresh error: deadline-exceeded`
- `Error al obtener la configuracion de alertas: Failed to get document because the client is offline`

Acciones aplicadas:

- `Spin` de facturacion fiscal usa `description`.
- Drawer de plantillas fiscales usa `styles.section`.
- Badges/textos fiscales usan transient props `$tone`.
- Resolucion de empleado de caja cae a `employeeRef.id` sin ensuciar consola por documentos legacy faltantes.
- Errores transitorios de sesion/config fiscal se registran como warning.
- Agregado indice Firestore para `accountsReceivable` por `isActive` y `createdAt desc`.

Verificacion:

- `npm run typecheck:app`
- `node tools/lint.js path src/modules/settings/pages/setting/subPage/TaxReceipts src/firebase/cashCount/fbGetCashCounts/getEmployeeData.ts src/firebase/Auth/fbAuthV2/fbSignIn/checkSession.ts src/firebase/Settings/fiscalAlertsConfig/fbGetFiscalAlertsConfig.ts`
- Navegador cargo `http://localhost:5173/settings/tax-receipt?auditReload=1` con consola warning/error vacia despues de desplegar indices.

## /developer-hub

Estado: correccion aplicada.

Hallazgos:

- Dock de modulos renderizaba `Tooltip.Trigger` de HeroUI alrededor de `Button`; HeroUI implementa el trigger como `div role="button"`, dejando control interactivo dentro de control interactivo en el DOM accesible.

Acciones aplicadas:

- Dock de modulos usa `title` nativo en los botones y elimina `Tooltip.Trigger` en esa superficie.

Verificacion:

- Navegador cargo `http://localhost:5173/developer-hub` despues de levantar `npm run dev:staging`.
- Consola inicial de la ruta: sin warnings/errors.

Notas:

- Captura DOM/screenshot de Navegador se colgo en esta ruta; se continuo con consola y URL.

## Firestore local dev

Estado: correccion aplicada.

Hallazgos:

- Navegacion entre `/developer-hub` y `/settings/tax-receipt` produjo errores de Vite/client:
  `FIRESTORE (11.10.0) INTERNAL ASSERTION FAILED: Unexpected state (ID: b815)`.
- El stack aparecio en multiples superficies (`HomeDashboard`, `InvoicePreview`, `NotificationCenter`) y durante desmontaje de listeners `onSnapshot`, no solo en fiscal.
- `firebaseconfig` usaba `persistentLocalCache` con `persistentMultipleTabManager` tambien en dev local no-emulador.

Acciones aplicadas:

- Firestore usa `memoryLocalCache()` en `import.meta.env.DEV` y en emuladores.
- Builds no-dev mantienen `persistentLocalCache` con multi-tab.

Verificacion:

- Error `FIRESTORE INTERNAL ASSERTION FAILED` no reaparecio al recargar ruta fiscal en Navegador.

## AntD Modal maskClosable

Estado: correccion aplicada.

Hallazgos:

- AntD reporto: `Warning: [antd: Modal] maskClosable is deprecated. Please use mask.closable instead.`
- Quedaban usos directos de `maskClosable` en modales AntD de ventas, tesoreria, suscripciones, seguros, dev tools y control panel.

Acciones aplicadas:

- Modales AntD migrados a `mask={{ closable: ... }}`.
- `AppModal` custom conserva su prop interna `maskClosable` porque no pasa por AntD.

Verificacion:

- `rg -n "maskClosable" src -g "*.tsx" -g "*.ts"` solo reporta `AppModal` custom y su consumidor.
- Navegador cargo ruta fiscal con consola warning/error vacia.

## /settings/business

Estado: sin hallazgos en smoke.

Verificacion:

- Navegador cargo `http://localhost:5173/settings/business?auditReload=1`.
- Consola nueva de la ruta: sin warnings/errors.

## /accounting/fiscal-compliance

Estado: sin hallazgos en smoke.

Verificacion:

- Navegador cargo `http://localhost:5173/accounting/fiscal-compliance?auditReload=1`.
- Consola nueva de la ruta: sin warnings/errors.

## Smoke financiero core

Estado: sin hallazgos en smoke.

Rutas verificadas con consola nueva vacia:

- `/accounting`
- `/accounting/journal-book`
- `/accounting/reports`
- `/account-receivable/list`
- `/accounts-payable/list`
- `/treasury`

## Smoke operacional core

Estado: sin hallazgos en smoke.

Rutas verificadas con consola nueva vacia:

- `/sales`
- `/bills`
- `/inventory/items`
- `/inventory/control`
- `/purchases`
- `/orders`
- `/cash-reconciliation`

## Smoke settings core

Estado: sin hallazgos en smoke.

Rutas verificadas con consola nueva vacia:

- `/settings`
- `/settings/users`
- `/settings/app-info`
- `/settings/authorization`
- `/settings/accounting`
- `/settings/accounting/chart-of-accounts`
- `/settings/accounting/posting-profiles`
- `/settings/accounting/exchange-rates`
- `/settings/inventory`
- `/settings/subscription/manage`

## Smoke extendido

Estado: sin hallazgos en smoke.

Rutas verificadas con consola nueva vacia:

- `/contact`
- `/suppliers`
- `/expenses`
- `/preorders`
- `/purchases/analytics`
- `/backorders`
- `/inventory/summary`
- `/inventory/warehouses`
- `/inventory/warehouses/products-stock`
- `/inventory/movements`
- `/credit-note/list`
- `/authorizations`
- `/insurance/config`
- `/utility-report`
- `/changelogs`

## Smoke formularios/analytics

Estado: sin hallazgos en smoke.

Rutas verificadas con consola nueva vacia:

- `/bills/analytics`
- `/orders/create`
- `/purchases/create`
- `/expenses/new`
- `/insurance/create`
- `/cash-register-opening`
- `/inventory/product-studio`
- `/inventory/product_outflow`
