# Refactor arquitectonico seguro

Este documento define reglas practicas para continuar refactors pequenos sin cambiar comportamiento funcional. La prioridad es reducir acoplamiento accidental y evitar que nuevos cambios mezclen UI, dominio y acceso a datos.

## Reglas para codigo nuevo

- No usar Firebase SDK directo en componentes nuevos. Crear un service, repository o hook de dominio que encapsule la lectura/escritura.
- No poner logica de negocio pesada en componentes visuales. Calculos, normalizadores y validaciones deben vivir en `utils/`, `services/`, `domain/` o en carpetas del dominio.
- Preferir services/repositories por dominio antes que helpers globales genericos. Si una pieza es de facturacion, inventario, caja o RRHH, debe ser ubicable por ese dominio.
- Preferir carpetas owner-locales (`components`, `hooks`, `utils`, `repositories`, `types`) dentro de `src/modules/<dominio>/` antes de subir codigo a buckets compartidos.
- Usar `src/domain/<dominio>/` solo para contratos neutrales y puros que realmente cruzan owners; no mover ahi logica que dependa de React, Firebase, rutas o estilos.
- Evitar imports profundos entre modulos. Si un modulo necesita una capacidad de otro, consumir `src/modules/<dominio>/public.ts` o extraer un contrato pequeno en `src/domain/<dominio>` / `src/shared/<area>`.
- Evitar duplicar componentes compartidos. Si dos componentes mantienen el mismo contrato visual, crear una pieza compartida y dejar wrappers solo cuando ayuden a migrar sin romper imports.
- Los tipos de router deben vivir fuera del agregador de rutas cuando sean usados por otros archivos del router o del menu. `src/router/types/routeTypes.ts` es el contrato neutral para `AppRoute`.

## Fase 1 aplicada

- Se extrajo `AppRoute` desde `src/router/routes/routes.tsx` hacia `src/router/types/routeTypes.ts`.
- `routeVisibility.ts` y `router/index.tsx` ahora consumen el tipo desde el contrato neutral; el helper legacy `findRouteByName.ts` ya fue retirado.
- En esa primera pasada, `routes.tsx` mantuvo un re-export temporal de `AppRoute` para no forzar una migracion masiva.

## Fase 2 aplicada

- Se elimino el re-export temporal de `AppRoute` desde `routes.tsx`.
- Los archivos `src/router/routes/paths/*` ahora consumen `AppRoute` desde `src/router/types/routeTypes.ts`.
- `routes.tsx` quedo como agregador de rutas; el filtrado por entorno vive en `routeFiltering.ts` y el procesamiento/IDs vive en `routeProcessing.ts`.
- Las redirecciones historicas de settings se movieron a `src/router/routes/paths/Setting/redirectRoutes.tsx`, reduciendo `Setting.tsx` a rutas de pantalla y layout.
- Se limpio deuda mecanica transversal detectada por lint en `src` y `functions/src`: imports/variables sin uso y spreads con fallback vacio.
- El flujo AI de business seeding conserva salida estructurada tipada y normalizada en un helper propio, con prueba de contrato dedicada.

## Fase 3 aplicada parcialmente

