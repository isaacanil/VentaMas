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
import { toMillis } from '@/utils/date/toMillis';
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

const MIN_VALID_TRANSACTION_MILLIS = 946684800000; // 2000-01-01T00:00:00.000Z
const EMPTY_EVIDENCE_FILES: EvidenceFileInput[] = [];
const EMPTY_PURCHASE_ATTACHMENTS: PurchaseAttachment[] = [];
const EMPTY_GENERAL_FORM_ERRORS: GeneralFormErrors = {};
const EMPTY_PROVIDER_ITEMS: ProviderDataItem[] = [];
type UpdateProductPayload = Parameters<typeof updateProduct>[0];
type UpdateProductValue = UpdateProductPayload['value'];
type DeleteProductPayload = Parameters<typeof deleteProductFromOrder>[0];

const normalizeOrderProductKey = (
  value: string | number | undefined,
): string | undefined => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return undefined;
};

const normalizeOrderExpirationDate = (
  value: OrderReplenishment['expirationDate'],
): string | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  if (typeof value === 'string') return value;

  const rawMillis = toMillis(value as any);
  if (typeof rawMillis !== 'number' || !Number.isFinite(rawMillis)) {
    return undefined;
  }

  const normalizedMillis =
    rawMillis < 100_000_000_000 ? rawMillis * 1000 : rawMillis;

  return DateTime.fromMillis(normalizedMillis).toISO();
};

const normalizeOrderNumericField = (
  value: string | number | undefined,
): number | undefined => {
  if (value === undefined) return undefined;

  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : 0;
};

const toUpdateProductValue = (
  value: Partial<OrderReplenishment>,
): UpdateProductValue => {
  const nextValue: UpdateProductValue = {};

  if (typeof value.id === 'string') nextValue.id = value.id;
  if (typeof value.name === 'string') nextValue.name = value.name;

  const normalizedKey = normalizeOrderProductKey(value.key);
  if (normalizedKey !== undefined) nextValue.key = normalizedKey;

  const normalizedExpirationDate = normalizeOrderExpirationDate(
    value.expirationDate,
  );
  if (normalizedExpirationDate !== undefined) {
    nextValue.expirationDate = normalizedExpirationDate;
  }

  const quantity = normalizeOrderNumericField(value.quantity);
  if (quantity !== undefined) nextValue.quantity = quantity;

  const purchaseQuantity = normalizeOrderNumericField(value.purchaseQuantity);
  if (purchaseQuantity !== undefined) {
    nextValue.purchaseQuantity = purchaseQuantity;
  }

  if (Array.isArray(value.selectedBackOrders)) {
    nextValue.selectedBackOrders = value.selectedBackOrders.flatMap((order) => {
      if (!order || typeof order.id !== 'string') {
        return [];
      }

      return [
        {
          id: order.id,
          quantity:
            Number((order as { quantity?: string | number }).quantity) || 0,
        },
      ];
    });
  }

  if (typeof value.unitMeasurement === 'string') {
    nextValue.unitMeasurement = value.unitMeasurement;
  }

  const baseCost = normalizeOrderNumericField(value.baseCost);
  if (baseCost !== undefined) nextValue.baseCost = baseCost;

  const taxPercentage = normalizeOrderNumericField(value.taxPercentage);
  if (taxPercentage !== undefined) nextValue.taxPercentage = taxPercentage;

  const freight = normalizeOrderNumericField(value.freight);
  if (freight !== undefined) nextValue.freight = freight;

  const otherCosts = normalizeOrderNumericField(value.otherCosts);
  if (otherCosts !== undefined) nextValue.otherCosts = otherCosts;

  const unitCost = normalizeOrderNumericField(value.unitCost);
  if (unitCost !== undefined) nextValue.unitCost = unitCost;

  const subtotal = normalizeOrderNumericField(
    value.subtotal ?? value.subTotal,
  );
  if (subtotal !== undefined) nextValue.subtotal = subtotal;

  return nextValue;
};

const normalizeTransactionMillis = (value: unknown): number | null => {
  const rawMillis = toMillis(value as any);
  if (typeof rawMillis !== 'number' || !Number.isFinite(rawMillis)) {
    return null;
  }
  const normalized = rawMillis < 100_000_000_000 ? rawMillis * 1000 : rawMillis;
  return normalized >= MIN_VALID_TRANSACTION_MILLIS ? normalized : null;
};

const parseDate = (value: unknown) => {
  const millis = normalizeTransactionMillis(value);
  if (typeof millis === 'number') {
    return DateTime.fromMillis(millis);
  }
  if (DateTime.isDateTime(value) && value.isValid) return value;
  return null;
};

