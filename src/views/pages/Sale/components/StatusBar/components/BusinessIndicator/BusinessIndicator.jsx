import { faStore, faUsers } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Tooltip } from 'antd';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import {
  selectIsTemporaryMode,
  selectUser,
} from '@/features/auth/userSlice';
import { ReturnToBusinessModal } from '@/views/pages/Sale/components/StatusBar/components/ReturnToBusinessModal';

export const BusinessIndicator = () => {
  const isTemporaryMode = useSelector(selectIsTemporaryMode);
  const [modalVisible, setModalVisible] = useState(false);
  const user = useSelector(selectUser);

  const businessIndicator = isTemporaryMode
    ? {
        text: 'VISITANDO',
        icon: faUsers,
        color: '#ff6b35',
        bgColor: 'rgba(255, 107, 53, 0.15)',
      }
    : {
        text: 'MI NEGOCIO',
        icon: faStore,
        color: '#00d084',
        bgColor: 'rgba(0, 208, 132, 0.15)',
      };

  const handleClick = () => {
    if (isTemporaryMode) {
      setModalVisible(true);
    }
  };
  if (user.role !== 'dev') return null;
  return (
    <>
      <Tooltip
        title={
          isTemporaryMode
            ? 'Haz clic para regresar a tu negocio'
            : 'Estás en tu negocio'
        }
      >
        <Container
          $color={businessIndicator.color}
          $bgColor={businessIndicator.bgColor}
          $isClickable={isTemporaryMode}
          onClick={handleClick}
        >
          <FontAwesomeIcon icon={businessIndicator.icon} size="sm" />
          <BusinessText>{businessIndicator.text}</BusinessText>
        </Container>
      </Tooltip>

      <ReturnToBusinessModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
};

const Container = styled.div`
  align-items: center;
  background: ${(props) => props.$bgColor};
  border-radius: 14px;
  color: ${(props) => props.$color};
  cursor: ${(props) => (props.$isClickable ? 'pointer' : 'default')};
  display: flex;
  font-size: 1rem;
  font-weight: 600;
  gap: 0.4rem;
  padding: 0.4rem 0.6rem;
  transition: all 0.2s ease;

  ${(props) =>
    props.$isClickable &&
    `
    &:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      filter: brightness(1.1);
    }
  `}
`;
const BusinessText = styled.span`
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3px;
`;
