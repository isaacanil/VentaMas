# Guía de Layout de Páginas

Cómo construir páginas consistentes dentro del `DashboardLayout`.

---

## Arquitectura del Layout

```
DashboardLayout
├── LayoutShell          (flex column, height: 100%)
│   ├── MenuAppUI*       (si alguna página hija registra config via context)
│   └── Content          (flex: 1 1 auto, min-height: 0)
│       └── <Outlet />   ← tu página se renderiza aquí
```

> **Punto clave:** `Content` ya provee `flex: 1 1 auto` y `min-height: 0`.
> Tu página solo necesita **crecer para llenar** ese espacio y **contener su overflow**.

---

## Regla de oro

Toda página que tenga contenido scrolleable (tablas, listas) debe cumplir:

```css
/* Cada nivel entre Content y el elemento scrolleable */
flex: 1 1 auto;
min-height: 0;      /* permite que flex shrink funcione */
overflow: hidden;    /* contiene el scroll al hijo correcto */
```

Sin `min-height: 0` los hijos flex nunca se encogen y la tabla desborda la pantalla.

---

## Cómo funciona `<MenuApp />`

`MenuApp` tiene **dos modos** de renderizado:

| Contexto | Comportamiento |
|---|---|
| **Dentro de `DashboardLayout`** | No renderiza nada visible. Usa `useDashboardMenu()` para enviar su config al layout, que renderiza `<MenuAppUI>` **arriba** del `<Content>`. |
| **Fuera de `DashboardLayout`** (o con `forceRender`) | Renderiza `<MenuAppUI>` inline directamente. |

Esto significa que **no importa dónde pongas `<MenuApp />` en tu JSX** — siempre aparecerá arriba del contenido de la página cuando estás dentro del dashboard. La posición en el JSX solo afecta cuándo se registra/limpia la config.

---

## Patrones recomendados

### Patrón 1 — Página con tabla (el más común)

**Usar para:** Listados, tablas con filtros, búsqueda.
**Ejemplos:** Cuadre de Caja, Cuentas por Cobrar, Facturas.

```tsx
import { PageLayout } from '@/components/layout/PageShell';
import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';

export const MiPagina = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <PageLayout>
      <MenuApp
        sectionName="Mi Sección"          {/* título en la barra */}
        displayName="elementos"            {/* placeholder del search: "Buscar elementos..." */}
        searchData={searchTerm}            {/* controlado */}
        setSearchData={setSearchTerm}      {/* habilita el input de búsqueda */}
      />
      <FilterBar />
      <MiTabla searchTerm={searchTerm} />
    </PageLayout>
  );
};
```

`PageLayout` ya incluye `flex column + flex: 1 1 auto + min-height: 0 + overflow: hidden + background-color: var(--color2)`. **No necesitas crear un styled-component**.

**¿Por qué funciona?**
- `PageLayout` llena el espacio de `Content` del dashboard
- `FilterBar` ocupa su tamaño natural
- La tabla (con `flex: 1 1 auto; min-height: 0; overflow: hidden` internamente) llena el resto y scrollea

> **Nota:** Si usas `<AdvancedTable>`, su contenedor inmediato también necesita `flex: 1 1 auto; min-height: 0; overflow: hidden`.

### Patrón 2 — Página simple (sin tabla scrolleable)

**Usar para:** Formularios, detalles, configuración.

```tsx
import { PageBody } from '@/components/layout/PageShell';

export const MiFormulario = () => {
  return (
    <PageBody>
      <MenuApp sectionName="Configuración" />
      <Content>
        {/* formulario, cards, etc. */}
      </Content>
    </PageBody>
  );
};
```

`PageBody` = `PageShell` + `overflow: hidden`. Si necesitas scroll en toda la página, usa `PageShell` y agrega `overflow-y: auto` en un styled wrapper.

### Patrón 2b — Página con grid rows

**Usar para:** Cuando necesitas filas de tamaño fijo + una que crece (header + content).

```tsx
import styled from 'styled-components';
import { PageShell } from '@/components/layout/PageShell';

const Container = styled(PageShell)`
  display: grid;
  grid-template-rows: min-content min-content 1fr;
`;
```

`PageShell` provee `flex: 1 1 auto` y `min-height: 0`. Al agregar `display: grid` sobre eso, el grid llena el espacio disponible correctamente.

### Patrón 3 — Página sin MenuApp (fullscreen / modal-like)

**Usar para:** Apertura/cierre de caja, wizards, flujos paso a paso.
**Ejemplo:** `CashRegisterClosure`, `CashRegisterOpening`.

```tsx
export const MiPaginaFullscreen = () => {
  return (
    <Backdrop>
      <Content>
        <Header />
        <Body />
        <Footer />
      </Content>
    </Backdrop>
  );
};

const Backdrop = styled.div`
  width: 100%;
  height: 100%;
  overflow-y: auto;
  background-color: #f0f0f0;
`;

const Content = styled.div`
  display: grid;
  gap: 0.4em;
  width: 100%;
  max-width: 1000px;   /* centrado con ancho máximo */
  padding: 0.4em;
  margin: 0 auto;
`;
```

### Patrón 4 — Layout de dos columnas

