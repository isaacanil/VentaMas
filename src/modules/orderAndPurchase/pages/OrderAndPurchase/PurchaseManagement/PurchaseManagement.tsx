import { message, Button, Form, Modal, Select, notification } from 'antd';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import styled from 'styled-components';

import PurchaseCompletionSummary from '@/components/Purchase/PurchaseCompletionSummary';
import { selectUser } from '@/features/auth/userSlice';
import {
  cleanPurchase,
  setPurchase,
  selectPurchaseState,
} from '@/features/purchase/addPurchaseSlice';
import { addPurchase } from '@/firebase/purchase/fbAddPurchase';
import { fbCompletePurchase } from '@/firebase/purchase/fbCompletePurchase';
import { fbUpdatePurchase } from '@/firebase/purchase/fbUpdatePurchase';
import { useListenWarehouses } from '@/firebase/warehouse/warehouseService';
import { useListenOrder } from '@/hooks/useOrders';
import { useListenPurchase } from '@/hooks/usePurchases';
import ROUTES_PATH from '@/router/routes/routesName';
import type { UserIdentity } from '@/types/users';
import { getLocalURL } from '@/utils/fileUtils';
import type { WarehouseRecord } from '@/utils/inventory/types';
import type { Purchase, PurchaseAttachment } from '@/utils/purchase/types';
import type { EvidenceFileInput } from '@/components/common/EvidenceUpload/types';
import Loader from '@/components/common/Loader/Loader';
import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';

import GeneralForm from './components/GeneralForm/GeneralForm';
import { defaultsMap, sanitizeData } from './purchaseLogic';
import { getBackOrderAssociationId } from './purchaseManagementUtils';

const Container = styled.div`
  display: grid;
  grid-template-rows: min-content 1fr min-content;
  height: 100%;
  overflow-y: hidden;
`;

const Body = styled.div`
  width: 100%;
  padding: 1em;
  margin: 0 auto;
  overflow-y: auto;
`;
const ButtonsContainer = styled.div`
  position: sticky;
  bottom: 0;
  display: flex;
  gap: 1em;
  justify-content: flex-end;
  width: 100%;
  padding: 1em;
  margin-top: auto;
  background-color: #fff;
  border-top: 1px solid #e8e8e8;
`;

type PurchaseMode = 'create' | 'complete' | 'convert' | 'update';

