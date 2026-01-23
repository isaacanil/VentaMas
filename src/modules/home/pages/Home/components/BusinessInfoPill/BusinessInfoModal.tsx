import { Modal } from 'antd';
import styled from 'styled-components';

import type { JSX } from 'react';

type BusinessInfo = {
  name?: string | null;
  logoUrl?: string | null;
  description?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  rnc?: string | null;
  taxId?: string | null;
  [key: string]: unknown;
} | null;

interface BusinessInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  business?: BusinessInfo;
}

export const BusinessInfoModal = ({
  isOpen,
  onClose,
  business,
}: BusinessInfoModalProps): JSX.Element => {
  const businessName =
    (typeof business?.name === 'string' && business.name.trim()) ||
    'Tu negocio';
  const logoUrl =
    typeof business?.logoUrl === 'string' && business.logoUrl.trim().length > 0
      ? business.logoUrl
      : null;

  const infoFields = [
    {
      label: 'Nombre comercial',
      value: typeof business?.name === 'string' ? business.name : null,
    },
    {
      label: 'Descripción',
      value:
        typeof business?.description === 'string' ? business.description : null,
    },
    {
      label: 'RNC / Tax ID',
      value:
        typeof business?.rnc === 'string'
          ? business.rnc
          : typeof business?.taxId === 'string'
            ? business.taxId
            : null,
    },
    {
      label: 'Teléfono',
      value: typeof business?.phone === 'string' ? business.phone : null,
    },
    {
      label: 'Correo',
      value: typeof business?.email === 'string' ? business.email : null,
    },
    {
      label: 'Dirección',
      value: typeof business?.address === 'string' ? business.address : null,
    },
  ].filter(
    (item): item is { label: string; value: string } => Boolean(item.value),
  );

  return (
    <Modal
      open={isOpen}
      centered
      onCancel={onClose}
      footer={null}
      destroyOnHidden
      title={<Title>Información del negocio</Title>}
      width={480}
      styles={{
        body: {
          padding: '1.5rem',
        },
      }}
    >
      <ModalBody>
        <LogoWrapper>
          {logoUrl ? (
            <LogoImage src={logoUrl} alt={`Logo de ${businessName}`} />
          ) : (
            <LogoPlaceholder aria-hidden="true">
              {businessName.charAt(0).toUpperCase()}
            </LogoPlaceholder>
          )}
        </LogoWrapper>
        {infoFields.length > 0 ? (
          <InfoList>
            {infoFields.map(({ label, value }) => (
              <InfoItem key={label}>
                <InfoLabel>{label}</InfoLabel>
                <InfoValue>{value}</InfoValue>
              </InfoItem>
            ))}
          </InfoList>
        ) : (
          <EmptyState>No encontramos datos adicionales del negocio.</EmptyState>
        )}
      </ModalBody>
    </Modal>
  );
};

const Title = styled.h2`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #0f172a;
`;

const ModalBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const LogoWrapper = styled.div`
  display: flex;
  justify-content: center;
`;

const LogoImage = styled.img`
  width: 120px;
  height: 120px;
  padding: 0.65rem;
  object-fit: contain;
  background: rgb(248 250 252 / 90%);
  border: 1px solid rgb(15 23 42 / 8%);
  border-radius: 20px;
`;

const LogoPlaceholder = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 120px;
  font-size: 3rem;
  font-weight: 700;
  color: #1d4ed8;
  background: rgb(226 232 240 / 65%);
  border-radius: 20px;
`;

const InfoList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
`;

const InfoLabel = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

const InfoValue = styled.span`
  font-size: 0.95rem;
  font-weight: 500;
  color: #0f172a;
  overflow-wrap: anywhere;
`;

const EmptyState = styled.p`
  margin: 0;
  font-size: 0.9rem;
  color: #475569;
  text-align: center;
`;
