import { Form, Button, Segmented, notification } from 'antd';
import { AppModal } from '@/components/ui/AppModal/AppModal';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { OPERATION_MODES } from '@/constants/modes';
import { selectUser } from '@/features/auth/userSlice';
import {
  addClient,
  selectClient as selectCartClient,
  setClientMode,
} from '@/features/clientCart/clientCartSlice';
import { CLIENT_MODE_BAR } from '@/features/clientCart/clientMode';
import { toggleClientModal } from '@/features/modals/modalSlice';
import type {
  ClientInput,
} from '@/firebase/client/clientNormalizer';
import type { UserIdentity, UserWithBusiness } from '@/types/users';
import { submitClientForm } from './utils/submitClientForm';

import ClientFinancialInfo from './components/ClientFinancialInfo/ClientFinancialInfo';
import { ClientGeneralInfo } from './components/ClientGeneralInfo';

type ClientFormAntProps = {
  isOpen: boolean;
  mode: string;
  data?: ClientInput | null;
  addClientToCart?: boolean;
};

type UserRootState = Parameters<typeof selectUser>[0];
type ClientRootState = Parameters<typeof selectCartClient>[0];
type ClientCartClient = Parameters<typeof addClient>[0];

const mapClientToCart = (client: NormalizedClient): ClientCartClient => ({
  ...client,
  id: client.id != null ? String(client.id) : '',
  name: (client.name as string | undefined) ?? '',
  tel: (client.tel as string | undefined) ?? '',
  address: (client.address as string | undefined) ?? '',
  personalID: (client.personalID as string | undefined) ?? '',
  delivery: client.delivery ?? { status: false, value: 0 },
});

const hasBusinessId = (
  candidate: UserIdentity | null,
): candidate is UserWithBusiness =>
  Boolean(
    candidate &&
    typeof candidate.businessID === 'string' &&
    candidate.businessID.trim().length > 0,
  );

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
  const [activeTab, setActiveTab] = useState<'general' | 'financial'>('general');
  const clientData = form.getFieldsValue() as Partial<ClientInput>;
  const dispatch = useDispatch();
  const user = useSelector<UserRootState, UserIdentity | null>(selectUser);
  const selectedClient = useSelector<
    ClientRootState,
    ReturnType<typeof selectCartClient>
  >(selectCartClient);
  const userWithBusiness = hasBusinessId(user) ? user : null;

  const [hasRncPanel, setHasRncPanel] = useState(false);

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

  const clientSummary = {
    ...client,
    id: client.id != null ? String(client.id) : undefined,
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
    if (loading) {
      return;
    }

    setLoading(true);
    const result = await submitClientForm({
      customerData,
      form,
      isUpdating,
      selectedClientId: selectedClient?.id ?? null,
      userWithBusiness,
    });
    setLoading(false);

    if (result.status === 'validation_error') {
      return;
    }

    if (result.status === 'error') {
      notification.error({
        message: result.errorMessage,
        description: result.errorDescription,
      });
      return;
    }

    if (addClientToCart && result.clientForCart) {
        dispatch(setClientMode(CLIENT_MODE_BAR.UPDATE.id));
        dispatch(addClient(mapClientToCart(result.clientForCart)));
      }

    notification.success({
      message: result.successMessage,
      description: result.successDescription,
    });

    // Ensure the form is reset only when the modal is still open
    form.resetFields();

    dispatch(toggleClientModal({ mode: create }));
  };
  const handleOpenModal = () => {
    if (loading) return;
    setActiveTab('general');
    dispatch(toggleClientModal({ mode: create }));
  };

  const handleCancel = () => handleOpenModal();

  const footerButtons =
    activeTab === 'financial' ? null : (
      <>
        <Button onClick={handleCancel} disabled={loading}>
          Cerrar
        </Button>
        {isUpdating ? (
          <Button
            type="primary"
            loading={loading}
            disabled={loading}
            onClick={handleSubmit}
          >
            Actualizar Cliente
          </Button>
        ) : (
          <Button
            type="primary"
            loading={loading}
            disabled={loading}
            onClick={handleSubmit}
          >
            Crear
          </Button>
        )}
      </>
    );

  const modalWidth = activeTab === 'financial' ? 1000 : (hasRncPanel ? 1000 : 500);

  return (
    <AppModal
      open={isOpen}
      title={isUpdating ? 'Editar Cliente' : 'Nuevo Cliente'}
      width={modalWidth}
      destroyOnClose
      keyboard={!loading}
      maskClosable={!loading}
      onClose={handleCancel}
      footer={footerButtons}
    >
      <TabBar>
        <Segmented
          value={activeTab}
          onChange={(val) => setActiveTab(val as 'general' | 'financial')}
          options={[
            { label: 'Info. General', value: 'general' },
            { label: 'Info. Financiera', value: 'financial', disabled: !isUpdating },
          ]}
        />
      </TabBar>
      <ScrollableContent>
        {activeTab === 'general' ? (
          <ClientGeneralInfo
            form={form}
            customerData={customerData}
            onRncPanelChange={setHasRncPanel}
          />
        ) : (
          <ClientFinancialInfo client={clientSummary} />
        )}
      </ScrollableContent>
    </AppModal>
  );
};

export default ClientFormAnt;

const TabBar = styled.div`
  display: flex;
  justify-content: center;
  padding: 0.6em 1.2em 0.6em;
  border-bottom: 1px solid #e4e4e4;
  background: #fff;
  position: sticky;
  top: 0;
  z-index: 10;
`;

const ScrollableContent = styled.div`
  padding: 1.2em;
`;
