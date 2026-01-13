import { Form, Select, message, Button } from 'antd';
import { onSnapshot, doc } from 'firebase/firestore';
import { DateTime } from 'luxon';
import { useCallback, useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';

import DatePicker from '@/components/DatePicker';
import { icons } from '@/constants/icons/icons';
import { OPERATION_MODES } from '@/constants/modes';
import { transactionConditions } from '@/constants/orderAndPurchaseState';
import {
  selectOrder,
  AddProductToOrder,
  deleteProductFromOrder,
  updateProduct,
  setOrder,
  SelectProduct,
} from '@/features/addOrder/addOrderSlice';
import { selectUser } from '@/features/auth/userSlice';
import { toggleProviderModal } from '@/features/modals/modalSlice';
import { db } from '@/firebase/firebaseconfig';
import { useFbGetProviders } from '@/firebase/provider/useFbGetProvider';
import { getBackOrdersByProduct } from '@/firebase/warehouse/backOrderService';
import EvidenceUpload from '@/components/common/EvidenceUpload/EvidenceUpload';
import ProductsTable from '@/modules/orderAndPurchase/pages/OrderAndPurchase/OrderManagement/components/ProductsTable';
import BackOrdersModal from '@/modules/orderAndPurchase/pages/OrderAndPurchase/PurchaseManagement/components/BackOrdersModal';
import ProductModal from '@/modules/orderAndPurchase/pages/OrderAndPurchase/shared/ProductModal';
import type { BackOrder } from '@/models/Warehouse/BackOrder';
import type { ProviderDataItem, ProviderInfo } from '@/utils/provider/types';
import type {
  PurchaseAttachment,
  PurchaseBackOrderRef,
  PurchaseReplenishment,
} from '@/utils/purchase/types';
import type { Order } from '@/utils/order/types';
import type { EvidenceFileInput } from '@/components/common/EvidenceUpload/types';
import type { UserIdentity } from '@/types/users';

import ProviderSelector from '../../../components/ProviderSelector/ProviderSelector';

import NotesInput from './components/NotesInput';

type OrderMode = 'create' | 'update';

interface GeneralFormErrors {
  provider?: boolean;
  deliveryAt?: boolean;
  note?: boolean;
}

type OrderReplenishment = PurchaseReplenishment & { key?: string | number };

type BackOrderRecord = BackOrder & {
  pendingQuantity?: number;
  orderId?: string;
  purchaseId?: string;
  quantity?: number;
};

type BackOrderSelection = PurchaseBackOrderRef & {
  id: string;
  quantity: number;
  productId?: string;
  orderId?: string;
};

interface GeneralFormProps {
  files?: EvidenceFileInput[];
  attachmentUrls?: PurchaseAttachment[];
  onAddFiles?: (files: EvidenceFileInput[]) => void;
  onRemoveFiles?: (fileId: string) => void;
  errors?: GeneralFormErrors;
  mode: OrderMode;
  backOrderAssociationId?: string | null;
}

const parseDate = (value: unknown) => {
  if (!value) return null;
  if (typeof value === 'number') {
    return DateTime.fromMillis(value);
  }
  if (typeof value === 'string') {
    return DateTime.fromISO(value);
  }
  if (DateTime.isDateTime(value)) {
    return value;
  }
  return null;
};

const GeneralForm = ({
  files = [],
  attachmentUrls = [],
  onAddFiles,
  onRemoveFiles,
  errors = {},
  mode,
  backOrderAssociationId,
}: GeneralFormProps) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser) as UserIdentity | null;
  const [providerSnapshot, setProviderSnapshot] =
    useState<ProviderInfo | null>(null);
  const { providers = [] } = useFbGetProviders() as {
    providers?: ProviderDataItem[];
  };
  const [isBackOrderModalVisible, setIsBackOrderModalVisible] = useState(false);
  const [selectedProductForBackorders, setSelectedProductForBackorders] =
    useState<OrderReplenishment | null>(null);
  const [backOrders, setBackOrders] = useState<BackOrderRecord[]>([]);

  const {
    numberId,
    replenishments,
    condition,
    provider: providerId,
    deliveryAt,
    note,
  } = useSelector(selectOrder) as Order;
  const noteValue = typeof note === 'string' ? note : '';
  const providerIdValue = typeof providerId === 'string' ? providerId : null;
  const providerFromState =
    providers.find((p) => p.provider.id === providerIdValue)?.provider ?? null;
  const activeProvider =
    providerIdValue && providerSnapshot?.id === providerIdValue
      ? providerSnapshot
      : providerFromState;
  const conditionItems = transactionConditions.map((item) => ({
    label: item.label,
    value: item.id, // Cambiar de item.value a item.id
  }));

  const handleProductUpdate = useCallback(
    ({
      index,
      ...updatedValues
    }: { index?: string | number } & Partial<OrderReplenishment>) => {
      dispatch(updateProduct({ value: updatedValues, index }));
    },
    [dispatch],
  );

  const handleRemoveProduct = ({
    key,
    id,
  }: {
    key?: string | number;
    id?: string;
  }) => {
    dispatch(deleteProductFromOrder({ key, id }));
  };

  const handleDateChange = (field: 'deliveryAt', value: DateTime | null) => {
    dispatch(
      setOrder({
        [field]: value ? value.toISO() : null,
      }),
    );
  };

  const handleConditionChange = (value: string) => {
    dispatch(setOrder({ condition: value }));
  };
  // Optimized note change handler
  const handleNoteChange = useCallback(
    (value: string) => {
      dispatch(setOrder({ note: value }));
    },
    [dispatch],
  );

  // Efecto para observar cambios en el proveedor
  useEffect(() => {
    const businessID = user?.businessID;
    const providerID = providerIdValue;

    if (!businessID || !providerID) return;

    const ref = doc(db, 'businesses', businessID, 'providers', providerID);

    const unsub = onSnapshot(
      ref,
      (docSnapshot) => {
        if (!docSnapshot.exists()) return;
        const snapshotProvider = docSnapshot.data()?.provider;
        if (!snapshotProvider) return;

        setProviderSnapshot((prev) => ({
          ...(prev ?? {}),
          ...snapshotProvider,
          id: providerID,
        }));
      },
      (error) => {
        console.error('Error observando proveedor:', error);
        message.error('Error al sincronizar datos del proveedor');
      },
    );

    return () => unsub();
  }, [providerIdValue, user?.businessID]);
  const handleProviderSelect = (providerData: ProviderInfo | null) => {
    setProviderSnapshot(providerData);
    dispatch(setOrder({ provider: providerData?.id || null }));
  };

  const handleAddProvider = () => {
    dispatch(
      toggleProviderModal({ mode: OPERATION_MODES.CREATE.id, data: null }),
    );
  };

  const handleEditProvider = (provider: ProviderInfo) => {
    dispatch(
      toggleProviderModal({ mode: OPERATION_MODES.UPDATE.id, data: provider }),
    );
  };

  const handleQuantityClick = async (
    record: OrderReplenishment,
  ): Promise<void> => {
    const fullProduct = (replenishments || []).find((p) => p.id === record.id);
    if (!fullProduct) {
      console.error('No se encontró el producto completo:', record);      
      return;
    }

    if (!user?.businessID) return;

    try {
      const fetchedBackOrders = (await getBackOrdersByProduct(
        user.businessID,
        fullProduct.id || '',
      )) as BackOrderRecord[];

      if (
        fullProduct.selectedBackOrders?.length > 0 ||
        fetchedBackOrders.length > 0
      ) {
        setBackOrders(fetchedBackOrders);
        setSelectedProductForBackorders(fullProduct);
        setIsBackOrderModalVisible(true);
      } else {
        const productKey =
          typeof fullProduct.key === 'string' || typeof fullProduct.key === 'number'
            ? fullProduct.key
            : undefined;
        const updatedValues = {
          key: productKey,
          purchaseQuantity: fullProduct.quantity || 0,
          selectedBackOrders: [],
        };
        handleProductUpdate({ index: productKey, ...updatedValues });
      }
    } catch (error) {
      console.error('Error fetching backorders', error);
      message.error('Error checking backorders');
    }
  };
  const handleBackOrderModalConfirm = (backOrderData: {
    id: string;
    selectedBackOrders: BackOrderSelection[];
    purchaseQuantity: number;
  }) => {
    const totalBackOrderQuantity = backOrderData.selectedBackOrders.reduce(
      (sum, bo) => sum + (bo.quantity || 0),
      0,
    );
    const purchaseQuantity = backOrderData.purchaseQuantity;
    const quantity = Math.max(0, purchaseQuantity - totalBackOrderQuantity);
    const selectedProductKey =
      typeof selectedProductForBackorders?.key === 'string' ||
      typeof selectedProductForBackorders?.key === 'number'
        ? selectedProductForBackorders.key
        : undefined;
    const updatedValues = {
      ...backOrderData,
      key: selectedProductKey,
      selectedBackOrders: backOrderData.selectedBackOrders,
      purchaseQuantity,
      quantity,
      index: selectedProductKey,
    };
    handleProductUpdate({ ...updatedValues });
    setIsBackOrderModalVisible(false);
    setSelectedProductForBackorders(null);
  };

  const handleBackOrderModalCancel = () => {
    setIsBackOrderModalVisible(false);
    setSelectedProductForBackorders(null);
  };

  const initialSelectedBackOrders =
    selectedProductForBackorders?.selectedBackOrders?.flatMap((order) => {
      if (!order?.id) return [];
      return [
        {
          ...order,
          id: order.id,
          quantity: typeof order.quantity === 'number' ? order.quantity : 0,
        },
      ];
    }) ?? [];
  const initialPurchaseQuantity =
    typeof selectedProductForBackorders?.purchaseQuantity === 'number'
      ? selectedProductForBackorders.purchaseQuantity
      : Number(selectedProductForBackorders?.purchaseQuantity) || 0;

  const handleDirectProductAdd = (products: unknown[] | unknown) => {
    const productsToAdd = Array.isArray(products) ? products : [products];
    productsToAdd.forEach((product) => {
      dispatch(SelectProduct(product));
      dispatch(AddProductToOrder());
    });
    message.success(`${productsToAdd.length} producto(s) agregado(s)`);
  };

  return (
    <>
      <InvoiceDetails>
        <ProviderSelector
          validateStatus={errors?.provider ? 'error' : ''}
          help={errors?.provider ? 'El proveedor es requerido' : ''}
          providers={providers}
          selectedProvider={activeProvider}
          onSelectProvider={handleProviderSelect}
          onAddProvider={handleAddProvider}
          onEditProvider={handleEditProvider}
        />
      </InvoiceDetails>
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: '10px',
        }}
      >
        <ProductModal
          onSelect={handleDirectProductAdd}
          selectedProduct={null}
          multiselect={true}
        >
          <Button type="primary" icon={icons.operationModes.add}>
            Agregar Producto
          </Button>
        </ProductModal>
      </div>
      <ProductsTable
        products={replenishments || []}
        onEditProduct={handleProductUpdate}
        removeProduct={handleRemoveProduct}
        onQuantityClick={handleQuantityClick} // NEW: pass the backorder click handler
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: ' repeat(auto-fit, minmax(350px, 1fr))',
          gap: '1.4em',
          marginTop: '1.4em', // Add margin top to create separation
        }}
      >
        <div>
          <Group>
            <Form.Item label="Condición" required>
              <Select
                options={conditionItems}
                value={condition} // Cambiado de conditionKey a condition
                onChange={handleConditionChange}
              />
            </Form.Item>
            <Form.Item
              label="Fecha de Entrega"
              required
              validateStatus={errors?.deliveryAt ? 'error' : ''}
              help={
                errors?.deliveryAt ? 'La fecha de entrega es requerida' : ''
              }
            >
              <DatePicker
                value={parseDate(deliveryAt)}
                onChange={(value) => handleDateChange('deliveryAt', value)}
                format="DD/MM/YYYY"
                style={{ width: '100%' }}
                status={errors?.deliveryAt ? 'error' : ''}
              />
            </Form.Item>
          </Group>
          <NotesInput
            initialValue={noteValue}
            onNoteChange={handleNoteChange}
            errors={errors}
          />
        </div>
        <EvidenceUpload
          files={files}
          attachmentUrls={attachmentUrls}
          onAddFiles={onAddFiles}
          onRemoveFiles={onRemoveFiles}
        />
      </div>
      {selectedProductForBackorders && (
        <BackOrdersModal
          backOrders={backOrders}
          isVisible={isBackOrderModalVisible}
          onCancel={handleBackOrderModalCancel}
          onConfirm={handleBackOrderModalConfirm}
          initialSelectedBackOrders={initialSelectedBackOrders}
          initialPurchaseQuantity={initialPurchaseQuantity}
          productId={selectedProductForBackorders.id ?? null}
          backOrderAssociationId={backOrderAssociationId}
          mode={mode}
          purchaseId={numberId} // Pasamos el ID de la orden/compra
        />
      )}
    </>
  );
};

export default GeneralForm;

const Group = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1em;

  @media (width <= 768px) {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }
`;
const InvoiceDetails = styled.div`
  display: grid;
  grid-template-columns: 300px 200px 200px 200px;
  gap: 0.4em;
  overflow-x: auto;
`;
