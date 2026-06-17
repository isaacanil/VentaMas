# Auditoría del código

## 1. Resumen ejecutivo

El proyecto es una aplicación grande de React/Vite + Firebase con una capa backend de Cloud Functions. La estructura ya muestra varios refactors seguros recientes: hay más archivos `.styles.ts`, helpers locales, componentes `Vm/HeroUI` y pruebas unitarias en zonas contables, RRHH y exportación. Aun así, la arquitectura todavía mezcla responsabilidades entre `src/modules`, `src/firebase`, `src/components`, `src/utils`, `src/types` y `functions/src`.

La complejidad esencial del negocio es alta: facturación, DGII, CxC, inventario, caja, tesorería, nómina y multi-moneda no son dominios simples. El riesgo principal no es esa complejidad, sino la complejidad accidental: acceso directo a Firebase desde demasiados lugares, contratos duplicados entre frontend/backend, componentes grandes con lógica de dominio, rutas registradas en varias configuraciones y un sistema visual dividido entre AntD legacy, componentes propios y `Vm/HeroUI`.

Alcance de esta auditoría: análisis estático del árbol actual. No se modificó código fuente, no se ejecutaron refactors automáticos y no se validó comportamiento runtime. El árbol de Git ya estaba sucio antes de crear este documento, por lo que los hallazgos describen mantenibilidad y riesgo estructural, no regresiones confirmadas.

Actualización round-2: la dirección vigente ya está más cerrada que el diagnóstico original. El trabajo nuevo debe reforzar ownership local por módulo (`components`, `hooks`, `utils`, `repositories`), contratos neutrales en `src/domain` cuando crucen owners, barrels públicos `public.ts`, wrappers de Cloud Functions sobre `src/firebase/functions/callable.ts` y el gate `npm run test:run:architecture`. La cobertura de rutas debe vivir en guardrails ejecutables, no en checklists manuales paralelos.

## 2. Mapa de estructura actual

