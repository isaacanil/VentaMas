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

type BusinessInfoModalProps = {
  isOpen: boolean;
  onClose: () => void;
  business?: BusinessInfo;
};

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
  ].filter((item) => Boolean(item.value));

  return (
    <Modal
      open={isOpen}
      centered
      onCancel={onClose}
      footer={null}
      destroyOnClose
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
  font-size: 1rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
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
  object-fit: contain;
  border-radius: 20px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  padding: 0.65rem;
  background: rgba(248, 250, 252, 0.9);
`;

const LogoPlaceholder = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  font-weight: 700;
  color: #1d4ed8;
  background: rgba(226, 232, 240, 0.65);
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
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #94a3b8;
  font-weight: 600;
`;

const InfoValue = styled.span`
  font-size: 0.95rem;
  color: #0f172a;
  font-weight: 500;
  word-break: break-word;
`;

const EmptyState = styled.p`
  margin: 0;
  font-size: 0.9rem;
  color: #475569;
  text-align: center;
`;
