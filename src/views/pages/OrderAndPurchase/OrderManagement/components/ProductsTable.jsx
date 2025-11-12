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
    if (inputType === 'number') {
      return (
        <InputNumber
          onBlur={(e) => onSave(record, dataIndex, e.target.value)}
          autoFocus
        />
      );
    }
    if (inputType === 'date') {
      // En lugar de mostrar el DatePicker directamente, abrimos el modal
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
      onClick={onCellClick || handleDateCellClick} // Mover el onClick aquí
      style={{ cursor: 'pointer' }} // Opcional: Cambiar cursor al pasar sobre la celda
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
    // Convertir timestamp a momento para DatePicker si es necesario
    const formValue =
      dataIndex === 'expirationDate' && value ? dayjs(value) : value;

    form.setFieldsValue({ [dataIndex]: formValue });
    setEditingCell({ row: record.key, col: dataIndex });
  };

  const handleSave = (record, dataIndex, value) => {
    // Para fechas, asegurarnos de que el valor sea un timestamp
    const finalValue =
      dataIndex === 'expirationDate' ? (value ? Number(value) : null) : value;

    const newData = { ...record, [dataIndex]: finalValue };
    if (dataIndex === 'quantity') {
      if (
        !record.selectedBackOrders ||
        record.selectedBackOrders.length === 0
      ) {
        newData.quantity = Number(finalValue) || 0;
        newData.purchaseQuantity = Number(finalValue) || 0;
      } else {
        const backordersQuantity = record.selectedBackOrders.reduce(
          (sum, bo) => sum + bo.quantity,
          0,
        );
        newData.quantity = Number(finalValue) || 0;
        newData.purchaseQuantity =
          (Number(finalValue) || 0) + backordersQuantity;
      }
    } else {
      newData[dataIndex] = finalValue;
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
      width: 200,
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
      title: 'Acciones',
      key: 'actions',
      fixed: 'right',
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
        // For cantidad column: if backorders exist, run onQuantityClick; otherwise, edit inline.
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
            key: index,
          }))}
          rowKey={(record, index) => index}
          onRow={() => ({})} // Asegurar que no haya conflictos con eventos en las filas
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
