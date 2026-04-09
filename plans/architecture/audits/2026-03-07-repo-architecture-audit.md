# Auditoría técnica del repositorio

- Fecha propuesta: 2026-03-07
- Estado: Auditoría base para priorización arquitectónica

## 1. Resumen ejecutivo
El repositorio muestra una base funcional amplia y activa, con una combinación de React, TypeScript, Vite, Redux Toolkit, Firebase, Ant Design y `styled-components`. La impresión general no es la de una base "rota", pero sí la de una arquitectura con varios modelos organizativos coexistiendo y con fricción creciente para cambios transversales.

Los problemas mejor respaldados por la evidencia del repositorio son:

- **Fragmentación de capas por dominio**: `src/` tiene **31 carpetas raíz** y conviven al menos `modules`, `features`, `domain`, `services`, `firebase`, `utils`, `types`, `models` y `helper`. En el dominio `invoice` hay código repartido en `src/modules/invoice` (**96 archivos**), `src/features/invoice` (**4 archivos**), `src/firebase/invoices` (**21 archivos**), `src/services/invoice` (**6 archivos**) y `src/types/invoice.ts`.
- **Store global amplio y mixto**: `src/app/store.ts` registra **57 reducers**. Un recuento por nombre detecta al menos **17 reducers** con perfil principalmente visual o de modal (`modal`, `imageViewer`, `warehouseModal`, `shelfModal`, `segmentModal`, `barcodePrintModal`, `theme`, `notification`, entre otros).
- **Acoplamiento directo con Firebase en la capa de UI y hooks**: hay **288 archivos fuera de `src/firebase/`** que importan módulos de Firebase directamente. Ejemplos: `src/modules/utility/pages/Utility/hooks/useUtilityDashboard.ts`, `src/hooks/usePurchases.tsx`, `src/components/ui/Product/Product/hooks/useProductHandling.tsx`, `src/services/invoice/invoice.service.ts`.
- **Deuda de tipado concentrada en slices y flujos críticos**: en `src/` hay **615 ocurrencias de `any`** distribuidas en **169 archivos**. Los mayores focos dentro de `src/features/` son `cashCountManagementSlice.ts` (23), `updateProductSlice.ts` (17), `addPurchaseSlice.ts` (16), `productExpirySelectionSlice.ts` (15) y `accountsReceivableSlice.ts` (11).
- **Convenciones de UI y estilos mezcladas**: el código usa `styled-components` en **812 archivos**, Ant Design en **592 archivos** y además conserva **17 archivos `.scss`**. Ejemplos representativos: `src/components/modals/Modal.tsx` usa `styled-components`, `src/modules/settings/pages/setting/subPage/TaxReceipts/components/TableTaxReceipt/TableTaxReceipt.tsx` usa Ant Design y `src/components/common/Account/Account.tsx` importa `Account.module.scss`.

Conclusión operativa: el repositorio sigue siendo extensible, pero hoy el costo de cambios transversales ya es más alto de lo deseable para un equipo que siga agregando dominios, pantallas y flujos de negocio. La prioridad no parece ser una reescritura completa, sino reducir puntos de coordinación global, fijar reglas de ubicación para nuevo código y ejecutar uno o dos refactors piloto con alcance controlado.

---

## 2. Scorecard general

**Nota metodológica:** los puntajes son una lectura cualitativa basada en evidencia observable del repositorio.  
Escala usada:
- `1-3`: problema estructural serio o transversal
- `4-5`: funcional, pero con fricción importante
- `6-7`: aceptable con deuda controlable
- `8-10`: sólido y consistente

| Categoría | Puntuación (1-10) | Comentarios |
| :--- | :---: | :--- |
| Estructura del repo | 4 | Hay 31 carpetas raíz en `src/` y coexisten varios esquemas de organización (`modules`, `features`, `domain`, `services`, `firebase`, `utils`). |
| Claridad arquitectónica | 4 | Se distinguen intenciones de separación, pero varios dominios siguen repartidos en capas paralelas. `invoice` es el caso más visible. |
| Separación de responsabilidades | 5 | Existen hooks y servicios dedicados, pero varias pantallas siguen coordinando estado, datos e infraestructura en el mismo flujo. |
| Consistencia | 4 | Mezcla real de convenciones de nombres, exports, estilos y placement de código. |
| Mantenibilidad | 4 | La mantenibilidad se resiente sobre todo en cambios transversales: store amplio, imports directos a Firebase y raíces superpuestas. |
| Reutilización | 6 | Hay esfuerzo reusable importante (`components/ui`, `components/common`, hooks, utilidades), aunque parte de esa reutilización está fragmentada. |
| Tipado (TypeScript) | 4 | El proyecto usa TypeScript de forma amplia, pero aún quedan muchas zonas con `any` explícito en slices, selectores y estructuras críticas. |
| Manejo del estado | 4 | Redux Toolkit está presente y ordenado a nivel técnico, pero el store mezcla negocio con UI global y modales. |
| Performance estructural | 5 | No hay una medición de performance en esta auditoría. Lo observable es complejidad de coordinación: 708 ocurrencias de `useEffect` en 291 archivos y varios flujos dependientes de sincronización entre capas. |
| Testabilidad | 4 | Solo se detectaron 12 archivos de test en `src/`, con más presencia en utilidades que en flujos de UI/negocio. |
| Accesibilidad estructural | 5 | Ant Design ayuda en parte de la base, pero la coexistencia de múltiples capas de UI dificulta asumir un estándar uniforme. |
| Preparación para escalar | 4 | La base puede seguir creciendo, pero el costo marginal de cambio ya es alto en dominios centrales como ventas, facturación e inventario. |

---

## 3. Hallazgos críticos

### 3.1. Fragmentación de un dominio central en múltiples raíces (`invoice`)
- **Observación**  
  El dominio de facturación no está concentrado en una única frontera arquitectónica. La UI, el estado, el acceso a datos, los servicios y los tipos viven en raíces separadas.
