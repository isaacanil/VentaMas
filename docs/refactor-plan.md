# Refactor arquitectonico seguro

Este documento define reglas practicas para continuar refactors pequenos sin cambiar comportamiento funcional. La prioridad es reducir acoplamiento accidental y evitar que nuevos cambios mezclen UI, dominio y acceso a datos.

## Reglas para codigo nuevo

- No usar Firebase SDK directo en componentes nuevos. Crear un service, repository o hook de dominio que encapsule la lectura/escritura.
- No poner logica de negocio pesada en componentes visuales. Calculos, normalizadores y validaciones deben vivir en `utils/`, `services/`, `domain/` o en carpetas del dominio.
- Preferir services/repositories por dominio antes que helpers globales genericos. Si una pieza es de facturacion, inventario, caja o RRHH, debe ser ubicable por ese dominio.
- Evitar imports profundos entre modulos. Si un modulo necesita una capacidad de otro, extraer un contrato pequeno en `src/shared/types`, `src/shared/lib` o en una capa de dominio neutral.
- Evitar duplicar componentes compartidos. Si dos componentes mantienen el mismo contrato visual, crear una pieza compartida y dejar wrappers solo cuando ayuden a migrar sin romper imports.
- Los tipos de router deben vivir fuera del agregador de rutas cuando sean usados por otros archivos del router o del menu. `src/router/types/routeTypes.ts` es el contrato neutral para `AppRoute`.

## Fase 1 aplicada

- Se extrajo `AppRoute` desde `src/router/routes/routes.tsx` hacia `src/router/types/routeTypes.ts`.
- `routeVisibility.ts`, `router/index.tsx` y `findRouteByName.ts` ahora consumen el tipo desde el contrato neutral.
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
- Las tarjetas principales de suscripcion (`SubscriptionOverviewCard`, `SubscriptionPlansCard`, `SubscriptionBillingCard`, `SubscriptionSettingsCard`, `SubscriptionCurrentPlanCard` y `SubscriptionPaymentMethodCard`) movieron styled-components a archivos `.styles.ts` locales, sin tocar reglas de negocio ni handlers.
- Los modales de mantenimiento `DeveloperFieldCatalogModal` y `DeveloperPlanVersioningModal` tambien separaron estilos locales; el modal de versionado movio su editor de campos a `DeveloperPlanVersioningFields.tsx` y reemplazo comentarios decorativos por comentarios ASCII simples.
- `SubscriptionOverviewCard`, `SubscriptionPlansCard` y `SubscriptionBillingCard` separaron subcomponentes de presentacion en archivos locales, dejando los contenedores con estado, filtros y composicion de alto nivel.
- `SubscriptionOverviewCard` reemplazo el archivo generico `.parts.tsx` por componentes nombrados (`UsageItem`, `ActivityItem`, `QuickAction`) y helpers locales de iconos/estado.
- `SubscriptionOverviewCard` separo sus secciones principales en componentes nombrados (`SubscriptionPlanSummary`, `SubscriptionUsageSection`, `SubscriptionStatsRow`, `SubscriptionActivityCard` y `SubscriptionQuickActionsCard`) para dejar el contenedor como composicion.
- `SubscriptionPlansCard` ahora usa componentes nombrados (`PlanOptionCard`, `PlansComparisonTable`, `PlanChangeConfirmModal`) y helpers propios para definiciones/iconos, evitando un archivo `.parts.tsx` grande.
- `SubscriptionBillingCard` separo tipos, helpers de factura, badge de estado, tabla y modal de detalle en archivos nombrados, y `SubscriptionSettingsCard` movio resolvers fiscales/de negocio a un helper local.
- `SubscriptionSettingsCard` extrajo el flujo de cancelacion a `SubscriptionCancellationSection`, y `SubscriptionPaymentHistoryCard` movio estilos locales a `.styles.ts`.
- `SubscriptionCurrentPlanCard` movio mapeos de tono y formateadores a helpers locales; `SubscriptionPaymentMethodCard` separo el bloque de seguridad de pagos en `PaymentSecurityFeature`.
- Componentes de navegacion/limites de suscripcion (`SubscriptionSectionNav`, `SubscriptionTabbedLayout`, `SubscriptionLimitsCard`) movieron estilos embebidos a archivos `.styles.ts`.
- Las paginas internas de mantenimiento de suscripciones (`Overview`, `Tools`, `Sandbox`, `Success`) y piezas auxiliares (`DeveloperSubscriptionInactiveNotice`, `SimulatedPlanSelectionCard`, `DeveloperSubscriptionMaintenanceModals`) movieron estilos embebidos a archivos locales `.styles.ts`.
- Componentes pequenos de suscripcion (`DeveloperMaintenanceHub`, `SubscriptionShell` y `MockSubscriptionFlowCard`) movieron estilos locales a `.styles.ts` sin tocar reducers ni callbacks.
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
- `FileUploader/FileList` ahora usa `isImageFile`/`isPDFFile` de `utils/fileUtils`, y `FileUploader` + `EvidenceUpload` comparten los styled-components de lista en `components/common/FileList/FileList.styles.ts`.
- `FilterBar` movio normalizadores de rango numerico, rango de fecha y estado activo a `FilterBar.utils.ts`, dejando el componente principal mas enfocado en layout/render.
- `CreditNoteModal` comparte `QuantityAvailabilityDisplay`/`QuantityAvailabilityHint` entre tabla y tarjeta de productos, quitando tooltips/estilos inline duplicados sin tocar los calculos.
- `ProductCard` de `CreditNoteModal` movio sus styled-components a `ProductCard.styles.ts`, dejando el archivo principal centrado en datos, calculos y render.
- `CANONICAL_PAYMENT_METHOD_CODE_SET` ahora deriva de `CANONICAL_PAYMENT_METHOD_CODES`, evitando mantener dos listas canonicas de medios de pago.
- Se marcaron docs historicos con rutas `src/views` y se limpiaron comentarios obsoletos en `eslint.config.js` sin tocar reglas.
- Se corrigieron prefijos mojibake en logs de `arPaymentUtils.ts` usando texto ASCII estable, sin cambiar validaciones ni errores lanzados.
- El modal de autorizacion por PIN movio estilos a archivos locales y elimino estado derivado en `CustomPinInput`; `PinAuthorizationContent` quedo sin inline styles ni textos mojibake.
- `BackOrders` corrigio el icono de seccion/fallback de fecha con escapes seguros y movio estilos locales de layout al `styles.ts` del modulo.

## Fase 4 sugerida

Centralizar servicios/API/Firebase por dominio, empezando por dominios de menor riesgo y dejando fuera fiscal, caja, pagos, facturacion y NCF hasta tener pruebas de caracterizacion.

1. Inventariar imports directos a `src/firebase/**` desde componentes y paginas.
2. Elegir 1 dominio de bajo riesgo y crear `services/<dominio>` o `modules/<dominio>/services`.
3. Mover solo llamadas de lectura simples detras de un service/repository tipado.
4. Agregar pruebas de contrato para normalizadores o mappers antes de mover escrituras.
5. Repetir por dominio, evitando barrels globales y evitando imports profundos entre modulos.
