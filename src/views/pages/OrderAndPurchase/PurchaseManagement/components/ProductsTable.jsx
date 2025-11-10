import { DeleteOutlined, LoadingOutlined } from '@ant-design/icons';
import { Table, Button, Input, Form, InputNumber, DatePicker, Modal } from 'antd';
import dayjs from 'dayjs';
import React, { useState } from 'react';

import { formatMoney, formatPercentage } from '../../../../../utils/formatters';


const EditableCell = ({
  editing,
  dataIndex,
  inputType,
  record,
  children,
  onSave,
  setDateModalVisible,
  setSelectedRecord,
  onCellClick, // nuevo parámetro
  loadingQuantity, // new prop
  onClick, // Add onClick prop
  ...restProps
}) => {
  const getInput = () => {
    if (inputType === 'number') {
      return <InputNumber
        onPressEnter={(e) => onSave(record, dataIndex, e.target.value)}
        onBlur={(e) => onSave(record, dataIndex, e.target.value)}
        autoFocus
      />;
    }
    if (inputType === 'date') {
      // En lugar de mostrar el DatePicker directamente, abrimos el modal
      return children;
    }
    return <Input
      onPressEnter={(e) => onSave(record, dataIndex, e.target.value)}
      onBlur={(e) => onSave(record, dataIndex, e.target.value)}
      autoFocus
    />;
  };
  
  const handleClick = () => {
    if (dataIndex === 'quantity' && loadingQuantity === record.key) {
      return; // Disable click while loading
    }

    if (onCellClick) {
      onCellClick();
    } else if (inputType === 'date' && record.editable !== false) {
      setSelectedRecord(record);
      setDateModalVisible(true);
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <td
      {...restProps}
      onClick={handleClick} // Mover el onClick aquí
      style={{ cursor: 'pointer' }} // Opcional: Cambiar cursor al pasar sobre la celda
    >
      {editing ? (
        <Form.Item
          name={dataIndex}
          style={{ margin: 0 }}
          noStyle
          rules={['freight', 'otherCosts'].includes(dataIndex) ? [] : [
            { required: true }
          ]}
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
          {dataIndex === 'expirationDate' && record[dataIndex]
            ? dayjs(record[dataIndex]).format('DD/MM/YY') // Format milliseconds
            : dataIndex === 'quantity' && loadingQuantity === record.key
              ? <span><LoadingOutlined spin /> Verificando...</span>
              : children}
        </div>
      )}
    </td>
  );
};

const ProductsTable = ({ products, removeProduct, onEditProduct, onQuantityClick }) => {
  const [editingCell, setEditingCell] = useState({ row: '', col: '' });
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [loadingQuantity, setLoadingQuantity] = useState(null); // Track which row is loading quantity
  const [form] = Form.useForm();

  const isEditing = (record, dataIndex) =>
    editingCell.row === record.key && editingCell.col === dataIndex;

  const edit = (record, dataIndex) => {
    const value = record[dataIndex];
    // Convertir timestamp a momento para DatePicker si es necesario
    const formValue = dataIndex === 'expirationDate' && value
      ? dayjs(value)
      : value;

    form.setFieldsValue({ [dataIndex]: formValue });
    setEditingCell({ row: record.key, col: dataIndex });
  };

  const handleSave = (record, dataIndex, value) => {
    const finalValue = dataIndex === 'expirationDate'
      ? (value ? dayjs(value).valueOf() : null)
      : value;

    const newData = { ...record };
    if (dataIndex === 'quantity') {
      if (!record.selectedBackOrders || record.selectedBackOrders.length === 0) {
        newData.quantity = Number(finalValue) || 0;
        newData.purchaseQuantity = Number(finalValue) || 0;
      } else {
        const backordersQuantity = record.selectedBackOrders.reduce((sum, bo) => sum + bo.quantity, 0);
        newData.quantity = Number(finalValue) || 0;
        newData.purchaseQuantity = (Number(finalValue) || 0) + backordersQuantity;
      }
    } else {
      newData[dataIndex] = finalValue;
    }
    // Enviar directamente el objeto actualizado sin envolverlo en otra propiedad "value"
    onEditProduct(newData);

    setEditingCell({ row: '', col: '' });
  };

  const handleDateModalOk = (date) => {
    if (selectedRecord) {
      const timestamp = date ? dayjs(date).startOf('day').valueOf() : null; // Ensure milliseconds
      handleSave(selectedRecord, 'expirationDate', timestamp);
    }
    setDateModalVisible(false);
    setSelectedRecord(null);
  };

  const handleQuantityClick = async (record) => {
    if (loadingQuantity === record.key) return; // Prevent multiple clicks

    setLoadingQuantity(record.key);

    try {
      const shouldShowModal = await onQuantityClick(record);

      if (!shouldShowModal) {
        // Si no hay backorders, habilitar edición directa
        edit(record, 'quantity');
      }
    } catch (error) {
      console.error('Error in handleQuantityClick:', error);
    } finally {
      setLoadingQuantity(null);
    }
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
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {text}
        </span>
      )
    },
    {
      title: 'F. Expiración',
      dataIndex: 'expirationDate',
      render: (value) => value ? dayjs(value).format('DD/MM/YY') : '-',
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
      title: 'ITBIS',
      dataIndex: 'taxPercentage',
      render: (value) => !value || value == 0 ? 'Exento' : formatPercentage(value),
      editable: true,
    },
    {
      title: 'Flete',
      dataIndex: 'freight',
      render: (value) => formatMoney(value),
      editable: true,
    },
    {
      title: 'Otros Costos',
      dataIndex: 'otherCosts',
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
            justifyContent: 'end'
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
        inputType: col.dataIndex === 'expirationDate' ? 'date' :
          ['quantity', 'baseCost', 'taxPercentage', 'freight', 'otherCosts'].includes(col.dataIndex) ? 'number' : 'text',
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record, col.dataIndex),
        onSave: handleSave,
        loadingQuantity, // Pass loading state
        // Para "Cantidad", solo se usa onCellClick que invoca onQuantityClick
        ...(col.dataIndex === 'quantity'
          ? { onCellClick: () => handleQuantityClick(record) }
          : { onClick: () => edit(record, col.dataIndex) }
        ),
        setDateModalVisible,
        setSelectedRecord,
      }),
    };
  });

  // Asegurarnos de que cada producto tenga un ID y key
  const dataSource = products.map((product, index) => ({
    ...product,
    key: product.id || index, // Usar el ID del producto como key si existe
  }));

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
          size='small'
          scroll={{ x: 1300 }}
          columns={mergedColumns}
          dataSource={dataSource}
          rowKey={(record) => record.id}
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
          value={selectedRecord?.expirationDate ? dayjs(selectedRecord.expirationDate) : null}
          onChange={handleDateModalOk}
        />
      </Modal>
    </>
  );
};

export default ProductsTable;