- **Evidencia**  
  - `src/modules/invoice`: **96 archivos**
  - `src/features/invoice`: **4 archivos**
  - `src/firebase/invoices`: **21 archivos**
  - `src/services/invoice`: **6 archivos**
  - `src/types/invoice.ts`
  - `src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/hooks/useInvoicePanelController.ts` combina selectores Redux, `useInvoice` desde `src/services/invoice/useInvoice.ts`, tipos de `src/types/invoice.ts` y lógica adicional de UI.
- **Por qué importa**  
  Cuando un dominio central queda repartido en capas físicas distintas, el costo de localizar impactos, revisar ownership y hacer cambios coherentes sube de forma no lineal. Esto no implica que cada cambio vaya a fallar, pero sí aumenta el trabajo de coordinación por cambio.
- **Alcance / extensión**  
  Transversal a ventas, facturación, notas de crédito, plantillas de impresión y parte del flujo de cuentas por cobrar.
- **Severidad**  
  Crítica.
- **Opciones de mejora**  
  1. Mantener la estructura actual y documentar una ruta canónica por dominio para código nuevo.  
  2. Hacer un piloto de "vertical slice" solo para `invoice`, dejando el resto del repo intacto.  
  3. Migrar gradualmente a una estructura por dominios o slices más verticales.
- **Recomendación final**  
  Hacer un piloto sobre `invoice` antes de imponer una reorganización completa del repo. La evidencia sí justifica unificar este dominio; no justifica todavía mover todo el repositorio a FSD o DDD en un solo esfuerzo.
- **Dependencias**  
  Acordar contratos mínimos de datos y ownership por capa en `invoice`.
- **Tipo de iniciativa**  
  Refactor grande.
- **Esfuerzo estimado**  
  Alto.
- **Prioridad**  
  1.

### 3.2. Store global amplio con mezcla de estado de negocio y estado UI
- **Observación**  
  El store central registra 57 reducers y mezcla slices de negocio con slices que parecen responder a preocupaciones de modal, visualización o configuración de UI.
- **Evidencia**  
  - `src/app/store.ts`: **57 claves** en `reducer`.
  - Reducers con perfil principalmente visual o modal detectados por nombre: **17**. Ejemplos: `modal`, `theme`, `notification`, `notificationCenter`, `userNotification`, `imageViewer`, `uploadImg`, `creditNoteModal`, `warehouseModal`, `shelfModal`, `rowShelfModal`, `segmentModal`, `barcodePrintModal`, `insuranceConfigModal`.
  - Slices de UI con tipado débil:
    - `src/features/theme/themeSlice.ts`
    - `src/features/warehouse/warehouseModalSlice.ts`
    - `src/features/productWeightEntryModalSlice/productWeightEntryModalSlice.ts`
    - `src/features/barcodePrintModalSlice/barcodePrintModalSlice.ts`
  - Ejemplo de alternativa local ya presente:
    - `src/components/modals/Modal.tsx` usa `useState`, `useRef` y `useEffect` locales.
    - `src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/hooks/useInvoicePanelController.ts` usa `useReducer` local para parte del estado UI del panel.
- **Por qué importa**  
  Un store global amplio no es un problema por sí mismo. El problema aparece cuando se convierte en punto de coordinación de demasiadas preocupaciones no relacionadas. Eso aumenta superficie de debugging, dependencia entre equipos/feature owners y ruido semántico en Redux DevTools.
- **Alcance / extensión**  
  Transversal a navegación, notificaciones, modales, warehouse, impresión, seguros y partes de ventas.
- **Severidad**  
  Crítica.
- **Opciones de mejora**  
  1. Mantener Redux para UI transversal real y sacar solo modales/estado efímero local.  
  2. Agrupar modales por contexto con providers locales.  
  3. Adoptar otra herramienta para UI state, pero solo si hay una convención clara.
- **Recomendación final**  
  Reducir el alcance de Redux para UI efímera empezando por el clúster de modales y viewers. No hay suficiente evidencia en esta auditoría para recomendar eliminar Redux del negocio.
- **Dependencias**  
  Inventariar qué slices son realmente globales y cuáles solo viven en una pantalla o flujo.
- **Tipo de iniciativa**  
  Refactor grande, ejecutable por etapas.
- **Esfuerzo estimado**  
  Medio-alto.
- **Prioridad**  
  2.

---

## 4. Hallazgos importantes por categoría

### 4.1. Arquitectura y límites: acceso directo a Firebase desde muchas capas
- **Observación**  
  El acceso a Firebase no está encapsulado de forma consistente. Hooks, componentes, módulos y servicios importan directamente desde `src/firebase/`.
- **Evidencia**  
  - **288 archivos fuera de `src/firebase/`** importan módulos de Firebase.
  - Ejemplos:
    - `src/hooks/usePurchases.tsx`
    - `src/hooks/useProductStockData.ts`
    - `src/hooks/useOrders.tsx`
    - `src/modules/utility/pages/Utility/hooks/useUtilityDashboard.ts`
    - `src/components/ui/Product/Product/hooks/useProductHandling.tsx`
    - `src/services/invoice/invoice.service.ts`
  - `src/firebase/` tiene **40 carpetas de primer nivel**, entre ellas `accountsReceivable`, `cashCount`, `client`, `invoices`, `products`, `purchase`, `warehouse`, `taxReceipt`, además de nombres mixtos como `Auth`, `Settings`, `ProductOutflow`, `Tools`.
- **Por qué importa**  
  El problema principal no es "usar Firebase", sino cuántos puntos del sistema conocen directamente su detalle. Eso complica pruebas, cambios de contratos y normalización de errores.
- **Alcance / extensión**  
  Transversal. Más visible en compras, productos, facturación, utilidades y hooks compartidos.
- **Severidad**  
  Alta.
