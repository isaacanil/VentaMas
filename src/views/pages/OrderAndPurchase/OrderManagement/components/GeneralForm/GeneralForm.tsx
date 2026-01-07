// @ts-nocheck
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
import EvidenceUpload from '@/views/pages/OrderAndPurchase/OrderManagement/components/EvidenceUpload/EvidenceUpload';
import ProductsTable from '@/views/pages/OrderAndPurchase/OrderManagement/components/ProductsTable';
import BackOrdersModal from '@/views/pages/OrderAndPurchase/PurchaseManagement/components/BackOrdersModal';
import ProductModal from '@/views/pages/OrderAndPurchase/shared/ProductModal';

import ProviderSelector from '../../../components/ProviderSelector/ProviderSelector';

import NotesInput from './components/NotesInput';

const GeneralForm = ({
  files,
  attachmentUrls,
  onAddFiles,
  onRemoveFiles,
  errors,
  mode,
  backOrderAssociationId,
}) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [prevProviderId, setPrevProviderId] = useState(null);
  const { providers = [] } = useFbGetProviders();
  const [isBackOrderModalVisible, setIsBackOrderModalVisible] = useState(false);
  const [selectedProductForBackorders, setSelectedProductForBackorders] =
    useState(null);
  useState(null);
  const [backOrders, setBackOrders] = useState([]);

  const {
    numberId,
    replenishments,
    condition,
    provider: providerId,
    deliveryAt,
    note,
  } = useSelector(selectOrder);
  const conditionItems = transactionConditions.map((item) => ({
    label: item.label,
    value: item.id, // Cambiar de item.value a item.id
  }));

  const handleProductUpdate = useCallback(({ index, ...updatedValues }) => {
    dispatch(updateProduct({ value: updatedValues, index }));
  }, [dispatch]);

  const handleRemoveProduct = ({ key, id }) => {
    dispatch(deleteProductFromOrder({ key, id }));
  };

  const handleDateChange = (field, value) => {
    dispatch(
      setOrder({
        [field]: value ? value.toISO() : null,
      }),
    );
  };

  const handleConditionChange = (value) => {
    dispatch(setOrder({ condition: value }));
  };
  // Optimized note change handler
  const handleNoteChange = useCallback(
    (value) => {
      dispatch(setOrder({ note: value }));
    },
    [dispatch],
  );

  // Adjust state during rendering when providerId changes
  if (providerId !== prevProviderId) {
    setPrevProviderId(providerId);
    if (!providerId) {
      // logic if provider is cleared?
    } else {
      const providerFromState = providers.find(
        (p) => p.provider.id === providerId,
      );
      if (providerFromState) {
        setSelectedProvider(providerFromState.provider);
      }
    }
  }


  // Efecto para observar cambios en el proveedor
  useEffect(() => {
    const businessID = user?.businessID;
    const providerID = selectedProvider?.id;

    if (!businessID || !providerID) return;

    const ref = doc(db, 'businesses', businessID, 'providers', providerID);

    const unsub = onSnapshot(
      ref,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const updatedProvider = {
            ...selectedProvider,
            ...docSnapshot.data().provider,
          };
          // Only update if data actually changed to avoid loops?
          // For now, trust the snapshot diff
          setSelectedProvider(updatedProvider);
          // Don't dispatch setOrder here unless necessary, it might cause loops
          if (updatedProvider.id !== providerId) {
            dispatch(setOrder({ provider: updatedProvider.id }));
          }
        }
      },
      (error) => {
        console.error('Error observando proveedor:', error);
        message.error('Error al sincronizar datos del proveedor');
      },
    );

    return () => unsub();
  }, [selectedProvider?.id, user?.businessID, dispatch, providerId, selectedProvider]);
  const handleProviderSelect = (providerData) => {
    setSelectedProvider(providerData);
    dispatch(setOrder({ provider: providerData?.id || null }));
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

  const handleQuantityClick = async (record) => {
    const fullProduct = replenishments.find((p) => p.id === record.id);
    if (!fullProduct) {
      console.error('No se encontró el producto completo:', record);
      return false;
    }

    if (!user?.businessID) return false;

    try {
      const fetchedBackOrders = await getBackOrdersByProduct(
        user.businessID,
        fullProduct.id
      );

      if (
        fullProduct.selectedBackOrders?.length > 0 ||
        fetchedBackOrders.length > 0
      ) {
        setBackOrders(fetchedBackOrders);
        setSelectedProductForBackorders(fullProduct);
        setIsBackOrderModalVisible(true);
      } else {
        const updatedValues = {
          purchaseQuantity: fullProduct.quantity || 0,
          selectedBackOrders: [],
        };
        handleProductUpdate({ index: fullProduct.key, ...updatedValues });
      }
    } catch (error) {
      console.error('Error fetching backorders', error);
      message.error('Error checking backorders');
    }

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
      purchaseQuantity,
      quantity,
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
          selectedProvider={selectedProvider}
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
                value={deliveryAt ? DateTime.fromISO(deliveryAt) : null}
                onChange={(value) => handleDateChange('deliveryAt', value)}
                format="DD/MM/YYYY"
                style={{ width: '100%' }}
                status={errors?.deliveryDate ? 'error' : ''}
              />
            </Form.Item>
          </Group>
          <NotesInput
            initialValue={note}
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
          initialSelectedBackOrders={
            selectedProductForBackorders.selectedBackOrders || []
          }
          initialPurchaseQuantity={
            selectedProductForBackorders.purchaseQuantity || 0
          }
          productId={selectedProductForBackorders.id}
          backOrderAssociationId={backOrderAssociationId}
          mode={mode}
          purchaseId={numberId} // Pasamos el ID de la orden/compra
        />
      )}
    </>
  );
};

GeneralForm.defaultProps = {
  files: [],
  attachmentUrls: [],
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onAddFiles: () => { },
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onRemoveFiles: () => { },
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
