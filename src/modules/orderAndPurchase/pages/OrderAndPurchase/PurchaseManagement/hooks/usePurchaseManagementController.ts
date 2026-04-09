import { message, notification } from 'antd';
import { useCallback, useEffect, useMemo, useReducer } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import type { EvidenceFileInput } from '@/components/common/EvidenceUpload/types';
import { selectUser } from '@/features/auth/userSlice';
import {
  cleanPurchase,
  selectPurchaseState,
  setPurchase,
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
import type { Purchase } from '@/utils/purchase/types';
import {
  canCompletePurchase,
  canEditPurchase,
  resolvePurchaseLineQuantities,
} from '@/utils/purchase/workflow';

import { defaultsMap, sanitizeData } from '../purchaseLogic';
import { getBackOrderAssociationId } from '../purchaseManagementUtils';
import type {
  PurchaseManagementLocationState,
  PurchaseMode,
  WarehouseOption,
} from '../types';
import {
  createInitialPurchaseManagementUiState,
  getPurchaseManagementSectionName,
  hasValidTransactionDate,
  normalizeTransactionMillis,
  purchaseManagementUiReducer,
} from '../utils/purchaseManagement';
import {
  resolveReceiptRowKey,
  sanitizePurchaseReceiptDraftFields,
} from '../utils/receiptDraft';

type PurchaseErrorField = 'provider' | 'deliveryAt' | 'paymentAt';
type PurchaseErrorFieldPatch = PurchaseErrorField | PurchaseErrorField[];

export const usePurchaseManagementController = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const locationState =
    location.state as PurchaseManagementLocationState | null;

  const mode = useMemo<PurchaseMode>(() => {
    if (!id) return 'create';
    if (location.pathname.includes('/complete/')) return 'complete';
    if (location.pathname.includes('/convert-to-purchase/')) return 'convert';
    return 'update';
  }, [id, location.pathname]);

  const sectionName = useMemo(
    () => getPurchaseManagementSectionName(mode),
    [mode],
  );

  const user = useSelector(selectUser) as UserIdentity | null;
  const { purchase: purchaseData } = useSelector(
    selectPurchaseState,
  ) as unknown as {
    purchase: Purchase | null;
    isLoading?: boolean;
  };
  const [uiState, dispatchUi] = useReducer(
    purchaseManagementUiReducer,
    locationState,
    createInitialPurchaseManagementUiState,
  );
  const {
    completedPurchase,
    errors,
    isWarehouseModalOpen,
    loading,
    localFiles,
    selectedWarehouseId,
    showSummary,
  } = uiState;
  const purchasesPath = ROUTES_PATH.PURCHASE_TERM.PURCHASES;
  const backOrderAssociationId = useMemo(
    () =>
      getBackOrderAssociationId({
        mode,
        purchaseId: purchaseData?.id || null,
        orderId:
          mode === 'convert'
            ? purchaseData?.orderId || id || null
            : purchaseData?.orderId || null,
        operationType: 'purchase',
      }),
    [id, mode, purchaseData?.id, purchaseData?.orderId],
  );

  const { purchase: fetchedPurchase, isLoading: purchaseLoading } =
    useListenPurchase(id) as { purchase?: Purchase; isLoading?: boolean };
  const { order: fetchedOrder } = useListenOrder(id) as { order?: Purchase };
  const { data: warehouses = [], loading: warehousesLoading } =
    (useListenWarehouses() as {
      data?: WarehouseRecord[];
      loading?: boolean;
    }) || {};
  const completionEligibilityPurchase = fetchedPurchase ?? purchaseData;

  const defaultWarehouseId = useMemo(() => {
    if (!warehouses.length) return null;
    const defaultWarehouse = warehouses.find(
      (warehouse) => warehouse?.defaultWarehouse,
    );
    return defaultWarehouse?.id || warehouses[0]?.id || null;
  }, [warehouses]);

  const warehouseOptions = useMemo<WarehouseOption[]>(
    () =>
      warehouses.map((warehouse) => {
        const baseLabel =
          warehouse?.name ||
          warehouse?.shortName ||
          warehouse?.id ||
          'Almacen sin nombre';
        return {
          value: warehouse.id,
          label: warehouse.defaultWarehouse
            ? `${baseLabel} (Predeterminado)`
            : baseLabel,
        };
      }),
    [warehouses],
  );

  const hasValidSelectedWarehouse = selectedWarehouseId
    ? warehouses.some((warehouse) => warehouse.id === selectedWarehouseId)
    : false;
  const effectiveSelectedWarehouseId = hasValidSelectedWarehouse
    ? selectedWarehouseId
    : defaultWarehouseId;

  const updatePurchaseState = useCallback(
    (updates: Partial<Purchase>) => {
      dispatch(setPurchase(updates));
    },
    [dispatch],
  );

  const clearPurchaseError = useCallback(
    (fields: PurchaseErrorFieldPatch) => {
      const fieldsToClear = Array.isArray(fields) ? fields : [fields];
      const nextErrors = { ...errors };
      fieldsToClear.forEach((field) => {
        nextErrors[field] = false;
      });

      dispatchUi({
        type: 'patch',
        patch: {
          errors: nextErrors,
        },
      });
    },
    [dispatchUi, errors],
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
          ...(purchaseData?.attachmentUrls || []),
          ...newAttachments,
        ],
      });
      dispatchUi({
        type: 'patch',
        patch: { localFiles: [...localFiles, ...newFiles] },
      });
    },
    [localFiles, purchaseData?.attachmentUrls, updatePurchaseState],
  );

  const handleRemoveFile = useCallback(
    (fileId: string) => {
      dispatchUi({
        type: 'patch',
        patch: { localFiles: localFiles.filter((file) => file.id !== fileId) },
      });
      updatePurchaseState({
        attachmentUrls: (purchaseData?.attachmentUrls || []).filter(
          (file) => file.id !== fileId,
        ),
      });
    },
    [localFiles, purchaseData?.attachmentUrls, updatePurchaseState],
  );

  useEffect(() => {
    if ((mode === 'update' || mode === 'complete') && fetchedPurchase) {
      dispatch(
        setPurchase({
          ...fetchedPurchase,
          replenishments: sanitizePurchaseReceiptDraftFields(
            fetchedPurchase.replenishments,
          ),
        }),
      );
      return;
    }

    if (mode === 'convert' && fetchedOrder) {
      dispatch(
        setPurchase({
          ...fetchedOrder,
          id: '',
          orderId: fetchedOrder.id,
          status: 'pending',
          workflowStatus: 'pending_receipt',
          completedAt: null,
        }),
      );
    }
  }, [dispatch, fetchedOrder, fetchedPurchase, mode]);

  const performSubmit = useCallback(
    async (warehouseIdOverride: string | null = null) => {
      if (!purchaseData) return false;

      dispatchUi({ type: 'patch', patch: { loading: true } });
      let wasSuccessful = false;
      const normalizedPurchaseData: Purchase = {
        ...purchaseData,
        deliveryAt: normalizeTransactionMillis(purchaseData.deliveryAt),
        paymentAt: normalizeTransactionMillis(purchaseData.paymentAt),
        replenishments: sanitizePurchaseReceiptDraftFields(
          purchaseData.replenishments,
        ),
      };

      const submitData = sanitizeData(
        normalizedPurchaseData,
        defaultsMap,
      ) as Purchase;

      if (!user) {
        console.error(
          'Error al guardar la compra:',
          new Error('Usuario no disponible'),
        );
        message.error('Error al guardar la compra');
        dispatchUi({ type: 'patch', patch: { loading: false } });
        return false;
      }

      const submitByMode = async () => {
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

            navigate(purchasesPath, {
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
      };

      try {
        await submitByMode();
        dispatchUi({ type: 'patch', patch: { errors: {} } });
        message.success(
          mode === 'complete'
            ? 'Recepcion registrada exitosamente'
            : 'Compra guardada exitosamente',
        );
        dispatch(cleanPurchase());
        if (mode !== 'complete') {
          navigate(purchasesPath);
        }
        wasSuccessful = true;
      } catch (error) {
        console.error('Error al guardar la compra:', error);
        message.error('Error al guardar la compra');
      }

      dispatchUi({ type: 'patch', patch: { loading: false } });
      return wasSuccessful;
    },
    [dispatch, localFiles, mode, navigate, purchaseData, purchasesPath, user],
  );

  const handleSubmit = useCallback(async () => {
    if (!purchaseData) {
      notification.error({
        message: 'Error',
        description: 'No hay datos de compra disponibles.',
        duration: 5,
      });
      return;
    }

    if (!purchaseData.replenishments?.length) {
      notification.warning({
        message: 'Compra Vacia',
        description: 'Debes agregar al menos un producto a la compra.',
        duration: 5,
      });
      return;
    }

    if (mode !== 'complete') {
      if (!purchaseData.provider) {
        notification.warning({
          message: 'Falta el Proveedor',
          description: 'Por favor, selecciona un proveedor para continuar.',
          duration: 5,
        });
        dispatchUi({
          type: 'patch',
          patch: { errors: { ...errors, provider: true } },
        });
        return;
      }

      if (!hasValidTransactionDate(purchaseData.deliveryAt)) {
        notification.warning({
          message: 'Falta Fecha de Entrega',
          description:
            'Por favor, selecciona una fecha de entrega valida (no vacia).',
          duration: 5,
        });
        dispatchUi({
          type: 'patch',
          patch: { errors: { ...errors, deliveryAt: true } },
        });
        return;
      }

      if (!hasValidTransactionDate(purchaseData.paymentAt)) {
        notification.warning({
          message: 'Falta Fecha de Pago',
          description: 'Por favor, selecciona una fecha de pago valida.',
          duration: 5,
        });
        dispatchUi({
          type: 'patch',
          patch: { errors: { ...errors, paymentAt: true } },
        });
        return;
      }

      const invalidProduct = purchaseData.replenishments.find((product) => {
        const qty = Number(product.purchaseQuantity) || 0;
        const cost = Number(product.baseCost) || 0;
        return !product.name?.trim() || qty <= 0 || cost <= 0;
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
          message: 'Producto Invalido',
          description,
          duration: 6,
        });
        return;
      }
    }

    if (mode === 'update' && !canEditPurchase(purchaseData)) {
      notification.warning({
        message: 'Compra no editable',
        description: 'Solo se pueden editar compras pendientes de recepcion.',
        duration: 5,
      });
      return;
    }

    if (
      mode === 'complete' &&
      !canCompletePurchase(completionEligibilityPurchase ?? {})
    ) {
      notification.warning({
        message: 'Compra no recepcionable',
        description:
          'Solo se pueden registrar recepciones sobre compras pendientes o parciales.',
        duration: 5,
      });
      return;
    }

    if (mode === 'complete') {
      dispatchUi({ type: 'patch', patch: { isWarehouseModalOpen: true } });
      return;
    }

    await performSubmit();
  }, [
    completionEligibilityPurchase,
    errors,
    mode,
    performSubmit,
    purchaseData,
  ]);

  const handleCloseSummary = useCallback(() => {
    dispatchUi({
      type: 'patch',
      patch: {
        completedPurchase: null,
        showSummary: false,
      },
    });
    dispatch(cleanPurchase());
    navigate(purchasesPath);
  }, [dispatch, navigate, purchasesPath]);

  const handleCancel = useCallback(() => {
    dispatch(cleanPurchase());
    navigate(purchasesPath);
  }, [dispatch, navigate, purchasesPath]);

  const handleWarehouseModalCancel = useCallback(() => {
    dispatchUi({
      type: 'patch',
      patch: {
        isWarehouseModalOpen: false,
        selectedWarehouseId: defaultWarehouseId,
      },
    });
  }, [defaultWarehouseId]);

  const handleConfirmWarehouse = useCallback(async () => {
    if (!effectiveSelectedWarehouseId) {
      message.error('Selecciona un almacen para completar la compra');
      return;
    }

    const success = await performSubmit(effectiveSelectedWarehouseId);
    if (success) {
      dispatchUi({ type: 'patch', patch: { isWarehouseModalOpen: false } });
    }
  }, [effectiveSelectedWarehouseId, performSubmit]);

  const handleSelectedWarehouseChange = useCallback((value: string) => {
    dispatchUi({
      type: 'patch',
      patch: { selectedWarehouseId: value },
    });
  }, []);

  useEffect(() => {
    if (mode === 'create') {
      dispatch(cleanPurchase());
    }
  }, [dispatch, mode]);

  const initialReceivedMap = useMemo(() => {
    const map = new Map<string | number, number>();
    (fetchedPurchase?.replenishments || []).forEach((r, idx) => {
      const q = resolvePurchaseLineQuantities(r);
      map.set(resolveReceiptRowKey(r, idx), q.receivedQuantity);
    });
    return map;
  }, [fetchedPurchase?.id]);

  const canSubmit = useMemo(() => {
    if (!purchaseData) return false;
    if (mode === 'complete') {
      return (purchaseData.replenishments || []).some((r, idx) => {
        const current = Number(r.receivedQuantity) || 0;
        const previous =
          initialReceivedMap.get(resolveReceiptRowKey(r, idx)) || 0;
        return current > previous;
      });
    }
    return true;
  }, [purchaseData, mode, initialReceivedMap]);

  return {
    attachmentUrls: purchaseData?.attachmentUrls || [],
    backOrderAssociationId,
    canSubmit,
    completedPurchase,
    clearPurchaseError,
    errors,
    handleAddFiles,
    handleCancel,
    handleCloseSummary,
    handleConfirmWarehouse,
    handleRemoveFile,
    handleSelectedWarehouseChange,
    handleSubmit,
    handleWarehouseModalCancel,
    initialReceivedMap,
    isWarehouseModalOpen,
    loading,
    localFiles,
    mode,
    purchaseLoading,
    sectionName,
    selectedWarehouseId: effectiveSelectedWarehouseId,
    showSummary,
    warehouseOptions,
    warehousesLoading,
  };
};
