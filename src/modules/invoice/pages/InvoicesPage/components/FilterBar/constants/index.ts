// Configuraciones locales
type SelectOption = {
  value: string;
  label: string;
};

export const SORT_OPTIONS: SelectOption[] = [
  { value: 'defaultCriteria', label: 'Por defecto' },
  { value: 'data.date.seconds', label: 'Fecha' },
  { value: 'data.numberID', label: 'Número' },
  { value: 'data.client.name', label: 'Cliente' },
  { value: 'data.totalPurchase.value', label: 'Total' },
];

export const PAYMENT_METHODS: SelectOption[] = [
  { value: '', label: 'Todos' },
  { value: 'cash', label: 'Efectivo' },
  { value: 'card', label: 'Tarjeta' },
  { value: 'transfer', label: 'Transferencia' },
];

export const PAYMENT_STATUS: SelectOption[] = [
  { value: '', label: 'Todos' },
  { value: 'paid', label: 'Pagadas' },
  { value: 'partial', label: 'Pago parcial' },
  { value: 'unpaid', label: 'Sin pago' },
];

export const BREAKPOINTS = {
  mobile: 900,
  tablet: 768,
  desktop: 1200,
};

export const FILTER_CONFIG = {
  date: {
    label: 'Fechas',
    width: 'auto',
    type: 'dateRange',
    required: false,
  },
  client: {
    label: 'Cliente',
    width: 180,
    searchable: true,
    type: 'select',
    required: false,
  },
  paymentMethod: {
    label: 'Método',
    width: 150,
    options: PAYMENT_METHODS,
    type: 'select',
    required: false,
  },
  paymentStatus: {
    label: 'Estado de pago',
    width: 165,
    options: PAYMENT_STATUS,
    type: 'select',
    required: false,
  },
  amount: {
    label: 'Monto',
    type: 'range',
    inputWidth: 90,
    required: false,
  },
  receivable: {
    label: 'Cuenta por cobrar',
    type: 'toggle',
    required: false,
  },
  sort: {
    label: 'Ordenar',
    options: SORT_OPTIONS,
    type: 'sort',
    width: 130,
    required: false,
  },
};

export const ACCESSIBILITY_CONFIG = {
  ariaLabels: {
    clientSelect: 'Seleccionar cliente',
    paymentMethodSelect: 'Seleccionar método de pago',
    paymentStatusSelect: 'Seleccionar estado de pago',
    minAmount: 'Monto mínimo',
    maxAmount: 'Monto máximo',
    receivablesOnly: 'Filtrar solo facturas a crédito',
    sortCriteria: 'Criterio de ordenamiento',
    sortDirection: 'Cambiar dirección de ordenamiento',
    filterButton: 'Abrir filtros',
    clearFilters: 'Limpiar todos los filtros',
  },
  roles: {
    filterBar: 'toolbar',
    filtersForm: 'form',
  },
};
