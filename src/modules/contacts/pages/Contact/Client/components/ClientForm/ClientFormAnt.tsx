import { Modal, Form, Button, Tabs, notification } from 'antd';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { OPERATION_MODES } from '@/constants/modes';
import { selectUser } from '@/features/auth/userSlice';
import {
  addClient,
  setClientMode,
} from '@/features/clientCart/clientCartSlice';
import { CLIENT_MODE_BAR } from '@/features/clientCart/clientMode';
import { toggleClientModal } from '@/features/modals/modalSlice';
import { fbAddClient } from '@/firebase/client/fbAddClient';
import { fbUpdateClient } from '@/firebase/client/fbUpdateClient';
import type { ClientInput, NormalizedClient } from '@/firebase/client/clientNormalizer';
import type { UserIdentity } from '@/types/users';

import ClientFinancialInfo from './components/ClientFinancialInfo/ClientFinancialInfo';
import { ClientGeneralInfo } from './components/ClientGeneralInfo';

type ClientFormAntProps = {
  isOpen: boolean;
  mode: string;
  data?: ClientInput | null;
  addClientToCart?: boolean;
};

type UserRootState = Parameters<typeof selectUser>[0];

const ClientFormAnt = ({
  isOpen,
  mode,
  data,
  addClientToCart = false,
  //isUpdating = false
}: ClientFormAntProps) => {
  const update = OPERATION_MODES.UPDATE.id;
  const create = OPERATION_MODES.CREATE.id;
  const isUpdating = mode === update;
  const [form] = Form.useForm<ClientInput>();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const clientData = form.getFieldsValue() as Partial<ClientInput>;
  const dispatch = useDispatch();
  const user = useSelector<UserRootState, UserIdentity | null>(selectUser);

  const customerData: ClientInput = {
    name: '',
    address: '',
    tel: '',
    personalID: '',
    tel2: '',
    numberId: 0,
    province: '',
    sector: '',
    delivery: {
      status: false,
      value: '',
    },
    ...(data ?? {}),
  };
  const client = {
    ...customerData,
    ...(data ?? {}),
    ...clientData,
  };
  useEffect(() => {
    if (mode === update && data) {
      form.setFieldsValue(data);
    }
    if (mode === create && !data) {
      form.resetFields();
    }
  }, [mode, data, update, create, form]);

  // useEffect(() => {
  //     if (isUpdating && customerData) {
  //         form.setFieldsValue(customerData);
  //     } else {
  //         setTimeout(() => {
  //         form.resetFields();
  //         creditLimitForm.resetFields();
  //         }, 10000);
  //     }
  // }, [customerData, isUpdating]);

  const handleSubmit = async () => {
    // Evitar submissions múltiples
    if (loading || submitted) {
      return;
    }

    try {
      setLoading(true);
      setSubmitted(true); // Marcar como enviado
      let clientCreated: NormalizedClient | null = null;
      const values = await form.validateFields();
      // const creditLimitData = await creditLimitForm.validateFields(); // Ya no necesario aquí

      const sanitizedValues = values as ClientInput & { clear?: unknown };
      delete sanitizedValues.clear;

      const client = {
        ...customerData,
        ...sanitizedValues,
      };

      if (isUpdating) {
        await fbUpdateClient(user, client as ClientInput & { id: string });
        // fbUpsertCreditLimit se maneja ahora en CreditLimitModal
        notification.success({
          message: 'Cliente Actualizado',
          description:
            'La información del cliente ha sido actualizada con éxito.',
        });
      } else {
        clientCreated = (await fbAddClient(user, client)) ?? null;
        notification.success({
          message: 'Cliente Creado',
          description: 'Se ha añadido un nuevo cliente con éxito.',
        });
      }
      if (addClientToCart && clientCreated) {
        dispatch(setClientMode(CLIENT_MODE_BAR.UPDATE.id));
        dispatch(addClient(clientCreated));
      }

      // Ensure the form is reset only when the modal is still open

      form.resetFields();

      dispatch(toggleClientModal({ mode: create }));
    } catch {
      notification.error({
        message: 'Error al Procesar',
        description:
          'Hubo un error al procesar el formulario. Por favor, inténtelo de nuevo.',
      });
    } finally {
      setLoading(false);
      // Resetear el estado submitted después de un breve delay
      setTimeout(() => {
        setSubmitted(false);
      }, 2000); // 2 segundos de cooldown
    }
  };
  const handleOpenModal = () => dispatch(toggleClientModal({ mode: create }));

  const handleCancel = () => handleOpenModal();

  const items = [
    {
      key: '1',
      label: 'Info. General',
      children: (
        <ClientGeneralInfo
          form={form}
          customerData={customerData}
          isUpdating={isUpdating}
          handleSubmit={handleSubmit}
          loading={loading}
          submitted={submitted}
        />
      ),
    },
    {
      key: '2',
      label: 'Info. Financiera',
      children: (
        <ClientFinancialInfo
          client={client}
        />
      ),
      disabled: !isUpdating,
    },
  ];

  return (
    <Modal
      style={{ top: 10 }}
      open={isOpen}
      title={isUpdating ? 'Editar Cliente' : 'Nuevo Cliente'}
      cancelText="Cerrar"
      width={1000}
      styles={{
        content: {
          padding: '1.2em',
        },
      }}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Cerrar
        </Button>,
        // Solo mostrar el botón crear cuando no está actualizando
        !isUpdating && (
          <Button
            key="create"
            type="primary"
            loading={loading || submitted}
            disabled={loading || submitted}
            onClick={handleSubmit}
          >
            Crear
          </Button>
        ),
      ]}
    >
      <Tabs defaultActiveKey="1" items={items} />
      <br />
    </Modal>
  );
};

export default ClientFormAnt;
