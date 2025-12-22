import { useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';

export const PreorderConfirmation = ({
  open,
  onConfirm,
  onCancel,
  preorder,
  loading,
}) => {
  const preorderNumber =
    preorder?.data?.preorderDetails?.numberID ||
    preorder?.data?.numberID ||
    'N/A';
  const clientName = preorder?.data?.client?.name || 'N/A';

  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !loading) {
        onCancel?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, loading, onCancel]);

  const handleBackdropClick = (event) => {
    if (loading) return;
    if (event.target === event.currentTarget) {
      onCancel?.();
    }
  };

  const handleConfirm = () => {
    if (loading) return;
    onConfirm?.();
  };

  const handleCancel = () => {
    if (loading) return;
    onCancel?.();
  };

  if (!open) {
    return null;
  }

  return (
    <Backdrop role="presentation" onMouseDown={handleBackdropClick}>
      <Dialog
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="preorder-confirmation-title"
        aria-describedby="preorder-confirmation-description"
      >
        <Header>
          <Title id="preorder-confirmation-title">Confirmar preventa</Title>
          <CloseButton
            type="button"
            onClick={handleCancel}
            disabled={loading}
            aria-label="Cerrar"
          >
            ×
          </CloseButton>
        </Header>
        <Body id="preorder-confirmation-description">
          ¿Deseas completar la preventa <strong>{preorderNumber}</strong> para
          el cliente <strong>{clientName}</strong>?
        </Body>
        <Footer>
          <SecondaryButton
            type="button"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancelar
          </SecondaryButton>
          <PrimaryButton
            type="button"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? 'Guardando...' : 'Completar'}
          </PrimaryButton>
        </Footer>
      </Dialog>
    </Backdrop>
  );
};

const fadeIn = keyframes`
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
`;

const slideUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(24px) scale(0.98);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1800;
  display: grid;
  place-items: center;
  padding: 16px;
  background: rgb(15 23 42 / 50%);
  animation: ${fadeIn} 0.16s ease forwards;
`;

const Dialog = styled.article`
  display: grid;
  gap: 18px;
  width: min(420px, 92vw);
  padding: 20px;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 18px 38px rgb(15 23 42 / 18%);
  animation: ${slideUp} 0.22s ease forwards;
`;

const Header = styled.header`
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #0f172a;
`;

const CloseButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  font-size: 1.4rem;
  line-height: 1;
  color: #64748b;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  background: transparent;
  border: none;
  border-radius: 8px;

  &:hover {
    color: ${({ disabled }) => (disabled ? '#94a3b8' : '#0f172a')};
    background: ${({ disabled }) => (disabled ? 'transparent' : '#f1f5f9')};
  }
`;

const Body = styled.div`
  font-size: 0.95rem;
  line-height: 1.45;
  color: #334155;

  strong {
    color: #0f172a;
  }
`;

const Footer = styled.footer`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;

const BaseButton = styled.button`
  min-width: 120px;
  padding: 10px 16px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  border: none;
  border-radius: 8px;
  opacity: ${({ disabled }) => (disabled ? 0.65 : 1)};
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    background 0.2s ease;
`;

const PrimaryButton = styled(BaseButton)`
  color: #fff;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  box-shadow: 0 12px 22px rgb(37 99 235 / 25%);

  &:hover {
    box-shadow: ${({ disabled }) =>
      disabled
        ? '0 12px 22px rgba(37, 99, 235, 0.25)'
        : '0 16px 28px rgba(37, 99, 235, 0.3)'};
    transform: ${({ disabled }) =>
      disabled ? 'none' : 'translateY(-1px) scale(1.01)'};
  }
`;

const SecondaryButton = styled(BaseButton)`
  color: #1f2937;
  background: #e2e8f0;

  &:hover {
    background: ${({ disabled }) => (disabled ? '#e2e8f0' : '#cbd5f5')};
  }
`;
