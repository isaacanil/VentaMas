import { Form, Input, Select, message, Modal, Button, Tooltip } from 'antd';
import {
  FileTextOutlined,
  BarcodeOutlined,
  InfoCircleOutlined,
} from '@/constants/icons/antd';
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
import { getBackOrdersByProduct } from '@/firebase/warehouse/backOrderService';
import BackOrdersModal from '@/modules/orderAndPurchase/pages/OrderAndPurchase/PurchaseManagement/components/BackOrdersModal';
import EvidenceUpload from '@/components/common/EvidenceUpload/EvidenceUpload';
import ProductsTable from '@/modules/orderAndPurchase/pages/OrderAndPurchase/PurchaseManagement/components/ProductsTable';
import ProductModal from '@/modules/orderAndPurchase/pages/OrderAndPurchase/shared/ProductModal';
import { toMillis } from '@/utils/date/toMillis';
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
import type { PurchaseMode } from '../../types';

import NotesInput from './components/NotesInput';
import OrderSelector from './components/OrderSelector';

const { confirm } = Modal;

interface GeneralFormErrors {
  provider?: boolean;
  deliveryAt?: boolean;
  paymentAt?: boolean;
  note?: boolean;
}

type PurchaseReplenishmentRow = PurchaseReplenishment & {
  key?: string | number;
};

type BackOrderRecord = BackOrder & {
  pendingQuantity?: number;
  orderId?: string;
  purchaseId?: string;
  quantity?: number;
};

type PurchaseErrorField = 'provider' | 'deliveryAt' | 'paymentAt';
type PurchaseErrorFieldInput = PurchaseErrorField | PurchaseErrorField[];

interface GeneralFormProps {
  files?: EvidenceFileInput[];
  attachmentUrls?: PurchaseAttachment[];
  onAddFiles?: (files: EvidenceFileInput[]) => void;
  onRemoveFiles?: (fileId: string) => void;
  onClearError?: (field: PurchaseErrorFieldInput) => void;
  errors?: GeneralFormErrors;
  backOrderAssociationId?: string | null;
  mode?: PurchaseMode;
}

const MIN_VALID_TRANSACTION_MILLIS = 946684800000; // 2000-01-01T00:00:00.000Z
const EMPTY_EVIDENCE_FILES: EvidenceFileInput[] = [];
const EMPTY_PURCHASE_ATTACHMENTS: PurchaseAttachment[] = [];
const EMPTY_GENERAL_FORM_ERRORS: GeneralFormErrors = {};
const EMPTY_PROVIDER_ITEMS: ProviderDataItem[] = [];
const EMPTY_PENDING_ORDERS: Record<string, unknown>[] = [];
const DOCUMENT_TYPE_OPTIONS = [
  { value: 'inventory', label: 'Inventario' },
  { value: 'service', label: 'Servicio' },
  { value: 'expense', label: 'Gasto' },
  { value: 'asset', label: 'Activo fijo' },
];
const DGII_606_EXPENSE_TYPE_OPTIONS = [
  { value: '01', label: '01 - Gastos de personal' },
  { value: '02', label: '02 - Trabajos, suministros y servicios' },
  { value: '03', label: '03 - Arrendamientos' },
  { value: '04', label: '04 - Activos fijos' },
  { value: '05', label: '05 - Gastos de representación' },
  { value: '06', label: '06 - Otras deducciones admitidas' },
  { value: '07', label: '07 - Gastos financieros' },
  { value: '08', label: '08 - Gastos extraordinarios' },
  { value: '09', label: '09 - Costo de venta' },
  { value: '10', label: '10 - Adquisición de activos' },
  { value: '11', label: '11 - Gastos de seguros' },
];

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

const resolveRowKey = (value: unknown): string | number | undefined =>
  typeof value === 'string' || typeof value === 'number' ? value : undefined;

