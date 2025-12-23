import { DeleteOutlined } from '@ant-design/icons';
import {
  Table,
  Button,
  Input,
  Form,
  InputNumber,
} from 'antd';
import DatePicker from '@/components/DatePicker';
import { DateTime } from 'luxon';
import React, { useState } from 'react';

import { formatMoney, formatPercentage, formatQuantity } from '@/utils/formatters';
import ProductModal from '@/views/pages/OrderAndPurchase/shared/ProductModal';

const EditableCell = ({
  dataIndex,
  inputType,
  record,
  onSave,
  ...restProps
}) => {
  const isProductModal = inputType === 'productModal';
  const isDatePicker = inputType === 'date';
  const isNumberInput = inputType === 'number';

  const handleValueChange = (value) => {
    onSave(record, dataIndex, value);
  };

  const handleProductSelect = (product) => {
    onSave(record, dataIndex, product);
  };

  const handleDateChange = (date) => {
    const timestamp = date ? date.toMillis() : null;
    onSave(record, dataIndex, timestamp);
  };

  const renderInput = () => {
    if (isProductModal) {
      return (
        <ProductModal
          onSelect={handleProductSelect}
          selectedProduct={{ name: record[dataIndex], id: record.id }} // Pass ID as well
        >
          <Input
            value={record[dataIndex]} // Display product name
            placeholder="Seleccionar producto"
            readOnly
          />
        </ProductModal>
      );
    }
    if (isNumberInput) {
      return (
        <InputNumber
          value={record[dataIndex]}
          onChange={handleValueChange}
          onBlur={(e) => {
            const val = e.target.value.replace(/,/g, '');
            handleValueChange(val);
          }}
          min={dataIndex === 'quantity' ? 1 : 0}
          formatter={(value) =>
            `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
          }
          parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
        />
      );
    }
    if (isDatePicker) {
      return (
        <DatePicker
          value={
            record[dataIndex] ? DateTime.fromMillis(record[dataIndex]) : null
          }
          onChange={handleDateChange}
          format="DD/MM/YY"
          style={{ width: '100%' }}
        />
      );
    }
    return (
      <Input
        value={record[dataIndex]}
        onChange={(e) => handleValueChange(e.target.value)}
        onBlur={(e) => handleValueChange(e.target.value)}
      />
    );
  };

  return (
    <td {...restProps}>
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
}) => {
  const [loadingQuantity, setLoadingQuantity] = useState(null); // Track which row is loading quantity
  const [form] = Form.useForm();

  const handleSave = (record, dataIndex, value) => {
    let newData = { ...record, originalId: record.id };

    if (dataIndex === 'name' && typeof value === 'object' && value !== null) {
      const product = value;
      newData = {
        ...newData,
        id: product.id,
        name: product.name,
        baseCost: product.pricing?.cost || 0,
        taxPercentage:
          product.pricing?.tax ??
          product.taxPercentage ??
          0, // Prefill ITBIS from product pricing/tax if available
      };
    } else {
      let finalValue = value;
      // Date handling is now inside EditableCell
      if (
        ['baseCost', 'taxPercentage', 'freight', 'otherCosts'].includes(
          dataIndex,
        )
      ) {
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
        const backordersQuantity = newData.selectedBackOrders.reduce(
          (sum, bo) => sum + bo.quantity,
          0,
        );
        newData.quantity = finalQty;
        newData.purchaseQuantity = finalQty + backordersQuantity;
      }
    }

    onEditProduct(newData);
  };

  const handleQuantityClick = async (record) => {
    if (loadingQuantity === record.key) return; // Prevent multiple clicks

    setLoadingQuantity(record.key);

    try {
      await onQuantityClick(record);
    } catch (error) {
      console.error('Error in handleQuantityClick:', error);
    } finally {
      setLoadingQuantity(null);
    }
  };

  const defaultColumns = [
    {
      title: 'Producto',
      dataIndex: 'name',
      width: 200,
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
      title: 'F. Expiración',
      dataIndex: 'expirationDate',
      render: (_, record) => (
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
      render: (_, record) => (
        <EditableCell
          record={record}
          inputType="number"
          dataIndex="quantity"
          onSave={handleSave}
          onCellClick={() => handleQuantityClick(record)} // Trigger modal for backorders
          loadingQuantity={loadingQuantity}
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
      title: 'ITBIS',
      dataIndex: 'taxPercentage',
      render: (_, record) => (
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
      render: (_, record) => (
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
      render: (_, record) => (
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
      render: (value) => formatMoney(value),
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

  // Asegurarnos de que cada producto tenga un ID y key
  const dataSource = products.map((product, index) => ({
    ...product,
    key: product.key || product.id || index, // Conservar la key original para mantener la edición sincronizada
  }));

  return (
    <>
      <Form form={form} component={false}>
        <Table
          className="editable-row-table"
          size="small"
          scroll={{ x: 1300 }}
          columns={defaultColumns} // Use defaultColumns directly
          dataSource={dataSource}
          rowKey={(record) => record.key || record.id} // Ensure key is used
          pagination={false} // No pagination on this table
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
              } = record;
              const displayQty = Number(quantity) || 0;
              const qtyForMoney = Number(quantity) || Number(record.purchaseQuantity) || 0;
              const b = Number(baseCost) || 0;
              const tPct = Number(taxPercentage) || 0;
              const f = Number(freight) || 0;
              const o = Number(otherCosts) || 0;
              const s = Number(subtotal) || 0;

              const taxRate = tPct > 1 ? tPct / 100 : tPct; // Ensure ITBIS is treated as a percentage
              const unitTax = b * taxRate;

              totalQuantity += displayQty;
              totalTax += qtyForMoney * unitTax; // ITBIS total should reflect quantity
              totalFreight += f; // Freight is entered as total per lot
              totalOtherCosts += o; // Other costs are totals per lot
              totalSubtotal += s;
            });

            return (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0}>Total</Table.Summary.Cell>
                <Table.Summary.Cell index={1} />
                <Table.Summary.Cell index={2}>
                  <span style={{ fontWeight: 'bold' }}>{formatQuantity(totalQuantity, 0)}</span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3}>
                  {/* Costo Base total se muestra en blanco */}
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
                  {/* Costo Unitario total se muestra en blanco */}
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
    </>
  );
};

export default ProductsTable;