- **Opciones de mejora**  
  1. Definir una política de "nuevo código" para que acceda a datos vía hooks/servicios de dominio.  
  2. Crear una capa de acceso por dominio solo en flujos prioritarios.  
  3. Centralizar lecturas críticas con contratos explícitos antes de tocar escrituras.
- **Recomendación final**  
  Introducir una frontera de acceso a datos por dominio en los flujos nuevos y usar `invoice` o `products` como piloto. La evidencia justifica reducir el número de importadores directos; no obliga todavía a un patrón de repositorio formal en todo el repo.
- **Dependencias**  
  Definir contratos mínimos de entrada/salida para uno o dos dominios piloto.
- **Tipo de iniciativa**  
  Refactor estructural.
- **Esfuerzo estimado**  
  Medio-alto.
- **Prioridad**  
  3.

### 4.2. TypeScript: deuda real, pero heterogénea
- **Observación**  
  Hay deuda de tipado observable, especialmente en slices, selectores y estructuras de estado. El dato de `unknown` requiere más matiz: no toda aparición de `unknown` es problema; el uso explícito de `any` sí es un indicador más fuerte.
- **Evidencia**  
  - `src/` contiene **615 ocurrencias de `any`** en **169 archivos**.
  - `src/` contiene **1996 ocurrencias de `unknown`** en **607 archivos**.
  - Concentración de `any` dentro de `src/features/`:
    - `src/features/cashCount/cashCountManagementSlice.ts`: **23**
    - `src/features/updateProduct/updateProductSlice.ts`: **17**
    - `src/features/purchase/addPurchaseSlice.ts`: **16**
    - `src/features/warehouse/productExpirySelectionSlice.ts`: **15**
    - `src/features/accountsReceivable/accountsReceivableSlice.ts`: **11**
  - Ejemplos concretos:
    - `src/features/usersManagement/usersManagementSlice.ts`
    - `src/features/theme/themeSlice.ts`
    - `src/features/barcodePrintModalSlice/barcodePrintModalSlice.ts`
    - `src/features/warehouse/warehouseModalSlice.ts`
    - `src/features/accountsReceivable/accountsReceivableSlice.ts`
- **Por qué importa**  
  Tipos débiles en reducers y selectores reducen la capacidad de refactorizar con seguridad y tienden a propagar castings hacia UI y servicios.
- **Alcance / extensión**  
  Alto en Redux y en algunos servicios. Menos homogéneo en utilidades y hooks.
- **Severidad**  
  Alta.
- **Opciones de mejora**  
  1. Atacar primero slices y selectores que ya están en el store.  
  2. Crear tipos de payload explícitos para acciones frecuentes.  
  3. Luego extender la limpieza a contratos de datos que entran desde Firebase.
- **Recomendación final**  
  Priorizar `any` en slices conectados al store antes de abrir un programa general de tipado. Eso genera mejor retorno que una limpieza indiscriminada de `unknown`.
- **Dependencias**  
  Alinear formas de estado inicial y payloads esperados.
- **Tipo de iniciativa**  
  Quick win técnico con continuación posterior.
- **Esfuerzo estimado**  
  Bajo-medio.
- **Prioridad**  
  1.

### 4.3. Consistencia visual y de estilo: coexistencia de tres enfoques
- **Observación**  
  El repositorio usa al mismo tiempo `styled-components`, Ant Design y SCSS modules.
- **Evidencia**  
  - `styled-components`: **812 archivos**
  - Ant Design: **592 archivos**
  - `.scss`: **17 archivos**
  - Ejemplos:
    - `src/components/modals/Modal.tsx` usa `styled-components`
    - `src/modules/settings/pages/setting/subPage/TaxReceipts/components/TableTaxReceipt/TableTaxReceipt.tsx` usa `antd`
    - `src/components/common/Account/Account.tsx` importa `./Account.module.scss`
    - `src/components/ui/Counter/Counter.tsx` usa `styled-components`
- **Por qué importa**  
  La mezcla de stacks no es necesariamente un bug, pero sí encarece el mantenimiento de tokens visuales, theming y criterios de ownership.
- **Alcance / extensión**  
  Transversal a componentes compartidos, modales, settings y pantallas legacy.
- **Severidad**  
  Media-alta.
- **Opciones de mejora**  
  1. Aceptar la coexistencia actual y definir criterios de uso por caso.  
  2. Congelar SCSS para código nuevo y migrarlo solo cuando se toque.  
  3. Estandarizar wrappers sobre Ant Design donde haya más repetición.
- **Recomendación final**  
  No recomendaría una migración inmediata "todo a un solo stack". Sí recomiendo fijar reglas para nuevo código y reducir gradualmente las islas SCSS y los patrones no estandarizados.
- **Dependencias**  
  Definir tokens visuales y ownership de la capa compartida.
- **Tipo de iniciativa**  
  Mejora gradual.
- **Esfuerzo estimado**  
  Medio.
- **Prioridad**  
  5.

### 4.4. Organización del repo: múltiples raíces con intención parcialmente solapada
- **Observación**  
  La estructura de `src/` muestra varias raíces con intención similar o parcialmente superpuesta.
- **Evidencia**  
  - **31 carpetas raíz** en `src/`.
  - Raíces relevantes: `components`, `features`, `modules`, `domain`, `services`, `firebase`, `utils`, `types`, `models`, `helper`.
  - `src/domain/` existe, pero hoy contiene solo **6 carpetas** y **7 archivos**:
    - `src/domain/accountsReceivable`
    - `src/domain/cashCount`
    - `src/domain/devtools`
    - `src/domain/inventory`
    - `src/domain/products`
    - `src/domain/warehouse`
  - `src/helper/` contiene solo `styleHelper.ts`.
- **Por qué importa**  
  Esto no prueba un problema funcional inmediato, pero sí indica una migración arquitectónica inconclusa o al menos una ausencia de regla fuerte para placement.
