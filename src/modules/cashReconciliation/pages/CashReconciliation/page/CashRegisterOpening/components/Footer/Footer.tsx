import styled from 'styled-components';
import { ConfirmCancelButtons } from '@/modules/cashReconciliation/pages/CashReconciliation/resource/ConfirmCancelButtons/ConfirmCancelButtons';

interface FooterProps {
  onSubmit?: (() => void) | null;
  onCancel?: (() => void) | null;
}

export const Footer: React.FC<FooterProps> = ({ onSubmit, onCancel }) => {
  return (
    <Container>
      <ConfirmCancelButtons onSubmit={onSubmit} onCancel={onCancel} />
    </Container>
  );
};

const Container = styled.div`
  position: sticky;
  bottom: 0;
  padding: 0.4em;
  background-color: #ffffff96;
  border: var(--border-primary);
  border-radius: var(--border-radius);
  backdrop-filter: blur(5px);
`;