- RRHH ahora comparte primitivos visuales, labels y formateadores en `src/modules/hrPayroll/components` y `src/modules/hrPayroll/utils`.
- Los modales grandes de RRHH se separaron en componentes locales de cada pagina (`HrEmployeeEditorModal` y `RecordHrPaymentModal`) para reducir el tamano de las pantallas sin mover reglas de negocio.
- El reporte de comisiones de servicio movio normalizadores/formatos a `ServiceCommissionsReport/utils/reportDisplay.ts`.
- La normalizacion de strings de comisiones se centralizo en `cleanCommissionString`, reutilizada por `collaboratorOptions`.
- `ServiceCommissionsReport` y `ServiceCommissionModal` separaron sus estilos locales en archivos `.styles.ts`, dejando los componentes principales enfocados en estado, handlers y render.
- La pantalla de mantenimiento de planes de suscripcion separo estilos y `DeveloperSubscriptionPlanCard` en archivos propios, reduciendo el contenedor principal a carga, acciones y composicion.
- `DeveloperSubscriptionPlanCard` separo helpers de presentacion y modales de detalle/historial, dejando la tarjeta principal enfocada en estado local y menu de acciones.
- Los estilos de suscripciones quedaron separados por responsabilidad: layout de pagina en `DeveloperSubscriptionMaintenancePlansPage.styles.ts` y tarjeta/modales en `DeveloperSubscriptionPlanCard.styles.ts`.
- Las tarjetas principales de suscripcion (`SubscriptionOverviewCard`, `SubscriptionPlansCard`, `SubscriptionBillingCard`, `SubscriptionSettingsCard`, `SubscriptionPlanSummary` y `SubscriptionPaymentMethodCard`) movieron styled-components a archivos `.styles.ts` locales, sin tocar reglas de negocio ni handlers.
- Los modales de mantenimiento `DeveloperFieldCatalogModal` y `DeveloperPlanVersioningModal` tambien separaron estilos locales; el modal de versionado movio su editor de campos a `DeveloperPlanVersioningFields.tsx` y reemplazo comentarios decorativos por comentarios ASCII simples.
- `SubscriptionOverviewCard`, `SubscriptionPlansCard` y `SubscriptionBillingCard` separaron subcomponentes de presentacion en archivos locales, dejando los contenedores con estado, filtros y composicion de alto nivel.
- `SubscriptionOverviewCard` reemplazo el archivo generico `.parts.tsx` por componentes nombrados (`UsageItem`, `ActivityItem`, `QuickAction`) y helpers locales de iconos/estado.
- `SubscriptionOverviewCard` separo sus secciones principales en componentes nombrados (`SubscriptionPlanSummary`, `SubscriptionUsageSection`, `SubscriptionStatsRow`, `SubscriptionActivityCard` y `SubscriptionQuickActionsCard`) para dejar el contenedor como composicion.
- `SubscriptionPlansCard` ahora usa componentes nombrados (`PlanOptionCard`, `PlansComparisonTable`, `PlanChangeConfirmModal`) y helpers propios para definiciones/iconos, evitando un archivo `.parts.tsx` grande.
- `SubscriptionBillingCard` separo tipos, helpers de factura, badge de estado, tabla y modal de detalle en archivos nombrados, y `SubscriptionSettingsCard` movio resolvers fiscales/de negocio a un helper local.
- `SubscriptionSettingsCard` extrajo el flujo de cancelacion a `SubscriptionCancellationSection`, y la tabla/modal activa de facturas vive en `BillingInvoicesTable` / `BillingInvoiceDetailModal`.
- `SubscriptionPlanSummary` concentra el resumen del plan activo; `SubscriptionPaymentMethodCard` separo el bloque de seguridad de pagos en `PaymentSecurityFeature`.
- Componentes de navegacion/limites de suscripcion (`SubscriptionTabbedLayout`, `SubscriptionUsageSection`) movieron estilos embebidos a archivos `.styles.ts`.
- Las paginas internas de mantenimiento de suscripciones (`Overview`, `Tools`, `Sandbox`, `Success`) y piezas auxiliares (`DeveloperSubscriptionInactiveNotice`, `SimulatedPlanSelectionCard`, `DeveloperSubscriptionMaintenanceModals`) movieron estilos embebidos a archivos locales `.styles.ts`.
- Componentes pequenos de suscripcion (`SubscriptionLayout` y `MockSubscriptionFlowCard`) movieron estilos locales a `.styles.ts` sin tocar reducers ni callbacks; `DeveloperMaintenanceHub` quedo retirado sin equivalente activo confirmado.
- Se corrigieron textos visibles con mojibake en el reporte de comisiones de servicio.
- `CollaboratorsManager` separo sus styled-components a `CollaboratorsManager.styles.ts`.
- `ServiceCommissionsReport` movio la paginacion local a `components/ReportPagination.tsx`.
- `HrCommissionPeriodsPage` movio las columnas de cortes, lineas y pagos a `HrCommissionPeriodsPage.columns.tsx`, y separo estilos/helpers locales para dejar la pagina enfocada en estado, acciones y composicion.
- `HrPayrollWorkspace` y `HrCommissionsPage` separaron columnas de tabla, helpers puros y estilos locales en archivos propios, reduciendo mezcla entre UI, filtros y handlers.
- Los primitivos compartidos de RRHH (`HrPayrollPagePrimitives`) separaron styled-components a `HrPayrollPagePrimitives.styles.ts`, dejando el archivo principal enfocado en tabla paginada, rango de fechas y contrato publico.
- `HrEmployeeEditorModal` separo estilos, tipos y helpers locales (`.styles.ts`, `.types.ts`, `.helpers.ts`), reduciendo acoplamiento tipo-only desde `HrPayrollWorkspace.helpers.ts`.
- `RecordHrPaymentModal` separo estilos y helpers de metodos de pago en archivos locales, manteniendo el modal enfocado en estado del formulario y callbacks.
- `VmPhoneField` separo estilos a un archivo local y conserva la logica reutilizable en `src/shared/phone`.
- `useServiceCommissionCollaborators` movio la normalizacion pura de documentos Firestore a `useServiceCommissionCollaborators.utils.ts` con prueba dedicada, dejando el hook como sincronizador externo.
- `InventoryConfig` separo estilos, acciones persistentes y helpers de presentacion en archivos locales, manteniendo el componente como composicion de opciones de inventario.
- `GeneralConfigSearch` movio estilos/animaciones a `.styles.ts`, limpio textos con mojibake y reemplazo el cierre por cambio de dependencia con un guard basado en `useRef`/`useEffect`.
- `Header`, `BillingConfig` y `SettingCard` de GeneralConfig separaron estilos y summaries puros en archivos locales, reduciendo inline styles y comentarios decorativos.
- `BillingModeConfig`, `ModulesConfig`, `ModuleCard`, `AuthorizationFlowConfig`, `BillingSection`, `SubscriptionConfig`, `QuoteSettingsSection` y `StockAlertSettingsSection` separaron estilos/configuracion visual a archivos locales y limpiaron textos mojibake sin tocar los guardados.
- `useGeneralConfigController` quedo enfocado en permisos, navegacion y efectos; rutas, menu, indice de busqueda y normalizacion viven en `utils/generalConfigControllerData.tsx`.
- `GeneralConfig` movio los estilos globales de highlight a `GeneralConfig.styles.ts`, y subcomponentes pequenos de `InvoiceSettingsSection` reemplazaron inline styles por props/estilos locales.
- `DueDateConfig` separo estilos y opciones/periodos en archivos locales, elimino el `as any` de opciones y redujo repeticion en los campos personalizados sin cambiar llamadas de guardado.
- `AuthorizationFlowSettingsSection` movio sus styled-components a un archivo local y normalizo textos rotos, manteniendo intacto el flujo de persistencia de autorizaciones.
- `SignatureAssetsSection` separo el editor de activos, estilos, tipos y helpers de transformacion en archivos locales; el contenedor quedo como composicion sin cambiar upload, guardado ni reset.
- `BusinessInfoCard` del flujo dev de AI business seeding movio estilos inline a `.styles.ts` y normalizo texto visible, manteniendo el contrato de datos intacto.
- `FiltersDrawer` del panel de control movio estilos inline y labels visuales a `.styles.ts`, dejando el drawer enfocado en opciones y callbacks.
- `BusinessMissingCreatedAt` separo estilos de pagina, tabla y progreso en `.styles.ts`, elimino estilos inline y normalizo textos visibles sin cambiar el escaneo, CSV ni actualizaciones Firestore.
- Decision diferida: `BusinessMissingCreatedAt` escribe `business.createdAt` en `businesses` y no queda ruteada/expuesta; no exponer hasta definir acceso/uso, revisar los tests existentes (`businessMissingCreatedAtData.test.ts`, `businessMissingCreatedAtCsv.test.ts`) y decidir si su destino es `DevTools/BusinessMissingCreatedAt`.
- `BusinessSelectorPage` movio su bloque completo de styled-components a `BusinessSelectorPage.styles.ts`, manteniendo el archivo principal enfocado en permisos, seleccion de negocio, invitaciones y navegacion.
- `Login` y `SignUp` reutilizan `AuthPageShell`, que centraliza imagen de fondo, animacion, boton de regreso, spinner y layout responsive; las paginas quedaron enfocadas en el formulario y su loading.
- `SocialLogin` y `LogoContainer` eliminaron estilos inline locales en favor de styled-components propios, manteniendo intactos los handlers de autenticacion.
- `RncPanel` movio estilos y placeholder de carga a `RncPanel.styles.ts`, dejando el componente con solo render condicional y formateo de fecha.
- El wrapper `components/ui/Tag` quedo tipado con `TagProps`, separo su estilo local y elimino el tooltip fijo accidental.
- `BackOrders/Header` separo estilos y controles de layout a `Header.styles.ts`, consolido metricas repetidas y limpio labels mojibake sin tocar filtros ni exportacion.
- `BackOrders/ProductGroup` movio su layout compacto y barra de progreso a `ProductGroup.styles.ts`, manteniendo animacion, datos y callback de cobertura.
- `Dialog` separo configuracion visual e iconos a `Dialog.config.ts` y styled-components a `Dialog.styles.ts`; `Dialog.tsx` quedo enfocado en estado de carga, confirmacion/cancelacion y render.
- `InputV4` movio todos sus styled-components a `InputV4.styles.ts`, elimino estilos inline del icono de limpiar y limpio comentarios/contenido mojibake sin cambiar props ni handlers.
- `ButtonIconMenu`, `DatePicker`, `RouteErrorFallback` y `CustomInput` movieron estilos locales a archivos `.styles.ts`, retirando estilos inline puntuales y textos mojibake en el fallback de rutas.
- `DatePicker` centralizo el locale de Luxon en `constants/dateLocale.ts`, tipa `layout` como contrato `grid | sidebar`, elimino casts/props redundantes de presets y separo estilos locales de `DatePickerInput` y `HeroUIDatePickerInput`.
- `DatePicker/PresetsSection` movio sus estilos locales a `PresetsSection.styles.ts`, conservando los calculos de rangos y handlers en el componente.
- `BadgeDate` separo estilos y utilidad de icono en archivos locales; `Badge`, `Loader`, `PillButton` y `Counter` exponen contratos publicos pequenos para evitar reflexion de tipos en consumidores.
- `FrontendFeatureRouteGate` separo el copy de vistas bloqueadas en `FrontendFeatureRouteGate.config.ts`, dejando el gate enfocado en permisos y composicion.
- El copy especifico de reclamo de negocio vive como configuracion nombrada en `FrontendFeatureRouteGate.config.ts`, evitando objetos inline en rutas de auth.
- `CellRenderer` de `AdvancedTable` reutiliza `toMillis` para fechas y cubre explicitamente el tipo `price`, cerrando deuda de contrato sin cambiar los componentes de fecha.
- La lectura de changelogs del panel de control vive ahora en `ChangeLogControl/ChangelogList` con repository/hook local y prueba de normalizacion; la ruta de escritura de `AppUpdate` queda fuera de este lote.
- `Select` separo helpers de acceso por clave/ruta y estilos locales en `Select.utils.ts` y `Select.styles.ts`, preservando Floating UI y el contrato de `onChange`.
- `ImageViewer` movio overlay, contenedor, header y estilos de imagen a `ImageViewer.styles.ts`, manteniendo zoom/pan y cierre por Escape/click externo.
- `ImagenBlock` de producto separo estilos de imagen/carga a `ImagenBlock.styles.ts`, retirando inline styles sin cambiar fallback, conectividad ni estado de carga.
- `PeerReviewAuthorization` separo estilos del modal/header a archivos locales, elimino subcomponentes `Body/Footer` sin uso y dejo el flujo de validacion intacto.
- `ColumnMenu` dejo de persistir `columnOrder:v1`; la persistencia queda centralizada en `useColumnOrder` por tabla/usuario.
- Se eliminaron duplicados accidentales: `useLoadingStatus.tsx\``, `utils/data/products/category`sin extension y la version vieja`useCheckAccountReceivable.tsx`.
- `FilterBarLegacy` fue retirado: el hook compartido vive en `src/components/common/FilterBar/hooks/useFilterBar.ts`.
- `FileUploader` y `EvidenceUpload` reutilizan `fileUploadShared` para lista, controles y boton de carga, dejando wrappers solo para contratos especificos.
- Se normalizaron rutas con typos o estructura legacy: `referenceUtils`, `TextCell`, `PaymentDatesOverview`, `InventoryFilterAndSort` y carpetas locales `components`.
- Los imports a `firebaseconfig` quedaron estandarizados con alias `@/firebase/firebaseconfig`, eliminando variantes relativas activas.
- La logica de ingredientes de pizza salio de `firebaseconfig` y vive en `src/firebase/products/customProduct/ingredientTypePizzaService.ts`, dejando la configuracion Firebase enfocada en inicializacion.
- Los wrappers simples de Cloud Functions reutilizan `src/firebase/functions/callable.ts`, evitando repetir `httpsCallable` y extraccion manual de `data`.
- Los renames de carpetas `Components` a `components` quedaron registrados como cambios de casing en Git para evitar fallos en filesystems case-sensitive.
- `FileUploader/FileList` ahora usa `isImageFile`/`isPDFFile` de `utils/fileUtils`, y `FileUploader` + `EvidenceUpload` comparten los styled-components de lista en `src/components/common/fileUploadShared/components/FileList.styles.ts`.
- `FilterBar` movio normalizadores de rango numerico, rango de fecha y estado activo a `FilterBar.utils.ts`, dejando el componente principal mas enfocado en layout/render.
- `CreditNoteModal` comparte `QuantityAvailabilityDisplay`/`QuantityAvailabilityHint` entre tabla y tarjeta de productos, quitando tooltips/estilos inline duplicados sin tocar los calculos.
- `ProductCard` de `CreditNoteModal` movio sus styled-components a `ProductCard.styles.ts`, dejando el archivo principal centrado en datos, calculos y render.
- `CANONICAL_PAYMENT_METHOD_CODE_SET` ahora deriva de `CANONICAL_PAYMENT_METHOD_CODES`, evitando mantener dos listas canonicas de medios de pago.
- Se marcaron docs historicos con rutas `src/views` y se limpiaron comentarios obsoletos en `eslint.config.js` sin tocar reglas.
- Se corrigieron prefijos mojibake en logs de `arPaymentUtils.ts` usando texto ASCII estable, sin cambiar validaciones ni errores lanzados.
- El modal de autorizacion por PIN movio estilos a archivos locales y elimino estado derivado en `CustomPinInput`; `PinAuthorizationContent` quedo sin inline styles ni textos mojibake.
- `BackOrders` corrigio el icono de seccion/fallback de fecha con escapes seguros y movio estilos locales de layout al `styles.ts` del modulo.
- `mapData` y `processMappedData` comparten `mappedRecord.ts` para normalizar/coaccionar valores importados y escribir paths anidados sin duplicar helpers.
- El login con proveedor reutiliza `src/firebase/functions/callable.ts` para `clientLoginWithProvider`, quitando `httpsCallable` directo del repository de auth.
- `AuthorizationsPanel` del centro de notificaciones reutiliza `PanelPrimitives` para tarjeta, header, lista, rows y estados vacio/cargando, dejando el panel enfocado en composicion.
- `InventoryControl` renombro su hook local a `useInventoryLocationNames`; el hook global legacy `src/hooks/useLocationNames` quedo retirado, y los logos duplicados de Welcome/loader apuntan al asset canonico `src/assets/logo/ventamax.svg`.
- Los hooks de cuentas bancarias activas de gastos y RRHH comparten `src/firebase/accounting/bankAccounts.repository.ts`, centralizando la lectura Firestore y el mapeo de opciones sin cambiar sus contratos publicos.
- Se retiraron wrappers legacy sin consumidores y datos mock duplicados en `contacts/pages/Contact/*/Selects` y `contacts/pages/Contact/*/components/OrderFilter`.
- Se normalizaron nombres con typos mecanicos (`ResizableSidebar`, `InvoiceInfo`, `InsuranceConfig`, `TaxReceiptSetting`, `categorySlice`, `CashReconciliation` y `CashReconciliationTable`) con busqueda antes/despues y typecheck.
- Los defaults puros de producto (`PRODUCT_BRAND_DEFAULT`, tipos de item, impuestos y garantia) viven en `src/domain/products/productDefaults.ts`; las rutas viejas quedan como facades temporales y consumidores de `utils`, templates y modales apuntan al contrato neutral.
- `InvoiceInfo`, `WarrantyInfo` y `ResizableSidebar` separaron styled-components a archivos `.styles.ts` locales.
- Las pantallas de orden y compra comparten `src/firebase/provider/useProviderSnapshotById.ts` para escuchar el proveedor seleccionado por ID, quitando listeners Firestore duplicados de los formularios.
- `tools/deploy.js` y `tools/project.js` ocultan/bloquean deploy de todas las Cloud Functions de staging salvo `ALLOW_ALL_FUNCTIONS_DEPLOY=1`, manteniendo el camino de deploy por funcion especifica.
- El servicio de jerarquia de almacenes se renombro a `src/firebase/warehouse/warehouseNestedService.ts`, corrigiendo el typo `Servise` y alineando los imports de inventario sin cambiar comportamiento.
- `useFbGetAccountReceivableByInvoice` dejo de mutar estado durante render: ahora deriva `loading` y la lista expuesta desde el snapshot vigente, y solo actualiza estado dentro del callback de Firestore.
- Las lecturas repetidas de proveedor en ordenes, ordenes pendientes y compras comparten `src/firebase/provider/providerLookup.ts`, que reutiliza el ref tipado de `providerRefs` y evita tres helpers locales equivalentes.
- Se normalizaron nombres mecanicos de UI (`DropdownMenu`, `ProductsList`, `ClientControl`) y sus imports activos, reduciendo friccion de busqueda sin tocar logica.
- `useFilterBar`, `SearchPanel` y `MenuApp` eliminaron setters durante render para sincronizar props; ahora exponen valores efectivos derivados desde drafts con clave de origen.
- Se retiraron tres `StatusIndicatorDot` duplicados y sin consumidores en contactos/ordenes, confirmados con `rg` antes de borrar.
- Se retiraron piezas huérfanas sin consumidores (`ProductWeightEntryModal` con su slice registrado pero no usado, `ErrorMassage` y el stub `fbDeteteTaxReceipt`), limpiando estado global y carpetas legacy.
- `InventoryControl` dejo de importar `db` directamente; sus hooks locales resuelven el `db` por defecto y conservan override opcional para pruebas.
- `pinAuth` reutiliza `createFirebaseCallable` para sus siete Cloud Functions de autorizacion, eliminando `httpsCallable` directo y extraccion manual repetida de `response.data`.
- El componente UI compartido de tipografia se normalizo a `Typography` en carpeta, archivo e imports activos, manteniendo intacto el contrato visual existente.
- La carpeta raiz de contexto se normalizo a `src/context`, y el SEO de la app vive junto al router en `src/router/components/AppSeo.tsx` porque depende de metadata de rutas.
- La carpeta utilitaria de transferencia de datos entre negocios se normalizo a `src/firebase/transfer`; no tenia consumidores activos fuera de sus imports internos.
- Se retiraron componentes legacy de recibos/notificaciones fiscales sin imports activos (`NotificationSection` y ambos `FiscalReceiptsList`), confirmados con busqueda repo-wide.
- Las mutaciones simples de almacen, clientes, proveedores, productos y creacion de negocio reutilizan `createFirebaseCallable`, quitando `httpsCallable` directo y extraccion manual de `response.data` donde aplicaba.
- `AuthorizationRequests`, `AddExpensesCategory`, `useFbGetClients`, `useFbGetDoctors`, `useListenSaleUnits`, `useListenInsuranceConfig` y `useListenProduct` dejaron de sincronizar estado derivado con setters durante render/efecto; ahora derivan desde scope o clave vigente y solo actualizan dentro de callbacks externos o acciones del usuario.
- `useFbGetOrders` se normalizo junto con su import activo y prueba focalizada; tambien se retiro un facade sin consumidores de `InvoicePreview` hacia `ElectronicTaxReceiptInfoCard`.
- `FileUploader` y `EvidenceUpload` importan directamente componentes visuales compartidos de `fileUploadShared`; se retiraron facades locales que solo reexportaban `DragOverlay`, `FileList`, `FileUploadControls`, `ImageLightbox` y `UploadButton`.
- `FileUploader` y `EvidenceUpload` tambien importan directamente `PreviewContent` desde `fileUploadShared`, retirando facades locales que solo reenviaban props.
- La conversion de timestamps Firestore se centralizo en `src/firebase/utils/firestoreDates.ts`, evitando duplicacion entre ordenes y compras y quitando el import cruzado de ordenes hacia `purchase`.
- Se retiro el archivo legacy sin consumidores de pedidos pendientes; el flujo activo de ordenes pendientes por proveedor vive en `src/firebase/order/useFbGetOrders.tsx`.
- `ProviderForm` dejo de mantener `selectedCountry` como estado duplicado; ahora deriva el pais desde `Form.useWatch('country')` y conserva el form de AntD como fuente de verdad.
- La consulta Supabase de RNC salio del bucket raiz `src/supabase` y vive como repository owner-local en `src/modules/contacts/repositories/rnc.repository.ts`.
- `UpdateProduct/InitializeData.ts` fue retirado como facade sin consumidores; los defaults de producto se importan desde `src/domain/products/productDefaults.ts`.
- `shortenLocationPath` vive en `src/utils/inventory/locations.ts`, reduciendo el import cruzado desde movimientos de inventario hacia componentes profundos de `InventoryControl`.
- `inventoryTableUtils` dejo de reexportar `Tag`, `Tooltip` y `EditorsList`; los consumidores importan UI desde `antd` y `EditorsList` desde su componente real.
- Se retiraron componentes legacy sin consumidores (`Account`, `CardList`, `UploadImg`, `RncPanel` raiz, `ProcessViewer`, `PageTransition`, el alias `MainLayoutModal` y el placeholder `SearchBar/Container`) junto con carpetas vacias residuales.
- El registry de design system ya no publica `vm.searchBar` como componente `planned`, evitando que recetas apunten a un placeholder sin contrato reutilizable.
- `resolveModuleMeta` salio de una carpeta profunda de `AuthorizationRequests` y vive en `src/modules/authorizations/utils/moduleMeta.ts`, para que Authorizations y NotificationCenter consuman un contrato neutral.
- `GeneratePinModal` y `PinDetailsModal` salieron de Settings y viven en `src/modules/authorizations/components/pinManagement`, porque son componentes de autorizacion reutilizados por configuracion y gestion personal de PIN.
- `fbSignIn` y `fbPublicSignUp` reutilizan `createFirebaseCallable`, alineando login/signup publicos con el wrapper compartido sin tocar la gestion de sesion ni Firebase Auth.
- `fbSignOut`, historial/verificacion de email, impersonacion dev, revoke session y alta de usuarios reutilizan `createFirebaseCallable`; el guard de callables ya no permite reintroducir esa deuda en esos archivos.
- Se retiraron declaraciones manuales redundantes junto a archivos TypeScript reales (`fbSignIn.d.ts` y `Tree.d.ts`), dejando a `tsc` derivar los contratos desde las fuentes.
- `InvoiceTemplate2` y `InvoiceTemplate3` comparten `ClassicHeader` y `ClassicFooter` en `templates/Invoicing/shared`, eliminando duplicacion exacta entre plantillas sin cambiar el render.
- `ThankYouMessage` vive en `src/components/common/ThankYouMessage`, compartido por checkout, factura y cotizacion en lugar de tres copias equivalentes.
- `WarrantySignature` vive en `src/components/common/WarrantySignature`, compartido por checkout, factura y cotizacion, retirando tres copias equivalentes de la firma por garantia.
- `pdfMakeLoader` vive en `src/pdf/utils` porque solo sirve al arbol de PDFs, dejando `src/utils/pdf` para utilidades compartidas generales.
- `BarCode` de `ProductForm` dejo de importar un modal desde `modules/dev/pages/test`; ahora reutiliza el modal local de impresion de etiquetas del propio formulario.
- Los exportadores Excel viven en `src/utils/export/excel`; la carpeta legacy `src/hooks/exportToExcel` quedo retirada y protegida por guardrail.
- `useStockAlertThresholds` y `useLocationNames` quedaron bajo `src/modules/inventory/hooks`, con exports publicos de inventario para consumidores externos.
- `vendorBills` vive en `src/domain/accountsPayable/vendorBills`, y el importador de productos vive en `src/domain/products/import`, retirando buckets de dominio desde `src/utils`.
- `WebName` vive junto al shell de navegacion y `InfoCard` vive junto al preview de factura, retirando componentes de uso unico desde `src/components/ui`.
- Los tipos del `FilterBar` de ordenes/compras y la factory comun `createTransactionFilterConfig` viven en `OrderAndPurchase/shared`, quitando el acoplamiento de `Order`, `useOrders` y `AccountsPayable` hacia una carpeta profunda de `Compra`.
- Las fechas de ordenes/compras reutilizan `OrderAndPurchase/shared/utils/transactionDates.ts` para normalizar millis, validar fechas transaccionales y alimentar `DatePicker` sin mantener copias locales en formularios, tablas y controller utils.
- Se retiraron duplicados huerfanos de `TotalsSummary` en orden/compra y el filtro legacy de contactos (`OrderFilter`/`OrderMenuFilterShared`) que solo quedaba referenciado en JSX comentado.
- `GlobalMenu` recupero ownership de `createLazyLoader` y `normalizeMatch`; esos helpers dejaron de vivir en `src/utils` porque dependen exclusivamente del contrato de toolbar de navegacion.
- `OrderManagement` y `PurchaseManagement` comparten `TransactionNotesInput` para debounce, cleanup y render del campo de notas, dejando wrappers locales solo para labels, placeholder y reglas de longitud.
- `calculatePaymentDates`, `formatPaymentDate` y `getFormattedDates` viven en `src/domain/accountsReceivable/paymentDates.ts`; `generateInstallments` y el panel de ventas consumen el contrato neutral en vez de importar logica desde una carpeta profunda de UI.
- `CashCountMetaData` salio del componente profundo de cierre de caja y vive en `src/domain/cashCount/cashCountMetaData.ts`, permitiendo que Firebase, DevTools y la UI reutilicen el calculo desde una capa de dominio.
- `useActiveBankAccounts` se movio de `ExpensesForm/hooks` a `src/modules/treasury/hooks`, y `useOpenCashRegisters` a `src/modules/cashReconciliation/hooks`, para que gastos, ventas, CxC y compras consuman recursos financieros desde su ownership real.
- `useProductRealtimeListener` dejo de importar Firestore directo; la suscripcion normalizada vive en `src/firebase/products/productRealtime.repository.ts` y el hook queda enfocado en estado React y valores derivados.
- Se retiraron huérfanos confirmados sin consumidores: `AddFileBtn`, `ChevronDownButton`, `countBillsByMonth`, `SettingsExample`, `AddProduct&Services`, `OrderDetailModal` y el `Actionmenu` legacy de `InvoiceSummary`.
- `useActiveBusinessBankAccounts` de RRHH conserva su API publica pero delega en `src/modules/accounting/hooks/useActiveBankAccounts.ts`, evitando mantener dos listeners equivalentes de cuentas bancarias activas.
- `UsersList` conserva un solo menu de acciones (`ActionMenu`); `UserListActionMenu` era una copia activa equivalente y se retiro para evitar divergencia entre tablas de usuarios.
- `getTaxReceiptAvailability` y `comprobantesOptions` viven en `src/utils/taxReceipt.ts`; CxC, preordenes, venta, proveedores y compras ya no importan logica fiscal desde carpetas profundas de UI.
- Se retiraron huerfanos confirmados sin consumidores en `DeveloperModal`, `InvoiceForm`, `ProductExpirySelection`, `SettingsModal`, `UpdateProduct`, `components/ui/Product` y `firebase/accountsReceivable/fetchInstallment.ts`.
- `useFbGetClientsOnOpen` delega en `useFbGetClients` con `enabled`, compartiendo listener, mapeo y normalizacion de clientes sin romper la API publica de apertura bajo demanda.
- `toggleClientModal` limpia `addClientToCart` al cerrar y lo deriva del payload al abrir, evitando que aperturas normales hereden accidentalmente el modo de carrito.
- Los estados vacio/cargando/error de `NotificationCenter` reutilizan `PanelStateBody`, eliminando contenedores locales duplicados en CxC y comprobantes fiscales.
- `useFbGetCreditNoteApplicationsByInvoice` conserva su API publica pero delega en `useFbGetCreditNoteApplications`, centralizando la suscripcion Firestore de aplicaciones de notas de credito.
- `TotalSalesCard` y `RangeComparisonCard` de Utility reutilizan `ComparisonMetricCard`, dejando cada wrapper con solo configuracion de titulo, icono, copy y tono visual.
- Los reportes de compras y gastos reutilizan helpers puros en `src/components/charts` para construir datos de barra y opciones monetarias de Chart.js, reduciendo duplicacion visual sin tocar los acumuladores de dominio.
- Se retiraron piezas huérfanas de `components/ui/Table` (`Body`, `Header`, `Footer`, `Row`) tras confirmar que no tenian consumidores activos.
- Se retiraron `NotificationHandler` y el `AlertDialog` legacy de `UserNotification`; `ModalManager` monta directamente `ConfirmationDialog`, que queda como el flujo activo.
- `downloadQuotationPDF`, `fbUpdateUser` y `fbUpdateUserPassword` reutilizan `createFirebaseCallable`, quitando `httpsCallable` directo en wrappers simples sin cambiar sus APIs publicas.
- `billingManagement` centraliza su helper dinamico `callBilling` sobre `createFirebaseCallable`, conservando data directa para las pantallas de suscripcion y evitando repetir `response.data`.
- El cliente HTTP frontend de Cloud Functions vive en `src/firebase/functions/httpClient.ts`; los services owner-locales lo consumen desde la capa Firebase compartida en vez de `src/services`.
- `reconcileBatchStatus` vive en `src/firebase/inventory/reconcileBatchStatus.ts`, dejando el wrapper callable bajo el owner de inventario sin cambiar su API publica.
- Los helpers de pagos a proveedor (`fbAddAccountsPayablePayment`, `fbVoidAccountsPayablePayment`) reutilizan `createFirebaseCallable`, manteniendo validaciones locales y retorno directo de data sin repetir `httpsCallable`.
- `electronicTaxReceipts` usa `callElectronicTaxReceipt` como helper local para agregar `sessionToken` y consumir `createFirebaseCallable` en validacion/configuracion fiscal sin repetir `response.data`.
- La seleccion de marca de producto vive en `src/domain/products/brandSelection.ts`, compartida por `ProductForm` y `ProductStudio` sin acoplar devtools a carpetas internas del modal.
- `ProductStudio` importa `buildBrandOptions` desde su owner real y deja `brandUtils.ts` solo para metadata propia del studio.
- `AccountingConfig` elimino facades de un solo re-export (`ChartOfAccountsList`, `PostingProfilesList`, `AccountingEventCoverageList`) y el componente muerto `ExchangeRateList`, apuntando los consumidores al workspace real.
- Los documentos vivos de fiscal/contabilidad actualizan rutas normalizadas (`TaxReceiptSetting`, `InsuranceConfig`) y marcan `fbDeteteTaxReceipt` como retirado, dejando intactos los snapshots historicos de auditoria.
- Se normalizaron imports internos con sufijo `.js` que apuntaban a fuentes TypeScript reales en PDF, inventario, clientes y comprobantes; se dejaron intactos los `.js` reales como `accountingSchemas.js`.
- `CentredText` se normalizo a `CenteredText`, alineando nombre de archivo, export e imports activos sin cambiar su API visual.
- `useFbGetProviders` delega la suscripcion Firestore en `src/firebase/provider/provider.repository.ts`, reutilizando `providerRefs` y dejando el hook enfocado en estado React/loading.
- Se retiro la isla legacy autocontenida `src/modules/home/pages/Home/HomeScreen`, que no tenia consumidores externos y mantenia debug JSON junto a un acceso opcional a `getBills` desde `firebaseconfig`; la pantalla activa de Home sigue viviendo en `src/modules/home/pages/Home/Home.tsx`.
- Se retiraron componentes Home legacy sin consumidores (`DashboardShortcuts`, `FeatureCardList`, `HomeQuickActions`, `BusinessInfoModal` y `AppVersionBadge`) y la referencia muerta del piloto estricto hacia la utilidad eliminada de `HomeScreen`.
- Se elimino el cliente frontend muerto `src/services/accountsReceivable/audit.service.ts`; el endpoint HTTP de auditoria CxC queda como superficie backend/documentada, no como API importada desde `src/services`.
- `LoginImageConfig` dejo de importar Firebase Storage directo; el acceso a `listAll`, `getDownloadURL`, `deleteObject` y `uploadBytes` vive en `src/modules/controlPanel/AppConfig/repositories/loginImageStorageRepository.ts`.
- Al retirar `AppVersionBadge`, tambien se elimino el formatter exclusivo de ese badge, manteniendo solo `formatClientAppVersionDate` para `getClientBuildInfo`.
- `OrderManagement` y `PurchaseManagement` comparten los primitivos visuales de sus `GeneralForm` en `src/modules/orderAndPurchase/pages/OrderAndPurchase/shared/components/TransactionGeneralFormLayout`, dejando `InvoiceDetails` local porque cada flujo tiene requisitos fiscales distintos.
- `ChangeUserPasswordModal` dejo de sincronizar validez derivada con `setState` dentro de `useEffect`; ahora actualiza el estado de submit desde callbacks del formulario y mantiene el reseteo local al cerrar.
- Las notas de credito/debito electronicas solo crean efectos financieros cuando DGII/RFCE ya estan en un estado aceptado; el mismo criterio se usa para ocultar notas de credito electronicas rechazadas como medio de pago disponible.
- Se eliminaron assets scaffold sin referencias (`src/assets/react.svg`, `src/assets/link`) y modelos muertos (`src/models/Products`, `src/models/Sales`), actualizando la referencia de inventario.
- Se retiraron modelos Warehouse muertos sin consumidores activos (`src/models/Warehouse/ProductStock.ts`, `src/models/Warehouse/Sale.ts`) y la referencia de inventario ahora apunta a servicios/tipos activos.
- `src/constants/appConfig.ts` quedo retirado como wrapper de un unico valor; `appModeSlice` mantiene el default directamente y `moduleBoundaries.test.ts` bloquea reintroducirlo.
- `statusActionConfig` salio de `src/config` hacia `src/components/ui/statusDisplay/statusDisplayConfig.tsx`, porque contiene iconos React y tokens visuales consumidos solo por badges/fechas de UI.
- `checkOpenCashReconciliation` se separo del hook `useIsOpenCashReconciliation` hacia `src/firebase/cashCount/cashReconciliationStatus.repository.ts`, evitando que servicios de factura y CxC importen un archivo React para una consulta async.
- `useBankInstitutionCatalog` se movio desde `src/domain/banking` hacia `src/firebase/banking`, dejando `src/domain` como contratos/normalizadores puros y agregando guardrail contra imports de React/Firebase en esa capa.
- La ruta `/dev/business/switch` mantiene su ubicacion actual pero queda marcada con `requiresDevAccess: true` y cubierta por `routeVisibility.test.ts`.
- `tools/lint.js` dejo de listar buckets retirados (`src/ant`, `src/motion`) y `docs/codebase-audit.md` actualizo la referencia activa de producto desde el bucket modal legacy al owner actual de products.
- `SearchProductBar` de `MenuApp` quedo retirado: no tenia consumidores activos y conservaba comandos hacia rutas obsoletas (`/devTools`, `/app/freeSpace`). La busqueda activa queda en `SearchPanel` y Home mantiene `ShortcutSearch`.
- Se retiraron facades frontend sin consumidores: `src/firebase/inventoryDataCleaner` (limpieza destructiva de colecciones) y `src/firebase/functions/invoice/processInvoice.ts` (caller de prueba a `processInvoiceEndpoint`).
- `src/firebase/Tools/getDocRef.ts` quedo retirado como re-export muerto; los consumidores activos usan `getDocRef` desde `src/firebase/firebaseOperations.ts` y `Tools/getNextID` permanece intacto.
- `WelcomeV2` comparte el primitivo visual `SectionLabel` en `sections/SectionPrimitives.styles.ts`, evitando cuatro copias equivalentes entre showcase, features, workflow y testimonios.
- `PRODUCT_STUDIO` y `CHANGELOG_MANAGE` quedaron marcadas con `requiresDevAccess: true`; ambas ya se presentaban como superficies dev, pero podian abrirse por URL directa sin esa metadata.
- `auditAccountsReceivableHttp` ahora reporta `adjustmentNoteFinancialEffects` para detectar notas de credito/debito electronicas no posteables que aun conservan CxC, aplicaciones o eventos contables activos.
- La pantalla de auditoria CxC consume ese indicador con un panel local de revision, y la llamada HTTP vive en un service owner-local del modulo en vez de reintroducir un cliente global en `src/services`.
- `repairCustomerAdjustmentNoteFinancialEffects` centraliza la reparacion segura de esos efectos financieros: por defecto corre en dry-run, solo auto-repara rechazos fiscales confirmados, revalida dentro de transaccion y devuelve `manual_review` para estados ambiguos o documentos con pagos/aplicaciones/asientos.
- Los accesos de lectura con `requiredModule` ya validan entitlement de suscripcion, y la reparacion fiscal de CxC exige acceso al modulo `accountsReceivable` tanto en dry-run como en escritura.
- `Loader` dejo de depender de un slice Redux sin dispatchers activos; ahora es prop-driven, el mount global muerto salio de `ModalManager` y `src/features/loader` quedo retirado.
- Los permisos dinamicos separan catalogo puro (`src/domain/permissions/dynamicPermissionsCatalog.ts`) de persistencia Firestore (`src/firebase/permissions/dynamicPermissions.repository.ts`), y los consumidores de usuarios importan solo la capa que necesitan.
- La metadata de productos de bajo riesgo (categorias, favoritos, ingredientes activos y marcas) se encapsulo en hooks owner-locales de products, sacando imports directos de Firebase de los componentes visuales sin tocar stock, imagenes ni guardados de producto.
- El modal de pizza personalizada deriva el draft en render con `buildCustomPizzaDraft` y prueba focalizada, en vez de sincronizar estado derivado desde `Header` con `useEffect`.
- Los paths retirados recientes (`functionsApiClient`, `dynamicPermissions`, `invoiceV2Admin`, `pdfMakeLoader` legacy y `reconcileBatchStatus` bajo functions/inventory) quedaron cubiertos por `moduleBoundaries.test.ts`, y los planes/docs activos apuntan a sus owners actuales.