- **Alcance / extensión**  
  Global.
- **Severidad**  
  Alta.
- **Opciones de mejora**  
  1. Mantener la estructura y documentar reglas estrictas de placement.  
  2. Congelar nuevas raíces y usar una sola convención para código nuevo.  
  3. Ejecutar migraciones verticales por dominio cuando haya ROI claro.
- **Recomendación final**  
  Congelar el crecimiento de raíces top-level y tomar una decisión explícita sobre el papel de `domain` antes de seguir creando nuevas carpetas conceptuales.
- **Dependencias**  
  Acuerdo de equipo sobre estructura objetivo mínima.
- **Tipo de iniciativa**  
  Quick win de gobernanza + refactor gradual.
- **Esfuerzo estimado**  
  Bajo para la regla; alto para la migración posterior.
- **Prioridad**  
  2.

### 4.5. Testing y testabilidad: presencia útil, cobertura todavía limitada
- **Observación**  
  Sí hay tests, pero la huella es pequeña para el tamaño del repo y está concentrada en utilidades y algunos flujos puntuales.
- **Evidencia**  
  Se detectaron **12 archivos de test** en `src/`, entre ellos:
  - `src/utils/barcode.test.ts`
  - `src/utils/invoice.test.ts`
  - `src/utils/date/toMillis.test.ts`
  - `src/hooks/useRncSearch.test.ts`
  - `src/firebase/cashCount/closing/fbCashCountClosed.test.ts`
  - `src/modules/checkout/pages/AzulCheckoutRedirect/AzulCheckoutRedirect.test.tsx`
  - `src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/components/Body/components/ReceivableManagementPanel/ReceivableManagementPanel.test.tsx`
- **Por qué importa**  
  Un número bajo de tests no demuestra por sí solo mala calidad. Sí sugiere que varios refactors arquitectónicos deberán apoyarse más en QA manual o en pruebas específicas de regresión.
- **Alcance / extensión**  
  Global, con más vacío aparente en flujos complejos de integración.
- **Severidad**  
  Media-alta.
- **Opciones de mejora**  
  1. Añadir pruebas a utilidades críticas y a refactors piloto.  
  2. Cubrir primero los seams que se vayan creando (datos, mapeos, reducers).  
  3. No intentar cobertura amplia antes de reducir acoplamiento.
- **Recomendación final**  
  Acompañar los refactors prioritarios con pruebas dirigidas, en vez de abrir un programa de testing genérico sin foco.
- **Dependencias**  
  Definir qué refactors sí requieren red de seguridad automatizada.
- **Tipo de iniciativa**  
  Soporte a refactor.
- **Esfuerzo estimado**  
  Medio.
- **Prioridad**  
  4.

### 4.6. React y efectos: la cifra es alta, la interpretación debe ser prudente
- **Observación**  
  El repositorio tiene muchas ocurrencias de `useEffect`, pero el conteo bruto no basta para concluir un problema de diseño por sí solo.
- **Evidencia**  
  - `useEffect`: **708 ocurrencias** en **291 archivos**.
  - Archivos con mayor frecuencia observada:
    - `src/components/ui/loader/GenericLoader.tsx` (7)
    - `src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/components/Body/components/InsuranceManagementPanel/InsuranceManagementPanel.tsx` (6)
    - `src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/components/Body/components/PaymentMethods/PaymentMethods.tsx` (6)
    - `src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/components/Body/components/ReceivableManagementPanel/ReceivableManagementPanel.tsx` (6)
    - `src/firebase/products/fbGetProducts.ts` (4)
  - Ejemplos de coordinación compleja:
    - `src/modules/sales/pages/Sale/Sale.tsx`
    - `src/hooks/usePurchases.tsx`
    - `src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/hooks/useInvoicePanelController.ts`
- **Por qué importa**  
  La señal útil aquí no es la cantidad aislada, sino que varios flujos importantes aún coordinan sincronización de datos, UI y side effects al mismo tiempo.
- **Alcance / extensión**  
  Relevante en ventas, hooks legacy y algunos servicios/herramientas de datos.
- **Severidad**  
  Media.
- **Opciones de mejora**  
  1. No perseguir la cifra global.  
  2. Atacar primero efectos de sincronización derivada en flujos calientes.  
  3. Usar la regla `react-hooks/set-state-in-effect` como criterio preventivo para nuevo código.
- **Recomendación final**  
  Tratar este hallazgo como señal de complejidad localizada, no como argumento para una campaña global contra `useEffect`.
- **Dependencias**  
  Identificar flujos críticos con mayor frecuencia de regresiones.
- **Tipo de iniciativa**  
  Higiene técnica focalizada.
- **Esfuerzo estimado**  
  Medio.
- **Prioridad**  
  6.

---

## 5. Redundancias detectadas

Las redundancias observadas no son todas equivalentes. En algunos casos parecen duplicidad funcional; en otros, naming ambiguo u ownership poco claro.

