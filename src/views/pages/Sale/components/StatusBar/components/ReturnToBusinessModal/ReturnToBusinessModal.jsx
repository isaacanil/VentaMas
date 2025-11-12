import {
  faStore,
  faArrowLeft,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Modal, Button, Typography } from 'antd';
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';

import {
  selectIsTemporaryMode,
  returnToOriginalBusiness,
} from '../../../../../../../features/auth/userSlice';

const { Title, Text } = Typography;

export const ReturnToBusinessModal = ({ visible, onClose }) => {
  const dispatch = useDispatch();
  const isTemporaryMode = useSelector(selectIsTemporaryMode);

  const handleReturnToBusiness = () => {
    dispatch(returnToOriginalBusiness());
    onClose();
  };

  if (!isTemporaryMode) return null;

  return (
    <Modal
      title={null}
      open={visible}
      onCancel={onClose}
      footer={null}
      centered
      width={400}
      styles={{
        body: {
          padding: '24px',
        },
      }}
    >
      <ModalContent>
        <IconContainer>
          <FontAwesomeIcon icon={faUsers} size="3x" color="#ff6b35" />
        </IconContainer>

        <Title level={4} style={{ textAlign: 'center', marginBottom: '8px' }}>
          Estás visitando otro negocio
        </Title>

        <Text
          type="secondary"
          style={{
            textAlign: 'center',
            display: 'block',
            marginBottom: '24px',
          }}
        >
          Actualmente estás navegando como invitado. ¿Deseas regresar a tu
          negocio?
        </Text>

        <BusinessInfo>
          <FontAwesomeIcon
            icon={faStore}
            style={{ marginRight: '8px', color: '#00d084' }}
          />
          <Text strong>Mi Negocio</Text>
        </BusinessInfo>

        <ButtonContainer>
          <Button
            type="primary"
            size="large"
            icon={
              <FontAwesomeIcon
                icon={faArrowLeft}
                style={{ marginRight: '8px' }}
              />
            }
            onClick={handleReturnToBusiness}
            style={{
              background: '#00d084',
              borderColor: '#00d084',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            Regresar
          </Button>
        </ButtonContainer>
      </ModalContent>
    </Modal>
  );
};

const ModalContent = styled.div`
  text-align: center;
`;

const IconContainer = styled.div`
  margin-bottom: 16px;
`;

const BusinessInfo = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 208, 132, 0.1);
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 24px;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 12px;
`;

export default ReturnToBusinessModal;
