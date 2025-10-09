import { faStore, faUsers } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useState } from 'react'
import styled from 'styled-components'
import { Tooltip } from 'antd'
import { selectIsTemporaryMode, selectUser } from '../../../../../../../features/auth/userSlice'
import { useSelector } from 'react-redux'
import { ReturnToBusinessModal } from '../ReturnToBusinessModal'

export const BusinessIndicator = () => {
    const isTemporaryMode = useSelector(selectIsTemporaryMode);
    const [modalVisible, setModalVisible] = useState(false);
    const user = useSelector(selectUser);
    
    const businessIndicator = isTemporaryMode ? {
        text: 'VISITANDO',
        icon: faUsers,
        color: '#ff6b35',
        bgColor: 'rgba(255, 107, 53, 0.15)'
    } : {
        text: 'MI NEGOCIO',
        icon: faStore,
        color: '#00d084',
        bgColor: 'rgba(0, 208, 132, 0.15)'
    }

    const handleClick = () => {
        if (isTemporaryMode) {
            setModalVisible(true);
        }
    }
    if (user.role !== "dev") return null;
    return (
        <>
            <Tooltip title={isTemporaryMode ? 'Haz clic para regresar a tu negocio' : 'Estás en tu negocio'}>
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
    )
}

const Container = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.6rem;
  border-radius: 14px;
  background: ${props => props.$bgColor};
  color: ${props => props.$color};
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.2s ease;
  cursor: ${props => props.$isClickable ? 'pointer' : 'default'};
  
  ${props => props.$isClickable && `
    &:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      filter: brightness(1.1);
    }
  `}
`
const BusinessText = styled.span`
  font-weight: 700;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.3px;
`