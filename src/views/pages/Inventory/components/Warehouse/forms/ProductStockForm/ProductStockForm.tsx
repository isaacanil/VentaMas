// @ts-nocheck
import {
  Button,
  InputNumber,
  Form,
  Modal,
  Select,
  message,
  Spin,
  Alert,
  Progress,
} from 'antd';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '@/features/auth/userSlice';
import {
  closeProductStock,
  selectProductStock,
  setProductStockClear,
  updateProductStockFormData,
  openProductStock,
} from '@/features/productStock/productStockSlice';
import { selectWarehouse } from '@/features/warehouse/warehouseSlice';
import {
  createProductStock,
  updateProductStock,
  useListenProductsStock,
} from '@/firebase/warehouse/productStockService';
import { useGetProductsWithBatch } from '@/hooks/products/useGetProductsWithBatch';
import useListenBatches from '@/hooks/products/useListenBatch';
import { formatNumber } from '@/utils/format';
import type { InventoryUser, ProductStockRecord } from '@/utils/inventory/types';

const { Option } = Select;

const FormContainer = styled(Form)`
  display: flex;
  flex-direction: column;
`;

const StyledButton = styled(Button)`
  width: 100%;
  color: white;
  background-color: #1890ff;

  &:hover {
    background-color: #40a9ff;
  }
`;

const getLocationPath = (
  warehouseId: string,
  shelfId?: string,
  rowId?: string,
  segmentId?: string,
) => {
  if (!warehouseId) {
    throw new Error('warehouseId is required to determine the location path.');
  }

  const path = [warehouseId];

  if (shelfId) path.push(shelfId);
  if (rowId) path.push(rowId);
  if (segmentId) path.push(segmentId);

  return path.join('/');
};

type ProductRecord = { id: string; name?: string } & Record<string, unknown>;

type ProductStockFormProps = {
  isOpen?: boolean;
  onClose?: () => void;
  location?: { id?: string; type?: string } | null;
  initialData?: unknown;
};

type ProductStockState = ReturnType<typeof selectProductStock>;

type WarehouseState = ReturnType<typeof selectWarehouse>;