## Guardrails añadidos en esta pasada

- `src/modules/moduleBoundaries.test.ts` protege boundaries entre dominios: bloquea imports desde un modulo hacia carpetas privadas de otro (`pages/`, `components/`, `hooks/`, `utils/`), mantiene vacias las allowlists `allowedLegacyDeepImports` y `allowedLegacyPrivateRouterImports`, y tambien cubre buckets legacy retirados, el adapter HeroUI y ciclos entre modulos. Los ciclos legacy permitidos viven en una lista explicita separada y no deben crecer.
- `src/modules/publicBarrels.test.ts` fija el contrato runtime exacto de cada `public.ts`: cada modulo debe tener barrel publico registrado y exportar solo los nombres/tipos esperados por el test, para que el barrel sea un contrato acotado y no un indice de carpetas internas.
- `src/firebase/functions/callableImportGuard.test.ts` obliga a que los wrappers nuevos de Cloud Functions usen `src/firebase/functions/callable.ts` / `createFirebaseCallable`; los imports directos de `httpsCallable` quedan limitados al wrapper compartido y a la deuda enumerada en el test.
- `src/router/routes/routePreloaders.test.ts`, `routeHandle.test.ts`, `routeVisibility.test.ts` y `src/modules/navigation/components/MenuApp/GlobalMenu/core/createLazyLoader.test.ts` son el guardrail ejecutable de rutas/menu/preloaders. No mantener checklists manuales paralelos salvo como nota temporal de migracion.
- `npm run test:run:architecture` corre la suite estructural actual: callable wrappers, boundaries, public barrels, rutas y lazy loaders.
- `tools/deploy.js` y `tools/project.js` bloquean los deploys de todas las Cloud Functions de staging salvo `ALLOW_ALL_FUNCTIONS_DEPLOY=1`. El flujo normal documentado por el helper es `npm run deploy -- staging:functions nombreDeFuncion`, que termina en `--only functions:nombreDeFuncion`.