**Usar para:** Venta (productos + carrito), split views.
**Ejemplo:** `Sale.tsx`.

```tsx
export const MiSplitView = () => {
  return (
    <Grid>
      <LeftPanel>
        <MenuApp displayName="Items" searchData={...} setSearchData={...} />
        <Lista />
      </LeftPanel>
      <RightPanel>
        <Detalle />
      </RightPanel>
    </Grid>
  );
};

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr min-content;
  height: 100%;
  overflow: hidden;

  @media (width <= 800px) {
    grid-template-columns: 1fr;
  }
`;

const LeftPanel = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 0;
`;
```

---

## Props de `<MenuApp />`

| Prop | Tipo | Descripción |
|---|---|---|
| `sectionName` | `string` | Nombre que aparece como badge en la barra |
| `displayName` | `string` | Usado en placeholder del search: `"Buscar {displayName}..."` |
| `searchData` | `string` | Valor controlado del input de búsqueda |
| `setSearchData` | `(v: string) => void` | Setter — **su presencia habilita el input de búsqueda** |
| `data` | `any` | Datos pasados al GlobalMenu (para exportar, etc.) |
| `showBackButton` | `boolean` | Botón "volver" (default: `true`) |
| `showNotificationButton` | `boolean` | Botón de notificaciones (default: `false`) |
| `sectionNameIcon` | `ReactNode` | Icono junto al nombre de sección |
| `sectionStatus` | `ReactNode` | Badge de estado junto al nombre |
| `toolbarProps` | `object` | Props extra para el `GlobalMenu` |
| `onBackClick` | `() => void` | Handler custom para el botón volver |
| `onReportSaleOpen` | `() => void` | Abre panel de analytics |
| `forceRender` | `boolean` | Fuerza renderizado inline (ignora dashboard context) |

---

## Componentes de layout disponibles

| Componente | Ubicación | CSS | Cuándo usar |
|---|---|---|---|
| `PageShell` | `@/components/layout/PageShell` | `flex column, flex: 1 1 auto, min-height: 0` | Base para extender con styled() |
| `PageBody` | `@/components/layout/PageShell` | PageShell + `overflow: hidden` | Páginas con contenido scrolleable sin background |
| `PageLayout` | `@/components/layout/PageShell` | PageBody + `background-color: var(--color2)` | **El más común.** Páginas con tabla/lista + fondo estándar |

```
PageShell          ← base (flex column, crece, min-height: 0)
  └── PageBody     ← + overflow: hidden
       └── PageLayout  ← + background-color: var(--color2)
```

Otros componentes de UI útiles:

| Componente | Ubicación | Uso |
|---|---|---|
| `AdvancedTable` | `@/components/ui/AdvancedTable` | Tabla con sort, paginación, virtualización. Requiere `height: 100%` en su padre. |
| `FilterBar` | `@/components/common/FilterBar` | Barra de filtros responsive (drawer en mobile) |

---

## Errores comunes

### ❌ Tabla desborda la pantalla
```tsx
// MAL — styled.div repitiendo CSS que ya existe en PageLayout
const Container = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  background-color: var(--color2);
`;
```
```tsx
// BIEN — Usa PageLayout directamente
import { PageLayout } from '@/components/layout/PageShell';

return (
  <PageLayout>
    <MenuApp sectionName="..." />
    <MiTabla />
  </PageLayout>
);
```

### ❌ Usar `height: 100vh` en una página
Las páginas viven dentro del dashboard layout. Usar `100vh` causa doble scroll.
Usa `flex: 1 1 auto` + `min-height: 0` para llenar el espacio disponible.

### ❌ Fragment con hijos sueltos sin contenedor flex
```tsx
// MAL — Fragment no es un contenedor flex, los hijos no se distribuyen
return (
  <>
    <MenuApp sectionName="..." />
    <FilterBar />
    <Tabla />      {/* no tiene restricción de altura */}
  </>
);
```
```tsx
// BIEN — Un solo contenedor que distribuye el espacio
import { PageLayout } from '@/components/layout/PageShell';

return (
  <PageLayout>
    <MenuApp sectionName="..." />
    <FilterBar />
    <Tabla />
  </PageLayout>
);
```

> **Nota sobre `<MenuApp />` en fragments:** Cuando estás dentro del `DashboardLayout`, `<MenuApp />` no renderiza nada (se porta al layout via context), así que usar Fragment no rompe el layout visualmente. Pero es más claro y mantenible usar un solo contenedor.

### ❌ Cadena rota de flex
Cada nivel entre `Content` (del layout) y el elemento scrolleable necesita `flex: 1; min-height: 0`. Si un nivel intermedio no lo tiene, la cadena se rompe y el scroll no funciona.

```
Content (flex: 1, min-height: 0)        ✅
  └── PageContainer (flex: 1, min-height: 0) ✅
       └── TableWrapper (flex: 1, min-height: 0) ✅
            └── AdvancedTable (height: 100%, overflow: auto) ✅ scrollea

Content (flex: 1, min-height: 0)        ✅
  └── PageContainer (sin flex props)     ❌ ROMPE LA CADENA
       └── TableWrapper                  ❌ no importa lo que pongas
            └── AdvancedTable            ❌ desborda
```
