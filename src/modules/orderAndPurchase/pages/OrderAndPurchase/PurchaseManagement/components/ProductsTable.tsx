import { DeleteOutlined } from '@/constants/icons/antd';
import { Table, Button, Input, Form, InputNumber } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DateTime } from 'luxon';
import { useState } from 'react';
import type { ReactNode } from 'react';
import DatePicker from '@/components/DatePicker';
import {
  formatMoney,
  formatPercentage,
  formatQuantity,
} from '@/utils/formatters';
import type { PurchaseReplenishment } from '@/utils/purchase/types';
import { resolvePurchaseLineQuantities } from '@/utils/purchase/workflow';
import ProductModal from '@/modules/orderAndPurchase/pages/OrderAndPurchase/shared/ProductModal';
import {
  resolveReceiptRowKey,
  resolveReceivingNowValue,
  stripTransientReceiptFields,
} from '../utils/receiptDraft';
import type { PurchaseMode } from '../types';

interface PurchaseRow extends PurchaseReplenishment {
  key?: string | number;
  originalId?: string;
}

type EditableInputType = 'productModal' | 'date' | 'number' | 'text';

interface EditableCellProps {
  dataIndex: keyof PurchaseRow;
  inputType: EditableInputType;
  record: PurchaseRow;
  value?: number | string | null;
  onSave: (
    record: PurchaseRow,
    dataIndex: keyof PurchaseRow,
    value: unknown,
  ) => void;
  children?: ReactNode;
}

const EditableCell = (props: EditableCellProps) => {
  const { dataIndex, inputType, record, value, onSave, children } = props;
  const isProductModal = inputType === 'productModal';
  const isDatePicker = inputType === 'date';
  const isNumberInput = inputType === 'number';
  const placeholder = typeof children === 'string' ? children : undefined;
  const currentValue = value ?? record[dataIndex];

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
  const currentTextValue = typeof currentValue === 'string' ? currentValue : '';
  const currentNumberValue = Number(currentValue) || 0;
  const inputControl = isProductModal ? (
    <ProductModal
      onSelect={handleProductSelect}
      selectedProduct={{ name: currentTextValue, id: record.id }}
    >
      <Input
        value={currentTextValue}
        placeholder="Seleccionar producto"
        readOnly
      />
    </ProductModal>
  ) : isNumberInput ? (
    <InputNumber
      value={currentNumberValue}
      onChange={handleValueChange}
      onBlur={(event) => {
        const val = event.target.value.replace(/,/g, '');
        handleValueChange(val);
      }}
      min={dataIndex === 'quantity' ? 1 : 0}
      formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
      parser={(value) => value?.replace(/\$\s?|(,*)/g, '') ?? ''}
      placeholder={placeholder}
    />
  ) : isDatePicker ? (
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
  ) : (
    <Input
      value={currentTextValue}
      onChange={(event) => handleValueChange(event.target.value)}
      onBlur={(event) => handleValueChange(event.target.value)}
    />
  );

  return <Form.Item noStyle>{inputControl}</Form.Item>;
};

interface ProductsTableProps {
  products: PurchaseRow[];
  removeProduct: (payload: { key?: string | number; id?: string }) => void;
  onEditProduct: (product: PurchaseRow) => void;
  onQuantityClick: (record: PurchaseRow) => Promise<void> | void;
  mode?: PurchaseMode;
  initialReceivedMap?: Map<string | number, number>;
}

