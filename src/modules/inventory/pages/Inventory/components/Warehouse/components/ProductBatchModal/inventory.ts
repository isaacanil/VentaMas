export interface Location {
  warehouse: string;
  shelf?: string;
  row?: string;
  segment?: string;
}

export interface Batch {
  id: string;
  batchNumber: string;
  location: Location;
  quantity: number;
  expirationDate: string;
}

export interface Product {
  id: string;
  name: string;
  batches: Batch[];
}

export const sampleProduct: Product = {
  id: '1',
  name: 'Producto A',
  batches: [
    {
      id: '1',
      batchNumber: 'BATCH001',
      location: {
        warehouse: 'Almacén 1',
        shelf: 'Estante A',
        row: 'Fila 1',
        segment: 'Segmento 1',
      },
      quantity: 100,
      expirationDate: '2024-06-30',
    },
    {
      id: '2',
      batchNumber: 'BATCH001',
      location: { warehouse: 'Almacén 1', shelf: 'Estante B' },
      quantity: 50,
      expirationDate: '2024-06-30',
    },
    {
      id: '3',
      batchNumber: 'BATCH002',
      location: { warehouse: 'Almacén 2' },
      quantity: 75,
      expirationDate: '2024-07-15',
    },
    {
      id: '4',
      batchNumber: 'BATCH003',
      location: { warehouse: 'Almacén 1', shelf: 'Estante D', row: 'Fila 3' },
      quantity: 200,
      expirationDate: '2024-08-31',
    },
  ],
};
