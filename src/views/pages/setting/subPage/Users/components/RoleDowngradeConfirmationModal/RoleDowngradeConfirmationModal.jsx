import { 
  faExclamationTriangle, 
  faArrowDown
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Modal } from 'antd';
import styled from 'styled-components';

const RoleDowngradeConfirmationModal = ({ 
  isOpen, 
  currentRole, 
  newRole, 
  userName, 
  onConfirm, 
  onCancel 
}) => {
  return (    <StyledModal
      open={isOpen}
      onCancel={onCancel}
      footer={null}
      width={500}
      centered
      closable={false}
    >      <Container>
        <IconContainer>
          <FontAwesomeIcon icon={faExclamationTriangle} />
        </IconContainer>
        
        <Content>
          <Title>Cambiar Rol de Usuario</Title>
          <Subtitle>Se reducirán los privilegios de <strong>{userName}</strong></Subtitle>
          
          <RoleChange>
            <Role>
              <RoleLabel>Actual</RoleLabel>
              <RoleName>{currentRole}</RoleName>
            </Role>
            <ArrowIcon>
              <FontAwesomeIcon icon={faArrowDown} />
            </ArrowIcon>
            <Role>
              <RoleLabel>Nuevo</RoleLabel>
              <RoleName>{newRole}</RoleName>
            </Role>
          </RoleChange>
          
          <Warning>
            Esta acción no se puede deshacer automáticamente
          </Warning>
        </Content>

        <Actions>
          <CancelButton onClick={onCancel}>
            Cancelar
          </CancelButton>
          <ConfirmButton onClick={onConfirm}>
            Confirmar
          </ConfirmButton>
        </Actions>
      </Container>
    </StyledModal>
  );
};

export default RoleDowngradeConfirmationModal;

// Styled Components
const StyledModal = styled(Modal)`
  .ant-modal-content {
    border-radius: 20px;
    overflow: hidden;
    padding: 0;
    box-shadow: 0 24px 48px rgba(0, 0, 0, 0.15);
    animation: modalSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }
  
  @keyframes modalSlideIn {
    from {
      opacity: 0;
      transform: translateY(-12px) scale(0.96);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
`;

const Container = styled.div`
  background: #ffffff;
  text-align: center;
`;

const IconContainer = styled.div`
  padding: 32px 24px 24px 24px;
  font-size: 48px;
  color: #ff9500;
`;

const Content = styled.div`
  padding: 0 24px 24px 24px;
`;

const Title = styled.h3`
  margin: 0 0 8px 0;
  font-size: 17px;
  font-weight: 600;
  color: #1d1d1f;
  letter-spacing: -0.022em;
`;

const Subtitle = styled.p`
  margin: 0 0 24px 0;
  font-size: 13px;
  color: #86868b;
  line-height: 1.38;
  
  strong {
    color: #1d1d1f;
    font-weight: 600;
  }
`;

const RoleChange = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin: 24px 0;
  padding: 16px;
  background: #f5f5f7;
  border-radius: 12px;
`;

const Role = styled.div`
  text-align: center;
`;

const RoleLabel = styled.div`
  font-size: 11px;
  color: #86868b;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  margin-bottom: 4px;
  font-weight: 500;
`;

const RoleName = styled.div`
  font-size: 15px;
  color: #1d1d1f;
  font-weight: 600;
  text-transform: capitalize;
`;

const ArrowIcon = styled.div`
  color: #86868b;
  font-size: 16px;
`;

const Warning = styled.div`
  margin: 24px 0;
  padding: 12px 16px;
  background: #fff9f4;
  border-radius: 8px;
  font-size: 13px;
  color: #bf4800;
  border: 1px solid #ffe5cc;
`;

const Actions = styled.div`
  display: flex;
  border-top: 0.5px solid #d2d2d7;
`;

const Button = styled.button`
  flex: 1;
  padding: 17px 16px;
  border: none;
  background: transparent;
  font-size: 17px;
  cursor: pointer;
  transition: background-color 0.15s ease;
  
  &:not(:last-child) {
    border-right: 0.5px solid #d2d2d7;
  }
  
  &:hover {
    background: rgba(0, 0, 0, 0.04);
  }
  
  &:active {
    background: rgba(0, 0, 0, 0.08);
  }
`;

const CancelButton = styled(Button)`
  color: #007aff;
  font-weight: 400;
`;

const ConfirmButton = styled(Button)`
  color: #ff3b30;
  font-weight: 600;
`;