| Grupo | Evidencia | Lectura técnica | Acción sugerida |
| :--- | :--- | :--- | :--- |
| Componentes con mismo nombre y distinta responsabilidad | `src/components/common/FileUploader/FileList.tsx`, `src/components/common/EvidenceUpload/FileList.tsx`, `src/components/modals/FileListModal/FileList.tsx` | No implica duplicación exacta, pero sí búsqueda y ownership ambiguos. | Normalizar naming por contexto (`UploadFileList`, `EvidenceFileList`, `PreviewFileGrid`) o documentar propósito. |
| DatePicker en múltiples ubicaciones | `src/components/DatePicker.tsx`, `src/components/common/DatePicker/DatePicker.tsx`, `src/components/ui/Dates/DatePicker/DatePicker.tsx` | Señal de evolución paralela de componentes base. | Elegir un DatePicker canónico para nuevo código y marcar los demás como legacy o adaptadores. |
| FilterBar como patrón repetido | `src/components/common/FilterBar/FilterBar.tsx`, `src/components/common/FilterBarLegacy/FilterBar.tsx`, `src/modules/invoice/pages/InvoicesPage/components/FilterBar/FilterBar.tsx`, además de otros `FilterBar.tsx` en compras, caja y clientes | Parte es especialización válida, parte es naming repetido que complica descubrir la pieza reusable. | Distinguir explícitamente entre `BaseFilterBar`, `LegacyFilterBar` y filtros de dominio. |
| Utilidades solapadas | `src/utils/object/compareObject.ts` y `src/utils/object/compareObjects.ts`; `src/utils/ensureArray.ts` y `src/utils/array/ensureArray.ts` | Aquí sí hay solapamiento claro de propósito, aunque no implementación idéntica. | Inventariar cuál versión es la preferida y deprecar la otra. |
| Plantillas de invoice/quotation en rutas paralelas | `src/modules/invoice/components/.../templates/...` y `src/pdf/invoicesAndQuotation/...` | La coexistencia puede ser legítima si sirven a renderizados distintos, pero hoy introduce dudas sobre cuál es la fuente de verdad para impresión/documentos. | Documentar qué carpeta es UI preview y cuál es output PDF, o consolidar si ambas hacen lo mismo. |

---

## 6. Inconsistencias detectadas

### Convenciones de nombres y carpetas
- `src/` mezcla nombres en minúscula y PascalCase al nivel raíz: `Context`, `Seo`, `components`, `features`, `modules`.
- `src/firebase/` también mezcla estilos: `Auth`, `Settings`, `Tools`, `ProductOutflow`, junto con `accountsReceivable`, `cashCount`, `client`, `products`.
- `src/domain/` usa singular (`domain`) mientras el resto tiende a plural (`modules`, `features`, `services`, `types`).

### Convenciones de exportación
- Se detectan **576** `export default` y **2605** `export const` en `src/`.
- Ejemplos mezclados:
  - `src/components/common/Account/Account.tsx` exporta nombrado (`export const Account`)
  - `src/features/theme/themeSlice.ts` exporta reducer por defecto
  - `src/services/invoice/useInvoice.ts` exporta `default function useInvoice()`
- Esto no es un bug en sí, pero sí una inconsistencia de convención relevante para discoverability y refactors masivos.

### Convenciones de ownership
- `components/ui` (**121 archivos**) y `components/common` (**70 archivos**) conviven como catálogos compartidos sin una frontera obvia en el nombre.
- `helper` contiene un solo archivo (`src/helper/styleHelper.ts`), mientras `utils` concentra gran parte de las utilidades.
- `domain` existe como tercer modelo estructural, pero hoy es todavía pequeño (6 carpetas, 7 archivos) frente a `features` (**47 carpetas**) y `modules` (**22 carpetas**).

### Convenciones de estilo
- El stack visual actual no define de forma implícita una única convención para nuevos componentes: conviven `styled-components`, Ant Design y SCSS modules.

---

## 7. Riesgos arquitectónicos

### Riesgos actuales
- **Costo alto de coordinación en dominios centrales**  
  Especialmente visible en facturación y ventas, donde los cambios atraviesan slices, servicios, hooks, acceso a datos y plantillas.
- **Propagación de tipado débil desde el store**  
  `any` en reducers y selectores puede extender castings inseguros hacia componentes y servicios.
- **Ownership difuso en componentes compartidos**  
  Múltiples raíces y nombres repetidos dificultan saber dónde agregar o corregir una pieza reusable.

### Riesgos futuros
- **Migraciones parciales que nunca consolidan**  
  La coexistencia de `modules`, `features` y `domain` sugiere que una migración puede quedar a medio camino y aumentar el costo cognitivo si no se decide una convención final.
- **Mayor costo de encapsular datos más adelante**  
  Cuantos más importadores directos de Firebase se creen, más caro será introducir una capa de acceso coherente después.
- **Aumento del ruido semántico del store**  
  Si Redux sigue absorbiendo UI efímera, será más difícil distinguir estado transversal de estado local.

No hay evidencia suficiente en esta auditoría para afirmar que estos riesgos ya estén "rompiendo la app". Sí hay evidencia suficiente para afirmar que escalan mal si se mantienen sin control.

---

## 8. Quick wins (Bajo esfuerzo, alto impacto)

1. **Tipar slices UI con `any` evidente**
   - Alcance: `themeSlice`, `usersManagementSlice`, `barcodePrintModalSlice`, `warehouseModalSlice`, `productWeightEntryModalSlice`.
   - Impacto: mejora inmediata de refactor safety en estado global.
   - Dificultad: baja-media.
   - Dependencia: ninguna relevante.
   - Tipo: quick win.
   - Orden recomendado: primero.

2. **Fijar una regla de placement para código nuevo**
   - Alcance: evitar que sigan creciendo raíces top-level y rutas paralelas.
   - Impacto: detiene el deterioro estructural aunque no migre legacy.
   - Dificultad: baja.
   - Dependencia: acuerdo de equipo.
   - Tipo: quick win de gobernanza.
   - Orden recomendado: primero.

3. **Inventariar y deprecar helpers solapados**
   - Alcance: `compareObject.ts` vs `compareObjects.ts`, `ensureArray.ts` vs `utils/array/ensureArray.ts`, `helper/styleHelper.ts`.
   - Impacto: reduce ambigüedad en nuevo código.
   - Dificultad: baja-media.
   - Dependencia: decidir versión canónica.
   - Tipo: quick win.
   - Orden recomendado: segundo.

4. **Normalizar naming de componentes repetidos en la capa compartida**
   - Alcance: `FileList`, `DatePicker`, `FilterBar`, `BarcodePrintModal`.
   - Impacto: mejora discoverability y ownership.
   - Dificultad: media.
   - Dependencia: inventario previo de usos.
   - Tipo: quick win acotado.
   - Orden recomendado: segundo.

