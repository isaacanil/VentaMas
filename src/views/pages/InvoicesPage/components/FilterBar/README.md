# FilterBar - Estructura Refactorizada

## Descripción

El componente `FilterBar` ha sido refactorizado y dividido en múltiples archivos para mejorar la mantenibilidad, legibilidad y reutilización del código.

## Estructura de Archivos

```
src/views/pages/InvoicesPage/components/FilterBar/
├── FilterBar.jsx                 # Componente principal (refactorizado)
├── index.js                      # Exportaciones principales
├── constants/
│   └── index.js                  # Constantes y configuraciones
├── hooks/
│   └── index.js                  # Hooks personalizados
├── components/
│   ├── index.js                  # Exportaciones de componentes
│   ├── FilterField.jsx           # Componente base para campos de filtro
│   ├── DateRangeFilter.jsx       # Filtro de rango de fechas
│   ├── ClientFilter.jsx          # Filtro de cliente
│   ├── PaymentMethodFilter.jsx   # Filtro de método de pago
│   ├── AmountRangeFilter.jsx     # Filtro de rango de montos
│   ├── SortControls.jsx          # Controles de ordenamiento
│   ├── ClearFiltersButton.jsx    # Botón para limpiar filtros
│   └── TotalsDisplay.jsx         # Display de totales
└── styles/
    └── index.js                  # Styled-components
```

## Características

### 1. **Separación de Responsabilidades**

- **Constantes**: Todas las configuraciones y constantes en un archivo separado
- **Hooks**: Lógica de estado y efectos separada en hooks reutilizables
- **Componentes**: Cada filtro como componente independiente
- **Estilos**: Styled-components organizados por separado

### 2. **Hooks Personalizados**

- `useInvoiceSorting`: Maneja la lógica de ordenamiento
- `useFilterHandlers`: Maneja los handlers de filtros
- `useClientOptions`: Maneja las opciones de clientes
- `useDrawerState`: Maneja el estado del drawer
- `useResponsiveLayout`: Maneja breakpoints responsive
- `useFilterCollapse`: Maneja el colapso de filtros en desktop

### 3. **Componentes Modulares**

- `DateRangeFilter`: Filtro de fechas con DatePicker
- `ClientFilter`: Select de clientes con búsqueda
- `PaymentMethodFilter`: Select de métodos de pago
- `AmountRangeFilter`: Inputs numéricos para rangos de monto
- `SortControls`: Select de ordenamiento + botón de dirección
- `ClearFiltersButton`: Botón para limpiar filtros activos
- `TotalsDisplay`: Display de totales (solo móvil)

### 4. **Sistema de Colapso Inteligente**

- Mide dinámicamente el ancho disponible
- Colapsa filtros progresivamente según prioridad
- Muestra botón "Más" cuando hay overflow
- Drawer responsive para filtros ocultos

### 5. **Responsive Design**

- **Móvil (≤ 900px)**: Botón "Filtros" + drawer bottom + totales
- **Desktop (> 900px)**: Filtros horizontales + colapso progresivo

## Uso

```jsx
import { FilterBar } from './components/FilterBar';

<FilterBar
  invoices={invoices}
  datesSelected={datesSelected}
  setDatesSelected={setDatesSelected}
  processedInvoices={processedInvoices}
  setProcessedInvoices={setProcessedInvoices}
  filters={filters}
  onFiltersChange={onFiltersChange}
/>;
```

## Beneficios de la Refactorización

1. **Mantenibilidad**: Cada archivo tiene una responsabilidad específica
2. **Reutilización**: Componentes y hooks pueden reutilizarse
3. **Testabilidad**: Cada parte puede probarse de forma independiente
4. **Legibilidad**: Código más limpio y fácil de entender
5. **Escalabilidad**: Fácil agregar nuevos filtros o modificar existentes

## Orden de Prioridad de Filtros

1. **DateRangeFilter** - Más importante
2. **ClientFilter**
3. **PaymentMethodFilter**
4. **AmountRangeFilter**
5. **SortControls**
6. **ClearFiltersButton** - Menos importante

Los filtros se colapsan en orden inverso de prioridad cuando no hay espacio suficiente.
