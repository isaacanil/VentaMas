import { Form, Input, Select, message, Modal, Button } from 'antd';
import { onSnapshot, doc } from 'firebase/firestore';
import { DateTime } from 'luxon';
import { useCallback, useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';

import DatePicker from '@/components/DatePicker';
import { icons } from '@/constants/icons/icons';
import { OPERATION_MODES } from '@/constants/modes';
import { transactionConditions } from '@/constants/orderAndPurchaseState';
import { selectUser } from '@/features/auth/userSlice';
import { toggleProviderModal } from '@/features/modals/modalSlice';
import {
  selectPurchase,
  AddProductToPurchase,
  deleteProductFromPurchase,
  updateProduct,
  setPurchase,
  cleanPurchase,
  SelectProduct,
} from '@/features/purchase/addPurchaseSlice';
import { db } from '@/firebase/firebaseconfig';
import { useFbGetPendingOrdersByProvider } from '@/firebase/order/usefbGetOrders';
import { useFbGetProviders } from '@/firebase/provider/useFbGetProvider';
import {
  getBackOrdersByProduct,
} from '@/firebase/warehouse/backOrderService';
import BackOrdersModal from '@/modules/orderAndPurchase/pages/OrderAndPurchase/PurchaseManagement/components/BackOrdersModal';
import EvidenceUpload from '@/components/common/EvidenceUpload/EvidenceUpload';
import ProductsTable from '@/modules/orderAndPurchase/pages/OrderAndPurchase/PurchaseManagement/components/ProductsTable';
import ProductModal from '@/modules/orderAndPurchase/pages/OrderAndPurchase/shared/ProductModal';
import type { BackOrder } from '@/models/Warehouse/BackOrder';
import type { ProviderDataItem, ProviderInfo } from '@/utils/provider/types';
import type {
  Purchase,
  PurchaseAttachment,
  PurchaseBackOrderSelection,
  PurchaseReplenishment,
} from '@/utils/purchase/types';
import type { EvidenceFileInput } from '@/components/common/EvidenceUpload/types';
import type { UserIdentity } from '@/types/users';

import ProviderSelector from '../../../components/ProviderSelector/ProviderSelector';

import NotesInput from './components/NotesInput';
import OrderSelector from './components/OrderSelector';

const { confirm } = Modal;

interface GeneralFormErrors {
  provider?: boolean;
  deliveryAt?: boolean;
  paymentAt?: boolean;
  note?: boolean;
}

type PurchaseReplenishmentRow = PurchaseReplenishment & { key?: string | number };

type BackOrderRecord = BackOrder & {
  pendingQuantity?: number;
  orderId?: string;
  purchaseId?: string;
  quantity?: number;
};

interface GeneralFormProps {
  files?: EvidenceFileInput[];
  attachmentUrls?: PurchaseAttachment[];
  onAddFiles?: (files: EvidenceFileInput[]) => void;
  onRemoveFiles?: (fileId: string) => void;
  errors?: GeneralFormErrors;
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

const resolveRowKey = (value: unknown): string | number | undefined =>
  typeof value === 'string' || typeof value === 'number' ? value : undefined;

const GeneralForm = ({
  files = [],
  attachmentUrls = [],
  onAddFiles,
  onRemoveFiles,
  errors = {},
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
    useState<PurchaseReplenishmentRow | null>(null);
  const [backOrders, setBackOrders] = useState<BackOrderRecord[]>([]);

  const {
    invoiceNumber,
    proofOfPurchase,
    replenishments,
    condition,
    provider: providerId,
    deliveryAt,
    paymentAt,
    note,
  } = useSelector(selectPurchase) as unknown as Purchase;

  const noteValue = typeof note === 'string' ? note : '';
  const invoiceNumberValue =
    typeof invoiceNumber === 'string' || typeof invoiceNumber === 'number'
      ? String(invoiceNumber)
      : '';
  const proofOfPurchaseValue =
    typeof proofOfPurchase === 'string' || typeof proofOfPurchase === 'number'
      ? String(proofOfPurchase)
      : '';

  const providerIdValue = typeof providerId === 'string' ? providerId : null;
  const providerFromState =
    providers.find((p) => p.provider.id === providerIdValue)?.provider ?? null;
  const activeProvider =
    providerIdValue && providerSnapshot?.id === providerIdValue
      ? providerSnapshot
      : providerFromState;

  const { data: orders = [], loading: orderLoading } =
    useFbGetPendingOrdersByProvider(providerIdValue);

  const conditionItems = transactionConditions.map((item) => ({
    label: item.label,
    value: item.id,
  }));

  useEffect(() => {
    const businessID = user?.businessID;
    const providerID = providerIdValue;

    if (!businessID || !providerID) return;

    const ref = doc(db, 'businesses', businessID, 'providers', providerID);

    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) return;
        const next = snap.data()?.provider;
        if (!next) return;

        setProviderSnapshot((prev) => ({
          ...(prev ?? {}),
          ...next,
          id: providerID,
        }));
      },
      (error) => {
        console.error('Error observando proveedor:', error);
        message.error('Error al sincronizar datos del proveedor');
      },
    );

    return () => unsub();
  }, [user?.businessID, providerIdValue]);

  const handleProviderSelect = (providerData: ProviderInfo | null) => {
    if (
      activeProvider &&
      providerData &&
      activeProvider.id !== providerData.id
    ) {
      confirm({
        title: 'Confirmar cambio de proveedor',
        content: '¿Quieres reemplazar el proveedor y descartar datos actuales?',
        onOk() {
          dispatch(cleanPurchase());
          dispatch(setPurchase({ provider: providerData.id }));
          setProviderSnapshot(providerData);
        },
      });
    } else if (providerData) {
      setProviderSnapshot(providerData);
      dispatch(cleanPurchase());
      dispatch(setPurchase({ provider: providerData.id }));
    } else {
      setProviderSnapshot(null);
      dispatch(setPurchase({ provider: null }));
    }
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

  const handleProductUpdate = useCallback(
    ({
      index,
      ...updatedValues
    }: { index?: string | number } & Partial<PurchaseReplenishmentRow>) => {
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
    dispatch(deleteProductFromPurchase({ key, id }));
  };

  const handleInputChange = (
    field: 'invoiceNumber' | 'proofOfPurchase',
    value: string,
  ) => {
    dispatch(setPurchase({ [field]: value }));
  };

  const handleDateChange = (field: 'deliveryAt' | 'paymentAt', value: DateTime | null) => {
    dispatch(
      setPurchase({
        [field]: value ? value.toMillis() : null,
      }),
    );
  };

  const handleConditionChange = (value: string) => {
    dispatch(setPurchase({ condition: value }));
  };

  const handleNoteChange = useCallback(
    (value: string) => {
      dispatch(setPurchase({ note: value }));
    },
    [dispatch],
  );

  const handleQuantityClick = async (record: PurchaseReplenishmentRow): Promise<void> => {
    const fullProduct = (replenishments || []).find((p) => p.id === record.id);
    if (!fullProduct) return;

    if (!user?.businessID) return;

    try {
      const fetchedBackOrders = (await getBackOrdersByProduct(
        user.businessID,
        fullProduct.id || '',
      )) as BackOrderRecord[];
      const hasBackOrders = fetchedBackOrders.length > 0;

      const productKey = resolveRowKey(fullProduct.key);

      if (hasBackOrders || fullProduct.selectedBackOrders?.length) {
        setBackOrders(fetchedBackOrders);
        setSelectedProductForBackorders(fullProduct);
        setIsBackOrderModalVisible(true);
      } else {
        handleProductUpdate({
          index: productKey,
          key: productKey,
          purchaseQuantity: fullProduct.quantity || 0,
          selectedBackOrders: [],
        });
        // Ensure modal/selection is clear
        setSelectedProductForBackorders(null);
      }
    } catch (error) {
      console.error('Error fetching backorders', error);
      message.error('Error al verificar backorders');
    }

  };

  const handleBackOrderModalConfirm = (backOrderData: {
    id: string;
    selectedBackOrders: PurchaseBackOrderSelection[];
    purchaseQuantity: number;
  }) => {
    const totalBackOrderQuantity = backOrderData.selectedBackOrders.reduce(
      (sum, bo) => sum + (bo.quantity || 0),
      0,
    );

    const purchaseQuantity = backOrderData.purchaseQuantity;

    const quantity = Math.max(0, purchaseQuantity - totalBackOrderQuantity);

    const selectedProductKey = resolveRowKey(selectedProductForBackorders?.key);

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

  const initialSelectedBackOrders: PurchaseBackOrderSelection[] =
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
      dispatch(AddProductToPurchase());
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
        <OrderSelector orders={orders} orderLoading={orderLoading} />
        <Form.Item label="Número de Factura">
          <Input
            value={invoiceNumberValue}
            onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
          />
        </Form.Item>
        <Form.Item label="Comprobante de Compra">
          <Input
            value={proofOfPurchaseValue}
            onChange={(e) =>
              handleInputChange('proofOfPurchase', e.target.value)
            }
          />
        </Form.Item>
      </InvoiceDetails>
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: '10px',
        }}
      >
        <ProductModal onSelect={handleDirectProductAdd} selectedProduct={null} multiselect={true}>
          <Button type="primary" icon={icons.operationModes.add}>
            Agregar Producto
          </Button>
        </ProductModal>
      </div>
      <ProductsTable
        products={replenishments || []}
        onEditProduct={handleProductUpdate}
        removeProduct={handleRemoveProduct}
        onQuantityClick={handleQuantityClick}
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
                value={condition}
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
                value={parseDate(deliveryAt) as any}
                onChange={(value) => handleDateChange('deliveryAt', value)}
                format="DD/MM/YYYY"
                style={{ width: '100%' }}
                status={errors?.deliveryAt ? 'error' : ''}
              />
            </Form.Item>
            <Form.Item
              label="Fecha de Pago"
              required
              validateStatus={errors?.paymentAt ? 'error' : ''}
              help={errors?.paymentAt ? 'La fecha de pago es requerida' : ''}
            >
              <DatePicker
                value={parseDate(paymentAt) as any}
                onChange={(value) => handleDateChange('paymentAt', value)}
                format="DD/MM/YYYY"
                style={{ width: '100%' }}
                status={errors?.paymentAt ? 'error' : ''}
              />
            </Form.Item>
          </Group>
          <NotesInput
            initialValue={noteValue}
            onNoteChange={handleNoteChange}
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
