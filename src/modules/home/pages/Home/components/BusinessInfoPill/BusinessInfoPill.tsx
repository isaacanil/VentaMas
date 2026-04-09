import { memo, useMemo, useState } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import styled from 'styled-components';

import { DownOutlined } from '@/constants/icons/antd';
import { selectUser } from '@/features/auth/userSlice';
import { BusinessWorkspaceModal } from './BusinessWorkspaceModal';

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
  forceWorkspaceOpen?: boolean;
  onWorkspaceOpenChange?: (isOpen: boolean) => void;
}

// Memoized selector to extract business data
const selectBusinessData = (state: RootState): BusinessInfo | null => {
  const data = state.business?.data;
  return typeof data === 'object' && data !== null ? data : null;
};

export const BusinessInfoPill = memo(
  ({
    className,
    forceWorkspaceOpen = false,
    onWorkspaceOpenChange,
  }: BusinessInfoPillProps): JSX.Element => {
    const business = useSelector(selectBusinessData, shallowEqual);
    const user = useSelector(selectUser) as any;
    const [isWorkspaceModalOpen, setWorkspaceModalOpen] = useState(false);

    const hasMultipleBusinesses =
      user?.hasMultipleBusinesses ||
      (user?.availableBusinesses && user.availableBusinesses.length > 1);

    const businessName = useMemo(
      () =>
        (typeof business?.name === 'string' && business.name.trim()) ||
        'Tu negocio',
      [business],
    );

    const isModalOpen = forceWorkspaceOpen || isWorkspaceModalOpen;

    const handleOpenChange = (nextValue: boolean): void => {
      if (!forceWorkspaceOpen) {
        setWorkspaceModalOpen(nextValue);
      }
      onWorkspaceOpenChange?.(nextValue);
    };

    const handleInteraction = (): void => handleOpenChange(true);

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
          aria-label="Administrar negocio activo"
        >
          <TextGroup>
            <Label>Negocio</Label>
            <Name title={businessName}>{businessName}</Name>
          </TextGroup>
          {hasMultipleBusinesses ? (
            <IconWrapper title="Cambiar de negocio">
              <DownOutlined />
            </IconWrapper>
          ) : null}
        </PillButton>
        <BusinessWorkspaceModal
          isOpen={isModalOpen}
          onClose={() => handleOpenChange(false)}
        />
      </>
    );
  },
);

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

const IconWrapper = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 0.2rem;
  color: rgb(15 23 42 / 55%);
  font-size: 0.75rem;
  transition: color 160ms ease;

  ${PillButton}:hover & {
    color: rgb(15 23 42 / 90%);
  }
`;
