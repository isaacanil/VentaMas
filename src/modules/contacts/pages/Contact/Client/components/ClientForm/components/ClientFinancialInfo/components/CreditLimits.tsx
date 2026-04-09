import {
  faFileInvoice,
  faCreditCard,
  faExclamationTriangle,
  faCheckCircle,
  faTimesCircle,
  faEdit,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'antd';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '@/features/auth/userSlice';
import { fbGetCreditLimit } from '@/firebase/accountsReceivable/fbGetCreditLimit';
import { formatPrice } from '@/utils/format';
import type { CreditLimitConfig } from '@/utils/accountsReceivable/types';
import type { UserIdentity } from '@/types/users';

import CreditLimitModal from './CreditLimitModal';

type CreditLimitsProps = {
  arBalance?: number;
  client: { id?: string | null; name?: string | null } | null | undefined;
};

type UserRootState = Parameters<typeof selectUser>[0];

type CreditValueProps = {
  creditValue?: number;
};

export const CreditLimits = ({
  arBalance = 800,
  client,
}: CreditLimitsProps) => {
  const [modalVisible, setModalVisible] = useState(false);
  const user = useSelector<UserRootState, UserIdentity | null>(selectUser);
  const businessId = user?.businessID ?? null;
  const clientId = client?.id ?? null;
  const queryClient = useQueryClient();

  const {
    data: creditLimitState,
    error,
    isLoading,
  } = useQuery<CreditLimitConfig | null, Error>({
    queryKey: ['creditLimit', businessId, clientId],
    queryFn: () => fbGetCreditLimit({ user, clientId }),
    enabled: Boolean(user && businessId && clientId),
    staleTime: 60000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Derivar el estado directamente de la query en lugar de usar useEffect
  const creditLimitStatus = creditLimitState?.creditLimit?.status ?? false;

  const handleEditLimits = () => {
    setModalVisible(true);
  };

  const handleModalSave = async (_values?: CreditLimitConfig) => {
    try {
      // Invalidar la query para refrescar los datos
      queryClient.invalidateQueries({
        queryKey: ['creditLimit', businessId, clientId],
      });
    } catch (err) {
      console.error('Error updating form:', err);
    }
  };

  const handleModalClose = () => {
    setModalVisible(false);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error loading credit limit</div>;
  }

  // Función para obtener el ícono del crédito disponible
  const getCreditIcon = (availableCredit: number) => {
    if (availableCredit < 0) return faTimesCircle;
    if (availableCredit === 0) return faExclamationTriangle;
    return faCheckCircle;
  };

  return (
    <div>
      <Container>
        <Header>
          <Title>Configuración de límites</Title>
        </Header>

        <SummaryGrid>
          <SummaryCard>
            <SummaryIcon>
              <FontAwesomeIcon icon={faFileInvoice} />
            </SummaryIcon>
            <SummaryContent>
              <SummaryLabel>Límite de facturas</SummaryLabel>
              <SummaryValue>
                {creditLimitState?.invoice?.status &&
                creditLimitState?.invoice?.value
                  ? creditLimitState.invoice.value
                  : 'No configurado'}
              </SummaryValue>
            </SummaryContent>
            <EditButton onClick={handleEditLimits}>
              <FontAwesomeIcon icon={faEdit} />
            </EditButton>
          </SummaryCard>

          <SummaryCard>
            <SummaryIcon>
              <FontAwesomeIcon icon={faCreditCard} />
            </SummaryIcon>
            <SummaryContent>
              <SummaryLabel>Límite de crédito</SummaryLabel>
              <SummaryValue>
                {creditLimitState?.creditLimit?.status &&
                creditLimitState?.creditLimit?.value
                  ? formatPrice(creditLimitState.creditLimit.value)
                  : 'No configurado'}
              </SummaryValue>
            </SummaryContent>
            <EditButton onClick={handleEditLimits}>
              <FontAwesomeIcon icon={faEdit} />
            </EditButton>
          </SummaryCard>

          {creditLimitState?.creditLimit?.status &&
            creditLimitState?.creditLimit?.value && (
              <SummaryCard>
                <SummaryIcon
                  creditValue={creditLimitState.creditLimit.value - arBalance}
                >
                  <FontAwesomeIcon
                    icon={getCreditIcon(
                      creditLimitState.creditLimit.value - arBalance,
                    )}
                  />
                </SummaryIcon>
                <SummaryContent>
                  <SummaryLabel>
                    Crédito disponible
                    {(() => {
                      const availableCredit =
                        creditLimitState.creditLimit.value - arBalance;
                      if (availableCredit < 0) return ' (Sobregiro)';
                      if (availableCredit === 0) return ' (Límite alcanzado)';
                      return '';
                    })()}
                  </SummaryLabel>
                  <SummaryValue
                    creditValue={creditLimitState.creditLimit.value - arBalance}
                  >
                    {formatPrice(
                      creditLimitState.creditLimit.value - arBalance || 0,
                    )}
                  </SummaryValue>
                </SummaryContent>
              </SummaryCard>
            )}
        </SummaryGrid>
      </Container>

      <CreditLimitModal
        visible={modalVisible}
        onClose={handleModalClose}
        onSave={handleModalSave}
        initialValues={creditLimitState}
        client={client}
        arBalance={arBalance}
      />

      {/* Alerts */}
      {creditLimitState?.creditLimit?.status &&
        creditLimitState?.creditLimit?.value < arBalance && (
          <Alert
            message="Advertencia"
            description="El límite de crédito es menor que el balance disponible."
            type="warning"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}

      {!creditLimitStatus && (
        <Alert
          message="Advertencia"
          description={`El límite de crédito no está activado para el cliente ${client?.name ?? ''}. No podrás usar las funcionalidades de cuentas por cobrar hasta que actives el límite de crédito.`}
          type="warning"
          showIcon
          style={{ marginTop: 16 }}
        />
      )}
    </div>
  );
};

// Estilos con Styled Components
const Container = styled.div`
  padding: 0 12px 8px;
  border-radius: 6px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.4;
  color: ${({ theme }) => theme.text?.primary || 'rgba(0, 0, 0, 0.87)'};
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
`;

const SummaryCard = styled.div`
  display: flex;
  align-items: center;
  padding: 12px;
  background: ${({ theme }) => theme.bg?.light || '#ffffff'};
  border: 1px solid ${({ theme }) => theme.border?.light || '#e8e8e8'};
  border-radius: 4px;
  box-shadow: 0 1px 2px rgb(0 0 0 / 4%);
`;

const SummaryIcon = styled.div<CreditValueProps>`
  margin-right: 10px;
  font-size: 1rem;
  line-height: 1;
  color: ${(props) => {
    if (props.creditValue !== undefined) {
      if (props.creditValue < 0) return '#ff4d4f';
      if (props.creditValue === 0) return '#faad14';
      return '#2e7d32';
    }
    return '#1890ff';
  }};
`;

const SummaryContent = styled.div`
  flex: 1;
`;

const SummaryLabel = styled.div`
  margin-bottom: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1.5;
  color: ${({ theme }) => theme.text?.secondary || 'rgba(0, 0, 0, 0.54)'};
`;

const SummaryValue = styled.div<CreditValueProps>`
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.4;
  color: ${(props) => {
    if (props.creditValue !== undefined) {
      // Para crédito disponible
      if (props.creditValue < 0) return '#d32f2f'; // Rojo más oscuro para negativo (sobregiro)
      if (props.creditValue === 0) return '#f57c00'; // Naranja más oscuro para cero
      return '#2e7d32'; // Verde más oscuro para positivo
    }
    return props.theme?.text?.primary || 'rgba(0, 0, 0, 0.87)'; // Color por defecto
  }};
`;

const EditButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  margin-left: 8px;
  font-size: 0.875rem;
  color: #666;
  cursor: pointer;
  background: none;
  border: none;
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    color: #1890ff;
    background-color: #f0f0f0;
  }

  &:active {
    transform: scale(0.95);
  }
`;