No incluyo "eliminar SCSS" como quick win. La evidencia no sugiere que sea un cambio barato ni prioritario frente a deuda de estado y acoplamiento.

---

## 9. Refactors estratégicos

1. **Piloto de cohesión vertical para `invoice`**
   - Valor esperado: reducir cambio transversal en un dominio central y establecer una plantilla replicable.
   - Trade-offs: costo alto de movimiento y riesgo de migración parcial.
   - Prerrequisitos: mapa de ownership, contratos de datos y regla de placement.
   - Riesgo principal: mezclar reubicación física con cambios funcionales en el mismo PR.

2. **Reducción del uso de Redux para UI efímera**
   - Valor esperado: bajar superficie global de coordinación y clarificar qué estado sí es compartido.
   - Trade-offs: más providers o estado local distribuido si se hace sin criterio.
   - Prerrequisitos: clasificación de slices globales vs locales.
   - Riesgo principal: mover demasiadas piezas a la vez y perder trazabilidad.

3. **Crear una frontera de acceso a datos por dominio**
   - Valor esperado: mejorar testabilidad y desacoplar pantallas del detalle de Firebase.
   - Trade-offs: añadir una capa extra puede ser burocrático si se aplica sin foco.
   - Prerrequisitos: elegir dominio piloto y contrato mínimo.
   - Riesgo principal: crear abstracciones genéricas sin adopción real.

4. **Racionalizar la capa compartida de UI**
   - Valor esperado: menos ambigüedad entre `components/ui`, `components/common` y variantes legacy.
   - Trade-offs: renombres y reexports pueden tener costo operativo alto si se hacen de golpe.
   - Prerrequisitos: inventario de componentes base y de componentes legacy.
   - Riesgo principal: convertir el esfuerzo en una limpieza cosmética sin impacto estructural.

---

## 10. Orden de prioridad recomendado

1. **Detener el deterioro estructural**
   - Definir placement para código nuevo.
   - Congelar nuevas raíces top-level y decidir el rol de `src/domain/`.
   - Motivo: evita que el problema crezca mientras se ejecutan refactors.

2. **Subir el piso de seguridad del store**
   - Limpiar `any` evidentes en slices conectados al store.
   - Identificar reducers de UI efímera.
   - Motivo: bajo costo relativo y alto impacto en seguridad de cambio.

3. **Recortar el alcance de Redux donde sea más claro**
   - Empezar por modales/viewers con ownership local evidente.
   - Motivo: reduce coordinación global sin tocar todavía flujos de negocio complejos.

4. **Ejecutar un piloto de cohesión vertical**
   - `invoice` es el mejor candidato por criticidad y evidencia.
   - Motivo: permite validar la estructura objetivo antes de extenderla al resto del repo.

5. **Crear seam de datos en el dominio piloto**
   - Mover accesos directos a Firebase detrás de una frontera concreta.
   - Motivo: mejora testabilidad y simplifica evolución posterior.

6. **Expandir pruebas solo donde el refactor lo pida**
   - Motivo: maximiza retorno; no conviene abrir una iniciativa amplia de testing antes de reducir acoplamiento.

---

## 11. Propuesta de estructura objetivo

No considero justificado imponer en este punto una migración total a FSD, DDD o cualquier marco concreto. Sí veo justificada una **estructura objetivo más vertical para código nuevo o dominios en refactor**, con una sola convención principal.

### Estado actual observado
- UI compartida repartida entre `components/ui`, `components/common` y piezas legacy.
- Dominio repartido entre `modules`, `features`, `services`, `firebase`, `types`.
- `domain` existe, pero aún no actúa como convención dominante.

### Dirección razonable si se decide converger

```text
src/
├── app/                # bootstrap, providers, router, store
├── shared/             # utilidades y UI realmente transversales
│   ├── ui/
│   ├── lib/
│   ├── utils/
│   └── types/
├── domains/
│   ├── invoice/
│   │   ├── ui/
│   │   ├── model/
│   │   ├── data/
│   │   └── lib/
│   ├── products/
│   └── warehouse/
```

### Qué mejoraría
- Menos cambio transversal por dominio.
- Menor ambigüedad sobre dónde vive el código nuevo.
- Mejor oportunidad de encapsular acceso a datos y tipos por dominio.

### Qué costo tiene
- Renombres, movimientos y reexports.
- Riesgo de PRs grandes si no se hace por piloto.
- Posible convivencia temporal con legado durante varios ciclos.

### Qué no conviene mover todavía
- Todo `src/modules/` en bloque.
- Todas las plantillas PDF y de impresión si aún no se define una fuente de verdad.
- Toda la capa visual solo por consistencia estética.

---

## 12. Plan de ejecución por fases

### Fase 0. Baseline y reglas
- **Objetivo**: fijar reglas antes de mover código.
- **Cambios**:
  - Definir placement para nuevo código.
  - Clasificar raíces actuales: vigentes, legacy, en migración.
  - Identificar reducers UI vs negocio.
- **Riesgos**:
  - Quedarse solo en documentación.
- **Validaciones**:
  - Aprobación de equipo.
  - Dos o tres ejemplos concretos de placement resueltos con la nueva regla.

### Fase 1. Endurecimiento del store y quick wins
- **Objetivo**: subir seguridad de cambio con bajo riesgo.
- **Cambios**:
  - Limpiar `any` evidentes en slices del store.
  - Deprecar helpers solapados.
  - Normalizar algunos nombres de componentes repetidos.
- **Riesgos**:
  - Hacer renombres amplios sin beneficio real.
- **Validaciones**:
  - Typecheck limpio en archivos intervenidos.
  - Smoke test de pantallas dueñas de los slices tocados.

### Fase 2. Extracción de UI efímera de Redux
- **Objetivo**: reducir coordinación global donde el ownership es local.
- **Cambios**:
  - Sacar modales/viewers localizados del store.
  - Mantener en Redux solo estado transversal real.