const ProductsTable = ({
  products,
  removeProduct,
  onEditProduct,
  onQuantityClick,
  mode = 'create',
  initialReceivedMap = new Map(),
}: ProductsTableProps) => {
  const [loadingQuantity, setLoadingQuantity] = useState<
    string | number | null
  >(null);
  const [form] = Form.useForm();
  const isReceiptMode = mode === 'complete';

  const handleSave = (
    record: PurchaseRow,
    dataIndex: keyof PurchaseRow,
    value: unknown,
  ) => {
    let newData: PurchaseRow = {
      ...stripTransientReceiptFields(record),
      originalId: record.id,
    };

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
      if ((dataIndex as string) !== 'receivingNow') {
        newData[dataIndex] = finalValue as never;
      }
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
        const backordersQuantity = newData.selectedBackOrders.reduce(
          (sum, bo) => sum + Number(bo.quantity || 0),
          0,
        );
        newData.quantity = finalQty;
        newData.purchaseQuantity = finalQty + backordersQuantity;
      }
    }

    if (
      dataIndex === 'receivedQuantity' ||
      dataIndex === 'orderedQuantity' ||
      dataIndex === 'purchaseQuantity' ||
      (dataIndex as string) === 'receivingNow'
    ) {
      if ((dataIndex as string) === 'receivingNow') {
        const initial =
          initialReceivedMap.get(resolveReceiptRowKey(record, '')) || 0;
        const receivingNow = Number(value) || 0;
        newData.receivedQuantity = initial + receivingNow;
      }

      const normalized = resolvePurchaseLineQuantities({
        ...newData,
        orderedQuantity:
          dataIndex === 'orderedQuantity' ? value : newData.orderedQuantity,
        purchaseQuantity:
          dataIndex === 'purchaseQuantity' ? value : newData.purchaseQuantity,
        receivedQuantity:
          dataIndex === 'receivedQuantity' ||
          (dataIndex as string) === 'receivingNow'
            ? newData.receivedQuantity
            : newData.receivedQuantity,
      });

      newData = {
        ...newData,
        orderedQuantity: normalized.orderedQuantity,
        receivedQuantity: normalized.receivedQuantity,
        pendingQuantity: normalized.pendingQuantity,
      };
    }

    onEditProduct(newData);
  };

  const handleQuantityClick = async (record: PurchaseRow) => {
    if (loadingQuantity === record.key) return;

    setLoadingQuantity(record.key ?? null);
    const quantityClickError = await onQuantityClick(record)
      .then(() => null)
      .catch((error) => error);

    if (quantityClickError) {
      console.error('Error in handleQuantityClick:', quantityClickError);
    }

    setLoadingQuantity(null);
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

  const hasExpirationDates = products.some((p) => {
    const millis = Number(p.expirationDate);
    return Number.isFinite(millis) && millis > 0;
  });

  const receiptColumns: ColumnsType<PurchaseRow> = [
    {
      title: 'Producto',
      dataIndex: 'name',
      width: 240,
      ellipsis: { showTitle: true },
      render: (value) => (
        <span style={{ fontWeight: 600 }}>
          {value || 'Producto sin nombre'}
        </span>
      ),
    },
    ...(hasExpirationDates
      ? [
          {
            title: 'F. Expiración',
            dataIndex: 'expirationDate',
            render: (value: any) => {
              const millis = Number(value);
              if (!Number.isFinite(millis) || millis <= 0) return 'N/A';
              return DateTime.fromMillis(millis).toFormat('dd/MM/yyyy');
            },
          },
        ]
      : []),
    {
      title: 'Cant. ordenada',
      dataIndex: 'orderedQuantity',
      align: 'right',
      render: (_value, record) =>
        formatQuantity(
          resolvePurchaseLineQuantities(record).orderedQuantity,
          0,
        ),
    },
    {
      title: 'Recibida antes',
      dataIndex: 'receivedBefore',
      align: 'right',
      render: (_value, record) => {
        const initial =
          initialReceivedMap.get(resolveReceiptRowKey(record, '')) || 0;
        return (
          <span style={{ color: '#8c8c8c' }}>{formatQuantity(initial, 0)}</span>
        );
      },
    },
    {
      title: 'Recibir ahora',
      dataIndex: 'receivingNow',
      width: 150,
      render: (_value, record, index) => {
        const receivingNow = resolveReceivingNowValue(
          record,
          initialReceivedMap,
          index,
        );

        return (
          <EditableCell
            record={record}
            inputType="number"
            dataIndex={'receivingNow' as any}
            value={receivingNow}
            onSave={handleSave}
          >
            {receivingNow > 0 ? formatQuantity(receivingNow, 0) : ''}
          </EditableCell>
        );
      },
    },
    {
      title: 'Pendiente luego',
      dataIndex: 'pendingAfter',
      align: 'right',
      render: (_value, record) => {
        const pending = resolvePurchaseLineQuantities(record).pendingQuantity;
        return (
          <span
            style={{
              fontWeight: 'bold',
              color: pending > 0 ? '#faad14' : '#52c41a',
            }}
          >
            {formatQuantity(pending, 0)}
          </span>
        );
      },
    },
  ];

  const dataSource: PurchaseRow[] = products.map((product, index) => ({
    ...product,
    key: product.key || product.id || index,
  }));

  const visibleDataSource = isReceiptMode
    ? dataSource.filter((row) => {
        const key = resolveReceiptRowKey(row, row.key ?? '');
        const initialReceived = initialReceivedMap.get(key) ?? 0;
        const { orderedQuantity } = resolvePurchaseLineQuantities(row);
        return orderedQuantity - initialReceived > 0;
      })
    : dataSource;

  const scrollX = isReceiptMode ? 700 : 1300;

  return (
    <Form form={form} component={false}>
      <Table
        className="editable-row-table"
        size="small"
        scroll={{ x: scrollX }}
        columns={isReceiptMode ? receiptColumns : defaultColumns}
        dataSource={visibleDataSource}
        rowKey={(record) => record.key || record.id}
        pagination={false}
        summary={(pageData) => {
          if (isReceiptMode) {
            let totalOrdered = 0;
            let totalReceivedBefore = 0;
            let totalReceivingNow = 0;
            let totalPendingAfter = 0;

            pageData.forEach((record) => {
              const quantities = resolvePurchaseLineQuantities(record);
              const initial =
                initialReceivedMap.get(
                  resolveReceiptRowKey(record, record.key || ''),
                ) || 0;

              totalOrdered += quantities.orderedQuantity;
              totalReceivedBefore += initial;
              totalReceivingNow += quantities.receivedQuantity - initial;
              totalPendingAfter += quantities.pendingQuantity;
            });

            // Adjust indexes based on Expiration Column visibility
            const colOffset = hasExpirationDates ? 1 : 0;

            return (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0}>Total</Table.Summary.Cell>
                {hasExpirationDates && <Table.Summary.Cell index={1} />}
                <Table.Summary.Cell index={1 + colOffset} align="right">
                  <span style={{ fontWeight: 'bold' }}>
                    {formatQuantity(totalOrdered, 0)}
                  </span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2 + colOffset} align="right">
                  <span style={{ fontWeight: 'bold', color: '#8c8c8c' }}>
                    {formatQuantity(totalReceivedBefore, 0)}
                  </span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3 + colOffset}>
                  <span style={{ fontWeight: 'bold' }}>
                    {formatQuantity(totalReceivingNow, 0)}
                  </span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4 + colOffset} align="right">
                  <span
                    style={{
                      fontWeight: 'bold',
                      color: totalPendingAfter > 0 ? '#faad14' : '#52c41a',
                    }}
                  >
                    {formatQuantity(totalPendingAfter, 0)}
                  </span>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            );
          }

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
            const qtyForMoney =
              Number(quantity) || Number(purchaseQuantity) || 0;
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
                <span style={{ fontWeight: 'bold' }}>
                  {formatMoney(totalTax)}
                </span>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={5}>
                <span style={{ fontWeight: 'bold' }}>
                  {formatMoney(totalFreight)}
                </span>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={6}>
                <span style={{ fontWeight: 'bold' }}>
                  {formatMoney(totalOtherCosts)}
                </span>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={7}>
                <span style={{ fontWeight: 'bold' }}>{''}</span>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={8}>
                <span style={{ fontWeight: 'bold' }}>
                  {formatMoney(totalSubtotal)}
                </span>
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
