import { Modal } from 'antd';
import styled from 'styled-components';

import type { JSX } from 'react';

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

export const SessionInfoModal = ({ isOpen, onClose, user, business }: SessionInfoModalProps): JSX.Element => {
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

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      title={<Title>Información de la sesión</Title>}
      centered
      destroyOnClose
      width={420}
      styles={{
        body: {
          padding: '1.25rem',
        },
      }}
    >
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
    </Modal>
  );
};

const Title = styled.h2`
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-primary-600, #2563eb);
  margin: 0;
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
