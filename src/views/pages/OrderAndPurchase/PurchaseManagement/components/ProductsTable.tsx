import { DeleteOutlined } from '@ant-design/icons';
import { Table, Button, Input, Form, InputNumber } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DateTime } from 'luxon';
import { useState } from 'react';
import DatePicker from '@/components/DatePicker';
import { formatMoney, formatPercentage, formatQuantity } from '@/utils/formatters';
import type { PurchaseReplenishment } from '@/utils/purchase/types';
import ProductModal from '@/views/pages/OrderAndPurchase/shared/ProductModal';

interface PurchaseRow extends PurchaseReplenishment {
  key?: string | number;
  originalId?: string;
}

type EditableInputType = 'productModal' | 'date' | 'number' | 'text';

interface EditableCellProps {
  dataIndex: keyof PurchaseRow;
  inputType: EditableInputType;
  record: PurchaseRow;
  onSave: (record: PurchaseRow, dataIndex: keyof PurchaseRow, value: unknown) => void;
}

const EditableCell = ({
  dataIndex,
  inputType,
  record,
  onSave,
}: EditableCellProps) => {
  const isProductModal = inputType === 'productModal';
  const isDatePicker = inputType === 'date';
  const isNumberInput = inputType === 'number';

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
          selectedProduct={{ name: record[dataIndex] as string, id: record.id }}
        >
          <Input
            value={record[dataIndex] as string}
            placeholder="Seleccionar producto"
            readOnly
          />
        </ProductModal>
      );
    }
    if (isNumberInput) {
      return (
        <InputNumber
          value={record[dataIndex] as number}
          onChange={handleValueChange}
          onBlur={(event) => {
            const val = event.target.value.replace(/,/g, '');
            handleValueChange(val);
          }}
          min={dataIndex === 'quantity' ? 1 : 0}
          formatter={(value) =>
            `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
          }
          parser={(value) => value?.replace(/\$\s?|(,*)/g, '') ?? ''}
        />
      );
    }
    if (isDatePicker) {
      return (
        <DatePicker
          value={
            record[dataIndex]
              ? DateTime.fromMillis(Number(record[dataIndex]))
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
        value={record[dataIndex] as string}
        onChange={(event) => handleValueChange(event.target.value)}
        onBlur={(event) => handleValueChange(event.target.value)}
      />
    );
  };

  return (
    <td>
      <Form.Item style={{ margin: 0 }} noStyle>
        {renderInput()}
      </Form.Item>
    </td>
  );
};

interface ProductsTableProps {
  products: PurchaseRow[];
  removeProduct: (payload: { key?: string | number; id?: string }) => void;
  onEditProduct: (product: PurchaseRow) => void;
  onQuantityClick: (record: PurchaseRow) => Promise<void> | void;
}

const ProductsTable = ({
  products,
  removeProduct,
  onEditProduct,
  onQuantityClick,
}: ProductsTableProps) => {
  const [loadingQuantity, setLoadingQuantity] = useState<string | number | null>(null);
  const [form] = Form.useForm();

  const handleSave = (
    record: PurchaseRow,
    dataIndex: keyof PurchaseRow,
    value: unknown,
  ) => {
    let newData: PurchaseRow = { ...record, originalId: record.id };

    if (dataIndex === 'name' && typeof value === 'object' && value !== null) {
      const product = value as {
        id?: string;
        name?: string;
        pricing?: { cost?: number; tax?: number };
        taxPercentage?: number;
      };
      newData = {
        ...newData,
        id: product.id,
        name: product.name,
        baseCost: product.pricing?.cost || 0,
        taxPercentage: product.pricing?.tax ?? product.taxPercentage ?? 0,
      };
    } else {
      let finalValue: unknown = value;
      if (
        ['baseCost', 'taxPercentage', 'freight', 'otherCosts'].includes(
          dataIndex as string,
        )
      ) {
        finalValue = Number(value) || 0;
      }
      newData[dataIndex] = finalValue as never;
    }

    if (dataIndex === 'quantity') {
      const finalQty = Number(newData.quantity) || 0;
      if (!newData.selectedBackOrders || newData.selectedBackOrders.length === 0) {
        newData.quantity = finalQty;
        newData.purchaseQuantity = finalQty;
      } else {
        const backordersQuantity = newData.selectedBackOrders.reduce(
          (sum, bo) => sum + Number(bo.quantity || 0),
          0,
        );
        newData.quantity = finalQty;
        newData.purchaseQuantity = finalQty + backordersQuantity;
      }
    }

    onEditProduct(newData);
  };

  const handleQuantityClick = async (record: PurchaseRow) => {
    if (loadingQuantity === record.key) return;

    setLoadingQuantity(record.key ?? null);

    try {
      await onQuantityClick(record);
    } catch (error) {
      console.error('Error in handleQuantityClick:', error);
    } finally {
      setLoadingQuantity(null);
    }
  };

  const defaultColumns: ColumnsType<PurchaseRow> = [
    {
      title: 'Producto',
      dataIndex: 'name',
      width: 200,
      ellipsis: { showTitle: true },
      render: (_value, record) => (
        <EditableCell
          record={record}
          inputType="productModal"
          dataIndex="name"
          onSave={handleSave}
        />
      ),
    },
    {
      title: 'F. Expiración',
      dataIndex: 'expirationDate',
      render: (_value, record) => (
        <EditableCell
          record={record}
          inputType="date"
          dataIndex="expirationDate"
          onSave={handleSave}
        />
      ),
    },
    {
      title: 'Cantidad',
      dataIndex: 'quantity',
      render: (_value, record) => (
        <EditableCell
          record={record}
          inputType="number"
          dataIndex="quantity"
          onSave={handleSave}
        />
      ),
      onCell: (record) => ({
        onClick: () => handleQuantityClick(record),
      }),
    },
    {
      title: 'Costo Base',
      dataIndex: 'baseCost',
      render: (_value, record) => (
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
      title: 'ITBIS',
      dataIndex: 'taxPercentage',
      render: (_value, record) => (
        <EditableCell
          record={record}
          inputType="number"
          dataIndex="taxPercentage"
          onSave={handleSave}
        >
          {formatPercentage(record.taxPercentage)}
        </EditableCell>
      ),
    },
    {
      title: 'Flete',
      dataIndex: 'freight',
      render: (_value, record) => (
        <EditableCell
          record={record}
          inputType="number"
          dataIndex="freight"
          onSave={handleSave}
        >
          {formatMoney(record.freight)}
        </EditableCell>
      ),
    },
    {
      title: 'Otros Costos',
      dataIndex: 'otherCosts',
      render: (_value, record) => (
        <EditableCell
          record={record}
          inputType="number"
          dataIndex="otherCosts"
          onSave={handleSave}
        >
          {formatMoney(record.otherCosts)}
        </EditableCell>
      ),
    },
    {
      title: 'Costo Unitario',
      dataIndex: 'unitCost',
      render: (value) => formatMoney(value as number),
    },
    {
      title: 'Subtotal',
      dataIndex: 'subtotal',
      fixed: 'right',
      render: (value) => formatMoney(value as number),
    },
    {
      title: '',
      key: 'actions',
      fixed: 'right',
      width: 70,
      render: (_value, record) => (
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
              removeProduct({
                key: record.key,
                id: record.id || record.originalId,
              })
            }
          />
        </div>
      ),
    },
  ];

  const dataSource: PurchaseRow[] = products.map((product, index) => ({
    ...product,
    key: product.key || product.id || index,
  }));

  return (
    <Form form={form} component={false}>
      <Table
        className="editable-row-table"
        size="small"
        scroll={{ x: 1300 }}
        columns={defaultColumns}
        dataSource={dataSource}
        rowKey={(record) => record.key || record.id}
        pagination={false}
        summary={(pageData) => {
          let totalQuantity = 0;
          let totalTax = 0;
          let totalFreight = 0;
          let totalOtherCosts = 0;
          let totalSubtotal = 0;

          pageData.forEach((record) => {
            const {
              quantity,
              baseCost,
              taxPercentage,
              freight,
              otherCosts,
              subtotal,
              purchaseQuantity,
            } = record;
            const displayQty = Number(quantity) || 0;
            const qtyForMoney = Number(quantity) || Number(purchaseQuantity) || 0;
            const b = Number(baseCost) || 0;
            const tPct = Number(taxPercentage) || 0;
            const f = Number(freight) || 0;
            const o = Number(otherCosts) || 0;
            const s = Number(subtotal) || 0;

            const taxRate = tPct > 1 ? tPct / 100 : tPct;
            const unitTax = b * taxRate;

            totalQuantity += displayQty;
            totalTax += qtyForMoney * unitTax;
            totalFreight += f;
            totalOtherCosts += o;
            totalSubtotal += s;
          });

          return (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0}>Total</Table.Summary.Cell>
              <Table.Summary.Cell index={1} />
              <Table.Summary.Cell index={2}>
                <span style={{ fontWeight: 'bold' }}>
                  {formatQuantity(totalQuantity, 0)}
                </span>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={3}>
                <span style={{ fontWeight: 'bold' }}>{''}</span>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={4}>
                <span style={{ fontWeight: 'bold' }}>{formatMoney(totalTax)}</span>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={5}>
                <span style={{ fontWeight: 'bold' }}>{formatMoney(totalFreight)}</span>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={6}>
                <span style={{ fontWeight: 'bold' }}>{formatMoney(totalOtherCosts)}</span>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={7}>
                <span style={{ fontWeight: 'bold' }}>{''}</span>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={8}>
                <span style={{ fontWeight: 'bold' }}>{formatMoney(totalSubtotal)}</span>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={9} />
            </Table.Summary.Row>
          );
        }}
      />
    </Form>
  );
};

export default ProductsTable;
