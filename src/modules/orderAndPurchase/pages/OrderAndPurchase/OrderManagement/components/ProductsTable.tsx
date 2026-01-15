import { DeleteOutlined } from '@/constants/icons/antd';
import { Table, Button, Input, Form, InputNumber } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DateTime } from 'luxon';
import type { ReactNode } from 'react';

import DatePicker from '@/components/DatePicker';
import { formatMoney, formatQuantity } from '@/utils/formatters';
import type { PurchaseBackOrderRef, PurchaseReplenishment } from '@/utils/purchase/types';
import ProductModal from '@/modules/orderAndPurchase/pages/OrderAndPurchase/shared/ProductModal';

type OrderReplenishment = PurchaseReplenishment & {
  key?: string | number;
  originalId?: string;
};

type EditableInputType = 'text' | 'number' | 'date' | 'productModal';

interface EditableCellProps {
  dataIndex: keyof OrderReplenishment;
  inputType?: EditableInputType;
  record: OrderReplenishment;
  onSave: (record: OrderReplenishment, dataIndex: keyof OrderReplenishment, value: unknown) => void;
  onCellClick?: () => void;
  children?: ReactNode;
}

interface ProductsTableProps {
  products: OrderReplenishment[];
  removeProduct: (payload: { key?: string | number; id?: string }) => void;
  onEditProduct: (payload: OrderReplenishment & { index?: string | number }) => void;
  onQuantityClick: (record: OrderReplenishment) => void;
}

