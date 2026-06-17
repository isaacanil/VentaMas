# Arquitectura de Datos y Dominios Centralizados (Clean Architecture)

Este documento define la arquitectura "Single Source of Truth" del proyecto. El objetivo es desacoplar la **Lógica de Negocio**, los **Datos (Tipos)** y la **UI**, garantizando escalabilidad y mantenibilidad.

## Principios Fundamentales

1.  **Ownership explícito**: La definición de un dato y sus reglas viven en el dueño real. Si es interno de un módulo, vive bajo `src/modules/<dominio>/`; si es neutral y lo consumen varios dueños, vive en `src/domain/<dominio>/`.
2.  **UI "Tonta" (Presentacional)**: Los componentes **no** definen reglas de negocio ni calculan totales complejos. Solo renderizan y reaccionan.
3.  **Flujo Unidireccional**: API $\to$ Normalizador $\to$ Estado (Redux/Context) $\to$ UI.
4.  **Colocación Lógica (Domain Separation)**: Todo lo relacionado con un dominio (Facturas, Clientes, etc.) debe estar identificable y separado en carpetas owner-locales (`components`, `hooks`, `utils`, `repositories`, `types`) antes de crear helpers globales.
5.  **Contrato Público Acotado**: Cuando otro dominio necesita consumir algo de `src/modules/<dominio>`, debe hacerlo desde `src/modules/<dominio>/public.ts`. Ese archivo expone solo la superficie estable del dueño, no un índice general de carpetas internas.

---

## Mapa del Territorio (Folder Structure)

Para un dominio ejemplo: **`Invoice`** (Facturación).

| Capa                 | Ubicación                                 | Responsabilidad                                                                                                                                                         |
| :------------------- | :---------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Contrato Neutral** | `src/domain/invoice/`                     | Reglas, catálogos o tipos puros que deben ser consumidos por más de un dueño sin acoplarse a UI/Firebase.                                                               |
| **Módulo Dueño**     | `src/modules/invoice/`                    | Carpeta owner-local con `components`, `hooks`, `utils`, `repositories`, `types` y `pages` del dominio.                                                                  |
| **Repositorios**     | `src/modules/invoice/repositories/`       | Lecturas/escrituras Firestore o adaptadores del dominio. Normalizan datos antes de exponerlos a hooks/UI.                                                               |
| **Callables**        | `src/firebase/functions/callable.ts`      | Wrapper compartido para Cloud Functions. Los wrappers de dominio deben usar `createFirebaseCallable` o `createFirebaseCallableFor`.                                     |
| **Estado (State)**   | `src/features/invoice/`                   | Solo para estado global real. Estado local o view models deben vivir junto al owner antes de subir a Redux.                                                             |
| **UI (Page)**        | `src/modules/invoice/pages/InvoicesPage/` | Pantalla final que compone hooks, componentes y acciones del módulo.                                                                                                    |
| **Contrato Público** | `src/modules/invoice/public.ts`           | Exporta solo lo que otros dominios pueden importar de forma estable. Se valida estructuralmente con `src/modules/publicBarrels.test.ts`.                                |

---

## Reglas por Capa

### 1. Tipos y Definiciones (`src/domain/`, `types/` y tipos locales)

- **Regla de Oro**: Si un contrato cruza módulos y no depende de UI/Firebase, debe vivir en `src/domain/<dominio>/` o en una capa compartida explícita. Si solo lo usa un owner, debe quedarse junto a ese owner.
- **Capa real de Invoice**: Los tipos centrales existentes pueden seguir en `src/types/invoice.ts`, pero contratos nuevos compartidos deben preferir `src/domain/<dominio>/` cuando sean neutrales y testeables.
- **DTO vs Model**:
  - Si la API devuelve datos "feos" (ej. `created_at_seconds`), definir un tipo `InvoiceDTO`.
  - La App usa `Invoice` (limpio, ej. `createdAt: Date`).
- **Nombrado**: `PascalCase` para interfaces (ej. `ProductItem`).

### 2. Lógica y Normalización (`src/modules/<dominio>/utils/` o `src/domain/<dominio>/`)

- **Normalizadores**: `normalizeInvoice(raw: any): Invoice`.
  - La UI **nunca** debe recibir datos crudos de Firebase (`Snapshots`, `Timestamps`).
  - Los repositories/adapters deben usar estos normalizadores antes de retornar.
- **Cálculos**: `calculateTotal(items: Product[])`.
  - La UI nunca hace `items.reduce(...)` inline. Usa el helper.
- **Validaciones**: `validateInvoice(invoice: Invoice): boolean`.
- **Neutralidad**: Solo mover a `src/domain` cuando el helper no dependa de React, Firebase, rutas, estilos ni estado global.

### 3. Estado (`features/<domain>/`)

- Contiene los **Redux Slices**.
- Los selectores complejos deben estar aquí o en utils/domain locales, no en el componente.
- Si el estado es de una pantalla, preferir `src/modules/<dominio>/hooks/use...ViewModel.ts` o helpers locales antes de crear estado global.
- **Ejemplo**: `invoiceSlice.ts` maneja `currentInvoice`, `isLoading`, `error`.

### 4. Repositories, Servicios y Callables

