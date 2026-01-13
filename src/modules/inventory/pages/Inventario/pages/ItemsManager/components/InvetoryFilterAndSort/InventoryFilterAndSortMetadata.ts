type FilterOptionValue = string | number | boolean;

type FilterOption = {
  valor: FilterOptionValue;
  etiqueta: string;
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
  { valor: true, etiqueta: 'S?' },
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
  { valor: 'categoria', etiqueta: 'Categor?a' },
  { valor: 'costo', etiqueta: 'Costo' },
  { valor: 'precio', etiqueta: 'Precio' },
  { valor: 'impuesto', etiqueta: 'Impuesto' },
];

export const opcionesInventariable: FilterOption[] = [
  { valor: 'todos', etiqueta: 'Todos' },
  { valor: 'si', etiqueta: 'S?' },
  { valor: 'no', etiqueta: 'No' },
];

export const opcionesItbis: FilterOption[] = [
  { valor: 'todos', etiqueta: 'Todos' },
  { valor: '0.18', etiqueta: '18%' },
  { valor: '0.16', etiqueta: '16%' },
  { valor: '0', etiqueta: 'Exento' },
];

export const opcionesVisible: FilterOption[] = [
  { valor: 'todos', etiqueta: 'Todos' },
  { valor: 'si', etiqueta: 'S?' },
  { valor: 'no', etiqueta: 'No' },
];
