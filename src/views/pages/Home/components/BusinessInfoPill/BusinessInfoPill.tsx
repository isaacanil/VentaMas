import { useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { BusinessInfoModal } from './BusinessInfoModal';

import type { JSX, KeyboardEvent } from 'react';

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
};

type RootState = {
  business?: {
    data?: BusinessInfo | null;
  };
};

type BusinessInfoPillProps = {
  className?: string;
};

export const BusinessInfoPill = ({ className }: BusinessInfoPillProps): JSX.Element => {
  const business = useSelector<RootState, BusinessInfo | null>((state) =>
    typeof state.business?.data === 'object' && state.business.data !== null ? state.business.data : null,
  );
  const [isModalOpen, setModalOpen] = useState(false);

  const businessName = (typeof business?.name === 'string' && business.name.trim()) || 'Tu negocio';

  const handleInteraction = (): void => setModalOpen(true);

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>): void => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleInteraction();
    }
  };

  return (
    <>
      <PillButton
        type="button"
        className={className}
        onClick={handleInteraction}
        onKeyDown={handleKeyDown}
        aria-label="Ver información del negocio"
      >
        <TextGroup>
          <Label>Negocio</Label>
          <Name title={businessName}>{businessName}</Name>
        </TextGroup>
      </PillButton>
      <BusinessInfoModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} business={business} />
    </>
  );
};

const PillButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border-radius: 999px;
  padding: 0.45rem 1rem;
  background: rgba(255, 255, 255, 1);
  border: 1px solid rgba(15, 23, 42, 0.08);
  color: rgba(15, 23, 42, 0.88);
  min-height: 48px;
  backdrop-filter: blur(12px);
  cursor: pointer;
  transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease;

  &:hover {
    transform: translateY(-1px);
    border-color: rgba(15, 23, 42, 0.25);
  }

  &:focus-visible {
    outline: none;
    border-color: rgba(37, 99, 235, 0.55);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.25);
  }
`;

const TextGroup = styled.span`
  display: flex;
  flex-direction: column;
  min-width: 0;
  text-align: left;
`;

const Label = styled.span`
  font-size: 0.68rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(15, 23, 42, 0.55);
`;

const Name = styled.span`
  font-size: 0.95rem;
  font-weight: 600;
  color: rgba(15, 23, 42, 0.9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;
