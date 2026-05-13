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
  ownershipIssueCount?: number;
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
    ownershipIssueCount = 0,
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
    const pillAriaLabel =
      ownershipIssueCount > 0
        ? `Administrar negocio activo, ${ownershipIssueCount} alerta de negocio`
        : 'Administrar negocio activo';

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
          aria-label={pillAriaLabel}
        >
          {ownershipIssueCount > 0 ? (
            <IssueBadge aria-hidden="true">{ownershipIssueCount}</IssueBadge>
          ) : null}
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
          ownershipIssueCount={ownershipIssueCount}
        />
      </>
    );
  },
);

BusinessInfoPill.displayName = 'BusinessInfoPill';

const PillButton = styled.button`
  position: relative;
  display: inline-flex;
  flex: 0 1 auto;
  gap: 0.35rem;
  align-items: center;
  min-width: 132px;
  max-width: 178px;
  height: 42px;
  padding: 0 0.7rem;
  color: var(--ds-color-nav-text);
  cursor: pointer;
  background: rgb(15 23 42 / 16%);
  border: 1px solid rgb(255 255 255 / 22%);
  border-radius: 999px;
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 12%);
  backdrop-filter: blur(14px);
  transition:
    background-color 160ms ease,
    border-color 160ms ease,
    box-shadow 160ms ease;

  &:active {
    background: rgb(15 23 42 / 22%);
  }

  &:focus-visible {
    outline: none;
    border-color: rgb(255 255 255 / 72%);
    box-shadow:
      inset 0 1px 0 rgb(255 255 255 / 18%),
      0 0 0 3px rgb(255 255 255 / 22%);
  }
`;

const IssueBadge = styled.span`
  position: absolute;
  top: -0.25rem;
  right: -0.25rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.1rem;
  height: 1.1rem;
  padding: 0 0.25rem;
  font-size: 0.66rem;
  font-weight: 800;
  line-height: 1;
  color: var(--ds-color-state-on-danger);
  background: var(--ds-color-state-danger);
  border: 2px solid var(--ds-color-nav-bg);
  border-radius: 999px;
  box-shadow: 0 6px 12px rgb(15 23 42 / 22%);
`;

const TextGroup = styled.span`
  display: flex;
  flex-direction: column;
  min-width: 0;
  text-align: left;
`;

const Label = styled.span`
  font-size: 0.62rem;
  line-height: 1;
  color: rgb(255 255 255 / 66%);
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;

const Name = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.88rem;
  font-weight: 600;
  line-height: 1.2;
  color: rgb(255 255 255 / 96%);
  white-space: nowrap;
`;

const IconWrapper = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 0.1rem;
  color: rgb(255 255 255 / 66%);
  font-size: 0.75rem;
`;