const PurchaseManagement = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  // Determine mode based on the current path
  const mode = useMemo<PurchaseMode>(() => {
    if (!id) return 'create';
    if (location.pathname.includes('/complete/')) return 'complete';
    if (location.pathname.includes('/convert-to-purchase/')) return 'convert';
    return 'update';
  }, [id, location.pathname]);

  const user = useSelector(selectUser) as UserIdentity | null;
  const { purchase: purchaseData } = useSelector(selectPurchaseState) as {
    purchase: Purchase;
  };

  const backOrderAssociationId = getBackOrderAssociationId({
    mode,
    purchaseId: id,
    orderId: purchaseData?.orderId,
    operationType: 'purchase',
  });

  const { PURCHASES } = ROUTES_PATH.PURCHASE_TERM;

  const [localFiles, setLocalFiles] = useState<EvidenceFileInput[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    provider: false,
    deliveryAt: false,
    paymentAt: false,
    note: false,
  });

  const { purchase: fetchedPurchase, isLoading: purchaseLoading } =
    useListenPurchase(id) as { purchase?: Purchase; isLoading?: boolean };
  const { order: fetchedOrder } = useListenOrder(id) as { order?: Purchase };
  const { data: warehouses = [], loading: warehousesLoading } =
    (useListenWarehouses() as { data?: WarehouseRecord[]; loading?: boolean }) || {};

  const defaultWarehouseId = useMemo(() => {
    if (!warehouses?.length) return null;
    const defaultWarehouse = warehouses.find(
      (warehouse) => warehouse?.defaultWarehouse,
    );
    return defaultWarehouse?.id || warehouses[0]?.id || null;
  }, [warehouses]);

  const warehouseOptions = useMemo(
    () =>
      warehouses.map((warehouse) => {
        const baseLabel =
          warehouse?.name ||
          warehouse?.shortName ||
          warehouse?.id ||
          'Almacén sin nombre';
        return {
          value: warehouse.id,
          label: warehouse.defaultWarehouse
            ? `${baseLabel} (Predeterminado)`
            : baseLabel,
        };
      }),
    [warehouses],
  );

  const [showSummary, setShowSummary] = useState(false);
  const [completedPurchase] = useState<Purchase | null>(null);
  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(null);

  useEffect(() => {
    if (!defaultWarehouseId) return;
    const selectionIsValid = selectedWarehouseId
      ? warehouses.some((warehouse) => warehouse.id === selectedWarehouseId)
      : false;
    if (!selectionIsValid) {
      setSelectedWarehouseId(defaultWarehouseId);
    }
  }, [defaultWarehouseId, warehouses, selectedWarehouseId]);

  const updatePurchaseState = useCallback(
    (updates: Partial<Purchase>) => {
      dispatch(setPurchase(updates));
    },
    [dispatch],
  );

  const handleAddFiles = useCallback(
    (newFiles: EvidenceFileInput[]) => {
      const newAttachments = newFiles.map((file) => ({
        type: file.type,
        url: file.file ? getLocalURL(file.file) : file.url,
        location: 'local',
        id: file.id,
        name: file.name,
      }));

      updatePurchaseState({
        attachmentUrls: [
          ...(purchaseData.attachmentUrls || []),
          ...newAttachments,
        ],
      });
      setLocalFiles((prev) => [...prev, ...newFiles]);
    },
    [purchaseData.attachmentUrls, updatePurchaseState],
  );

  const handleRemoveFile = useCallback(
    (fileId: string) => {
      setLocalFiles((prev) => prev.filter((f) => f.id !== fileId));
      updatePurchaseState({
        attachmentUrls: (purchaseData.attachmentUrls || []).filter(
          (f) => f.id !== fileId,
        ),
      });
    },
    [purchaseData.attachmentUrls, updatePurchaseState],
  );

  useEffect(() => {
    if ((mode === 'update' || mode === 'complete') && fetchedPurchase) {
      dispatch(setPurchase(fetchedPurchase));
    } else if (mode === 'convert' && fetchedOrder) {
      dispatch(
        setPurchase({ ...fetchedOrder, id: '', orderId: fetchedOrder.id }),
      );
    }
  }, [mode, fetchedPurchase, fetchedOrder, dispatch]);

  const performSubmit = useCallback(
    async (warehouseIdOverride: string | null = null) => {
      setLoading(true);
      try {
        const submitData = sanitizeData(purchaseData, defaultsMap) as Purchase;

        switch (mode) {
          case 'create':
            await addPurchase({ user, purchase: submitData, localFiles });
            break;
          case 'update':
            await fbUpdatePurchase({ user, purchase: submitData, localFiles });
            break;
          case 'complete': {
            const completionResult = await fbCompletePurchase({
              user,
              purchase: submitData,
              localFiles,
              warehouseId: warehouseIdOverride,
            });

            const destinationWarehouseId =
              completionResult?.destinationWarehouseId ||
              warehouseIdOverride ||
              null;
            const summaryPurchase = completionResult || {
              ...submitData,
              destinationWarehouseId,
            };

            navigate(PURCHASES, {
              state: {
                completedPurchase: summaryPurchase,
                showSummary: true,
              },
            });
            break;
          }
          case 'convert':
            await addPurchase({ user, purchase: submitData, localFiles });
            break;
          default:
            break;
        }

        message.success('Compra guardada exitosamente');
        dispatch(cleanPurchase());
        if (mode !== 'complete') {
          navigate(PURCHASES);
        }
        return true;
      } catch (error) {
        console.error('Error al guardar la compra:', error);
        message.error('Error al guardar la compra');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [dispatch, navigate, user, purchaseData, localFiles, PURCHASES, mode],
  );

  const handleSubmit = useCallback(async () => {
    // 1. Validar Proveedor
    if (!purchaseData.provider) {
      notification.warning({
        message: 'Falta el Proveedor',
        description: 'Por favor, selecciona un proveedor para continuar.',
        duration: 5,
      });
      setErrors((prev) => ({ ...prev, provider: true }));
      return;
    }

    // 2. Validar Fecha de Entrega
    if (!purchaseData.deliveryAt) {
      notification.warning({
        message: 'Falta Fecha de Entrega',
        description: 'Por favor, selecciona la fecha de entrega.',
        duration: 5,
      });
      setErrors((prev) => ({ ...prev, deliveryAt: true }));
      return;
    }

    // 3. Validar Fecha de Pago
    if (!purchaseData.paymentAt) {
      notification.warning({
        message: 'Falta Fecha de Pago',
        description: 'Por favor, selecciona la fecha de pago.',
        duration: 5,
      });
      setErrors((prev) => ({ ...prev, paymentAt: true }));
      return;
    }

    // 4. Validar Lista de Productos
    if (!purchaseData?.replenishments?.length) {
      notification.warning({
        message: 'Compra Vacía',
        description: 'Debes agregar al menos un producto a la compra.',
        duration: 5,
      });
      return;
    }

    // 5. Validar Productos Individuales
    const invalidProduct = purchaseData.replenishments.find((p) => {
      const qty = Number(p.purchaseQuantity) || 0;
      const cost = Number(p.baseCost) || 0;
      return !p.name?.trim() || qty <= 0 || cost <= 0;
    });

    if (invalidProduct) {
      const qty = Number(invalidProduct.purchaseQuantity) || 0;
      const cost = Number(invalidProduct.baseCost) || 0;

      let description = 'Revisa los datos del producto.';
      if (qty <= 0) {
        description = `El producto "${invalidProduct.name}" tiene una cantidad de 0.`;
      } else if (cost <= 0) {
        description = `El producto "${invalidProduct.name}" tiene un costo base de 0.`;
      }

      notification.warning({
        message: 'Producto Inválido',
        description,
        duration: 6,
      });
      return;
    }

    if (mode === 'complete') {
      setIsWarehouseModalOpen(true);
      return;
    }

    await performSubmit();
  }, [purchaseData, mode, performSubmit]);

  const handleCloseSummary = useCallback(() => {
    setShowSummary(false);
    dispatch(cleanPurchase());
    navigate(PURCHASES);
  }, [dispatch, navigate, PURCHASES]);

  const handleCancel = useCallback(() => {
    dispatch(cleanPurchase());
    navigate(PURCHASES);
  }, [dispatch, navigate, PURCHASES]);

  const handleWarehouseModalCancel = useCallback(() => {
    setIsWarehouseModalOpen(false);
    if (defaultWarehouseId) {
      setSelectedWarehouseId(defaultWarehouseId);
    }
  }, [defaultWarehouseId]);

  const handleConfirmWarehouse = useCallback(async () => {
    if (!selectedWarehouseId) {
      message.error('Selecciona un almacén para completar la compra');
      return;
    }
    const success = await performSubmit(selectedWarehouseId);
    if (success) {
      setIsWarehouseModalOpen(false);
    }
  }, [performSubmit, selectedWarehouseId]);

  // Limpiar datos al montar el componente si estamos en modo crear
  useEffect(() => {
    if (mode === 'create') {
      dispatch(cleanPurchase());
    }
  }, [dispatch, mode]);

  return (
    <Container>
      <MenuApp
        showBackButton={false}
        sectionName={
          mode === 'create'
            ? 'Nueva Compra'
            : mode === 'complete'
              ? 'Completar Compra'
              : mode === 'convert'
                ? 'Convertir a Compra'
                : 'Editar Compra'
        }
      />
      <Loader loading={purchaseLoading} minHeight="200px">
        <Body>
          <Form layout="vertical">
            <GeneralForm
              files={localFiles}
              attachmentUrls={purchaseData.attachmentUrls || []}
              onAddFiles={handleAddFiles}
              onRemoveFiles={handleRemoveFile}
              errors={errors}
              backOrderAssociationId={backOrderAssociationId}
            />
          </Form>
        </Body>
      </Loader>
      <ButtonsContainer>
        <Button onClick={handleCancel}>Cancelar</Button>
        <Button type="primary" onClick={handleSubmit} loading={loading}>
          Guardar
        </Button>
      </ButtonsContainer>
      <Modal
        title="Seleccionar almacén de destino"
        open={isWarehouseModalOpen}
        onOk={handleConfirmWarehouse}
        onCancel={handleWarehouseModalCancel}
        okText="Completar compra"
        cancelText="Cancelar"
        confirmLoading={loading}
        okButtonProps={{
          disabled:
            !selectedWarehouseId ||
            warehousesLoading ||
            warehouseOptions.length === 0,
        }}
        destroyOnHidden={false}
      >
        <p style={{ marginBottom: '0.8em' }}>
          Elige el almacén donde se registrará la recepción de esta compra. Este
          cambio solo aplica a esta compra.
        </p>
        <Select
          showSearch
          style={{ width: '100%' }}
          value={selectedWarehouseId}
          onChange={setSelectedWarehouseId}
          loading={warehousesLoading}
          placeholder={
            warehousesLoading
              ? 'Cargando almacenes...'
              : 'Selecciona un almacén'
          }
          optionFilterProp="label"
          options={warehouseOptions}
        />
      </Modal>
      <PurchaseCompletionSummary
        visible={showSummary}
        onClose={handleCloseSummary}
        purchase={completedPurchase}
      />
    </Container>
  );
};

export default PurchaseManagement;

