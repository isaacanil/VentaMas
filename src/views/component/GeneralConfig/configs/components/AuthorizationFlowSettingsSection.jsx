import React, { useState } from 'react';
import styled from 'styled-components';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { selectUser } from '../../../../../features/auth/userSlice';
import { SelectSettingCart } from '../../../../../features/cart/cartSlice';
import { setBillingSettings } from '../../../../../firebase/billing/billingSetting';
import { ROUTES } from '../../../../../routes/routesName';

const AuthorizationFlowSettingsSection = () => {
  const user = useSelector(selectUser);
  const settings = useSelector(SelectSettingCart) || {};
  const authorizationFlowEnabled = !!settings?.billing?.authorizationFlowEnabled;
  const [isUpdating, setIsUpdating] = useState(false);
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  const handleToggle = async (nextValue) => {
    if (!user?.businessID) {
      messageApi.error('No se pudo actualizar la configuración de autorizaciones.');
      return;
    }

    setIsUpdating(true);
    try {
      await setBillingSettings(user, { authorizationFlowEnabled: nextValue });
      messageApi.success(
        `Flujo de autorizaciones ${nextValue ? 'habilitado' : 'deshabilitado'}`
      );
    } catch (error) {
      messageApi.error('Error al guardar la configuración.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleGoToAuthorizations = () => {
    navigate(ROUTES.AUTHORIZATIONS_TERM.AUTHORIZATIONS_LIST);
  };

  return (
    <Container>
      {contextHolder}
      <SectionContainer>
        <InfoBlock>
          <InfoTitle>Habilitar Flujo de Autorizaciones</InfoTitle>
          <InfoDescription>
            Activa o desactiva la autorización con PIN para acciones protegidas
          </InfoDescription>
        </InfoBlock>
        <ToggleButton
          type="button"
          role="switch"
          aria-checked={authorizationFlowEnabled}
          aria-label="Alternar flujo de autorizaciones"
          onClick={() => handleToggle(!authorizationFlowEnabled)}
          disabled={isUpdating}
          $checked={authorizationFlowEnabled}
        >
          <ToggleThumb $checked={authorizationFlowEnabled} />
        </ToggleButton>
      </SectionContainer>

      <StatusContainer>
        {authorizationFlowEnabled ? (
          <StatusCard $type="info">
            <StatusHeader>
              <StatusIndicator $type="info" />
              <StatusTitle $type="info">Autorizaciones activadas</StatusTitle>
            </StatusHeader>
            <StatusDescription>
              Los cajeros deberán solicitar la aprobación de un supervisor con PIN para acciones protegidas como aplicar descuentos.
            </StatusDescription>
            <HistoryLink type="button" onClick={handleGoToAuthorizations}>
              Ver historial de autorizaciones
            </HistoryLink>
          </StatusCard>
        ) : (
          <StatusCard $type="warning">
            <StatusHeader>
              <StatusIndicator $type="warning" />
              <StatusTitle $type="warning">Autorizaciones desactivadas</StatusTitle>
            </StatusHeader>
            <StatusDescription>
              El flujo de autorizaciones está deshabilitado. Las acciones protegidas se podrán realizar sin solicitar PIN.
            </StatusDescription>
          </StatusCard>
        )}
      </StatusContainer>
    </Container>
  );
};

export default AuthorizationFlowSettingsSection;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const SectionContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1em;
  padding: 16px;
  background-color: #fdfdfdff;
  border-radius: 12px;
  border: 1px solid #e5e9f2;
`;

const InfoBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const InfoTitle = styled.h4`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2933;
`;

const InfoDescription = styled.p`
  margin: 0;
  font-size: 14px;
  color: rgba(31, 41, 51, 0.6);
`;

const ToggleButton = styled.button`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  width: 44px;
  height: 24px;
  padding: 0;
  border-radius: 999px;
  border: none;
  background-color: ${({ $checked }) => ($checked ? '#2abf88' : '#b8c2cc')};
  transition: background-color 0.2s ease;
  cursor: pointer;
  outline: none;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

const ToggleThumb = styled.span`
  position: absolute;
  top: 2px;
  left: ${({ $checked }) => ($checked ? '22px' : '2px')};
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: #ffffff;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.3);
  transition: left 0.2s ease;
`;

const StatusContainer = styled.div`

`;

const StatusCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-radius: 10px;
  background-color: ${({ $type }) =>
    $type === 'info' ? 'rgba(42, 191, 136, 0.12)' : 'rgba(245, 158, 11, 0.15)'};
  border: 1px solid
    ${({ $type }) => ($type === 'info' ? 'rgba(42, 191, 136, 0.35)' : 'rgba(245, 158, 11, 0.35)')};
`;

const StatusHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StatusIndicator = styled.span`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: ${({ $type }) => ($type === 'info' ? '#2abf88' : '#f59e0b')};
`;

const StatusTitle = styled.span`
  font-weight: 600;
  font-size: 15px;
  color: ${({ $type }) => ($type === 'info' ? '#0f5132' : '#8a3b00')};
`;

const StatusDescription = styled.p`
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: rgba(31, 41, 51, 0.75);
`;

const HistoryLink = styled.button`
  align-self: flex-start;
  padding: 0;
  border: none;
  background: none;
  color: #1570ef;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  text-decoration: underline;

  &:hover {
    color: #0b4abf;
  }
`;