| Carpeta o archivo                                                                                         | Responsabilidad aparente                                                             | Observación                                                                                                                                                                                            |
| --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/modules`                                                                                             | Pantallas y dominios principales de producto. Es la carpeta más grande del frontend. | Contiene módulos bien delimitados, pero también flujos donde UI, hooks, servicios y reglas conviven en archivos grandes.                                                                               |
| `src/components`                                                                                          | Componentes compartidos, modales globales, UI legacy y componentes comunes.          | `components/modals` funciona como contenedor de flujos de negocio, no solo UI compartida.                                                                                                              |
| `src/components/heroui`                                                                                   | Capa `Vm*` basada en HeroUI.                                                         | Es la dirección más clara para UI nueva en dev/admin y superficies modernas.                                                                                                                           |
| `src/components/ui`                                                                                       | Primitivos propios y legacy.                                                         | Convive con AntD y HeroUI; algunos componentes custom tienen deuda de accesibilidad.                                                                                                                   |
| `src/firebase`                                                                                            | Hooks, repositorios, servicios y funciones de acceso a Firebase por dominio.         | La carpeta concentra gran parte del acceso a datos, pero no es la única frontera; muchos módulos importan Firestore directo.                                                                           |
| `src/services`                                                                                            | Deuda legacy de servicios frontend globales.                                         | Solo queda deuda legacy de factura bajo `src/services/invoice/**`; CxC y clientes HTTP/globales retirados no deben reintroducirse como capa global.                                                     |
| `src/utils`                                                                                               | Helpers transversales de negocio, formato, fecha, contabilidad, inventario y otros.  | Útil, pero algunos archivos ya contienen lógica de dominio pesada que compite con `modules` y `firebase`.                                                                                              |
| `src/shared`                                                                                              | Contratos y utilidades compartidas.                                                  | Buena ubicación para contratos neutrales, pero hay duplicados con `functions/src/shared`.                                                                                                              |
| `src/types`, `src/models`, `src/domain`, `src/constants`, `src/modules/expenses/validation` | Tipos, modelos, constantes y validaciones.                                  | `src/domain` debe ser la salida preferida para contratos neutrales y puros; si un concepto tiene owner claro, mantenerlo owner-local y exponerlo por `public.ts` solo cuando otro dominio lo necesite. |
| `src/features`                                                                                            | Redux slices y estado global.                                                        | El store central registra muchas features y desactiva `serializableCheck`, lo que aumenta el acoplamiento.                                                                                             |
| `src/router`                                                                                              | Rutas, nombres, preloaders y procesamiento de rutas.                                 | La metadata aún vive en varias piezas, pero `routePreloaders.test.ts`, `routeHandle.test.ts`, `routeVisibility.test.ts` y `menuRouteAccess.test.ts` ya funcionan como guardrails ejecutables.          |
| `src/design-system`, `src/styles`, `src/theme`, `src/variable.css`                                        | Tokens, temas, estilos globales y normalización visual.                              | Hay tokens, pero también variables duplicadas y colores hardcodeados en componentes.                                                                                                                   |
| `functions/src/app/modules`                                                                               | Cloud Functions por dominio actual.                                                  | Buena intención modular, aunque hay casing inconsistente (`Inventory`) y varios archivos muy grandes.                                                                                                  |
| `functions/src/app/versions/v1` y `functions/src/app/versions/v2`                                         | APIs/versiones previas y actuales.                                                   | Conviven con `app/modules`, lo que exige claridad al exponer funciones y desplegar selectivamente.                                                                                                     |
| `functions/src/shared`                                                                                    | Schemas/utilidades compartidas del backend.                                          | Hay duplicación directa con `src/shared/accountingSchemas.js`.                                                                                                                                         |
| `functions/src/index.js`                                                                                  | Entry point de exports de Cloud Functions.                                           | Mezcla muchas importaciones/exports de módulos y versiones, elevando el radio de cambio.                                                                                                               |
| `docs`, `plans`, documentos raíz                                                                          | Documentación técnica y planes.                                                      | Parte de la documentación histórica vive en raíz y podría archivarse.                                                                                                                                  |
| `tools`, `scripts`                                                                                        | Automatización local, lint, dev server, deploy y utilidades.                         | Es una fortaleza del repo; conviene no ampliar complejidad aquí sin necesidad.                                                                                                                         |

## 3. Hallazgos principales

| Problema                                                                                                                                            | Ubicación                                                                                                                                                                                                                                                                                                                                                 | Impacto                                                                                                                                   | Severidad  | Recomendación                                                                                                                                                                                         |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| La frontera UI/datos sigue porosa. Se detectaron muchos imports y operaciones Firestore/Functions en `src`, incluidos componentes, hooks y módulos. | `src/modules`, `src/components`, `src/hooks`, ejemplos: `src/modules/invoice/pages/CreditNote/components/CreditNoteModal/CreditNoteModal.tsx`, `src/modules/accounting/hooks/useAccountingConfig.ts`, `src/modules/accountsReceivable/pages/AccountReceivable/pages/AccountReceivableAudit/hooks/useReceivableInvoices.ts`                                | Probar UI requiere mocks de infraestructura; mover pantallas arrastra Firebase; las reglas de negocio se repiten entre cliente y backend. | Alta       | Crear repositories/services por dominio, empezando por lecturas simples y dominios de bajo riesgo. Dejar hooks como sincronizadores externos.                                                         |
| Contratos contables duplicados y divergentes entre frontend/backend.                                                                                | `src/shared/accountingSchemas.js`, `functions/src/shared/accountingSchemas.js`, `package.json`, `functions/package.json`                                                                                                                                                                                                                                  | Un schema puede validar distinto en cliente y Functions. El riesgo es alto porque afecta contabilidad y proyección de eventos.            | Alta       | Usar la prueba espejo existente `functions/src/shared/accountingSchemas.parity.test.js`, extraer contrato compartido buildable y alinear versión de Zod gradualmente.                                 |
| Pagos de CxC mantienen rutas cliente y backend activas.                                                                                             | `functions/src/app/modules/accountReceivable/functions/processAccountsReceivablePayment.js`, `src/firebase/processAccountsReceivablePayments/fbPayBalanceForAccounts.ts`, `src/firebase/processAccountsReceivablePayments/fbPayActiveInstallmentForAccount.ts`, `src/firebase/processAccountsReceivablePayments/insurance/fbProcessMultiplePaymentsAR.ts` | Reglas de balance, cuotas, recibos, caja y contabilidad pueden divergir.                                                                  | Alta       | Mapear pantallas que llaman cada ruta, mover validaciones compartidas a callable backend y deprecar escrituras cliente por fases.                                                                     |
| `functions/src/index.js` concentra demasiados exports.                                                                                              | `functions/src/index.js`, `functions/src/app/modules/*`, `functions/src/app/versions/v1`, `functions/src/app/versions/v2`                                                                                                                                                                                                                                 | Agregar o renombrar una función obliga tocar el root. Aumenta riesgo de deploy selectivo incorrecto.                                      | Alta       | Crear agregadores de exports por dominio/version y dejar `index.js` como composición mínima.                                                                                                          |
| Los modales de dominio no deben volver a un bucket compartido.                                                                                      | `src/modules/<dominio>/...`, `src/router/components/ModalManager.tsx`, `src/modules/dev/components/DeveloperConsoleModal/components/CommandProcessor/handlers/executeCommand.ts`                                                                                                                                                                          | Los modales globales se orquestan desde router/features, pero la UI y reglas de cada flujo deben vivir en su módulo dueño.                | Alta       | Mantener modales dominiales en `src/modules/<dominio>/components` y dejar `ModalManager` como orquestador.                                                                                            |
| Componentes grandes mezclan UI, estado, reglas y estilos.                                                                                           | `src/modules/accounting/pages/AccountingWorkspace/components/FiscalCompliancePanel.tsx`, `src/modules/sales/pages/Sale/components/Cart/components/InvoiceSummary/InvoiceSummary.tsx`, `src/modules/sales/pages/Sale/components/Cart/components/ProductCardForCart/ProductCardForCart.tsx`                                                                 | Cambios pequeños obligan editar archivos grandes y sensibles. Aumenta el riesgo de bugs en venta y fiscal.                                | Alta       | Extraer helpers puros con tests, subcomponentes por sección y hooks de view model. Mantener el contenedor como orquestador.                                                                           |
| Deuda de accesibilidad en componentes legacy.                                                                                                       | `src/components/ui/Button/Button.tsx`, `src/components/ui/Select/Select.tsx`, `src/modules/contacts/pages/Contact/Client/components/ClientForm/components/AppModal/AppModal.tsx`, `src/hooks/useModalFocusTrap.ts`, `src/components/ui/DropdownMenu/DropdownMenu.tsx`                                                                                     | Foco visible, listbox manual y modales custom pueden fallar con teclado o lector de pantalla.                                             | Alta       | Restaurar `:focus-visible`, migrar usos nuevos a `VmButton`/`VmSelect`/`VmModal` y retirar overlays custom al tocar pantallas.                                                                        |
| `settings` concentra demasiados subdominios.                                                                                                        | `src/modules/settings`, `src/modules/accounting/hooks/useAccountingConfig.ts`, `src/modules/settings/pages/subscription`, `src/modules/settings/pages/setting`                                                                                                                                                                                            | Configuración general, contable, fiscal, suscripción y usuarios compiten dentro del mismo módulo.                                         | Media-alta | Separar subdominios internos sin cambiar rutas públicas: `settings/accounting`, `settings/fiscal`, `settings/users`, `settings/subscription`.                                                         |
| Sistema UI con direcciones activas mezcladas.                                                                                                       | `src/components/ui`, `src/components/heroui`, `src/design-system/registry/components.ts`, múltiples imports AntD                                                                                                                                                                                                                                          | Nuevas pantallas pueden elegir AntD, custom UI o Vm por costumbre, no por arquitectura.                                                   | Media      | Documentar regla por área: AntD legacy permitido, `Vm/HeroUI` preferido para UI nueva. Migrar solo cuando se toca la pantalla.                                                                        |
| Estilos y tokens no están completamente centralizados.                                                                                              | `src/variable.css`, `src/styles/theme.css`, `src/design-system`, componentes con `style={{ ... }}`                                                                                                                                                                                                                                                         | Contraste, foco, spacing y estados visuales se vuelven inconsistentes.                                                                    | Media      | Consolidar tokens por uso real y reemplazar hardcodes por superficie, empezando por venta, fiscal y dev/admin.                                                                                        |
| Rutas, menú, preloaders y toolbars duplican metadata.                                                                                               | `src/router/routes/routesName.ts`, `src/router/routes/routes.tsx`, `src/router/routes/routePreloaders.ts`, `src/modules/navigation/components/MenuApp/GlobalMenu/configs/toolbarConfigs.ts`, `src/modules/navigation/components/MenuApp/MenuData/items/*`                                                                                                 | Agregar o mover una ruta puede requerir varios cambios, pero los olvidos principales ya deben fallar en pruebas estructurales.            | Media      | Mantener y ampliar `routePreloaders.test.ts`, `routeHandle.test.ts`, `routeVisibility.test.ts`, `menuRouteAccess.test.ts` y el test de `createLazyLoader`; no crear checklist manual paralelo salvo para una migración temporal. |
| Configuración de calidad deja zonas fuera.                                                                                                          | `tsconfig.json`, `tsconfig.typecheck.json`, `functions/tsconfig.json`, `eslint.config.js`                                                                                                                                                                                                                                                                 | `strict: false`, `allowJs`, `checkJs: false` y exclusiones reducen cobertura real de typecheck.                                           | Media      | Hacer pilotos por módulo: `checkJs` en backend nuevo, typecheck dev separado y migración gradual de Functions críticas a TS.                                                                          |
| Nombres, typos y casing mixto reducen navegabilidad.                                                                                                | `functions/src/app/modules/Inventory` y otros legacy pendientes. `src/firebase/processAccountsReceivablePayments` ya quedó normalizado desde el typo histórico.                                                                                                                                                                                           | Búsquedas fallan, imports quedan frágiles en filesystems case-sensitive y se facilita duplicar conceptos.                                 | Media      | Renombrar por lotes pequeños con pruebas focalizadas y commits de casing separados.                                                                                                                   |
| Cobertura de tests desigual por dominio.                                                                                                            | `src/modules/inventory`, `src/modules/contacts`, `src/modules/accountsReceivable`, `functions/src/app/modules/invoice`, `functions/src/app/modules/quotation`, `functions/src/app/modules/products`                                                                                                                                                       | Refactors de organización en dominios grandes no tienen red suficiente.                                                                   | Media      | Agregar primero tests de helpers/reglas puras, luego hooks críticos y después flujos monetarios de integración.                                                                                       |

## 4. Duplicaciones detectadas

### Componentes

| Archivos involucrados                                                                                                                                                                         | Qué se repite                                                                                     | Cómo se podría unificar                                                                            |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `src/components/common/Badge/*`, `src/components/ui/StatusBadge/*`                                                                                                                            | Dos familias de badges/status con tokens, variantes y estilos propios.                            | Definir un contrato único de `StatusBadge` y dejar wrappers temporales para consumidores antiguos. |
| `src/modules/contacts/components/OrderFilter/*`, `src/modules/contacts/pages/Contact/Client/components/OrderFilter/*`, `src/modules/contacts/pages/Contact/Provider/components/OrderFilter/*` | No se detectan referencias activas exactas a `OrderFilter`; los wrappers legacy fueron retirados. | Mantener eliminado; no recrear wrappers salvo nueva necesidad verificada.                          |
| `src/modules/orderAndPurchase/pages/OrderAndPurchase/shared/EvidenceUploadDrawer.tsx`, wrappers en `OrderManagement` y `PurchaseManagement`                                                   | Drawer compartido con wrappers mínimos por flujo.                                                 | Es una buena dirección; documentar como patrón y evitar crear nuevos drawers duplicados.           |
| Componentes de módulos específicos y `src/router/components/ModalManager.tsx`                                                                                                                 | Modales de crédito, producto, AR, dev tools e invoice deben vivir en su módulo dueño.             | Mantener modales dominiales en el módulo dueño y dejar `ModalManager` como orquestador.            |
| `src/components/ui/Button/Button.tsx`, `src/components/heroui` (`VmButton`) y usos AntD                                                                                                       | Botones con contratos y estilos distintos.                                                        | Definir `VmButton` como default para UI nueva; corregir foco en legacy mientras se migra.          |
| `src/components/ui/Select/Select.tsx`, `VmSelect`, selects AntD/HeroUI                                                                                                                        | Selección/listbox con comportamientos distintos.                                                  | Migrar formularios nuevos a `VmSelect`; limitar `Select` legacy a pantallas existentes.            |

### Hooks

| Archivos involucrados                                                                                                                                                                                                                                                                  | Qué se repite                                                                                                | Cómo se podría unificar                                                                           |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| `src/hooks/useBusinessFeatureEnabled.ts`, `src/hooks/useAccountingRolloutEnabled.ts`, `src/hooks/useAccountingBankPaymentPolicy.ts`                                                                                                                                                    | Hooks que leen un documento/config de Firestore con patrón `onSnapshot`, estado de loading/error y fallback. | Crear helper de listener de configuración por negocio, dejando cada hook como adapter de dominio. |
| `src/modules/accounting/hooks/useAccountingConfig.ts`, `src/modules/accounting/hooks/useChartOfAccounts.ts`, `src/modules/accounting/hooks/useAccountingPostingProfiles.ts`, `src/modules/settings/components/GeneralConfig/configs/AccountingConfig/hooks/useAccountingAuditTrail.ts` | Listeners y normalizadores de configuración contable repartidos en hooks hermanos.                           | Separar repository contable y un hook orquestador de view model para la pantalla.                 |
| `src/modules/hrPayroll/repositories/useHrCommissionEntries.ts`, `useHrCommissionPeriods.ts`, `useHrEmployees.ts`                                                                                                                                                                       | Hooks Firebase de RRHH con contratos similares de carga, normalización y estado.                             | Consolidar normalización en `src/modules/hrPayroll/repositories` y mantener hooks finos.          |
| `src/modules/inventory/pages/Inventory/components/Warehouse/forms/ProductStockForm/hooks/useGetProductsWithBatch.ts`, `src/modules/products/hooks/useProductRealtimeListener.ts`, `src/firebase/products/*`                                                                            | Lectura de productos/inventario por rutas distintas.                                                         | Crear servicios por lectura: productos base, stock, lotes y opciones de servicio.                 |
| `src/hooks/useTaxReceiptsFix.ts`, `src/firebase/taxReceipt/*`, módulos de settings fiscales                                                                                                                                                                                            | Lógica fiscal y de secuencia repartida entre hooks, Firebase y settings.                                     | Evitar mover de golpe; primero mapear rutas y extraer validadores puros con pruebas.              |

### Servicios

| Archivos involucrados                                                                                                                           | Qué se repite                                                                  | Cómo se podría unificar                                                                    |
| ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| `functions/src/app/modules/accountReceivable/functions/processAccountsReceivablePayment.js`, `src/firebase/processAccountsReceivablePayments/*` | Procesamiento de pagos CxC en backend y escrituras directas cliente.           | Centralizar mutaciones monetarias en callable backend y dejar cliente como adapter.        |
| `src/services/invoice/invoice.service.ts`, `src/firebase/invoices/*`, `functions/src/app/versions/v2/invoice/services/orchestrator.service.js`  | Servicios de factura viven en tres capas sin frontera clara.                   | Definir qué operaciones son cliente, callable y backend interno; documentar contratos.     |
| `src/firebase/warehouse/warehouseService.ts`, `warehouseStructureService.ts`, `warehouseNestedService.ts`, `stockSyncService.ts`                | Servicios de warehouse con nombres y responsabilidades parcialmente solapadas. | Separar estructura, stock, movimientos y sync por lotes controlados.                       |
| `src/firebase/permissions/dynamicPermissions.repository.ts`, `src/domain/permissions/dynamicPermissionsCatalog.ts`, `src/abilities/*`, módulos de usuarios/configuración | Permisos/roles ya separan catálogo puro y persistencia, pero CASL y pantallas de usuarios aún comparten responsabilidad de orquestación. | Completar una capa de permisos de dominio con contrato compartido para roles, permisos dinámicos y autorización UI. |
| `functions/src/index.js` y exports de módulos                                                                                                   | Registro manual repetido en entry point.                                       | Agregadores por dominio/version.                                                           |

### Utils

| Archivos involucrados                                                                                                                                                                              | Qué se repite                                                                                   | Cómo se podría unificar                                                                                                                |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `src/modules/accounting/pages/AccountingWorkspace/utils/accountingWorkspace.ts`, `src/utils/accounting/*`, `functions/src/app/versions/v2/accounting/utils/*`                                      | Proyección, formateo, balances y lógica contable existen en frontend, utils globales y backend. | Identificar lógica de presentación vs dominio. Compartir solo contratos/validadores puros, no todo el motor.                           |
| `src/utils/formatDate.ts`, `src/utils/date/dateUtils.ts`, `src/components/common/DatePicker/utils/dateUtils.ts`, `src/utils/serialization/serializeFirestoreData.ts`, `src/utils/date/toMillis.ts` | Fecha, normalización temporal y serialización Firestore repartidas.                             | Mantener serialización Firestore y conversión a millis en helpers explícitos mientras se define una capa compartida de display/rangos. |
| `src/utils/format/formatPrice.ts`, `src/utils/accounting/monetary.ts`, `src/utils/accounting/lineMonetary.ts`                                                                                      | Formato y cálculo monetario viven en varios helpers.                                            | Mantener cálculo contable en dominio contable y display monetario en helper compartido.                                                |
| `src/utils/referenceUtils.ts`, `src/utils/users/resolveUserDisplayNamesBatch.ts`, repositorios de dev                                                                                              | Lecturas Firestore utilitarias sin capa por dominio.                                            | Mover lecturas recurrentes a repositories pequeños y testeables.                                                                       |
| `src/utils/flowTrace.ts`                                                                                                                                                                           | Instrumentación muy grande y con `as any` sobre APIs globales.                                  | Dejar como herramienta dev, pero aislarla del typecheck app o tiparla por capas.                                                       |

### Tipos

| Archivos involucrados                                                                                                                                     | Qué se repite                                                                    | Cómo se podría unificar                                                                |
| --------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `src/types/accounting.ts`, `src/shared/accountingSchemas.js`, `functions/src/shared/accountingSchemas.js`, interfaces locales en `accountingWorkspace.ts` | Contratos contables de evento, schema, línea y snapshot viven en varios lugares. | Definir fuente canónica: schemas compartidos + tipos derivados o adaptadores por capa. |
| `src/models/Warehouse/*`, tipos locales en `src/firebase/warehouse/*`, tipos en módulos de inventario                                                     | Warehouse/product stock se tipa por modelos y por records locales.               | Crear modelos de dominio y DTOs Firestore separados.                                   |
| `src/types/payments.ts`, tipos locales en CxC, cuentas por pagar y nómina                                                                                 | Métodos/estados de pago aparecen en varios dominios.                             | Centralizar catálogos canónicos de método/estado y dejar labels por dominio.           |
| `src/types/hrPayroll.ts`, repositories `src/modules/hrPayroll/repositories/*`, componentes RRHH                                                           | Tipos de empleado, corte y comisión se transforman varias veces.                 | Mantener tipos públicos en `src/types/hrPayroll.ts` y mappers en repository.           |
| `functions` en JS con `checkJs: false`                                                                                                                    | Mucho backend productivo no aprovecha tipos reales.                              | Migrar Functions críticas a TS o habilitar JSDoc/checkJS por módulo.                   |

### Estilos

| Archivos involucrados                                                                                     | Qué se repite                                              | Cómo se podría unificar                                                                     |
| --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `src/variable.css`, `src/styles/theme.css`, `src/design-system/css/inject.ts` | Variables de color, radio, sombra y tipografía duplicadas. | Consolidar tokens por diseño real y retirar variables legacy cuando no tengan consumidores. |
| Componentes con `style={{ ... }}` en `src/components` y `src/modules`                                     | Hay muchos estilos inline, incluidos colores y medidas.    | Mover estilos a `.styles.ts` locales al tocar cada componente.                              |
| `ProductCardForCart.tsx`, `InvoiceSummary.tsx`, `CashCountAudit.tsx`                                      | Colores/gradientes/tokens locales en pantallas sensibles.  | Reemplazar por tokens `--ds-*` o helpers de tono por dominio.                               |
| `src/components/ui/Button/Button.tsx`, `src/components/ui/Select/Select.styles.ts`                        | Estados focus/hover definidos por componente legacy.       | Usar tokens de foco y contraste comunes.                                                    |
| `src/components/common/Badge/*`, `src/components/ui/StatusBadge/*`                                        | Mapas de tono y variantes duplicadas.                      | Unificar tokens de estado.                                                                  |

### Validaciones

| Archivos involucrados                                                                                                                                              | Qué se repite                                                                  | Cómo se podría unificar                                                                                |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `src/shared/accountingSchemas.js`, `functions/src/shared/accountingSchemas.js`                                                                                     | Schemas contables duplicados con diferencia real de Zod.                       | Prueba espejo existente `functions/src/shared/accountingSchemas.parity.test.js` y contrato compartido. |
| `functions/src/app/modules/accounting/functions/manageAccountingConfiguration.js`, `src/modules/accounting/hooks/useAccountingConfig.ts`, `src/utils/accounting/*` | Validación y normalización contable repartida entre backend, settings y utils. | Backend debe ser fuente de seguridad; frontend solo normalización/UX.                                  |
| `functions/src/app/modules/accountReceivable/*`, `src/firebase/processAccountsReceivablePayments/*`, `src/modules/accountsReceivable/*`                            | Validación de pagos, cuotas y balances distribuida.                            | Callable backend como autoridad; cliente con guards de UX.                                             |
| `src/modules/products/components/ProductEditorModal/*`, `src/firebase/products/*`, `functions/src/app/modules/products/*`                                          | Validación de producto e inventario puede vivir en UI, Firebase y backend.     | Extraer validadores puros por dominio antes de mover escrituras.                                       |
| `src/hooks/useTaxReceiptsFix.ts`, `src/firebase/taxReceipt/*`, Functions fiscales                                                                                  | Validación de secuencias fiscales y NCF en varias capas.                       | Mantener backend como fuente de integridad y usar cliente solo para advertencias.                      |

### Constantes

| Archivos involucrados                                                                                                        | Qué se repite                                                                         | Cómo se podría unificar                                                       |
| ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `src/constants/orderAndPurchaseState.ts`                                                                                     | Estados legacy y estados nuevos conviven en el mismo archivo con colores propios.     | Separar catálogos legacy/nuevos o migrar a un catálogo canónico con adapters. |
| `src/components/ui/StatusBadge/StatusBadge.tokens.ts`, badges locales de dominios, mapas de estado en RRHH/contabilidad      | Tonos/status repetidos.                                                               | Crear catálogo de tonos compartido y labels por dominio.                      |
| `src/utils/accounting/postingProfiles.ts`, `functions/src/app/modules/accounting/functions/manageAccountingConfiguration.js` | Constantes de perfiles, fuentes de monto y cuentas estructurales en frontend/backend. | Compartir contratos o documentar fuente de verdad backend.                    |
| `src/router/routes/routesName.ts`, `src/router/routes/paths/*`, menú y toolbars                                              | Nombres de rutas y metadata repetidos.                                                | Metadata única por ruta.                                                      |
| `src/abilities/roles.ts`, `src/abilities/roles/*`, permisos dinámicos                                                        | Roles, colores y reglas viven en varias capas.                                        | Separar contrato de rol, presentación visual y reglas CASL.                   |

## 5. Problemas de organización

1. `src/firebase` no es una frontera suficiente. Aunque muchas llamadas viven allí, también hay imports directos a `firebase/firestore` y `firebase/functions` desde módulos, componentes y hooks. Esto hace difícil distinguir si un archivo de pantalla es UI, hook de sincronización o servicio de datos.

2. Los modales de dominio no deben regresar a buckets compartidos. Un modal global puede tener sentido para orquestación, pero no para contener reglas de crédito, AR, producto, dev tools, invoice y warehouse.

3. `src/modules/settings` es demasiado amplio. Incluye configuración general, usuarios, fiscal, contable, suscripciones y componentes de alto detalle. La carpeta es clara como ruta de producto, pero confusa como frontera de dominio.

4. `functions/src` tiene tres ejes activos: `app/modules`, `app/versions/v1` y `app/versions/v2`. Esa convivencia puede ser válida, pero `functions/src/index.js` no debería ser el lugar donde se entienda todo el mapa.

5. Los contratos compartidos no tienen una única fuente de verdad. El caso más claro es contabilidad: `src/shared/accountingSchemas.js` y `functions/src/shared/accountingSchemas.js` están duplicados y ya divergen.

6. La navegación está repartida. Rutas, nombres, preloaders, toolbars y menú viven en archivos distintos. Esto no es grave por sí solo, pero aumenta el costo de cada ruta nueva.

7. Nombres con typos y casing mixto reducen confianza. En esta tanda se normalizó `processAccountsReceivablePayments`; quedan pendientes casos legacy como `functions/src/app/modules/Inventory`.

8. Hay artefactos históricos en raíz. `diagnostico-functions-firestore.md` y `STATE-fiscal-compliance.md` parecen documentación valiosa, pero mezclan historia con configuración raíz.

## 6. Oportunidades de centralización

1. Repositories/services por dominio para acceso a datos: empezar por lecturas de bajo riesgo en inventario, contacts o dev/admin antes de tocar facturación, caja, fiscal o pagos.

2. Contratos compartidos contables: mantener la prueba espejo existente `functions/src/shared/accountingSchemas.parity.test.js` como gate y crear una fuente canónica para schemas antes de mover lógica.

3. Backend como autoridad para mutaciones monetarias: CxC, caja, pagos, contabilidad y fiscal deben preferir callable/Functions con validación fuerte.

4. Hooks de configuración Firestore: un helper común para `onSnapshot` de documentos de negocio reduciría repetición en feature flags y settings.

5. Tokens visuales y estados: unificar tonos de badges, focus ring, colores semánticos, spacing y radii.

6. Primitivos UI modernos: `VmButton`, `VmSelect`, `VmModal`, `VmForm`, `VmAlert` deberían ser default para UI nueva.

7. Metadata de rutas: una fuente única para nombre, path, preload, toolbar y menú reduciría cambios manuales.

8. Fecha y dinero: separar claramente display, serialización Firestore y cálculo contable.

9. Tipos de pago y estado: centralizar catálogos canónicos y dejar labels específicos por dominio.

10. Testing de helpers puros: antes de grandes movimientos, cubrir normalizadores de contabilidad, CxC, inventario, RRHH y fiscal.

## 7. Componentes que deberían refactorizarse

| Componente/archivo                                                                                                                    | Motivo                                                                                        | Refactor recomendado                                                                                  |
| ------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `src/modules/accounting/pages/AccountingWorkspace/components/FiscalCompliancePanel.tsx`                                               | Concentra helpers DGII, estado, previews 606/607/608, tablas, modales y styled-components.    | Extraer `utils`, `hooks/useFiscalCompliancePanelViewModel`, previews por reporte y modal de corridas. |
| `src/modules/accounting/pages/AccountingWorkspace/utils/accountingWorkspace.ts`                                                       | Archivo de utilidad muy grande con tipos, proyección, balances, formateo y build de reportes. | Separar en `domain/projection`, `domain/reports`, `formatters` y `types`; testear cada unidad.        |
| `src/modules/sales/pages/Sale/components/Cart/components/InvoiceSummary/InvoiceSummary.tsx`                                           | Mezcla Redux, URL params, PIN, preventa, cotización, caja, moneda, impresión y estilos.       | Extraer view model y subhooks por responsabilidad.                                                    |
| `src/modules/sales/pages/Sale/components/Cart/components/ProductCardForCart/ProductCardForCart.tsx`                                   | Mezcla pricing, lote, seguro, comisión, acciones y estilos.                                   | Extraer hooks de pricing/lote, subcomponentes interactivos accesibles y estilos locales.              |
| `src/components/ui/Button/Button.tsx`                                                                                                 | Legacy button elimina foco visible y define comportamiento global delicado.                   | Restaurar `:focus-visible`, revisar botones icon-only y migrar usos nuevos a `VmButton`.              |
| `src/components/ui/Select/Select.tsx`                                                                                                 | Listbox manual incompleto y required visual.                                                  | Reemplazar por `VmSelect` o implementar patrón completo con teclado y labels.                         |
| `src/modules/contacts/pages/Contact/Client/components/ClientForm/components/AppModal/AppModal.tsx` + `src/hooks/useModalFocusTrap.ts` | Modal/focus trap custom local del formulario de cliente sin frontera clara de inert.          | Converger a `VmModal`/HeroUI cuando se vuelva a tocar este formulario.                                |
| `src/modules/dev/components/DeveloperConsoleModal/components/CommandProcessor/handlers/executeCommand.ts`                             | Handler muy grande en un modal shared/dev.                                                    | Dividir comandos por módulo y mover operaciones a services dev.                                       |
| `src/modules/accounting/hooks/useAccountingConfig.ts`                                                                                 | Hook grande con acceso a datos y normalización contable.                                      | Separar repository, mappers, actions y view model.                                                    |
| `src/modules/treasury/hooks/useTreasuryWorkspace.ts`                                                                                  | Hook grande para dominio financiero sensible.                                                 | Extraer helpers puros y tests antes de mover lógica.                                                  |
| `src/modules/dev/pages/DevTools/CashCountAudit/CashCountAudit.tsx`                                                                    | Pantalla dev grande con auditoría, presentación y estilos.                                    | Separar data access, export/formatters y paneles visuales.                                            |
| `functions/src/app/modules/accounting/functions/manageAccountingConfiguration.js`                                                     | Function grande con normalización, validaciones, carga y mutación.                            | Separar validators, builders, repositories y handlers de acción.                                      |
| `functions/src/app/modules/accountReceivable/functions/processAccountsReceivablePayment.js`                                           | Flujo monetario crítico y extenso.                                                            | Mantener backend como fuente; extraer validadores/builders con pruebas de caracterización.            |

## 8. Propuesta de estructura mejorada

La propuesta evita una reestructuración exagerada. La idea es reforzar fronteras sin romper rutas públicas ni mover dominios sensibles de una vez.

```text
src/
  app/
    store.ts
    middleware/
  components/
    heroui/              # Vm* como UI nueva por defecto
    ui-legacy/           # wrappers legacy cuando se migren gradualmente
    common/              # shared UI realmente transversal
  domain/
    accountsReceivable/  # contratos neutrales puros entre owners
    cashCount/
    products/
  modules/
    accounting/
      components/
      hooks/
      repositories/
      domain/
      utils/
      types/
      public.ts          # contrato publico acotado del owner
    sales/
      components/
      hooks/
      repositories/
      domain/
      utils/
    hrPayroll/
      components/
      hooks/
      repositories/
      utils/
      types/
    inventory/
      components/
      hooks/
      repositories/
      domain/
      utils/
    settings/
      accounting/
      fiscal/
      subscription/
      users/
      shared/
  shared/
    accounting/
      schemas/
      types/
    firebase/
      listenDocument.ts
    date/
    money/
    payments/
    phone/
    ui/
      tokens/
  firebase/
    functions/
      callable.ts        # createFirebaseCallable / createFirebaseCallableFor
  router/
    metadata/
    routes/
    utils/
```

```text
functions/src/
  app/
    modules/
      accounting/
        functions/
        services/
        repositories/
        validators/
        utils/
        schemas/
      accountReceivable/
        functions/
        services/
        validators/
        utils/
      invoice/
      hrPayroll/
      inventory/
    exports/
      accounting.exports.js
      accountReceivable.exports.js
      invoice.exports.js
  shared/
    schemas/
    money/
    firebase/
  index.js              # solo compone exports
```

Principios para aplicar esta estructura:

- No mover fiscal, caja, pagos, facturación ni NCF sin pruebas de caracterización.
- No crear helpers globales genéricos si el dominio es claro.
- Preferir carpetas locales `components`, `hooks`, `utils`, `repositories` dentro del módulo dueño.
- Usar `src/domain/<dominio>` solo para contratos neutrales y puros que cruzan owners; si el consumidor necesita algo de otro módulo, exponer el mínimo desde `src/modules/<dominio>/public.ts`.
- Mantener wrappers nuevos de Cloud Functions sobre `src/firebase/functions/callable.ts`; no reintroducir imports directos a `httpsCallable`.
- Mantener wrappers temporales cuando reduzcan riesgo de migración.
- Separar renames de casing/typos en cambios pequeños para evitar problemas en Windows/Git.

## 9. Plan de refactorización por fases

### Fase 1: Cambios seguros

1. Mantener `npm run test:run:architecture` como gate estructural para rutas, barrels públicos, boundaries de módulos y wrappers callable.
2. Documentar regla UI: `Vm/HeroUI` para UI nueva; AntD/custom solo legacy.
3. Restaurar foco visible en `src/components/ui/Button/Button.tsx` con token de diseño.
4. Auditar usos críticos de `src/components/ui/Select/Select.tsx` y bloquear usos nuevos.
5. Mantener y ampliar la prueba espejo existente `functions/src/shared/accountingSchemas.parity.test.js` para `src/shared/accountingSchemas.js` y `functions/src/shared/accountingSchemas.js`.
6. Archivar docs históricos raíz en `docs/archive/` cuando el equipo lo apruebe.
7. Crear inventario de imports directos a Firebase desde `src/modules` y `src/components`.
8. Añadir tests de helpers puros en módulos grandes antes de extraer archivos.
9. Renombrar typos de bajo riesgo en un lote pequeño, con imports actualizados.
10. Confirmar `.gitignore` para logs temporales `tmp-vite-preview*.log`.

### Fase 2: Centralización

1. Crear repositories por dominio para lecturas Firestore simples.
2. Mover hooks de configuración repetidos a un helper común de listener.
3. Centralizar schemas contables o generar tipos desde una fuente compartida.
4. Definir backend callable como ruta canónica para pagos CxC.
5. Unificar tokens de `StatusBadge`, badges comunes y estados visuales.
6. Separar `InvoiceSummary` y `ProductCardForCart` en view models, subhooks y subcomponentes.
7. Separar `FiscalCompliancePanel` en previews, modal, helpers y view model.
8. Mantener `functions/src/index.js` como superficie autoritativa de exports deployables; si se extraen agregadores por dominio, deben ser módulos internos importados desde ese index, no una superficie paralela.
9. Consolidar fecha/dinero en helpers compartidos con adapters por dominio.
10. Ampliar los guardrails de rutas/preloaders cuando aparezcan nuevas superficies de menú, toolbar o metadata; evitar checklists manuales paralelos.

### Fase 3: Refactor más profundo

1. Migrar mutaciones monetarias restantes del cliente a backend con pruebas de integración.
2. Migrar Functions críticas de JS a TS o habilitar `checkJs` por módulo.
3. Reducir `src/app/store.ts` con organización por dominio y revisar `serializableCheck`.
4. Reorganizar `settings` en subdominios internos sin cambiar rutas públicas.
5. Mantener modales dominiales fuera de buckets compartidos.
6. Dividir motores contables frontend/backend en unidades testeables, sin compartir lógica que deba diferir por capa.
7. Adoptar metadata única para rutas, menú, preloaders y toolbars.
8. Migrar legacy `Button`, `Select`, `AppModal`, `Menu` a `Vm*` cuando las pantallas se toquen.
9. Elevar cobertura de tests por dominio grande: inventario, contacts, CxC, invoice y warehouse.
10. Normalizar casing de carpetas sensibles en cambios separados y verificados en CI/Linux.

## 10. Prioridades recomendadas

1. Alinear `src/shared/accountingSchemas.js` y `functions/src/shared/accountingSchemas.js` usando la prueba espejo existente `functions/src/shared/accountingSchemas.parity.test.js`.
2. Mapear y cerrar la doble ruta de pagos CxC entre cliente y callable backend.
3. Restaurar foco visible en `src/components/ui/Button/Button.tsx` y bloquear nuevos usos del `Select` legacy.
4. Crear inventario de imports directos a Firebase y mover lecturas simples a repositories por dominio.
5. Dividir `FiscalCompliancePanel.tsx` en helpers, previews y view model.
6. Dividir `InvoiceSummary.tsx` y `ProductCardForCart.tsx` por responsabilidades de checkout.
7. Reducir `functions/src/index.js` con agregadores por dominio/version.
8. Mantener la suite `npm run test:run:architecture` verde y ampliar sus casos cuando cambien rutas, menú, preloaders, barrels públicos o callable wrappers.
9. Consolidar tokens de badges/status/focus y sustituir colores hardcodeados en superficies críticas.
10. Planificar renames de typos/casing en lotes pequeños con pruebas focalizadas.
