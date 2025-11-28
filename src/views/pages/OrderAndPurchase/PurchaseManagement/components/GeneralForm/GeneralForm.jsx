import { Form, Input, Select, DatePicker, message, Modal, Button } from 'antd';
import dayjs from 'dayjs';
import { onSnapshot, doc } from 'firebase/firestore';
import { useCallback, useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';

import { icons } from '../../../../../../constants/icons/icons';
import { OPERATION_MODES } from '../../../../../../constants/modes';
import { transactionConditions } from '../../../../../../constants/orderAndPurchaseState';
import { selectUser } from '../../../../../../features/auth/userSlice';
import { toggleProviderModal } from '../../../../../../features/modals/modalSlice';
import {
  selectPurchase,
  AddProductToPurchase,
  setProductSelected,
  deleteProductFromPurchase,
  clearProductSelected,
  updateProduct,
  setPurchase,
  cleanPurchase,
  SelectProduct,
} from '../../../../../../features/purchase/addPurchaseSlice';
import { db } from '../../../../../../firebase/firebaseconfig';
import { useFbGetPendingOrdersByProvider } from '../../../../../../firebase/order/usefbGetOrders';
import { useFbGetProviders } from '../../../../../../firebase/provider/useFbGetProvider';
import { useBackOrdersByProduct } from '../../../../../../firebase/warehouse/backOrderService';
import ProductModal from '../../../shared/ProductModal';
import ProviderSelector from '../../../components/ProviderSelector/ProviderSelector';
import BackOrdersModal from '../BackOrdersModal';
import EvidenceUpload from '../EvidenceUpload/EvidenceUpload';
import ProductsTable from '../ProductsTable';

import NotesInput from './components/NotesInput';
import OrderSelector from './components/OrderSelector';

const { confirm } = Modal;

const GeneralForm = ({
  files,
  attachmentUrls,
  onAddFiles,
  onRemoveFiles,
  errors,
  backOrderAssociationId,
}) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const unsubscribeRef = useRef(null);
  const { providers = [] } = useFbGetProviders();
  const [isBackOrderModalVisible, setIsBackOrderModalVisible] = useState(false);
  const [selectedProductForBackorders, setSelectedProductForBackorders] =
    useState(null);
  const { backOrders = [] } = useBackOrdersByProduct(
    selectedProductForBackorders?.id,
  );

  const {
    invoiceNumber,
    proofOfPurchase,
    replenishments,
    condition,
    provider: providerId,
    deliveryAt,
    paymentAt,
    note,
  } = useSelector(selectPurchase);

  const { data: orders = [], loading: orderLoading } =
    useFbGetPendingOrdersByProvider(providerId);

  const conditionItems = transactionConditions.map((item) => ({
    label: item.label,
    value: item.id,
  }));

  useEffect(() => {
    if (providerId) {
      const providerFromState = providers.find(
        (p) => p.provider.id === providerId,
      );
      if (providerFromState) {
        setSelectedProvider(providerFromState.provider);
      }
    }
  }, [providers, providerId]);

  useEffect(() => {
    if (selectedProvider?.id) {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }

      unsubscribeRef.current = onSnapshot(
        doc(
          db,
          'businesses',
          user.businessID,
          'providers',
          selectedProvider.id,
        ),
        (docSnapshot) => {
          if (docSnapshot.exists()) {
            const updatedProvider = {
              ...selectedProvider,
              ...docSnapshot.data().provider,
            };
            setSelectedProvider(updatedProvider);
            dispatch(setPurchase({ provider: selectedProvider.id }));
          }
        },
        (error) => {
          console.error('Error observando proveedor:', error);
          message.error('Error al sincronizar datos del proveedor');
        },
      );
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [selectedProvider?.id]);

  const handleProviderSelect = (providerData) => {
    if (
      selectedProvider &&
      providerData &&
      selectedProvider.id !== providerData.id
    ) {
      confirm({
        title: 'Confirmar cambio de proveedor',
        content: '¿Quieres reemplazar el proveedor y descartar datos actuales?',
        onOk() {
          dispatch(cleanPurchase());
          dispatch(setPurchase({ provider: providerData.id }));
          setSelectedProvider(providerData);
        },
      });
    } else if (providerData) {
      setSelectedProvider(providerData);
      dispatch(cleanPurchase());
      dispatch(setPurchase({ provider: providerData.id }));
    } else {
      setSelectedProvider(null);
      dispatch(setPurchase({ provider: null }));
    }
  };

  const handleAddProvider = () => {
    dispatch(
      toggleProviderModal({ mode: OPERATION_MODES.CREATE.id, data: null }),
    );
  };

  const handleEditProvider = (provider) => {
    dispatch(
      toggleProviderModal({ mode: OPERATION_MODES.UPDATE.id, data: provider }),
    );
  };

  const handleProductUpdate = ({ index, ...updatedValues }) => {
    dispatch(updateProduct({ value: updatedValues, index }));
  };

  const handleRemoveProduct = ({ key, id }) => {
    dispatch(deleteProductFromPurchase({ key, id }));
  };

  const handleInputChange = (field, value) => {
    dispatch(setPurchase({ [field]: value }));
  };

  const handleDateChange = (field, value) => {
    dispatch(
      setPurchase({
        [field]: value ? dayjs(value).valueOf() : null,
      }),
    );
  };

  const handleConditionChange = (value) => {
    dispatch(setPurchase({ condition: value }));
  };

  const handleNoteChange = useCallback(
    (value) => {
      dispatch(setPurchase({ note: value }));
    },
    [dispatch],
  );

  const handleQuantityClick = async (record) => {
    // Asegurarse de que el registro tenga toda la información necesaria
    const fullProduct = replenishments.find((p) => p.id === record.id);
    if (!fullProduct) {
      console.error('No se encontró el producto completo:', record);
      return false;
    }

    setSelectedProductForBackorders(fullProduct);

    // Si ya tiene backorders seleccionados, mostrar modal directamente
    if (fullProduct.selectedBackOrders?.length > 0) {
      setIsBackOrderModalVisible(true);
      return true;
    }

    try {
      const existingBackorders = backOrders.filter(
        (bo) => bo.productId === fullProduct.id,
      );

      if (existingBackorders && existingBackorders.length > 0) {
        setIsBackOrderModalVisible(true);
        return true;
      }
    } catch (error) {
      console.error('Error al verificar backorders:', error);
      message.error('Error al verificar backorders');
    }

    const updatedValues = {
      purchaseQuantity: fullProduct.quantity || 0,
      selectedBackOrders: [],
    };
    handleProductUpdate({ index: fullProduct.key, ...updatedValues });
    return false;
  };

  const handleBackOrderModalConfirm = (backOrderData) => {
    const totalBackOrderQuantity = backOrderData.selectedBackOrders.reduce(
      (sum, bo) => sum + bo.quantity,
      0,
    );

    const purchaseQuantity = backOrderData.purchaseQuantity;

    const quantity = Math.max(0, purchaseQuantity - totalBackOrderQuantity);

    const updatedValues = {
      ...backOrderData,
      selectedBackOrders: backOrderData.selectedBackOrders,
      purchaseQuantity: purchaseQuantity,
      quantity: quantity,
    };

    handleProductUpdate({ ...updatedValues });
    setIsBackOrderModalVisible(false);
    setSelectedProductForBackorders(null);
  };

  const handleBackOrderModalCancel = () => {
    setIsBackOrderModalVisible(false);
    setSelectedProductForBackorders(null);
  };

  const handleDirectProductAdd = (products) => {
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
          selectedProvider={selectedProvider}
          onSelectProvider={handleProviderSelect}
          onAddProvider={handleAddProvider}
          onEditProvider={handleEditProvider}
        />
        <OrderSelector orders={orders} orderLoading={orderLoading} />
        <Form.Item label="Número de Factura">
          <Input
            value={invoiceNumber}
            onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
          />
        </Form.Item>
        <Form.Item label="Comprobante de Compra">
          <Input
            value={proofOfPurchase}
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
        <ProductModal onSelect={handleDirectProductAdd} multiselect={true}>
          <Button type="primary" icon={icons.operationModes.add}>
            Agregar Producto
          </Button>
        </ProductModal>
      </div>
      <ProductsTable
        products={replenishments}
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
                value={deliveryAt ? dayjs(deliveryAt) : null}
                onChange={(value) => handleDateChange('deliveryAt', value)}
                format="DD/MM/YYYY"
                style={{ width: '100%' }}
                status={errors?.deliveryDate ? 'error' : ''}
              />
            </Form.Item>
            <Form.Item
              label="Fecha de Pago"
              required
              validateStatus={errors?.paymentAt ? 'error' : ''}
              help={errors?.paymentAt ? 'La fecha de pago es requerida' : ''}
            >
              <DatePicker
                value={paymentAt ? dayjs(paymentAt) : null}
                onChange={(value) => handleDateChange('paymentAt', value)}
                format="DD/MM/YYYY"
                style={{ width: '100%' }}
                status={errors?.paymentAt ? 'error' : ''}
              />
            </Form.Item>
          </Group>
          <NotesInput initialValue={note} onNoteChange={handleNoteChange} />
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
          initialSelectedBackOrders={
            selectedProductForBackorders.selectedBackOrders || []
          }
          initialPurchaseQuantity={
            selectedProductForBackorders.purchaseQuantity || 0
          }
          productId={selectedProductForBackorders.id}
          backOrderAssociationId={backOrderAssociationId}
        />
      )}
    </>
  );
};

GeneralForm.defaultProps = {
  files: [],
  attachmentUrls: [],
  onAddFiles: () => {},
  onRemoveFiles: () => {},
  errors: {},
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
