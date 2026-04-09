import { InputNumber, Table, Form } from 'antd';
import { useCallback, useMemo } from 'react';
import { useSelector, shallowEqual } from 'react-redux';

import { selectTaxReceiptEnabled } from '@/features/taxReceipt/taxReceiptSlice';
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
  const pricing = useSelector(
    (state: { updateProduct?: { product?: ProductRecord } }) =>
      state.updateProduct?.product?.pricing,
    shallowEqual,
  );
  const taxReceiptEnabled = useSelector(selectTaxReceiptEnabled);

  const calculateTableData = useCallback(
    (pricingData: ProductRecord['pricing']) => {
      const safePricing = pricingData ?? {};
      const costValue = Number(safePricing.cost) || 0;
      const prices: PriceRow[] = [
        {
          key: '1',
          cost: costValue,
          description: 'Precio Lista',
          name: ['pricing', 'listPrice'],
          amount: Number(safePricing.listPrice) || 0,
        },
        {
          key: '2',
          cost: costValue,
          description: 'Precio Medio',
          name: ['pricing', 'avgPrice'],
          amount: Number(safePricing.avgPrice) || 0,
        },
        {
          key: '3',
          cost: costValue,
          description: 'Precio Mínimo',
          name: ['pricing', 'minPrice'],
          amount: Number(safePricing.minPrice) || 0,
        },
        {
          key: '4',
          cost: costValue,
          description: 'Precio Tarjeta',
          name: ['pricing', 'cardPrice'],
          amount: Number(safePricing.cardPrice) || 0,
        },
        {
          key: '5',
          cost: costValue,
          description: 'Precio Oferta',
          name: ['pricing', 'offerPrice'],
          amount: Number(safePricing.offerPrice) || 0,
        },
      ];
      return prices.map((row) => {
        // Asegúrate de que tienes números válidos y no indefinidos
        const amount = Number(row.amount) || 0;
        // El tax puede ser un número directamente o un objeto con propiedad tax
        let taxValue = 0;
        if (typeof safePricing?.tax === 'number') {
          taxValue = safePricing.tax;
        } else if (
          typeof safePricing?.tax === 'object' &&
          safePricing?.tax?.tax !== undefined
        ) {
          taxValue = parseFloat(String(safePricing.tax.tax));
        } else if (typeof safePricing?.tax === 'string') {
          taxValue = parseFloat(safePricing.tax);
        }

        const costUnit = parseFloat(String(safePricing?.cost ?? 0)) || 0;

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
        const percentBenefits = isCalculationValid
          ? (margin / amount) * 100
          : 0;

        // Redondea y formatea los resultados
        return {
          ...row,
          itbis: itbis.toFixed(2),
          finalPrice: finalPrice.toFixed(2),
          margin: margin.toFixed(2),
          percentBenefits: `${isCalculationValid ? percentBenefits.toFixed(1) : '0'}%`,
        };
      });
    },
    [taxReceiptEnabled],
  );

  const tableData = useMemo(
    () => calculateTableData(pricing),
    [pricing, calculateTableData],
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