- **Riesgos**:
  - Distribuir estado local sin un patrón consistente.
- **Validaciones**:
  - Revisar que el flujo siga siendo trazable y que no se pierda control de apertura/cierre.

### Fase 3. Piloto vertical de `invoice`
- **Objetivo**: probar la estructura objetivo en un dominio central sin migración total.
- **Cambios**:
  - Reagrupar parte del dominio.
  - Introducir frontera de datos para el flujo piloto.
  - Añadir pruebas puntuales de regresión.
- **Riesgos**:
  - Mezclar refactor y cambios funcionales.
- **Validaciones**:
  - Comparación de rutas importadas antes/después.
  - Smoke test de ventas, facturación y notas de crédito relacionadas.

### Fase 4. Decisión de ampliación
- **Objetivo**: decidir si el patrón piloto se replica.
- **Cambios**:
  - Medir costo, claridad y estabilidad del piloto.
  - Extender a otro dominio solo si hay evidencia de mejora.
- **Riesgos**:
  - Escalar una solución no validada.
- **Validaciones**:
  - Feedback del equipo.
  - Reducción medible de rutas tocadas por cambio en el dominio piloto.

---

## 13. Anexo con evidencia

### 13.1. Comandos de referencia (PowerShell 7.5.4)

```powershell
'src_top_level_dir_count=' + ((Get-ChildItem src -Directory | Measure-Object).Count)
```

```powershell
$lines = Get-Content src/app/store.ts
$start = ($lines | Select-String 'reducer: \{' | Select-Object -First 1).LineNumber
$end = ($lines | Select-String '^  middleware:' | Select-Object -First 1).LineNumber
$keys = $lines[($start)..($end-2)] | Select-String '^[ ]{4}[A-Za-z].*:'
'store_reducer_keys=' + $keys.Count
```

```powershell
'useEffect_matches=' + ((rg -o "useEffect" src | Measure-Object).Count)
'files_with_useEffect=' + ((rg -l "useEffect" src | Measure-Object).Count)
```

```powershell
'any_tokens=' + ((rg -o "\bany\b" src | Measure-Object).Count)
'files_with_any=' + ((rg -l "\bany\b" src | Measure-Object).Count)
'unknown_tokens=' + ((rg -o "\bunknown\b" src | Measure-Object).Count)
'files_with_unknown=' + ((rg -l "\bunknown\b" src | Measure-Object).Count)
```

```powershell
'scss_files=' + ((Get-ChildItem -Recurse -Filter *.scss src | Measure-Object).Count)
'styled_components_imports=' + ((rg -l "styled-components" src | Measure-Object).Count)
'antd_imports=' + ((rg -l 'from "antd"|from ''antd''' src | Measure-Object).Count)
```

```powershell
'firebase_importers_outside_firebase=' + ((rg -l "@/firebase|\.\./firebase|\.\./\.\./firebase|\.\./\.\./\.\./firebase|\.\./\.\./\.\./\.\./firebase" src/components src/modules src/hooks src/services src/features | Measure-Object).Count)
```

### 13.2. Evidencia del store global y UI state en Redux
- Archivo central:
  - `src/app/store.ts`
- Slices de UI/modal observables en el store:
  - `src/features/theme/themeSlice.ts`
  - `src/features/barcodePrintModalSlice/barcodePrintModalSlice.ts`
  - `src/features/productWeightEntryModalSlice/productWeightEntryModalSlice.ts`
  - `src/features/warehouse/warehouseModalSlice.ts`
  - `src/features/warehouse/shelfModalSlice.ts`
  - `src/features/warehouse/rowShelfModalSlice.ts`
  - `src/features/warehouse/segmentModalSlice.ts`
  - `src/features/insurance/insuranceConfigModalSlice.ts`
  - `src/features/creditNote/creditNoteModalSlice.ts`
- Contrapuntos locales ya existentes:
  - `src/components/modals/Modal.tsx`
  - `src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/hooks/useInvoicePanelController.ts`

### 13.3. Evidencia de dispersión del dominio `invoice`
- UI / páginas / plantillas:
  - `src/modules/invoice/pages/InvoicesPage/InvoicesPage.tsx`
  - `src/modules/invoice/pages/CreditNote/CreditNoteCreate/CreditNoteCreate.tsx`
  - `src/modules/invoice/components/Invoice/components/Invoice/Invoice.tsx`
  - `src/modules/invoice/components/Invoice/templates/Invoicing/InvoiceTemplate1/InvoiceTemplate1.tsx`
  - `src/modules/invoice/components/Quotation/templates/Invoicing/QuotationTemplate2/QuotationTemplate2.tsx`
- Estado:
  - `src/features/invoice/invoiceFormSlice.ts`
  - `src/features/invoice/invoicePreviewSlice.ts`
  - `src/features/invoice/invoicesSlice.ts`
  - `src/features/invoice/utils/invoiceTotals.ts`
- Acceso a datos:
  - `src/firebase/invoices/fbAddInvoice.ts`
  - `src/firebase/invoices/fbGetInvoices.ts`
  - `src/firebase/invoices/fbUpdateInvoice.ts`
  - `src/firebase/invoices/useFbGetInvoicesWithFilters.ts`
  - `src/firebase/invoices/syncInvoicePaymentsFromAR.ts`
- Servicios:
  - `src/services/invoice/useInvoice.ts`
  - `src/services/invoice/invoice.service.ts`
  - `src/services/invoice/invoiceV2Admin.service.ts`
  - `src/services/invoice/logInvoiceAuthorizations.ts`
- Tipos:
  - `src/types/invoice.ts`

