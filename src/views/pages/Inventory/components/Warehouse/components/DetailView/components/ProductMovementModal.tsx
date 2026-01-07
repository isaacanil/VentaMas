// @ts-nocheck
import { Modal, Input, Form, InputNumber, message } from 'antd';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '@/features/auth/userSlice';
import { moveProduct } from '@/firebase/warehouse/productMovementService';
import { useTransformedWarehouseData } from '@/firebase/warehouse/warehouseNestedServise';
import Tree from '@/views/component/tree/Tree';
import type { InventoryUser } from '@/utils/inventory/types';
import type { WarehouseNode } from './InventoryTable/types';

const { TextArea } = Input;

const TreeContainer = styled.div`
  height: 300px;
  padding: 8px;
  margin-top: 16px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
`;

const FormContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 16px;
`;

const QuantityContainer = styled.div`
  display: flex;
  align-items: center;
`;

type MovementProduct = {
  id?: string;
  productId?: string;
  productName?: string;
  productStockId?: string;
  batchId?: string;
  quantity?: number;
};

type ProductMovementModalProps = {
  visible: boolean;
  onCancel: () => void;
  onOk: (values: { quantity: number; comment?: string }) => void;
  product?: MovementProduct | null;
  currentNode?: WarehouseNode | null;
};

type QuantityInputWithMaxProps = {
  maxQuantity: number;
};

type MovementFormValues = {
  product?: string;
  destination?: string;
  quantity?: number;
  comment?: string;
};

const QuantityInputWithMax = ({ maxQuantity }: QuantityInputWithMaxProps) => {
  const [quantity, setQuantity] = useState(0);
  const isExceeded = quantity > maxQuantity;

  const handleQuantityChange = (value: number | null) => {
    setQuantity(value ?? 0);
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

const findPathToNode = (
  nodes: WarehouseNode[],
  targetId: string,
  path: WarehouseNode[] = [],
): WarehouseNode[] | null => {
  for (const node of nodes) {
    const newPath = [...path, node];
    if (node.id === targetId) {
      return newPath;
    }
    if (node.children?.length) {
      const result = findPathToNode(node.children, targetId, newPath);
      if (result) {
        return result;
      }
    }
  }
  return null;
};

const getLocationPath = (path: WarehouseNode[]) =>
  path.map((node) => node.id).join('/');

export const ProductMovementModal = ({
  visible,
  onCancel,
  onOk,
  product,
  currentNode,
}: ProductMovementModalProps) => {
  const [form] = Form.useForm<MovementFormValues>();
  const [selectedDestination, setSelectedDestination] = useState<
    WarehouseNode | null
  >(null);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const { data: warehouseData } = useTransformedWarehouseData();
  const user = useSelector(selectUser) as InventoryUser | null;

  useEffect(() => {
    if (visible) {
      form.setFieldsValue({
        product: product?.productName || 'Sin selección',
        destination: '',
        quantity: undefined,
        comment: '',
      });
    } else {
      form.resetFields();
    }
  }, [visible, product, form]);

  useEffect(() => {
    form.setFieldsValue({
      product: product?.productName || 'Sin selección',
      destination: selectedDestination?.name || 'Sin selección',
    });
  }, [product, selectedDestination, form]);

  const handleOk = async () => {
    setLoadingSubmit(true);
    try {
      const values = await form.validateFields();
      if (!product?.id || !currentNode?.id || !selectedDestination?.id) {
        message.error('Faltan datos necesarios para el movimiento.');
        return;
      }

      const sourcePath = findPathToNode(
        (warehouseData || []) as WarehouseNode[],
        currentNode.id,
      );
      const destinationPath = findPathToNode(
        (warehouseData || []) as WarehouseNode[],
        selectedDestination.id,
      );

      if (!sourcePath || !destinationPath) {
        message.error('Error al obtener la ruta completa de las ubicaciones');
        return;
      }

      await moveProduct({
        user,
        productId: product.productId,
        productName: product.productName,
        productStockId: product.productStockId,
        batchId: product.batchId,
        quantityToMove: values.quantity ?? 0,
        sourceLocation: getLocationPath(sourcePath),
        destinationLocation: getLocationPath(destinationPath),
        comment: values.comment,
      });

      message.success('Movimiento realizado exitosamente.');
      form.resetFields();
      onOk({ quantity: values.quantity ?? 0, comment: values.comment });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message) {
          message.error(error.message);
        }
      }
      if (!(error instanceof Error)) {
        message.error('Error al mover el producto.');
      }
      console.error('Error al mover el producto:', error);
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  const treeConfig = {
    onNodeClick: (node: WarehouseNode) => {
      if (node.id === currentNode?.id) {
        message.info(
          'Esta ubicación no se puede seleccionar, pero puedes explorarla y escoger una interna.',
        );
      } else {
        setSelectedDestination(node);
      }
    },
    actions: [] as unknown[],
  };

  return (
    <Modal
      title="Movimiento de Producto"
      open={visible}
      onCancel={handleCancel}
      confirmLoading={loadingSubmit}
      onOk={handleOk}
      style={{ top: 10 }}
      width={800}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          product: product?.productName || 'Sin selección',
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
