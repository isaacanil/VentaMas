type ColumnRow = {
  name?: string;
  description?: string;
};

export const columns: Array<{
  title: string;
  dataIndex: keyof ColumnRow;
  key: string;
  width?: string;
  sorter?: (a: ColumnRow, b: ColumnRow) => number;
  sortDirections?: Array<'descend' | 'ascend'>;
}> = [
  {
    title: 'Nombre',
    dataIndex: 'name',
    key: 'name',
    width: '20%',
    sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
    sortDirections: ['descend', 'ascend'],
  },
  {
    title: 'Descripción',
    dataIndex: 'description',
    key: 'description',
    width: '20%',
    sorter: (a, b) =>
      (a.description || '').localeCompare(b.description || ''),
    sortDirections: ['descend', 'ascend'],
  },
];

export default columns;
