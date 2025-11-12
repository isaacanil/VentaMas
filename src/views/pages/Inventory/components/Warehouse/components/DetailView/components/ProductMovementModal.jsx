import { Modal, Input, Form, InputNumber, message } from 'antd';
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '../../../../../../../../features/auth/userSlice';
import { moveProduct } from '../../../../../../../../firebase/warehouse/productMovementService';
import { useTransformedWarehouseData } from '../../../../../../../../firebase/warehouse/warehouseNestedServise';
import Tree from '../../../../../../../component/tree/Tree';

const { TextArea } = Input;

const TreeContainer = styled.div`
  height: 300px;
  margin-top: 16px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  padding: 8px;
`;

const FormContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr); // Changed from 2 to 3 columns
  gap: 16px;
  margin-bottom: 16px;
`;

const QuantityContainer = styled.div`
  display: flex;
  align-items: center;
`;

const QuantityInputWithMax = ({ maxQuantity }) => {
  const [quantity, setQuantity] = useState(0);

  const isExceeded = quantity > maxQuantity;

  const handleQuantityChange = (value) => {
    setQuantity(value);
  };

  return (
    <QuantityContainer>
      <Form.Item
        name="quantity"
        label="Cantidad"
        validateStatus={isExceeded ? 'error' : ''}
        help={isExceeded ? `La cantidad no puede exceder ${maxQuantity}` : ''}
        rules={[{ required: true, message: 'Por favor ingrese la cantidad' }]}
      >
        <InputNumber
          addonAfter={maxQuantity}
          min={1}
          max={maxQuantity}
          style={{ width: '100%' }}
          onChange={handleQuantityChange}
        />
      </Form.Item>
    </QuantityContainer>
  );
};

// Add this helper function after the imports
const findPathToNode = (nodes, targetId, path = []) => {
  for (let node of nodes) {
    const newPath = [...path, node];
    if (node.id === targetId) {
      return newPath;
    }
    if (node.children) {
      const result = findPathToNode(node.children, targetId, newPath);
      if (result) {
        return result;
      }
    }
  }
  return null;
};

// Simplify to just create location string from path
const getLocationPath = (path) => {
  return path.map((node) => node.id).join('/');
};

export const ProductMovementModal = ({
  visible,
  onCancel,
  onOk,
  product,
  currentNode, // Destructure currentNode
}) => {
  const [form] = Form.useForm();
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [loadingSubmit, setLoadingSubmit] = useState(false); // NEW loading state
  const { data: warehouseData } = useTransformedWarehouseData();
  const user = useSelector(selectUser);

  // Limpiar formulario cuando se abre o cierra el modal
  useEffect(() => {
    if (visible) {
      // Inicializar con valores por defecto cuando se abre
      form.setFieldsValue({
        product: product?.productName || 'Sin selección',
        destination: '',
        quantity: null,
        comment: '',
      });
    } else {
      // Limpiar cuando se cierra
      form.resetFields();
    }
  }, [visible, product, form]);

  useEffect(() => {
    form.setFieldsValue({
      product: product?.productName || 'Sin selección', // Corrected to access productName
      destination: selectedDestination?.name || 'Sin selección',
    });
  }, [product, selectedDestination, form]);

  const handleOk = () => {
    setLoadingSubmit(true); // START loading
    form.validateFields().then(async (values) => {
      if (!product?.id || !currentNode?.id || !selectedDestination?.id) {
        message.error('Faltan datos necesarios para el movimiento.');
        return;
      }

      // Get source and destination paths
      const sourcePath = findPathToNode(warehouseData, currentNode.id);
      const destinationPath = findPathToNode(
        warehouseData,
        selectedDestination.id,
      );

      if (!sourcePath || !destinationPath) {
        message.error('Error al obtener la ruta completa de las ubicaciones');
        return;
      }

      try {
        await moveProduct({
          user,
          productId: product.productId,
          productName: product.productName,
          productStockId: product.productStockId,
          batchId: product.batchId,
          quantityToMove: values.quantity,
          sourceLocation: getLocationPath(sourcePath),
          destinationLocation: getLocationPath(destinationPath),
          comment: values.comment,
        });

        message.success('Movimiento realizado exitosamente.');
        form.resetFields();
        onOk(values);
      } catch (error) {
        console.error('Error al mover el producto:', error);
        message.error(error.message || 'Error al mover el producto.');
      } finally {
        setLoadingSubmit(false); // STOP loading
      }
    });
  };

  const handleCancel = () => {
    form.resetFields(); // Limpiar al cancelar
    onCancel();
  };

  const treeConfig = {
    onNodeClick: (node) => {
      if (node.id === currentNode.id) {
        message.info(
          'Esta ubicación no se puede seleccionar, pero puedes explorarla y escoger una interna.',
        );
        // Still allow expansion by not returning early
      } else {
        setSelectedDestination(node);
      }
    },
    actions: [], // No actions needed for this tree
  };

  return (
    <Modal
      title="Movimiento de Producto"
      open={visible}
      onCancel={handleCancel} // Usar handleCancel en lugar de onCancel directo
      confirmLoading={loadingSubmit} // BIND loading state
      onOk={handleOk}
      style={{ top: 10 }}
      width={800}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          product: product?.productName || 'Sin selección', // Corrected to access productName
        }}
      >
        <Form.Item name="product" label="Producto">
          <Input readOnly />
        </Form.Item>

        <FormContainer>
          <QuantityInputWithMax maxQuantity={product?.quantity || 0} />

          <Form.Item name="destination" label="Destino">
            <Input readOnly />
          </Form.Item>

          <Form.Item name="comment" label="Comentario">
            <TextArea rows={1} />
          </Form.Item>
        </FormContainer>
      </Form>

      <TreeContainer>
        <Tree
          data={warehouseData}
          config={treeConfig}
          selectedId={selectedDestination?.id}
        />
      </TreeContainer>
    </Modal>
  );
};