export function ProductStockForm(_props: ProductStockFormProps) {
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  const user = useSelector(selectUser) as InventoryUser | null;
  const { isOpen, formData } = useSelector(
    selectProductStock,
  ) as ProductStockState;
  const {
    selectedWarehouse: warehouse,
    selectedShelf: shelf,
    selectedRowShelf: rowShelf,
    selectedSegment: segment,
  } = useSelector(selectWarehouse) as WarehouseState;
  const { warehouseId, shelfId, rowId, segmentId } = {
    warehouseId: warehouse?.id ?? '',
    shelfId: shelf?.id,
    rowId: rowShelf?.id,
    segmentId: segment?.id,
  };

  const { productId, batchId, stock: formStock, locationId } = formData;

  const {
    products,
    error: productsError,
    loading: productsLoading,
  } = useGetProductsWithBatch();
  const {
    batches,
    error: batchesError,
    loading: batchesLoading,
  } = useListenBatches(user, formData?.productId || null);
  const { data: productsStock } = useListenProductsStock(productId || null);

  const productsList = Array.isArray(products)
    ? (products as ProductRecord[])
    : [];
  const batchesList = Array.isArray(batches) ? batches : [];
  const productsErrorMessage = productsError
    ? productsError instanceof Error
      ? productsError.message
      : String(productsError)
    : null;
  const batchesErrorMessage = batchesError
    ? batchesError instanceof Error
      ? batchesError.message
      : String(batchesError)
    : null;

  const isLoading = productsLoading || batchesLoading;

  const selectedBatch = batchesList.find((batch) => batch.id === batchId);
  const totalStockFromBatches = Number(selectedBatch?.quantity ?? 0);
  const totalStockFromProducts = (productsStock ?? [])
    .filter((product) => product.id !== formData.id)
    .reduce((acc, product) => acc + Number(product.stock ?? 0), 0);

  const stockDifference = (formStock || 0) + totalStockFromProducts;
  const remainingStock = totalStockFromBatches - stockDifference;
  const isStockAvailable = Boolean(
    batchId && totalStockFromBatches - totalStockFromProducts > 0,
  );
  const stockUsagePercent =
    totalStockFromBatches > 0
      ? Number(((stockDifference / totalStockFromBatches) * 100).toFixed(2))
      : 0;
  const formattedStockDifference = formatNumber(stockDifference);
  const formattedTotalStock = formatNumber(totalStockFromBatches);

  useEffect(() => {
    if (isOpen && warehouseId) {
      dispatch(
        updateProductStockFormData({
          path: getLocationPath(warehouseId, shelfId, rowId, segmentId),
        }),
      );
    }
  }, [isOpen, warehouseId, shelfId, rowId, segmentId, dispatch]);

  const handleProductChange = (productIdValue: string) => {
    const product = productsList.find((item) => item.id === productIdValue);
    dispatch(
      updateProductStockFormData({
        productId: productIdValue,
        productName: product?.name || '',
        batchId: '',
      }),
    );
  };

  const handleBatchChange = (batchIdValue: string) => {
    const existingProductStock = (productsStock ?? []).find((product) => {
      const productLocationId =
        typeof product.location === 'string'
          ? product.location
          : (product.location as { id?: string } | undefined)?.id;
      return (
        product.batchId === batchIdValue &&
        productLocationId &&
        productLocationId === locationId
      );
    }) as ProductStockRecord | undefined;

    if (existingProductStock) {
      Modal.confirm({
        title: 'Este batch ya existe en la ubicación actual',
        content:
          '¿Deseas actualizar el stock existente en lugar de agregar uno nuevo?',
        okText: 'Sí, actualizar',
        cancelText: 'No',
        onOk: () => {
          dispatch(openProductStock(existingProductStock));
        },
        onCancel: () => {
          dispatch(
            updateProductStockFormData({
              batchId: batchIdValue,
            }),
          );
        },
      });
    } else {
      dispatch(
        updateProductStockFormData({
          batchId: batchIdValue,
        }),
      );
    }
  };

  const handleStockChange = (value: number | null) => {
    dispatch(
      updateProductStockFormData({
        stock: value ?? 0,
      }),
    );
  };

  const handleSubmit = async () => {
    try {
      await form.validateFields();

      if (!formData.productId) {
        message.error('Por favor, selecciona un producto.');
        return;
      }
      if (batchesList.length > 0 && !formData.batchId) {
        message.error('Por favor, selecciona un batch.');
        return;
      }
      if (formData.stock <= 0 || Number.isNaN(formData.stock)) {
        message.error('La cantidad de stock no puede ser negativa o cero.');
        return;
      }

      if (formData.id) {
        const updatedStock = formData.stock;
        const updatedData = {
          ...formData,
          stock: updatedStock,
        };
        await updateProductStock(user, updatedData);
        message.success('Stock actualizado exitosamente.');
      } else {
        const data = {
          ...formData,
        };
        await createProductStock(user, data);
        message.success('Producto creado exitosamente.');
      }

      handleClose();
    } catch (error) {
      console.error(error);
      message.error('Ocurrió un error al procesar la solicitud.');
    }
  };

  const handleClose = () => {
    dispatch(setProductStockClear());
    dispatch(closeProductStock());
  };

  return (
    <Modal
      title={
        formData.id
          ? 'Actualizar Producto en Stock'
          : 'Agregar Producto en Stock'
      }
      open={isOpen}
      onCancel={handleClose}
      footer={null}
      destroyOnHidden
    >
      <Spin spinning={isLoading}>
        {productsErrorMessage && (
          <Alert
            message="Error al cargar productos"
            description={productsErrorMessage}
            type="error"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        )}
        {batchesErrorMessage && (
          <Alert
            message="Error al cargar lotes"
            description={batchesErrorMessage}
            type="error"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        )}
        <FormContainer form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Producto"
            required
            tooltip="Selecciona el producto correspondiente"
            rules={[
              { required: true, message: 'Por favor selecciona un producto' },
            ]}
          >
            <Select
              showSearch
              placeholder="Selecciona un producto"
              optionFilterProp="children"
              onChange={handleProductChange}
              filterOption={(input, option) =>
                String(option?.children ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              value={formData.productId || undefined}
              allowClear
            >
              {productsList.map((product) => (
                <Option key={product.id} value={product.id}>
                  {product.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {batchesList.length > 0 && (
            <Form.Item
              label="Batch"
              required
              tooltip="Selecciona el batch correspondiente"
              rules={[{
                required: true,
                message: 'Por favor selecciona un batch',
              }]}
            >
              <Select
                showSearch
                placeholder="Selecciona un batch"
                optionFilterProp="children"
                onChange={handleBatchChange}
                filterOption={(input, option) =>
                  String(option?.children ?? '')
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                value={formData.batchId || undefined}
                allowClear
              >
                {batchesList.map((batch) => (
                  <Option key={batch.id} value={batch.id}>
                    {batch.shortName}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          {isStockAvailable ? (
            <Form.Item
              label="Cantidad de Stock"
              required
              tooltip="Ingresa la cantidad de stock disponible"
              rules={[
                {
                  required: true,
                  message: 'Por favor ingresa la cantidad de stock',
                },
              ]}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1em' }}>
                <InputNumber
                  min={0}
                  max={Math.max(
                    totalStockFromBatches - totalStockFromProducts,
                    0,
                  )}
                  style={{ width: '100%' }}
                  value={formData.stock}
                  onChange={handleStockChange}
                />
                <span
                  style={{
                    whiteSpace: 'nowrap',
                    color: `${remainingStock < 0 ? 'red' : 'black'}`,
                  }}
                >
                  {` (Máximo: ${totalStockFromBatches - totalStockFromProducts})`}
                </span>
              </div>
            </Form.Item>
          ) : (
            batchId && (
              <Alert
                message="El máximo disponible ha sido alcanzado. Por favor intenta con otro producto o lote."
                type="warning"
                showIcon
                style={{ marginBottom: '16px' }}
              />
            )
          )}

          {isStockAvailable && (
            <Form.Item
              label="Stock Total Disponible"
              tooltip="Este es el stock total disponible del batch seleccionado y otros productos"
            >
              <div>
                <Progress
                  percent={Math.max(0, Math.min(100, stockUsagePercent))}
                  status={remainingStock < 0 ? 'exception' : 'normal'}
                />
                <span>{formattedStockDifference}</span>/<span>{formattedTotalStock}</span>
              </div>
              {remainingStock < 0 && (
                <Alert
                  message="El stock ingresado excede el total disponible. Por favor ajusta la cantidad."
                  type="error"
                  showIcon
                  style={{ marginTop: '8px' }}
                />
              )}
            </Form.Item>
          )}

          <StyledButton
            type="primary"
            htmlType="submit"
            disabled={isLoading || remainingStock < 0 || !isStockAvailable}
          >
            {formData.id ? 'Actualizar' : 'Agregar'}
          </StyledButton>
        </FormContainer>
      </Spin>
    </Modal>
  );
}
