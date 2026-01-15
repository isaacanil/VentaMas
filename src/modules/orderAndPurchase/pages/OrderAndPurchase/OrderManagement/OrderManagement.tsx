import { message, Button, Form, notification } from 'antd';
import { useState, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';

import {
  cleanOrder,
  setOrder,
  selectOrderState,
} from '@/features/addOrder/addOrderSlice';
import { selectUser } from '@/features/auth/userSlice';
import { addOrder } from '@/firebase/order/fbAddOrder';
import { fbUpdateOrder } from '@/firebase/order/fbUpdateOrder';
import { useListenOrder } from '@/hooks/useOrders';
import ROUTES_PATH from '@/router/routes/routesName';
import type { UserIdentity } from '@/types/users';
import { getLocalURL } from '@/utils/fileUtils';
import type { Order } from '@/utils/order/types';
import type { PurchaseAttachment } from '@/utils/purchase/types';
import type { EvidenceFileInput } from '@/components/common/EvidenceUpload/types';
import Loader from '@/components/common/Loader/Loader';
import { getBackOrderAssociationId } from '@/modules/orderAndPurchase/pages/OrderAndPurchase/PurchaseManagement/purchaseManagementUtils';
import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';

import GeneralForm from './components/GeneralForm/GeneralForm';
import { defaultsMap, sanitizeData } from './orderLogic';

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

type OrderMode = 'create' | 'update';

interface OrderErrors {
  provider: boolean;
  deliveryAt: boolean;
  note: boolean;
}

const OrderManagement = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const mode: OrderMode = id ? 'update' : 'create';

  const user = useSelector(selectUser) as UserIdentity | null;
  const { order: orderData } = useSelector(selectOrderState) as any;

  const { ORDERS } = ROUTES_PATH.ORDER_TERM;

  const backOrderAssociationId = getBackOrderAssociationId({
    mode,
    orderId: orderData?.id,
    operationType: 'order',
  });

  const [localFiles, setLocalFiles] = useState<EvidenceFileInput[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<OrderErrors>({
    provider: false,
    deliveryAt: false,
    note: false,
  });

  const { order: fetchedOrder, isLoading: orderLoading } = useListenOrder(id) as {
    order?: Order;
    isLoading?: boolean;
  };

  const updateOrderState = useCallback(
    (updates: any) => {
      dispatch(setOrder(updates));
    },
    [dispatch],
  );

  const handleAddFiles = useCallback(
    (newFiles: EvidenceFileInput[]) => {
      const newAttachments: PurchaseAttachment[] = newFiles.map((file) => ({
        type: file.type,
        url: file.file ? getLocalURL(file.file) : file.url,
        location: 'local',
        id: file.id,
        name: file.name,
      }));

      updateOrderState({
        attachmentUrls: [
          ...(orderData.attachmentUrls || []),
          ...newAttachments,
        ],
      });
      setLocalFiles((prev) => [...prev, ...newFiles]);
    },
    [orderData.attachmentUrls, updateOrderState],
  );

  const handleRemoveFile = useCallback(
    (fileId: string) => {
      setLocalFiles((prev) => prev.filter((f) => f.id !== fileId));
      updateOrderState({
        attachmentUrls: (orderData.attachmentUrls || []).filter(
          (f) => f.id !== fileId,
        ),
      });
    },
    [orderData.attachmentUrls, updateOrderState],
  );

  useEffect(() => {
    if (mode === 'update' && fetchedOrder) {
      dispatch(setOrder(fetchedOrder));
    }
  }, [mode, fetchedOrder, dispatch]);

  const handleSubmit = useCallback(async () => {
    // 1. Validar Proveedor
    if (!orderData.provider) {
      notification.warning({
        message: 'Falta el Proveedor',
        description: 'Por favor, selecciona un proveedor para continuar.',
        duration: 5,
      });
      setErrors((prev) => ({ ...prev, provider: true }));
      return;
    }

    // 2. Validar Fecha de Entrega (requerido por schema/logica anterior)
    if (!orderData.deliveryAt) {
      notification.warning({
        message: 'Falta Fecha de Entrega',
        description: 'Por favor, selecciona una fecha de entrega estimada.',
        duration: 5,
      });
      setErrors((prev) => ({ ...prev, deliveryAt: true }));
      return;
    }

    // 3. Validar Lista de Productos
    if (!orderData?.replenishments?.length) {
      notification.warning({
        message: 'Pedido Vacío',
        description: 'Debes agregar al menos un producto al pedido.',
        duration: 5,
      });
      return;
    }

    // 4. Validar Productos Individuales (Cantidad y Costo)
    const invalidProduct = orderData.replenishments.find((p) => {
      const qty = Number(p.quantity) || 0;
      const cost = Number(p.baseCost) || 0;
      return !p.name?.trim() || qty <= 0 || cost <= 0;
    });

    if (invalidProduct) {
      const qty = Number(invalidProduct.quantity) || 0;
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

    // Nota muy larga
    if (orderData.note && orderData.note.length > 300) {
      notification.warning({
        message: 'Nota muy extensa',
        description: 'La nota no debe exceder los 300 caracteres.',
        duration: 5,
      });
      return;
    }

    setLoading(true);
    try {
      const submitData = sanitizeData(orderData, defaultsMap);
      if (mode === 'create') {
        await addOrder({ user, order: submitData, localFiles });
      } else if (mode === 'update') {
        await fbUpdateOrder({ user, order: submitData, localFiles });
      }
      message.success('Pedido guardado exitosamente');
      dispatch(cleanOrder());
      navigate(ORDERS);
    } catch (error) {
      console.error('Error al guardar el pedido:', error);
      message.error('Error al guardar el pedido');
    } finally {
      setLoading(false);
    }
  }, [
    dispatch,
    navigate,
    user,
    orderData,
    localFiles,
    ORDERS,
    mode,
  ]);

  const handleCancel = useCallback(() => {
    dispatch(cleanOrder());
    navigate(ORDERS);
  }, [dispatch, navigate, ORDERS]);

  // Limpiar datos al montar el componente si estamos en modo crear
  useEffect(() => {
    if (mode === 'create') {
      dispatch(cleanOrder());
    }
  }, [dispatch, mode]);

  return (
    <Container>
      <MenuApp
        showBackButton={false}
        sectionName={mode === 'create' ? 'Nuevo Pedido' : 'Editar Pedido'}
      />
      <Loader loading={orderLoading} minHeight="200px">
        <Body>
          <Form layout="vertical">
            <GeneralForm
              mode={mode}
              files={localFiles}
              attachmentUrls={orderData.attachmentUrls || []}
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
    </Container>
  );
};

export default OrderManagement;

