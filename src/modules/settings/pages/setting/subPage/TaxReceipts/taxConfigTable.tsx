// Datos estáticos para las cabeceras de la tabla
export interface TaxConfigTableColumn {
  name: string;
}

export const settingDataTaxTable: ReadonlyArray<TaxConfigTableColumn> = [
  { name: 'NOMBRE' },
  { name: 'TIPO' },
  { name: 'SERIE' },
  { name: 'SECUENCIA' },
  { name: 'INCREMENTO' },
  { name: 'CANTIDAD' },
];
