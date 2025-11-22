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

import { formatMoney } from '../../../../../utils/formatters';
import ProductModal from '../../shared/ProductModal';

const EditableCell = ({
  editing,
  dataIndex,
  inputType,
  record,
  children,
  onSave,
  setDateModalVisible,
  setSelectedRecord,
  onCellClick,
  ...restProps
}) => {
  const getInput = () => {
    if (inputType === 'productModal') {
      return (
        <ProductModal
          onSelect={(product) => onSave(record, dataIndex, product)}
          selectedProduct={{ name: record[dataIndex] }}
        />
      );
    }
    if (inputType === 'number') {
      return (
        <InputNumber
          onBlur={(e) => onSave(record, dataIndex, e.target.value)}
          autoFocus
        />
      );
    }
    if (inputType === 'date') {
      return children;
    }
    return (
      <Input
        onBlur={(e) => onSave(record, dataIndex, e.target.value)}
        autoFocus
      />
    );
  };

  const handleDateCellClick = () => {
    if (inputType === 'date' && record.editable !== false) {
      setSelectedRecord(record);
      setDateModalVisible(true);
      return;
    }
    restProps.onClick?.();
  };

  return (
    <td
      {...restProps}
      onClick={onCellClick || handleDateCellClick}
      style={{ cursor: 'pointer' }}
    >
      {editing ? (
        <Form.Item
          name={dataIndex}
          style={{ margin: 0 }}
          noStyle
          rules={
            ['freight', 'otherCosts'].includes(dataIndex)
              ? []
              : [{ required: true }]
          }
        >
          {getInput()}
        </Form.Item>
      ) : (
        <div
          className="editable-cell-value-wrap"
          style={{
            paddingRight: 24,
            whiteSpace: 'nowrap',
          }}
        >
          {children}
        </div>
      )}
    </td>
  );
};

const ProductsTable = ({
  products,
  removeProduct,
  onEditProduct,
  onQuantityClick,
}) => {
  const [editingCell, setEditingCell] = useState({ row: '', col: '' });
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [form] = Form.useForm();

  const isEditing = (record, dataIndex) =>
    editingCell.row === record.key && editingCell.col === dataIndex;

  const edit = (record, dataIndex) => {
    const value = record[dataIndex];
    const formValue =
      dataIndex === 'expirationDate' && value ? dayjs(value) : value;

    form.setFieldsValue({ [dataIndex]: formValue });
    setEditingCell({ row: record.key, col: dataIndex });
  };

  const handleSave = (record, dataIndex, value) => {
    let newData = { ...record, originalId: record.id };

    if (dataIndex === 'name' && typeof value === 'object' && value !== null) {
      const product = value;
      newData = {
        ...newData,
        id: product.id,
        name: product.name,
        baseCost: product.pricing?.cost || 0,
        purchaseQuantity: newData.purchaseQuantity || 1,
      };
    } else {
      let finalValue = value;
      if (dataIndex === 'expirationDate') {
        finalValue = value ? Number(value) : null;
      } else if (
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
    setEditingCell({ row: '', col: '' });
  };

  const handleDateModalOk = (date) => {
    if (selectedRecord) {
      const timestamp = date ? date.startOf('day').valueOf() : null;
      handleSave(selectedRecord, 'expirationDate', timestamp);
    }
    setDateModalVisible(false);
    setSelectedRecord(null);
  };

  const columns = [
    {
      title: 'Producto',
      dataIndex: 'name',
      ellipsis: {
        showTitle: true,
      },
      render: (text) => (
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {text}
        </span>
      ),
      editable: true,
    },

    {
      title: 'Cantidad',
      dataIndex: 'quantity',
      render: (value) => value,
      editable: true,
    },
    {
      title: 'Costo Base',
      dataIndex: 'baseCost',
      render: (value) => formatMoney(value),
      editable: true,
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
            onClick={() => removeProduct(record.id)}
          />
        </div>
      ),
    },
  ];

  const mergedColumns = columns.map((col) => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record) => ({
        record,
        inputType:
          col.dataIndex === 'expirationDate'
            ? 'date'
            : col.dataIndex === 'name'
              ? 'productModal'
              : [
                    'quantity',
                    'baseCost',
                    'taxPercentage',
                    'freight',
                    'otherCosts',
                  ].includes(col.dataIndex)
                ? 'number'
                : 'text',
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record, col.dataIndex),
        onSave: handleSave,
        ...(col.dataIndex === 'quantity'
          ? {
              onCellClick: () => {
                if (
                  onQuantityClick &&
                  record.selectedBackOrders &&
                  record.selectedBackOrders.length > 0
                ) {
                  onQuantityClick(record);
                } else {
                  edit(record, col.dataIndex);
                }
              },
            }
          : { onClick: () => edit(record, col.dataIndex) }),
        setDateModalVisible,
        setSelectedRecord,
      }),
    };
  });

  return (
    <>
      <Form form={form} component={false}>
        <Table
          components={{
            body: {
              cell: EditableCell,
            },
          }}
          className="editable-row-table"
          size="small"
          scroll={{ x: 1300 }}
          columns={mergedColumns}
          dataSource={products.map((product, index) => ({
            ...product,
            key: product.id || index,
          }))}
          rowKey={(record) => record.key}
          onRow={() => ({})}
        />
      </Form>

      <Modal
        title="Seleccionar fecha de vencimiento"
        open={dateModalVisible}
        onCancel={() => {
          setDateModalVisible(false);
          setSelectedRecord(null);
        }}
        footer={null}
      >
        <DatePicker
          style={{ width: '100%' }}
          format="DD/MM/YY"
          value={
            selectedRecord?.expirationDate
              ? dayjs(selectedRecord.expirationDate)
              : null
          }
          onChange={handleDateModalOk}
        />
      </Modal>
    </>
  );
};

export default ProductsTable;
