import type { JSX, MouseEvent } from 'react';
import styled from 'styled-components';

type SessionUser = {
  realName?: string | null;
  username?: string | null;
  email?: string | null;
  role?: string | null;
} | null;

type SessionBusiness = {
  name?: string | null;
  rnc?: string | null;
  taxId?: string | null;
} | null;

type InfoRowEntry = {
  label: string;
  value: string | number;
};

type SessionInfoModalProps = {
  isOpen: boolean;
  onClose: () => void;
  user?: SessionUser;
  business?: SessionBusiness;
};

export const SessionInfoModal = ({
  isOpen,
  onClose,
  user,
  business,
}: SessionInfoModalProps): JSX.Element | null => {
  if (!isOpen) {
    return null;
  }

  const infoRows = [
    { label: 'Nombre', value: typeof user?.realName === 'string' ? user.realName : null },
    { label: 'Usuario', value: typeof user?.username === 'string' ? user.username : null },
    { label: 'Correo', value: typeof user?.email === 'string' ? user.email : null },
    { label: 'Rol', value: typeof user?.role === 'string' ? user.role : null },
    { label: 'Negocio', value: typeof business?.name === 'string' ? business.name : null },
    {
      label: 'RNC',
      value:
        typeof business?.rnc === 'string'
          ? business.rnc
          : typeof business?.taxId === 'string'
          ? business.taxId
          : null,
    },
  ].filter((row): row is InfoRowEntry => Boolean(row.value));

  const handleCardClick = (event: MouseEvent<HTMLDivElement>): void => {
    event.stopPropagation();
  };

  return (
    <Overlay onClick={onClose}>
      <ModalCard onClick={handleCardClick}>
        <Header>
          <Title>Información de la sesión</Title>
          <CloseButton aria-label="Cerrar" onClick={onClose}>
            &times;
          </CloseButton>
        </Header>
        <Body>
          {infoRows.length > 0 ? (
            <InfoGrid>
              {infoRows.map(({ label, value }) => (
                <InfoRow key={label}>
                  <InfoLabel>{label}</InfoLabel>
                  <InfoValue>{value}</InfoValue>
                </InfoRow>
              ))}
            </InfoGrid>
          ) : (
            <EmptyState>No encontramos datos de la sesión.</EmptyState>
          )}
        </Body>
      </ModalCard>
    </Overlay>
  );
};

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(15, 23, 42, 0.55);
  z-index: 1000;
  padding: 1rem;
`;

const ModalCard = styled.div`
  width: min(420px, 100%);
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 15px 40px rgba(15, 23, 42, 0.15);
  display: grid;
  grid-template-rows: auto 1fr;
  overflow: hidden;
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  background: #f8fafc;
`;

const Title = styled.h2`
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-primary-600, #2563eb);
  margin: 0;
`;

const CloseButton = styled.button`
  border: none;
  background: transparent;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  color: #0f172a;
  padding: 0;

  &:hover {
    color: var(--color-primary-600, #2563eb);
  }
`;

const Body = styled.div`
  padding: 1.25rem;
`;

const InfoGrid = styled.div`
  display: grid;
  gap: 0.75rem;
`;

const InfoRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
`;

const InfoLabel = styled.span`
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #94a3b8;
  font-weight: 600;
`;

const InfoValue = styled.span`
  font-size: 0.95rem;
  color: #0f172a;
  font-weight: 500;
`;

const EmptyState = styled.p`
  margin: 0;
  font-size: 0.9rem;
  color: #475569;
`;
