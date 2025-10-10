import { message, Button, Form } from 'antd'
import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import styled from 'styled-components'

import PurchaseCompletionSummary from '../../../../components/Purchase/PurchaseCompletionSummary'
import { selectUser } from '../../../../features/auth/userSlice'
import { cleanPurchase, setPurchase, selectPurchaseState } from '../../../../features/purchase/addPurchaseSlice'
import { addPurchase } from '../../../../firebase/purchase/fbAddPurchase'
import { fbCompletePurchase } from '../../../../firebase/purchase/fbCompletePurchase'
import { fbUpdatePurchase } from '../../../../firebase/purchase/fbUpdatePurchase'
import { useListenOrder } from '../../../../hooks/useOrders'; // Import the hook
import { useListenPurchase } from '../../../../hooks/usePurchases' // Import the hook
import ROUTES_PATH from '../../../../routes/routesName'
import { getLocalURL } from '../../../../utils/files';
import Loader from '../../../component/Loader/Loader'
import { MenuApp } from '../../../templates/MenuApp/MenuApp'

import GeneralForm from './components/GeneralForm/GeneralForm'
import { defaultsMap, sanitizeData } from './purchaseLogic'


const Container = styled.div`
  display: grid;
  height: 100%;
  grid-template-rows: min-content 1fr min-content;
  overflow-y: hidden;
`

const Body = styled.div`
 padding: 1em;
  overflow-y: auto;
 width: 100%;
  margin: 0 auto;
`
const ButtonsContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  position: sticky;
  bottom: 0;
  width: 100%;
  gap: 1em;
  background-color: #ffffff;
  padding: 1em;
  border-top: 1px solid #e8e8e8;
  margin-top: auto;
`

export function getBackOrderAssociationId({ mode, purchaseId, orderId, operationType }) {
  if (!mode) throw new Error('Mode is required');
  if (mode === 'create') return null; // Mover al inicio
  if (!purchaseId && operationType === 'purchase') return null;
  if (!orderId && operationType === 'order') return null;

  switch (operationType) {
    case 'purchase':
      return mode === 'convert' ? orderId : purchaseId;
    case 'order':
      return mode === 'update' ? orderId : null;
    default:
      throw new Error(`Invalid operationType: ${operationType}`);
  }
}


const PurchaseManagement = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation(); // Add this import at the top

  // Determine mode based on the current path
  const mode = useMemo(() => {
    if (!id) return 'create';
    if (location.pathname.includes('/complete/')) return 'complete';
    if (location.pathname.includes('/convert-to-purchase/')) return 'convert';
    return 'update';
  }, [id, location]);

  const user = useSelector(selectUser)
  const { purchase: purchaseData } = useSelector(selectPurchaseState);

  const backOrderAssociationId = getBackOrderAssociationId({
    mode,
    purchaseId: id,
    orderId: purchaseData?.orderId,
    operationType: 'purchase',
  });


  const { PURCHASES } = ROUTES_PATH.PURCHASE_TERM;

  const [localFiles, setLocalFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    provider: false,
    deliveryAt: false,
    paymentAt: false,
    note: false
  });

  const { purchase: fetchedPurchase, isLoading: purchaseLoading } = useListenPurchase(id); // Use the hook
  const { order: fetchedOrder, isLoading: orderLoading } = useListenOrder(id); // Use the hook

  const [showSummary, setShowSummary] = useState(false);
  const [completedPurchase, setCompletedPurchase] = useState(null);

  const updatePurchaseState = useCallback((updates) => {
    dispatch(setPurchase(updates));
  }, [dispatch]);

  const handleAddFiles = useCallback((newFiles) => {
    const newAttachments = newFiles.map(file => ({
      type: file.type,
      url: getLocalURL(file.file),
      location: 'local',
      id: file.id,
      name: file.name,
    }));

    updatePurchaseState({ attachmentUrls: [...(purchaseData.attachmentUrls || []), ...newAttachments] });
    setLocalFiles((prev) => [...prev, ...newFiles]);
  }, [purchaseData.attachmentUrls, updatePurchaseState]);

  const handleRemoveFile = useCallback((fileId) => {
    setLocalFiles((prev) => prev.filter(f => f.id !== fileId));
    updatePurchaseState({
      attachmentUrls: (purchaseData.attachmentUrls || []).filter(f => f.id !== fileId),
    });
  }, [purchaseData.attachmentUrls, updatePurchaseState]);

  const validateFields = useCallback(() => {
    const newErrors = {
      provider: !purchaseData.provider,
      deliveryAt: !purchaseData.deliveryAt,
      paymentAt: !purchaseData.paymentAt,
      note: false, // Note is no longer required
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error);
  }, [purchaseData]);

  useEffect(() => {
    if ((mode === 'update' || mode === 'complete') && fetchedPurchase) {
      dispatch(setPurchase(fetchedPurchase));
    } else if (mode === 'convert' && fetchedOrder) {
      dispatch(setPurchase({ ...fetchedOrder, id: '', orderId: fetchedOrder.id }));
    }
  }, [mode, fetchedPurchase, fetchedOrder, dispatch]);

  const handleSubmit = useCallback(async () => {

    if (!validateFields()) {
      message.error('Por favor complete todos los campos requeridos');
      return;
    }
    if (purchaseData?.replenishments?.length === 0) {
      message.error('Agrega un producto a la compra');
      return;
    }

    setLoading(true);
    try {
      const submitData = sanitizeData(purchaseData, defaultsMap);

      switch (mode) {
        case 'create':
          await addPurchase({ user, purchase: submitData, localFiles });
          break;
        case 'update':
          await fbUpdatePurchase({ user, purchase: submitData, localFiles });
          break;
        case 'complete':
          await fbCompletePurchase({ user, purchase: submitData, localFiles });
          navigate(PURCHASES, { state: { completedPurchase: submitData, showSummary: true } });
          break;
        case 'convert':
          await addPurchase({ user, purchase: submitData, localFiles });
          break;
      }

      message.success('Compra guardada exitosamente');
      dispatch(cleanPurchase());
      if (mode !== 'complete') {
        navigate(PURCHASES);
      }
    } catch (error) {
      console.error("Error al guardar la compra:", error);
      message.error('Error al guardar la compra');
    } finally {
      setLoading(false);
    }
  }, [dispatch, navigate, user, purchaseData, localFiles, validateFields, PURCHASES, mode]);

  const handleCloseSummary = useCallback(() => {
    setShowSummary(false);
    dispatch(cleanPurchase());
    navigate(PURCHASES);
  }, [dispatch, navigate, PURCHASES]);

  const handleCancel = useCallback(() => {
    dispatch(cleanPurchase());
    navigate(PURCHASES);
  }, [dispatch, navigate, PURCHASES]);

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
          mode === 'create' ? 'Nueva Compra' :
            mode === 'complete' ? 'Completar Compra' :
              mode === 'convert' ? 'Convertir a Compra' :
                'Editar Compra'
        } />
      <Loader loading={purchaseLoading} minHeight="200px" >
        <Body>
          <Form layout='vertical'>
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
        <Button onClick={handleCancel}>
          Cancelar
        </Button>
        <Button type="primary" onClick={handleSubmit} loading={loading}>
          Guardar
        </Button>
      </ButtonsContainer>
      <PurchaseCompletionSummary
        visible={showSummary}
        onClose={handleCloseSummary}
        purchase={completedPurchase}
      />
    </Container>
  )
}

export default PurchaseManagement
