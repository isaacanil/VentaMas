import { memo, useMemo, useState } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import styled from 'styled-components';

import { BusinessInfoModal } from './BusinessInfoModal';

import type { JSX, KeyboardEvent } from 'react';

interface BusinessInfo {
  name?: string | null;
  logoUrl?: string | null;
  description?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  rnc?: string | null;
  taxId?: string | null;
  [key: string]: unknown;
}

interface RootState {
  business?: {
    data?: BusinessInfo | null;
  };
}

interface BusinessInfoPillProps {
  className?: string;
}

// Memoized selector to extract business data
const selectBusinessData = (state: RootState): BusinessInfo | null => {
  const data = state.business?.data;
  return typeof data === 'object' && data !== null ? data : null;
};

export const BusinessInfoPill = memo(({
  className,
}: BusinessInfoPillProps): JSX.Element => {
  const business = useSelector(selectBusinessData, shallowEqual);
  const [isModalOpen, setModalOpen] = useState(false);

  const businessName = useMemo(
    () => (typeof business?.name === 'string' && business.name.trim()) || 'Tu negocio',
    [business]
  );

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
      <BusinessInfoModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        business={business}
      />
    </>
  );
});

BusinessInfoPill.displayName = 'BusinessInfoPill';


const PillButton = styled.button`
  display: inline-flex;
  gap: 0.4rem;
  align-items: center;
  min-height: 48px;
  padding: 0.45rem 1rem;
  color: rgb(15 23 42 / 88%);
  cursor: pointer;
  background: rgb(255 255 255 / 100%);
  border: 1px solid rgb(15 23 42 / 8%);
  border-radius: 999px;
  backdrop-filter: blur(12px);
  transition:
    transform 160ms ease,
    border-color 160ms ease,
    box-shadow 160ms ease;

  &:hover {
    border-color: rgb(15 23 42 / 25%);
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: none;
    border-color: rgb(37 99 235 / 55%);
    box-shadow: 0 0 0 3px rgb(37 99 235 / 25%);
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
  color: rgb(15 23 42 / 55%);
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

const Name = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.95rem;
  font-weight: 600;
  color: rgb(15 23 42 / 90%);
  white-space: nowrap;
`;
