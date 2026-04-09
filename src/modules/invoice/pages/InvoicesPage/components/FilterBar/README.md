# FilterBar - Panorama actual

El `FilterBar` de facturas usa un contenedor reutilizable que maneja la disposición responsive (desktop + drawer móvil), el botón de “Más filtros” y el botón de limpiar. Los filtros específicos continúan encapsulados en componentes pequeños.

## Piezas principales

- `src/components/common/FilterBar/FilterBar.tsx`: contenedor genérico (drawer/modal/desktop, clear, breakpoint móvil por defecto en 900px).
- `src/modules/invoice/pages/InvoicesPage/components/FilterBar/FilterBar.tsx`: arma la configuración de filtros para facturas y se la pasa al contenedor genérico.
- `components/`: filtros individuales (DateRangeFilter, ClientFilter, PaymentMethodFilter, AmountRangeFilter, ReceivableFilter, SortControls, TotalsDisplay).
- `hooks/`: `useInvoiceSorting`, `useFilterHandlers`, `useClientOptions`.
- `constants/`: opciones y textos usados por los filtros.

## Cómo se configura

`FilterBar.tsx` genera un arreglo `items` donde cada entrada define:

- `key`: identificador único.
- `section`: `'main'` (desktop visible) o `'additional'` (va al modal/extra).
- `render`: función que devuelve el componente del filtro. Se usa `wrap: false` porque cada filtro ya incluye su propio `Form.Item`.
- `value` e `isActive`: alimentan el estado de filtros activos y el resaltado del botón “Más filtros”.

Ejemplo simplificado:

```jsx
const items = [
  {
    key: 'date',
    section: 'main',
    wrap: false,
    render: () => (
      <DateRangeFilter
        datesSelected={datesSelected}
        setDatesSelected={setDatesSelected}
      />
    ),
    value: datesSelected,
    isActive: (value) => !!(value?.startDate || value?.endDate),
  },
  // ...
];
```

El contenedor recibe también:

- `hasActiveFilters` y `onClearFilters`: controlan el botón de limpiar en desktop y drawer.
- `labels`: textos personalizables para el trigger, el modal y el botón de limpiar.
- `mobileHeaderRight`: contenido extra en el header móvil (ej. `TotalsDisplay`).

```jsx
<CommonFilterBar
  items={items}
  hasActiveFilters={hasActiveFilters}
  onClearFilters={handleClearFilters}
  labels={{
    drawerTrigger: 'Filtros',
    drawerTitle: 'Filtros',
    modalTitle: 'Filtros adicionales',
    more: 'Más filtros',
    clear: 'Limpiar',
  }}
  mobileHeaderRight={
    <TotalsDisplay invoices={invoices} className="mobile-extra" />
  }
/>
```

## Comportamiento responsive

- **Móvil (≤ 900px)**: botón “Filtros” abre un drawer bottom con todos los filtros y el botón de limpiar.
- **Desktop**: filtros principales en línea; los adicionales se abren en un modal desde el botón “Más filtros”. Si no caben los filtros principales, los sobrantes se mueven automáticamente al modal.
