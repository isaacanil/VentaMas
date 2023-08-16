// InventoryFilterAndSortMetadata.js
export const ordenAlfabetico = [
    { valor: 'asc', etiqueta: 'Ascendente' },
    { valor: 'desc', etiqueta: 'Descendente' },
];

export const ordenNumerico = [
    { valor: 'ascNum', etiqueta: 'Ascendente' },
    { valor: 'descNum', etiqueta: 'Descendente' },
];

export const ordenBooleano = [
    { valor: true, etiqueta: 'Sí' },
    { valor: false, etiqueta: 'No' },
];

export const opcionesOrden = {
    nombre: ordenAlfabetico,
    stock: ordenNumerico,
    inventariable: ordenBooleano,
    categoria: ordenAlfabetico,
    costo: ordenNumerico,
    precio: ordenNumerico,
    impuesto: ordenNumerico,
};

export const opcionesCriterio = [
    { valor: 'nombre', etiqueta: 'Nombre del Producto' },
    { valor: 'stock', etiqueta: 'Stock' },
    { valor: 'inventariable', etiqueta: 'Inventariable' },
    { valor: 'categoria', etiqueta: 'Categoría' },
    { valor: 'costo', etiqueta: 'Costo' },
    { valor: 'precio', etiqueta: 'Precio' },
    { valor: 'impuesto', etiqueta: 'Impuesto' },
];


export const opcionesInventariable = [
    { valor: 'todos', etiqueta: 'Todos' },
    { valor: 'si', etiqueta: 'Sí' },
    { valor: 'no', etiqueta: 'No' },
];

export const opcionesItbis = [
    { valor: 'todos', etiqueta: 'Todos' },
    { valor: '0.18', etiqueta: '18%' },
    { valor: '0.16', etiqueta: '16%' },
    { valor: '0', etiqueta: 'Exento' }
];

export const opcionesVisible = [
    { valor: 'todos', etiqueta: 'Todos' },
    { valor: 'si', etiqueta: 'Sí' },
    { valor: 'no', etiqueta: 'No' },
];