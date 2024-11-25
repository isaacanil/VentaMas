import React, { useEffect } from "react";
import { Button, InputNumber, Form, Modal, Select, message, Spin, Alert, Progress } from "antd";
import styled from "styled-components";
import {
  createProductStock,
  updateProductStock,
  useListenProductsStock,
} from "../../../../../../../firebase/warehouse/ProductStockService";
import { useGetProductsWithBatch } from "../../../../../../../hooks/products/useGetProductsWithBatch";
import useListenBatches from "../../../../../../../hooks/products/useListenBatch";
import { useDispatch, useSelector } from "react-redux";
import { selectUser } from "../../../../../../../features/auth/userSlice";
import { closeProductStock, selectProductStock, setProductStockClear, updateProductStockFormData, openProductStock } from "../../../../../../../features/productStock/productStockSlice";
import { useFormatNumber } from "../../../../../../../hooks/useFormatNumber";
import { selectWarehouse } from "../../../../../../../features/warehouse/warehouseSlice";

const { Option } = Select;

const FormContainer = styled(Form)`
  display: flex;
  flex-direction: column;
`;

const StyledButton = styled(Button)`
  width: 100%;
  background-color: #1890ff;
  color: white;
  &:hover {
    background-color: #40a9ff;
  }
`;

const getLocationPath = (warehouseId, shelfId, rowId, segmentId) => {
  if (!warehouseId) {
    throw new Error("warehouseId is required to determine the location path.");
  }

  let path = [warehouseId];

  if (shelfId) path.push(shelfId);
  if (rowId) path.push(rowId);
  if (segmentId) path.push(segmentId);

  return path.join('/');
}

