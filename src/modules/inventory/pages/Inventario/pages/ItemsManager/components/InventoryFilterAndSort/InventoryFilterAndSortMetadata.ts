import {
  PRODUCT_ITEM_TYPE_OPTIONS,
} from '@/domain/products/productDefaults';
import type { ProductItemType } from '@/types/products';

type FilterOptionValue = string | number | boolean;

type FilterOption = {
  valor: FilterOptionValue;
  etiqueta: string;
};

const PRODUCT_ITEM_TYPE_FILTER_LABELS: Record<ProductItemType, string> = {
  product: 'Productos',
  service: 'Servicios',
  combo: 'Combos',
};

export const ordenAlfabetico: FilterOption[] = [
  { valor: 'asc', etiqueta: 'Ascendente' },
  { valor: 'desc', etiqueta: 'Descendente' },
];

export const ordenNumerico: FilterOption[] = [
  { valor: 'ascNum', etiqueta: 'Ascendente' },
  { valor: 'descNum', etiqueta: 'Descendente' },
];

export const ordenBooleano: FilterOption[] = [
  { valor: true, etiqueta: 'Sí' },
  { valor: false, etiqueta: 'No' },
];

export const opcionesOrden: Record<string, FilterOption[]> = {
  nombre: ordenAlfabetico,
  stock: ordenNumerico,
  inventariable: ordenBooleano,
  categoria: ordenAlfabetico,
  costo: ordenNumerico,
  precio: ordenNumerico,
  impuesto: ordenNumerico,
};

export const opcionesCriterio: FilterOption[] = [
  { valor: 'nombre', etiqueta: 'Nombre del Producto' },
  { valor: 'stock', etiqueta: 'Stock' },
  { valor: 'inventariable', etiqueta: 'Inventariable' },
  { valor: 'categoria', etiqueta: 'Categoría' },
  { valor: 'costo', etiqueta: 'Costo' },
  { valor: 'precio', etiqueta: 'Precio' },
  { valor: 'impuesto', etiqueta: 'Impuesto' },
];

export const opcionesInventariable: FilterOption[] = [
  { valor: 'todos', etiqueta: 'Todos' },
  { valor: 'si', etiqueta: 'Sí' },
  { valor: 'no', etiqueta: 'No' },
];

export const opcionesItemType: FilterOption[] = [
  { valor: 'todos', etiqueta: 'Todos' },
  ...PRODUCT_ITEM_TYPE_OPTIONS.map(({ value }) => ({
    valor: value,
    etiqueta: PRODUCT_ITEM_TYPE_FILTER_LABELS[value],
  })),
];

export const opcionesItbis: FilterOption[] = [
  { valor: 'todos', etiqueta: 'Todos' },
  { valor: '0.18', etiqueta: '18%' },
  { valor: '0.16', etiqueta: '16%' },
  { valor: '0', etiqueta: 'Exento' },
];

export const opcionesVisible: FilterOption[] = [
  { valor: 'todos', etiqueta: 'Todos' },
  { valor: 'si', etiqueta: 'Sí' },
  { valor: 'no', etiqueta: 'No' },
];