const GeneralForm = ({
  files = EMPTY_EVIDENCE_FILES,
  attachmentUrls = EMPTY_PURCHASE_ATTACHMENTS,
  onAddFiles,
  onRemoveFiles,
  errors = EMPTY_GENERAL_FORM_ERRORS,
  mode,
  backOrderAssociationId,
}: GeneralFormProps) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser) as UserIdentity | null;
  const [providerSnapshot, setProviderSnapshot] = useState<ProviderInfo | null>(
    null,
  );
  const { providers = EMPTY_PROVIDER_ITEMS } = useFbGetProviders() as {
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
  } = useSelector(selectOrder) as unknown as Order;
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
      index: _index,
      ...updatedValues
    }: { index?: string | number } & Partial<OrderReplenishment>) => {
      dispatch(updateProduct({ value: toUpdateProductValue(updatedValues) }));
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
    const payload: DeleteProductPayload = {
      id,
      key: normalizeOrderProductKey(key),
    };
    dispatch(deleteProductFromOrder(payload));
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

    const backOrdersResult = await getBackOrdersByProduct(
      user.businessID,
      fullProduct.id || '',
    )
      .then((fetchedBackOrders) => ({
        fetchedBackOrders: fetchedBackOrders as BackOrderRecord[],
        error: null,
      }))
      .catch((error) => ({
        fetchedBackOrders: null,
        error,
      }));

    if (backOrdersResult.error || !backOrdersResult.fetchedBackOrders) {
      console.error('Error fetching backorders', backOrdersResult.error);
      message.error('Error checking backorders');
      return;
    }

    const fetchedBackOrders = backOrdersResult.fetchedBackOrders;
    if (
      (fullProduct.selectedBackOrders?.length ?? 0) > 0 ||
      fetchedBackOrders.length > 0
    ) {
      setBackOrders(fetchedBackOrders);
      setSelectedProductForBackorders(fullProduct);
      setIsBackOrderModalVisible(true);
      return;
    }

    const productKey =
      typeof fullProduct.key === 'string' || typeof fullProduct.key === 'number'
        ? fullProduct.key
        : undefined;
    const updatedValues = {
      key: productKey,
      purchaseQuantity: Number(fullProduct.quantity || 0),
      selectedBackOrders: [],
    };
    handleProductUpdate({ index: productKey, ...updatedValues });
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
      id: backOrderData.id,
      selectedBackOrders: backOrderData.selectedBackOrders.map((bo) => ({
        id: bo.id,
        quantity: bo.quantity,
      })),
      purchaseQuantity,
      quantity,
    };
    handleProductUpdate({ index: selectedProductKey, ...updatedValues });
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
          label="Proveedor"
          validateStatus={errors?.provider ? 'error' : ''}
          help={errors?.provider ? 'El proveedor es requerido' : ''}
          providers={providers}
          selectedProvider={activeProvider}
          onSelectProvider={handleProviderSelect}
          onAddProvider={handleAddProvider}
          onEditProvider={handleEditProvider}
        />
      </InvoiceDetails>
      <ProductsSection>
        <ProductsHeader>
          <h2 className="title">Productos</h2>
          <ProductModal
            onSelect={handleDirectProductAdd}
            selectedProduct={null}
            multiselect={true}
          >
            <Button type="primary" icon={icons.operationModes.add}>
              Agregar Producto
            </Button>
          </ProductModal>
        </ProductsHeader>
        <ProductsTable
          products={replenishments || []}
          onEditProduct={handleProductUpdate}
          removeProduct={handleRemoveProduct}
          onQuantityClick={handleQuantityClick} // NEW: pass the backorder click handler
        />
      </ProductsSection>
      <FooterGrid>
        <FooterContainer>
          <CardHeader>
            <h2 className="title">Detalles de Transacción</h2>
          </CardHeader>
          <CardContent>
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
                  value={parseDate(deliveryAt) as any}
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
          </CardContent>
        </FooterContainer>
        <FooterContainer>
          <CardHeader>
            <h2 className="title">Evidencia</h2>
          </CardHeader>
          <CardContent>
            <EvidenceUpload
              files={files}
              attachmentUrls={attachmentUrls}
              onAddFiles={onAddFiles}
              onRemoveFiles={onRemoveFiles}
            />
          </CardContent>
        </FooterContainer>
      </FooterGrid>
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
          purchaseId={numberId as any} // Pasamos el ID de la orden/compra
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
  grid-template-columns: 1.5fr 1fr 1fr 1fr;
  gap: 1em;
  align-items: start;

  @media (width <= 1100px) {
    grid-template-columns: 1fr 1fr;
  }

  @media (width <= 600px) {
    grid-template-columns: 1fr;
  }

  .ant-form-item {
    margin-bottom: 0;
  }
`;

const ProductsSection = styled.div`
  margin-top: 2em;
  padding: 0;
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  background-color: #fff;
  overflow: hidden;
`;

const ProductsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8pc;
  border-bottom: 1px solid #f0f0f0;

  .title {
    margin: 0;
    font-size: 1pc;
    font-weight: 600;
    color: #262626;
  }
`;

const FooterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.4em;
  margin-top: 1.4em;
`;

const FooterContainer = styled.div`
  background-color: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  padding: 0;
  height: 100%;
  overflow: hidden;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8pc;
  border-bottom: 1px solid #f0f0f0;

  .title {
    margin: 0;
    font-size: 1pc;
    font-weight: 600;
    color: #262626;
  }
`;

const CardContent = styled.div`
  padding: 1.2pc;
`;
