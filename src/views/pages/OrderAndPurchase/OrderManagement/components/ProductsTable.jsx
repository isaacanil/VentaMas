import { DeleteOutlined } from '@ant-design/icons';
import {
  Table,
  Button,
  Input,
  Form,
  InputNumber,
  DatePicker,
  Modal,
} from 'antd';
import dayjs from 'dayjs';
import React, { useState } from 'react';

import { formatMoney, formatQuantity } from '../../../../../utils/formatters';
import ProductModal from '../../shared/ProductModal';

const EditableCell = ({
  dataIndex,
  inputType,
  record,
  onSave,
  onCellClick,
  children,
  ...restProps
}) => {
  const isProductModal = inputType === 'productModal';
  const isNumberInput = inputType === 'number';
  const isDatePicker = inputType === 'date';

  const handleValueChange = (value) => {
    onSave(record, dataIndex, value);
  };

  const handleProductSelect = (product) => {
    onSave(record, dataIndex, product);
  };

  const handleDateChange = (date) => {
    const timestamp = date ? dayjs(date).valueOf() : null;
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
          value={record[dataIndex] ? dayjs(record[dataIndex]) : null}
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
        purchaseQuantity: newData.purchaseQuantity || 1,
      };
    } else {
      let finalValue = value;
      // Date handling is now inside EditableCell
      if (
        ['quantity', 'baseCost', 'taxPercentage', 'freight', 'otherCosts'].includes(
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

    onEditProduct({ ...newData, index: record.key });
  };

  const defaultColumns = [
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
          rowKey={(record) => record.key}
          pagination={false}
          summary={(pageData) => {
            let totalQuantity = 0;
            let totalSubtotal = 0;

            pageData.forEach((record) => {
              const { quantity, purchaseQuantity, baseCost, subtotal } = record;
              const q = Number(purchaseQuantity ?? quantity) || 0;
              const displayQty = Number(quantity) || 0;
              const b = Number(baseCost) || 0;
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