- Encapsulan la complejidad de Firebase/Supabase.
- **Validación de Entrada**: Antes de enviar a la DB, validar con schemas (ej. Zod) o helpers de `utils`.
- **Validación de Salida**: Al recibir datos, pasarlos por el `normalize*` de `utils`.
- **Nunca** retornar `any`.
- **Cloud Functions**: No importar `httpsCallable` directo en wrappers nuevos. Usar `src/firebase/functions/callable.ts` para mantener data directa, errores y opciones en un solo contrato.

### 5. UI (`modules/` + `components/`)

- **Pages** (`src/modules/<feature>/pages`): Son contenedores. Conectan el estado (Redux/Hooks) y se lo pasan a los componentes.
- **Components** (`src/modules/<feature>/components`, `src/components/common`, `src/components/ui`):
  - Reciben datos por `props` o usan hooks específicos.
  - No hacen llamadas a API directas.
  - Estilos separados o CSS Modules/Styled.
- **Imports entre dominios**: Evitar imports profundos hacia `pages/`, `components/`, `hooks/` o `utils/` de otro módulo. Si una pieza debe ser consumida fuera del dominio dueño, exponerla de forma explícita en `src/modules/<dominio>/public.ts` y mantener ese contrato pequeño.

---

## Guardrails Automatizados

- `npm run test:run:architecture` ejecuta la suite estructural vigente: callable wrappers, boundaries de módulos, barrels públicos, preloaders de rutas, metadata/visibilidad de rutas y lazy loaders del menú global.
- `src/modules/moduleBoundaries.test.ts` recorre `src/modules` con el AST de TypeScript y bloquea nuevos imports profundos hacia carpetas privadas de otro módulo (`pages/`, `components/`, `hooks/`, `utils/`), imports relativos entre módulos, buckets compartidos retirados, imports privados desde router y ciclos nuevos entre módulos.
- `src/modules/publicBarrels.test.ts` valida que cada barrel público runtime (`src/modules/<dominio>/public.ts`) exponga exactamente el contrato esperado. Si se agrega o elimina un export runtime, se debe actualizar el barrel y el test juntos.
- La lista vigente de barrels públicos y rutas con preloader vive en `src/modules/publicBarrels.test.ts` y `src/router/routes/routePreloaders.test.ts`; evita duplicarla aquí para que el contrato quede en guardrails ejecutables.
- `src/router/routes/routeHandle.test.ts`, `src/router/routes/routeVisibility.test.ts` y `src/modules/navigation/components/MenuApp/GlobalMenu/core/createLazyLoader.test.ts` cubren metadata, visibilidad y carga lazy de rutas. No crear checklist manual paralelo salvo para una migración temporal.
- `src/firebase/functions/callableImportGuard.test.ts` bloquea nuevos imports directos de `httpsCallable` fuera de `src/firebase/functions/callable.ts` y de la deuda explícita del test. Los wrappers nuevos de Cloud Functions deben pasar por `createFirebaseCallable`.
- `tools/deploy.js` y `tools/project.js` ocultan y bloquean deploys de todas las Cloud Functions de staging salvo que exista `ALLOW_ALL_FUNCTIONS_DEPLOY=1`. El camino normal para Functions sigue siendo por función específica.

---

## Flujo de Trabajo para Nuevo Feature

1.  **Definir Ownership**: Confirmar si el contrato pertenece a un módulo, a `src/domain/<feature>/` o a una capa compartida real.
2.  **Lógica Pura**: Crear `src/modules/<feature>/utils/` o `src/domain/<feature>/`. Implementar cálculos y normalizadores testeables.
3.  **Repositorio/Servicio**: Crear `src/modules/<feature>/repositories/` o adapter equivalente. Conectar con backend usando tipos y normalizadores.
4.  **Callables (Si Aplica)**: Crear wrappers con `createFirebaseCallable` / `createFirebaseCallableFor`, no con `httpsCallable` directo.
5.  **Estado (Opcional)**: Si es global, crear `src/features/<feature>/slice.ts`; si es local, mantenerlo en hooks/view models del módulo.
6.  **Contrato Público (Si Aplica)**: Crear o actualizar `src/modules/<feature>/public.ts` solo con exports necesarios para otros dominios. Si es runtime, agregarlo a `src/modules/publicBarrels.test.ts`.
7.  **UI**: Crear componentes en `src/modules/<feature>/components/` y armar la página en `src/modules/<feature>/pages/`.
8.  **Guardrail**: Ejecutar `npm run test:run:architecture` cuando el cambio toque rutas, barrels, boundaries o wrappers de Functions.

---

## Checklist de Calidad ("Definition of Done")

- [ ] **Tipado Estricto**: No existe `any`.
- [ ] **Sin Lógica en JSX**: No hay ternarios complejos ni `.map` con lógica dentro del render.
- [ ] **Imports Limpios**: Se importa desde la fuente de verdad, no de archivos intermedios.
- [ ] **Contrato Público Acotado**: Los imports entre módulos pasan por `src/modules/<dominio>/public.ts` cuando existe una dependencia legítima.
- [ ] **Normalización**: Las fechas son objetos `Date` o strings ISO, no Timestamps de Firebase en la UI.
- [ ] **Reutilización**: Si una función de utilidad se usa en dos dominios, mover a `src/domain/<dominio>` o `src/shared/<area>` solo si realmente es neutral; si tiene dueño claro, exponerla por `public.ts`.

## Mantenimiento

Este documento es la ley. Si se encuentra código que viola estos principios (ej. lógica de impuestos dentro de un botón), se debe refactorizar moviéndolo a `utils/`.
