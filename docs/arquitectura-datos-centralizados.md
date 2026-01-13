# Arquitectura de Datos y Dominios Centralizados (Clean Architecture)

Este documento define la arquitectura "Single Source of Truth" del proyecto. El objetivo es desacoplar la **Lógica de Negocio**, los **Datos (Tipos)** y la **UI**, garantizando escalabilidad y mantenibilidad.

## Principios Fundamentales
1.  **Datos Centralizados**: La definición de un dato (interface) y sus reglas (validaciones/cálculos) viven en un solo lugar (`utils/<domain>`).
2.  **UI "Tonta" (Presentacional)**: Los componentes **no** definen reglas de negocio ni calculan totales complejos. Solo renderizan y reaccionan.
3.  **Flujo Unidireccional**: API $\to$ Normalizador $\to$ Estado (Redux/Context) $\to$ UI.
4.  **Colocación Lógica (Domain Separation)**: Todo lo relacionado con un dominio (Facturas, Clientes, etc.) debe estar identificable y separado.

---

## Mapa del Territorio (Folder Structure)

Para un dominio ejemplo: **`Invoice`** (Facturación).

| Capa | Ubicación | Responsabilidad |
| :--- | :--- | :--- |
| **Definiciones** | `src/types/invoice.ts` *(Preferido)* o `src/utils/invoice/types.ts` | **Fuente de verdad**. Interfaces, Enums y Constantes estáticas. |
| **Lógica (Brain)** | `src/utils/invoice/` | Reglas de negocio, cálculos, formateadores y **normalizadores**. |
| **Estado (State)** | `src/features/invoice/` | Slices de Redux Toolkit. Estado global, acciones asíncronas (Thunks). |
| **API (Gateway)** | `src/services/invoice/` | Llamadas a Firebase/Backend. **SIEMPRE** retorna datos tipados. |
| **Hooks (Logic)** | `src/hooks/invoice/` | Hooks personalizados para conectar UI con Estado/Servicios. |
| **UI (Smart)** | `src/modules/invoice/components/Invoice/` | Componentes reutilizables del dominio (ej. `InvoiceTable`). |
| **UI (Page)** | `src/modules/invoice/pages/InvoicesPage/` | Pantalla final que compone los componentes. |

---

## Reglas por Capa

### 1. Tipos y Definiciones (`types/` o `utils/<domain>/types.ts`)
- **Regla de Oro**: Si un tipo se usa en más de 2 archivos, debe estar aquí.
- **DTO vs Model**:
    - Si la API devuelve datos "feos" (ej. `created_at_seconds`), definir un tipo `InvoiceDTO`.
    - La App usa `Invoice` (limpio, ej. `createdAt: Date`).
- **Nombrado**: `PascalCase` para interfaces (ej. `ProductItem`).

### 2. Lógica y Normalización (`utils/<domain>/`)
- **Normalizadores**: `normalizeInvoice(raw: any): Invoice`.
    - La UI **nunca** debe recibir datos crudos de Firebase (`Snapshots`, `Timestamps`).
    - Los servicios deben usar estos normalizadores antes de retornar.
- **Cálculos**: `calculateTotal(items: Product[])`.
    - La UI nunca hace `items.reduce(...)` inline. Usa el helper.
- **Validaciones**: `validateInvoice(invoice: Invoice): boolean`.

### 3. Estado (`features/<domain>/`)
- Contiene los **Redux Slices**.
- Los selectores complejos deben estar aquí o en `utils`, no en el componente.
- **Ejemplo**: `invoiceSlice.ts` maneja `currentInvoice`, `isLoading`, `error`.

### 4. Servicios (`services/<domain>/`)
- Encapsulan la complejidad de Firebase/Supabase.
- **Validación de Entrada**: Antes de enviar a la DB, validar con schemas (ej. Zod) o helpers de `utils`.
- **Validación de Salida**: Al recibir datos, pasarlos por el `normalize*` de `utils`.
- **Nunca** retornar `any`.

### 5. UI (`modules/` + `components/`)
- **Pages** (`src/modules/<feature>/pages`): Son contenedores. Conectan el estado (Redux/Hooks) y se lo pasan a los componentes.
- **Components** (`src/modules/<feature>/components`, `src/components/common`, `src/components/ui`):
    - Reciben datos por `props` o usan hooks específicos.
    - No hacen llamadas a API directas.
    - Estilos separados o CSS Modules/Styled.

---

## Flujo de Trabajo para Nuevo Feature

1.  **Definir Tipos**: Crear `src/types/<feature>.ts`. ¿Qué datos voy a manejar?
2.  **Lógica Pura**: Crear `src/utils/<feature>/`. Implementar cálculos y normalizadores (Testables unitariamente).
3.  **Servicio**: Crear `src/services/<feature>/`. Conectar con backend usando los tipos.
4.  **Estado (Opcional)**: Si es global, crear `src/features/<feature>/slice.ts`.
5.  **UI**: Crear componentes en `src/modules/<feature>/components/` y armar la página en `src/modules/<feature>/pages/`.

---

## Checklist de Calidad ("Definition of Done")

- [ ] **Tipado Estricto**: No existe `any`.
- [ ] **Sin Lógica en JSX**: No hay ternarios complejos ni `.map` con lógica dentro del render.
- [ ] **Imports Limpios**: Se importa desde la fuente de verdad, no de archivos intermedios.
- [ ] **Normalización**: Las fechas son objetos `Date` o strings ISO, no Timestamps de Firebase en la UI.
- [ ] **Reutilización**: Si una función de utilidad se usa en dos dominios, mover a `src/utils/common` o `src/utils/<dominio-principal>`.

## Mantenimiento
Este documento es la ley. Si se encuentra código que viola estos principios (ej. lógica de impuestos dentro de un botón), se debe refactorizar moviéndolo a `utils/`.
