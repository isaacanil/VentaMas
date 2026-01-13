import { InputNumber, Table, Form } from 'antd';
import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { selectTaxReceiptEnabled } from '@/features/taxReceipt/taxReceiptSlice';
import { selectUpdateProductData } from '@/features/updateProduct/updateProductSlice';
import type { TableProps } from 'antd';
import type { ProductRecord } from '@/types/products';

type PriceRow = {
  key: string;
  cost: number;
  description: string;
  name: Array<string | number>;
  amount: number;
  itbis?: string;
  finalPrice?: string;
  margin?: string;
  percentBenefits?: string;
};

const columns: TableProps<PriceRow>['columns'] = [
  {
    title: 'Tipo',
    dataIndex: 'description',
    key: 'description',
  },
  {
    title: 'Monto',
    dataIndex: 'amount',
    key: 'amount',
    render: (text: number, record: PriceRow) => (
      <Form.Item
        name={record.name}
        rules={[
          { required: true, message: 'Rellenar' },
          {
            type: 'number',
            min: record?.cost || 0,
            message: `Minimo ${record?.cost}`,
          },
          // { type: 'number', min: 0, message: 'No puede ser menor al costo.' }
          // { type: 'number', min: 0, message: 'No puede ser negativa.' }
        ]}
        style={{ margin: 0 }}
      >
        <InputNumber defaultValue={text} min={0} step={0.1} />
      </Form.Item>
    ),
  },
  {
    title: 'Itbis',
    dataIndex: 'itbis',
    key: 'itbis',
  },
  {
    title: 'Total',
    dataIndex: 'finalPrice',
    key: 'finalPrice',
  },
  {
    title: 'Margen',
    dataIndex: 'margin',
    key: 'margin',
  },
  {
    title: '% Ganancia',
    dataIndex: 'percentBenefits',
    key: 'percentBenefits',
  },
  // Añade aquí más columnas como Itbis, Precio de venta Final, etc.
];

export const PriceCalculator = () => {
  const { product } = useSelector(selectUpdateProductData) as {
    product: ProductRecord;
  };
  const taxReceiptEnabled = useSelector(selectTaxReceiptEnabled);

  const calculateTableData = useCallback((productData: ProductRecord) => {
    const pricing = productData?.pricing ?? {};
    const costValue = Number(pricing.cost) || 0;
    const prices: PriceRow[] = [
      {
        key: '1',
        cost: costValue,
        description: 'Precio Lista',
        name: ['pricing', 'listPrice'],
        amount: Number(pricing.listPrice) || 0,
      },
      {
        key: '2',
        cost: costValue,
        description: 'Precio Medio',
        name: ['pricing', 'avgPrice'],
        amount: Number(pricing.avgPrice) || 0,
      },
      {
        key: '3',
        cost: costValue,
        description: 'Precio Mínimo',
        name: ['pricing', 'minPrice'],
        amount: Number(pricing.minPrice) || 0,
      },
      {
        key: '4',
        cost: costValue,
        description: 'Precio Tarjeta',
        name: ['pricing', 'cardPrice'],
        amount: Number(pricing.cardPrice) || 0,
      },
      {
        key: '5',
        cost: costValue,
        description: 'Precio Oferta',
        name: ['pricing', 'offerPrice'],
        amount: Number(pricing.offerPrice) || 0,
      },
    ];
    return prices.map((row) => {
      // Asegúrate de que tienes números válidos y no indefinidos
      const amount = Number(row.amount) || 0;
      // El tax puede ser un número directamente o un objeto con propiedad tax
      let taxValue = 0;
      if (typeof pricing?.tax === 'number') {
        taxValue = pricing.tax;
      } else if (
        typeof pricing?.tax === 'object' &&
        pricing?.tax?.tax !== undefined
      ) {
        taxValue = parseFloat(String(pricing.tax.tax));
      } else if (typeof pricing?.tax === 'string') {
        taxValue = parseFloat(pricing.tax);
      }

      const costUnit = parseFloat(String(pricing?.cost ?? 0)) || 0;

      // Realiza los cálculos
      const tax = taxValue / 100;
      const itbis = taxReceiptEnabled ? amount * tax : 0;
      const finalPrice = amount + itbis;
      // El margen es la ganancia = precio sin itbis - costo
      const rawMargin = amount - costUnit;
      const hasPrice = amount > 0;
      const margin = hasPrice ? rawMargin : 0;

      // Verifica si los cálculos son válidos
      const isCalculationValid =
        hasPrice && isFinite(margin) && isFinite(finalPrice);
      // Porcentaje de ganancia sobre el precio de venta (sin itbis)
      const percentBenefits = isCalculationValid ? (margin / amount) * 100 : 0;

      // Redondea y formatea los resultados
      return {
        ...row,
        itbis: itbis.toFixed(2),
        finalPrice: finalPrice.toFixed(2),
        margin: margin.toFixed(2),
        percentBenefits: `${isCalculationValid ? percentBenefits.toFixed(1) : '0'}%`,
      };
    });
  }, [taxReceiptEnabled]);

  const tableData = useMemo(
    () => calculateTableData(product),
    [product, calculateTableData],
  );
  // Nota: Ya no sincronizamos pricing.price con el precio final (con ITBIS).
  // El campo pricing.price debe almacenar exclusivamente el listPrice (sin impuestos).
  // La sincronización a listPrice ocurre en el reducer changeProductPrice cuando cambia pricing.listPrice.

  return (
    <Table
      columns={columns}
      dataSource={tableData}
      pagination={false}
      size="small"
    />
  );
};