export function ProductStockForm() {
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  const user = useSelector(selectUser);
  const { isOpen, formData } = useSelector(selectProductStock)
  const { selectedWarehouse: warehouse, selectedShelf: shelf, selectedRowShelf: rowShelf, selectedSegment: segment } = useSelector(selectWarehouse);
  const { warehouseId, shelfId, rowId, segmentId } = { warehouseId: warehouse?.id, shelfId: shelf?.id, rowId: rowShelf?.id, segmentId: segment?.id };

  const { productId, batchId, stock: formStock, locationId } = formData;

  const { products, error: productsError, loading: productsLoading } = useGetProductsWithBatch();
  const { batches, error: batchesError, loading: batchesLoading } = useListenBatches(user, formData?.productId);
  const { data: productsStock } = useListenProductsStock(productId);

  const isLoading = productsLoading || batchesLoading;

  // Calcular el stock total del batch específico seleccionado
  const selectedBatch = batches.find((batch) => batch.id === batchId);
  const totalStockFromBatches = selectedBatch ? selectedBatch.quantity : 0;
  const totalStockFromProducts = productsStock?.filter(product => product.id !== formData.id).reduce((acc, product) => acc + (product.stock || 0), 0) || 0;

  const stockDifference = (formStock || 0) + totalStockFromProducts;
  const stockExceeded = totalStockFromBatches - stockDifference;

  const isStockAvailable = batchId && totalStockFromBatches - totalStockFromProducts > 0;

  useEffect(() => {
    if (isOpen && warehouseId) {
      dispatch(updateProductStockFormData({
        path: getLocationPath(warehouseId, shelfId, rowId, segmentId),
      }
      ));
    }
  }, [isOpen, warehouseId, shelfId, rowId, segmentId]);

  const handleProductChange = (productId) => {
    const product = products.find((product) => product.id === productId);
    dispatch(updateProductStockFormData({
      productId,
      productName: product?.name || "",
      batchId: "",
    }));
  };

  const handleBatchChange = (batchId) => {
    const existingProductStock = productsStock?.find(product => product.batchId === batchId && product.location.id === locationId);
    console.log("existingProductStock  ", productsStock);
    if (existingProductStock) {
      antd.Modal.confirm({
        title: "Este batch ya existe en la ubicación actual",
        content: "¿Deseas actualizar el stock existente en lugar de agregar uno nuevo?",
        okText: "Sí, actualizar",
        cancelText: "No",
        onOk: () => {
          dispatch(openProductStock(existingProductStock));
        },
        onCancel: () => {
          dispatch(updateProductStockFormData({
            batchId,
          }));
        },
      });
    } else {
      dispatch(updateProductStockFormData({
        batchId,
      }));
    }
  };

  const handleStockChange = (value) => {
    dispatch(updateProductStockFormData({
      stock: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      await form.validateFields();

      if (!formData.productId) {
        message.error("Por favor, selecciona un producto.");
        return;
      }
      if (batches.length > 0 && !formData.batchId) {
        message.error("Por favor, selecciona un batch.");
        return;
      }
      if (formData.stock <= 0 || isNaN(formData.stock)) {
        message.error("La cantidad de stock no puede ser negativa o cero.");
        return;
      }

      if (formData.id) {
        // Si se seleccionó un batch existente, actualizar el stock
        const updatedStock = formData.stock;
        const updatedData = {
          ...formData,
          stock: updatedStock,
        };
        await updateProductStock(user, updatedData);
        message.success("Stock actualizado exitosamente.");
      } else {
        // Si no existe, crear un nuevo registro de stock
        const data = {
          ...formData,
        };
        await createProductStock(user, data);
        message.success("Producto creado exitosamente.");
      }

      handleClose();// Cerrar el modal después de enviar
    } catch (error) {
      console.error(error);
      message.error("Ocurrió un error al procesar la solicitud.");
    }
  };

  const handleClose = () => {
    dispatch(setProductStockClear());
    dispatch(closeProductStock());
  };

  return (
    <Modal
      title={formData.id ? "Actualizar Producto en Stock" : "Agregar Producto en Stock"}
      open={isOpen}
      onCancel={handleClose}
      footer={null}
      destroyOnClose
    >
      <Spin spinning={isLoading}>
        <FormContainer form={form} layout="vertical" onFinish={handleSubmit}>
          {/* Selección de Producto */}
          <Form.Item
            label="Producto"
            required
            tooltip="Selecciona el producto correspondiente"
            rules={[{ required: true, message: 'Por favor selecciona un producto' }]}
          >
            <Select
              showSearch
              placeholder="Selecciona un producto"
              optionFilterProp="children"
              onChange={handleProductChange}
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
              value={formData.productId || undefined}
              allowClear
            >
              {products.map((product) => (
                <Option key={product.id} value={product.id}>
                  {product.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* Selección de Batch */}
          {batches.length > 0 && (
            <Form.Item
              label="Batch"
              required
              tooltip="Selecciona el batch correspondiente"
              rules={[{ required: true, message: 'Por favor selecciona un batch' }]}
            >
              <Select
                showSearch
                placeholder="Selecciona un batch"
                optionFilterProp="children"
                onChange={handleBatchChange}
                filterOption={(input, option) =>
                  option.children.toLowerCase().includes(input.toLowerCase())
                }
                value={formData.batchId || undefined}
                allowClear
              >
                {batches.map((batch) => (
                  <Option key={batch.id} value={batch.id}>
                    {batch.shortName}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}
          {/* Cantidad de Stock */}
          {isStockAvailable ? (
            <Form.Item
              label="Cantidad de Stock"
              required
              tooltip="Ingresa la cantidad de stock disponible"
              rules={[{ required: true, message: 'Por favor ingresa la cantidad de stock' }]}
            >
              <div style={{ display: "flex", alignItems: "center", gap: '1em' }}>
                <InputNumber
                  min={0}
                  max={totalStockFromBatches - totalStockFromProducts}
                  style={{ width: "100%" }}
                  value={formData.stock}
                  onChange={handleStockChange}
                />
                <span style={{ whiteSpace: 'nowrap', color: stockExceeded < 0 ? 'red' : 'black' }}> (Máximo: {totalStockFromBatches - totalStockFromProducts})</span>
              </div>
            </Form.Item>
          ) : batchId && (
            <Alert message="El máximo disponible ha sido alcanzado. Por favor intenta con otro producto o lote." type="warning" showIcon style={{ marginBottom: 16 }} />
          )}

          {isStockAvailable && (
            <Form.Item
              label="Stock Total Disponible"
              tooltip="Este es el stock total disponible del batch seleccionado y otros productos"
            >
              <div>
                <Progress percent={useFormatNumber((stockDifference / totalStockFromBatches) * 100)} status={stockExceeded < 0 ? 'exception' : 'normal'} />
                <span>{useFormatNumber(stockDifference)}</span>/<span>{totalStockFromBatches}</span>
              </div>
              {stockExceeded < 0 && (
                <Alert message="El stock ingresado excede el total disponible. Por favor ajusta la cantidad." type="error" showIcon style={{ marginTop: 8 }} />
              )}
            </Form.Item>
          )}

          {/* Botón de Envío */}
          <StyledButton
            type="primary"
            htmlType="submit"
            disabled={isLoading || stockExceeded < 0 || !isStockAvailable}
          >
            {formData.id ? "Actualizar" : "Agregar"}
          </StyledButton>
        </FormContainer>
      </Spin>
    </Modal>
  );
}