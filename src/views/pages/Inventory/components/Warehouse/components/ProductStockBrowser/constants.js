export const PRODUCT_STOCK_FILTER_OPTIONS = [
  {
    value: 'multipleLots',
    label: 'Más de un lote activo',
    description: 'Productos con 2 o más lotes activos registrados',
    test: (product) => Number(product.uniqueBatches ?? 0) > 1,
  },
  {
    value: 'multipleStockRecords',
    label: 'Más de un registro de stock',
    description: 'Productos con más de un registro de stock activo',
    test: (product) => Number(product.stockRecords ?? 0) > 1,
  },
  {
    value: 'multipleLocations',
    label: 'Stock en varias ubicaciones',
    description: 'Productos distribuidos en más de una ubicación',
    test: (product) => Number(product.uniqueLocations ?? 0) > 1,
  },
  {
    value: 'hasExpiration',
    label: 'Con fecha de vencimiento',
    description: 'Productos con registros que incluyen fecha de vencimiento',
    test: (product) => {
      if (typeof product?.hasExpiration === 'boolean') {
        return product.hasExpiration;
      }
      return Array.isArray(product?.stockItems)
        ? product.stockItems.some((item) =>
            Boolean(item?.expirationDate || item?.expDate || item?.expiration),
          )
        : false;
    },
  },
];