## Deuda restante de alto riesgo: no tocar sin QA

- Las allowlists de deep imports y router privado en `moduleBoundaries.test.ts` deben seguir vacias. Cualquier necesidad de cruce entre dominios debe pasar por `@/modules/<modulo>/public` o por una capa neutral compartida, con QA funcional cuando toque flujos operativos sensibles. La lista de ciclos legacy es deuda acotada: no agregar nuevos ciclos sin dividir primero el contrato compartido.
- La deuda explícita de `callableImportGuard.test.ts` incluye wrappers de autenticación/sesión/cambio de negocio, contabilidad/DGII/reportes/cierre de periodo, CxC, notas de crédito, facturas, apertura/cierre de caja, tesorería y `src/services/invoice/invoice.service.ts`. No hacer migración masiva a `createFirebaseCallable` sin pruebas de caracterización y QA de cada flujo monetario o fiscal afectado.
- Los `public.ts` no deben crecer como barrels convenientes. Si un modulo necesita consumir algo de otro dominio, primero confirmar ownership, exponer solo el contrato minimo y actualizar `src/modules/publicBarrels.test.ts`; si el export toca facturacion, pagos, caja, tesoreria, fiscal/NCF o CxC, requiere QA funcional.
- No cambiar ni usar el bypass `ALLOW_ALL_FUNCTIONS_DEPLOY=1` como parte de limpiezas arquitectónicas. Sirve solo para una decisión explícita de release; para cambios en `functions/`, desplegar funciones específicas.

## Fase 4 sugerida

Centralizar servicios/API/Firebase por dominio, empezando por dominios de menor riesgo y dejando fuera fiscal, caja, pagos, facturacion y NCF hasta tener pruebas de caracterizacion. Ya hay avances en auth provider login, lectura de cuentas bancarias activas y callables simples de inventario/contactos/productos; continuar con lecturas simples antes de escrituras sensibles.

1. Inventariar imports directos a `src/firebase/**` desde componentes y paginas.
2. Elegir 1 dominio de bajo riesgo y crear `services/<dominio>` o `modules/<dominio>/services`.
3. Mover solo llamadas de lectura simples detras de un service/repository tipado.
4. Agregar pruebas de contrato para normalizadores o mappers antes de mover escrituras.
5. Repetir por dominio, evitando barrels globales y evitando imports profundos entre modulos; cuando se use `public.ts`, tratarlo como contrato publico acotado del modulo owner, no como indice general de carpetas internas.
6. Cerrar cada lote que toque boundaries, public barrels, callables o rutas con `npm run test:run:architecture`.