const GeneralForm = ({
  files = EMPTY_EVIDENCE_FILES,
  attachmentUrls = EMPTY_PURCHASE_ATTACHMENTS,
  onAddFiles,
  onRemoveFiles,
  onClearError,
  errors = EMPTY_GENERAL_FORM_ERRORS,
  backOrderAssociationId,
  mode = 'create',
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
    useState<PurchaseReplenishmentRow | null>(null);
  const [backOrders, setBackOrders] = useState<BackOrderRecord[]>([]);

  const {
    invoiceNumber,
    proofOfPurchase,
    replenishments,
    condition,
    provider: providerId,
    documentType,
    taxReceipt,
    classification,
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
  const taxReceiptNcfValue =
    typeof taxReceipt?.ncf === 'string' ||
    typeof taxReceipt?.ncf === 'number'
      ? String(taxReceipt.ncf)
      : proofOfPurchaseValue;
  const documentTypeValue =
    typeof documentType === 'string' && documentType.trim()
      ? documentType
      : 'inventory';
  const dgii606ExpenseTypeValue =
    typeof classification?.dgii606ExpenseType === 'string'
      ? classification.dgii606ExpenseType
      : undefined;

  const providerIdValue = typeof providerId === 'string' ? providerId : null;
  const providerFromState =
    providers.find((p) => p.provider.id === providerIdValue)?.provider ?? null;
  const activeProvider =
    providerIdValue && providerSnapshot?.id === providerIdValue
      ? providerSnapshot
      : providerFromState;

  const { data: orders = EMPTY_PENDING_ORDERS, loading: orderLoading } =
    useFbGetPendingOrdersByProvider(providerIdValue);
  const isReceiptMode = mode === 'complete';

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
          onClearError?.(['provider', 'deliveryAt', 'paymentAt']);
        },
      });
    } else if (providerData) {
      setProviderSnapshot(providerData);
      dispatch(cleanPurchase());
      dispatch(setPurchase({ provider: providerData.id }));
      onClearError?.(['provider', 'deliveryAt', 'paymentAt']);
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

  const handleTaxReceiptNcfChange = (value: string) => {
    dispatch(
      setPurchase({
        proofOfPurchase: value,
        taxReceipt: {
          ...(taxReceipt ?? {}),
          ncf: value,
        },
      }),
    );
  };

  const handleDocumentTypeChange = (value: string) => {
    dispatch(setPurchase({ documentType: value }));
  };

  const handleDgii606ExpenseTypeChange = (value: string) => {
    dispatch(
      setPurchase({
        classification: {
          ...(classification ?? {}),
          dgii606ExpenseType: value,
        },
      }),
    );
  };

  const handleDateChange = (
    field: 'deliveryAt' | 'paymentAt',
    value: DateTime | null,
  ) => {
    dispatch(
      setPurchase({
        [field]: value ? value.toMillis() : null,
      }),
    );
    if (value) {
      onClearError?.(field);
    }
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

  const handleQuantityClick = async (
    record: PurchaseReplenishmentRow,
  ): Promise<void> => {
    if (isReceiptMode) return;
    const fullProduct = (replenishments || []).find((p) => p.id === record.id);
    if (!fullProduct) return;

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
      message.error('Error al verificar backorders');
      return;
    }

    const fetchedBackOrders = backOrdersResult.fetchedBackOrders;
    const hasBackOrders = fetchedBackOrders.length > 0;
    const productKey = resolveRowKey(fullProduct.key);

    if (hasBackOrders || fullProduct.selectedBackOrders?.length) {
      setBackOrders(fetchedBackOrders);
      setSelectedProductForBackorders(fullProduct);
      setIsBackOrderModalVisible(true);
      return;
    }

    handleProductUpdate({
      index: productKey,
      key: productKey,
      purchaseQuantity: fullProduct.quantity || 0,
      selectedBackOrders: [],
    });
    setSelectedProductForBackorders(null);
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
            placeholder="Ej: 000123"
            prefix={<FileTextOutlined style={{ color: '#bfbfbf' }} />}
            value={invoiceNumberValue}
            onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
          />
        </Form.Item>
        <Form.Item label="NCF / Comprobante fiscal">
          <Input
            placeholder="Ej: B0100000001"
            prefix={<BarcodeOutlined style={{ color: '#bfbfbf' }} />}
            suffix={
              <Tooltip title="Número de Comprobante Fiscal (NCF)">
                <InfoCircleOutlined style={{ color: '#bfbfbf' }} />
              </Tooltip>
            }
            value={taxReceiptNcfValue}
            onChange={(e) => handleTaxReceiptNcfChange(e.target.value)}
          />
        </Form.Item>
        <Form.Item label="Tipo documento">
          <Select
            options={DOCUMENT_TYPE_OPTIONS}
            value={documentTypeValue}
            onChange={handleDocumentTypeChange}
          />
        </Form.Item>
        <Form.Item label="Tipo gasto 606">
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="Seleccionar"
            options={DGII_606_EXPENSE_TYPE_OPTIONS}
            value={dgii606ExpenseTypeValue}
            onChange={handleDgii606ExpenseTypeChange}
          />
        </Form.Item>
      </InvoiceDetails>
      <ProductsSection>
        <ProductsHeader>
          <h2 className="title">Productos</h2>
          {!isReceiptMode && (
            <ProductModal
              onSelect={handleDirectProductAdd}
              selectedProduct={null}
              multiselect={true}
            >
              <Button type="primary" icon={icons.operationModes.add}>
                Agregar Producto
              </Button>
            </ProductModal>
          )}
        </ProductsHeader>
        <ProductsTable
          products={replenishments || []}
          onEditProduct={handleProductUpdate}
          removeProduct={handleRemoveProduct}
          onQuantityClick={handleQuantityClick}
          mode={mode}
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
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1em;
  align-items: start;

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
