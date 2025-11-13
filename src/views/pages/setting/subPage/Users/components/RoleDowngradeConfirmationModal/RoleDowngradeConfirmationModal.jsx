import {
  faExclamationTriangle,
  faArrowDown,
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
  onCancel,
}) => {
  return (
    <StyledModal
      open={isOpen}
      onCancel={onCancel}
      footer={null}
      width={500}
      centered
      closable={false}
    >
      {' '}
      <Container>
        <IconContainer>
          <FontAwesomeIcon icon={faExclamationTriangle} />
        </IconContainer>

        <Content>
          <Title>Cambiar Rol de Usuario</Title>
          <Subtitle>
            Se reducirán los privilegios de <strong>{userName}</strong>
          </Subtitle>

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

          <Warning>Esta acción no se puede deshacer automáticamente</Warning>
        </Content>

        <Actions>
          <CancelButton onClick={onCancel}>Cancelar</CancelButton>
          <ConfirmButton onClick={onConfirm}>Confirmar</ConfirmButton>
        </Actions>
      </Container>
    </StyledModal>
  );
};

export default RoleDowngradeConfirmationModal;

// Styled Components
const StyledModal = styled(Modal)`
  .ant-modal-content {
    padding: 0;
    overflow: hidden;
    border-radius: 20px;
    box-shadow: 0 24px 48px rgb(0 0 0 / 15%);
    animation: modal-slide-in 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @keyframes modal-slide-in {
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
  text-align: center;
  background: #fff;
`;

const IconContainer = styled.div`
  padding: 32px 24px 24px;
  font-size: 48px;
  color: #ff9500;
`;

const Content = styled.div`
  padding: 0 24px 24px;
`;

const Title = styled.h3`
  margin: 0 0 8px;
  font-size: 17px;
  font-weight: 600;
  color: #1d1d1f;
  letter-spacing: -0.022em;
`;

const Subtitle = styled.p`
  margin: 0 0 24px;
  font-size: 13px;
  line-height: 1.38;
  color: #86868b;

  strong {
    font-weight: 600;
    color: #1d1d1f;
  }
`;

const RoleChange = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: center;
  padding: 16px;
  margin: 24px 0;
  background: #f5f5f7;
  border-radius: 12px;
`;

const Role = styled.div`
  text-align: center;
`;

const RoleLabel = styled.div`
  margin-bottom: 4px;
  font-size: 11px;
  font-weight: 500;
  color: #86868b;
  text-transform: uppercase;
  letter-spacing: 0.6px;
`;

const RoleName = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: #1d1d1f;
  text-transform: capitalize;
`;

const ArrowIcon = styled.div`
  font-size: 16px;
  color: #86868b;
`;

const Warning = styled.div`
  padding: 12px 16px;
  margin: 24px 0;
  font-size: 13px;
  color: #bf4800;
  background: #fff9f4;
  border: 1px solid #ffe5cc;
  border-radius: 8px;
`;

const Actions = styled.div`
  display: flex;
  border-top: 0.5px solid #d2d2d7;
`;

const Button = styled.button`
  flex: 1;
  padding: 17px 16px;
  font-size: 17px;
  cursor: pointer;
  background: transparent;
  border: none;
  transition: background-color 0.15s ease;

    &:not(:last-child) {
    border-right: 0.5px solid #d2d2d7;
  }

    &:hover {
    background: rgb(0 0 0 / 4%);
  }

    &:active {
    background: rgb(0 0 0 / 8%);
  }
`;

const CancelButton = styled(Button)`
  font-weight: 400;
  color: #007aff;
`;

const ConfirmButton = styled(Button)`
  font-weight: 600;
  color: #ff3b30;
`;
