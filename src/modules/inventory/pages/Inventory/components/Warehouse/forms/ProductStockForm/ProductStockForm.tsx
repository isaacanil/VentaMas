import {
  Button,
  Form,
  Modal,
  message,
  Spin,
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
} from '@/firebase/warehouse/productStockService';
import { useListenProductsStock } from '@/hooks/useProductStock';
import { useGetProductsWithBatch } from '@/hooks/products/useGetProductsWithBatch';
import useListenBatches from '@/hooks/products/useListenBatch';
import { formatNumber } from '@/utils/format';
import type {
  InventoryStockItem,
  InventoryUser,
  ProductStockRecord,
} from '@/utils/inventory/types';

import { ProductStockAlerts } from './components/ProductStockAlerts';
import { ProductStockAvailability } from './components/ProductStockAvailability';
import { ProductStockSelectors } from './components/ProductStockSelectors';

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
  location?: InventoryStockItem['location'] | null;
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
  const productsErrorMessage = productsError ? String(productsError) : null;
  const batchesErrorMessage = batchesError ? String(batchesError) : null;

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
          dispatch(openProductStock(existingProductStock as any));
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

    const isUpdatingStock = Boolean(formData.id);
    const saveProductStock = isUpdatingStock
      ? () =>
          updateProductStock(
            user as any,
            {
              ...formData,
              stock: formData.stock,
            } as any,
          )
      : () =>
          createProductStock(
            user as any,
            {
              ...formData,
            } as any,
          );
    const successMessage = isUpdatingStock
      ? 'Stock actualizado exitosamente.'
      : 'Producto creado exitosamente.';

    try {
      await saveProductStock();
      message.success(successMessage);
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
      destroyOnClose
    >
      <Spin spinning={isLoading}>
        <ProductStockAlerts
          productsErrorMessage={productsErrorMessage}
          batchesErrorMessage={batchesErrorMessage}
        />
        <FormContainer form={form} layout="vertical" onFinish={handleSubmit}>
          <ProductStockSelectors
            productsList={productsList}
            productId={formData.productId || ''}
            onProductChange={handleProductChange}
            batchesList={batchesList}
            batchId={formData.batchId || ''}
            onBatchChange={handleBatchChange}
          />
          <ProductStockAvailability
            batchId={batchId || ''}
            formattedStockDifference={formattedStockDifference}
            formattedTotalStock={formattedTotalStock}
            isStockAvailable={isStockAvailable}
            onStockChange={handleStockChange}
            remainingStock={remainingStock}
            stockUsagePercent={stockUsagePercent}
            totalStockFromBatches={totalStockFromBatches}
            totalStockFromProducts={totalStockFromProducts}
            value={formData.stock}
          />

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