### 13.4. Evidencia de acoplamiento directo a Firebase
- Hooks:
  - `src/hooks/usePurchases.tsx`
  - `src/hooks/useOrders.tsx`
  - `src/hooks/useTaxReceiptsFix.ts`
  - `src/hooks/useProductStockData.ts`
  - `src/hooks/expense/useExpensesForCashCount.tsx`
- Módulos / pantallas:
  - `src/modules/utility/pages/Utility/hooks/useUtilityDashboard.ts`
  - `src/modules/authorizations/pages/Authorizations/components/ViewPinModal.tsx`
- Componentes:
  - `src/components/ui/Product/Product/hooks/useProductHandling.tsx`
  - `src/components/ui/BlockEditor/Toolbar/Toolbar.tsx`
- Servicios que aún conocen Firebase:
  - `src/services/invoice/invoice.service.ts`
  - `src/services/functionsApiClient.ts`
  - `src/services/dynamicPermissions.ts`

### 13.5. Evidencia de deuda de tipado
- Slices con mayor concentración de `any`:
  - `src/features/cashCount/cashCountManagementSlice.ts`
  - `src/features/updateProduct/updateProductSlice.ts`
  - `src/features/purchase/addPurchaseSlice.ts`
  - `src/features/warehouse/productExpirySelectionSlice.ts`
  - `src/features/accountsReceivable/accountsReceivableSlice.ts`
- Ejemplos cortos:
  - `src/features/usersManagement/usersManagementSlice.ts`: `updateUser: (state: any, action: PayloadAction<any>)`
  - `src/features/theme/themeSlice.ts`: `toggleTheme: (state: any)`
  - `src/features/barcodePrintModalSlice/barcodePrintModalSlice.ts`: `action: PayloadAction<any>`
  - `src/features/warehouse/warehouseModalSlice.ts`: `closeWarehouseForm: (state: any)`
  - `src/features/accountsReceivable/accountsReceivableSlice.ts`: `createAsyncThunk as any`

### 13.6. Evidencia de mezcla de estilos
- `styled-components`:
  - `src/components/modals/Modal.tsx`
  - `src/components/ui/Counter/Counter.tsx`
  - `src/components/common/FileUploader/FileList.tsx`
- Ant Design:
  - `src/modules/settings/pages/setting/subPage/TaxReceipts/components/TableTaxReceipt/TableTaxReceipt.tsx`
  - `src/components/common/DatePicker/DatePicker.tsx`
  - `src/hooks/usePurchases.tsx`
- SCSS modules:
  - `src/components/common/Account/Account.module.scss`
  - `src/components/common/ErrorMassage/ErrorMassage.module.scss`
  - `src/components/ui/Counter/Counter.module.scss`
  - `src/modules/auth/components/UserAccountControl/UserAccountControl.module.scss`
  - `src/modules/sales/components/MenuComponents/MenuComponents.module.scss`

### 13.7. Evidencia de redundancias y naming ambiguo
- `FileList.tsx`:
  - `src/components/common/FileUploader/FileList.tsx`
  - `src/components/common/EvidenceUpload/FileList.tsx`
  - `src/components/modals/FileListModal/FileList.tsx`
- `DatePicker.tsx`:
  - `src/components/DatePicker.tsx`
  - `src/components/common/DatePicker/DatePicker.tsx`
  - `src/components/ui/Dates/DatePicker/DatePicker.tsx`
- `FilterBar.tsx`:
  - `src/components/common/FilterBar/FilterBar.tsx`
  - `src/components/common/FilterBarLegacy/FilterBar.tsx`
  - `src/modules/invoice/pages/InvoicesPage/components/FilterBar/FilterBar.tsx`
  - `src/modules/orderAndPurchase/pages/OrderAndPurchase/Compra/components/FilterBar/FilterBar.tsx`
- `BarcodePrintModal.tsx`:
  - `src/components/modals/BarcodePrintModal/BarcodePrintModal.tsx`
  - `src/components/modals/ProductForm/components/sections/BarcodePrintModal/BarcodePrintModal.tsx`
  - `src/modules/dev/pages/test/pages/barcodePrint/components/BarcodePrintModal.tsx`

### 13.8. Evidencia de utilidades solapadas
- Comparación de objetos:
  - `src/utils/object/compareObject.ts`
  - `src/utils/object/compareObjects.ts`
- Asegurar arrays:
  - `src/utils/ensureArray.ts`
  - `src/utils/array/ensureArray.ts`
- Helper aislado:
  - `src/helper/styleHelper.ts`

### 13.9. Evidencia de inconsistencias de naming y estructura
- Raíces en `src/` con mayúsculas:
  - `src/Context`
  - `src/Seo`
- Carpetas de `src/firebase/` con estilo mixto:
  - `src/firebase/Auth`
  - `src/firebase/Settings`
  - `src/firebase/Tools`
  - `src/firebase/ProductOutflow`
  - `src/firebase/AppUpdate`
- Modelo estructural parcial:
  - `src/domain/accountsReceivable/dueDatesReceivableLogic.ts`
  - `src/domain/inventory/inventorySessionsLogic.ts`
  - `src/domain/products/productInventoryLogic.ts`

### 13.10. Evidencia de pruebas presentes
- `src/utils/barcode.test.ts`
- `src/utils/invoice.test.ts`
- `src/utils/invoice/documentIdentity.test.ts`
- `src/utils/date/toMillis.test.ts`
- `src/utils/runtime/frontendFeatureAccess.test.ts`
- `src/hooks/useRncSearch.test.ts`
- `src/firebase/cashCount/closing/fbCashCountClosed.test.ts`
- `src/firebase/cashCount/closing/closeCashCountErrors.test.ts`
- `src/firebase/billing/callableErrors.test.ts`
- `src/modules/settings/pages/subscription/subscription.utils.test.ts`
- `src/modules/checkout/pages/AzulCheckoutRedirect/AzulCheckoutRedirect.test.tsx`
- `src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/components/Body/components/ReceivableManagementPanel/ReceivableManagementPanel.test.tsx`