const EditableCell = (props: EditableCellProps) => {
  const { dataIndex, inputType, record, onSave, onCellClick, children, ...restProps } = props;
  const isProductModal = inputType === 'productModal';
  const isNumberInput = inputType === 'number';
  const isDatePicker = inputType === 'date';
  const placeholder = typeof children === 'string' ? children : undefined;

  const handleValueChange = (value: unknown) => {
    onSave(record, dataIndex, value);
  };

  const handleProductSelect = (product: unknown) => {
    onSave(record, dataIndex, product);
  };

  const handleDateChange = (date: DateTime | null) => {
    const timestamp = date ? date.toMillis() : null;
    onSave(record, dataIndex, timestamp);
  };

  const renderInput = () => {
    if (isProductModal) {
      return (
        <ProductModal
          onSelect={handleProductSelect}
          selectedProduct={{
            name:
              typeof record[dataIndex] === 'string' ||
              typeof record[dataIndex] === 'number'
                ? String(record[dataIndex])
                : '',
            id: record.id,
          }}
        >
          <Input
            value={
              typeof record[dataIndex] === 'string' ||
              typeof record[dataIndex] === 'number'
                ? String(record[dataIndex])
                : ''
            }
            placeholder="Seleccionar producto"
            readOnly
          />
        </ProductModal>
      );
    }
    if (isNumberInput) {
      const numericValue =
        typeof record[dataIndex] === 'number' || typeof record[dataIndex] === 'string'
          ? Number(record[dataIndex])
          : 0;
      return (
        <InputNumber
          value={numericValue}
          onChange={handleValueChange}
          onBlur={(e) => {
            const val = e.target.value.replace(/,/g, '');
            handleValueChange(val);
          }}
          min={dataIndex === 'quantity' ? 1 : 0}
          formatter={(value) =>
            `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
          }
          parser={(value) => String(value ?? '').replace(/\$\s?|(,*)/g, '') as any}
          placeholder={placeholder}
        />
      );
    }
    if (isDatePicker) {
      return (
        <DatePicker
          value={
            record[dataIndex]
              ? (DateTime.fromMillis(Number(record[dataIndex])) as any)
              : null
          }
          onChange={handleDateChange}
          format="DD/MM/YY"
          style={{ width: '100%' }}
        />
      );
    }
    return (
      <Input
        value={
          typeof record[dataIndex] === 'string' || typeof record[dataIndex] === 'number'
            ? String(record[dataIndex])
            : ''
        }
        onChange={(e) => handleValueChange(e.target.value)}
        onBlur={(e) => handleValueChange(e.target.value)}
      />
    );
  };

  return (
    <td {...restProps} onClick={onCellClick}>
      <Form.Item
        style={{ margin: 0 }}
        noStyle
      >
        {renderInput()}
      </Form.Item>
    </td>
  );
};

const ProductsTable = ({
  products,
  removeProduct,
  onEditProduct,
  onQuantityClick,
}: ProductsTableProps) => {
  const [form] = Form.useForm();

  const handleSave = (
    record: OrderReplenishment,
    dataIndex: keyof OrderReplenishment,
    value: unknown,
  ) => {
    let newData: OrderReplenishment & { originalId?: string } = {
      ...record,
      originalId: record.id,
    };

    if (dataIndex === 'name' && typeof value === 'object' && value !== null) {
      const product = value as Record<string, any>;
      newData = {
        ...newData,
        id: product.id as string | undefined,
        name: product.name as string | undefined,
        baseCost: (product.pricing?.cost as number | undefined) || 0,
        taxPercentage:
          (product.pricing?.tax as number | undefined) ??
          (product.taxPercentage as number | undefined) ??
          0, // Prefill ITBIS from product pricing/tax if available
        purchaseQuantity: newData.purchaseQuantity || 1,
      };
    } else {
      let finalValue = value;
      // Date handling is now inside EditableCell
      const numericFields: Array<keyof OrderReplenishment> = [
        'quantity',
        'baseCost',
        'taxPercentage',
        'freight',
        'otherCosts',
      ];
      if (numericFields.includes(dataIndex)) {
        finalValue = Number(value) || 0;
      }
      newData[dataIndex] = finalValue;
    }

    if (dataIndex === 'quantity') {
      const finalQty = Number(newData.quantity) || 0;
      if (
        !newData.selectedBackOrders ||
        newData.selectedBackOrders.length === 0
      ) {
        newData.quantity = finalQty;
        newData.purchaseQuantity = finalQty;
      } else {
        const backordersQuantity = (
          newData.selectedBackOrders as PurchaseBackOrderRef[]
        ).reduce((sum, bo) => sum + (Number((bo as any).quantity) || 0), 0);
        newData.quantity = finalQty;
        newData.purchaseQuantity = finalQty + backordersQuantity;
      }
    }

    onEditProduct({ ...newData, index: record.key });
  };

  const defaultColumns: ColumnsType<OrderReplenishment> = [
    {
      title: 'Producto',
      dataIndex: 'name',
      ellipsis: {
        showTitle: true,
      },
      render: (_, record) => (
        <EditableCell
          record={record}
          inputType="productModal"
          dataIndex="name"
          onSave={handleSave}
        >
          {record.name}
        </EditableCell>
      ),
    },
    {
      title: 'Cantidad',
      dataIndex: 'quantity',
      render: (_, record) => (
        <EditableCell
          record={record}
          inputType="number"
          dataIndex="quantity"
          onSave={handleSave}
          onCellClick={() => onQuantityClick(record)} // Keep this for backorders modal
        >
          {record.quantity}
        </EditableCell>
      ),
    },
    {
      title: 'Costo Base',
      dataIndex: 'baseCost',
      render: (_, record) => (
        <EditableCell
          record={record}
          inputType="number"
          dataIndex="baseCost"
          onSave={handleSave}
        >
          {formatMoney(record.baseCost)}
        </EditableCell>
      ),
    },
    {
      title: 'Subtotal',
      dataIndex: 'subtotal',
      fixed: 'right',
      render: (value) => formatMoney(value),
    },
    {
      title: '',
      key: 'actions',
      fixed: 'right',
      width: 70,
      render: (_, record) => (
        <div
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'end',
          }}
        >
          <Button
            icon={<DeleteOutlined />}
            danger
            onClick={() =>
              removeProduct({ key: record.key, id: record.id || record.originalId })
            }
          />
        </div>
      ),
    },
  ];

  return (
    <>
      <Form form={form} component={false}>
        <Table
          className="editable-row-table"
          size="small"
          scroll={{ x: 1300 }}
          columns={defaultColumns}
          dataSource={products.map((product, index) => ({
            ...product,
            key: product.key || product.id || index,
          }))}
          rowKey="key"
          pagination={false}
          summary={(pageData) => {
            let totalQuantity = 0;
            let totalSubtotal = 0;

            pageData.forEach((record) => {
              const { quantity, subtotal } = record;
              const displayQty = Number(quantity) || 0;
              const s = Number(subtotal) || 0;

              totalQuantity += displayQty;
              totalSubtotal += s;
            });

            return (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0}>Total</Table.Summary.Cell>
                <Table.Summary.Cell index={1}>
                  <span style={{ fontWeight: 'bold' }}>{formatQuantity(totalQuantity, 0)}</span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2}>
                  {/* Costo Base total se muestra en blanco */}
                  <span style={{ fontWeight: 'bold' }}>{''}</span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3}>
                  <span style={{ fontWeight: 'bold' }}>{formatMoney(totalSubtotal)}</span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4} />
              </Table.Summary.Row>
            );
          }}
        />
      </Form>
    </>
  );
};

export default ProductsTable;
