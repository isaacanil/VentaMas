import { Button } from 'antd';
import styled from 'styled-components';
import type { PurchaseMode } from '../types';

interface PurchaseManagementActionsProps {
  loading: boolean;
  onCancel: () => void;
  onSubmit: () => void | Promise<void>;
  mode?: PurchaseMode;
  disabled?: boolean;
}

export const PurchaseManagementActions = ({
  loading,
  mode = 'create',
  onCancel,
  onSubmit,
  disabled = false,
}: PurchaseManagementActionsProps) => {
  const submitLabel =
    mode === 'complete' ? 'Registrar recepcion' : 'Guardar';

  return (
    <ButtonsContainer>
      <InnerActions>
        <Button onClick={onCancel}>Cancelar</Button>
        <Button
          type="primary"
          onClick={() => void onSubmit()}
          loading={loading}
          disabled={disabled}
        >
          {submitLabel}
        </Button>
      </InnerActions>
    </ButtonsContainer>
  );
};

const ButtonsContainer = styled.div`
  position: sticky;
  bottom: 0;
  width: 100%;
  padding: 1em;
  background-color: #fff;
  border-top: 1px solid #e8e8e8;
`;

const InnerActions = styled.div`
  display: flex;
  gap: 1em;
  justify-content: flex-end;
  max-width: 1440px;
  width: 100%;
  margin: 0 auto;

  @media (max-width: 576px) {
    justify-content: space-between;
    
    button {
      flex: 1;
    }
  }
`;
