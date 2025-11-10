// CombinedPill component - combines business and user information in a single pill
import { faBriefcase } from '@fortawesome/free-solid-svg-icons/faBriefcase';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons/faChevronRight';
import { faStore } from '@fortawesome/free-solid-svg-icons/faStore';
import { faUser } from '@fortawesome/free-solid-svg-icons/faUser';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styled from 'styled-components';

import type { KeyboardEvent, JSX } from 'react';

type CombinedPillProps = {
  logoUrl?: string | null;
  businessName?: string | null;
  userName: string;
  onClick?: () => void;
};

export const CombinedPill = ({
  logoUrl,
  businessName,
  userName,
  onClick,
}: CombinedPillProps): JSX.Element => {
  const isInteractive = typeof onClick === 'function';

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (!isInteractive) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick?.();
    }
  };

  return (
    <PillContainer
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      $interactive={isInteractive}
    >
      <Avatar>
        {logoUrl ? (
          <AvatarImage src={logoUrl} alt="Logo del negocio" />
        ) : (
          <AvatarFallback aria-hidden="true">
            <FontAwesomeIcon icon={faBriefcase} size="lg" />
          </AvatarFallback>
        )}
      </Avatar>
      <Content>
        <UserRow>
          <RowIcon>
            <FontAwesomeIcon icon={faUser} />
          </RowIcon>
          <UserName title={userName}>{userName}</UserName>
        </UserRow>
        <BusinessRow>
          <RowIcon muted>
            <FontAwesomeIcon icon={faStore} size="xs" />
          </RowIcon>
          <BusinessName title={businessName || 'Tu Negocio'}>
            {businessName || 'Tu Negocio'}
          </BusinessName>
        </BusinessRow>
      </Content>
      <Indicator aria-hidden="true">
        <FontAwesomeIcon icon={faChevronRight} />
      </Indicator>
    </PillContainer>
  );
};

const PillContainer = styled.div<{ $interactive: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.5rem 0.75rem 0.5rem 0.5rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.78);
  backdrop-filter: blur(18px);
  border: 1px solid rgba(255, 255, 255, 0.45);
  box-shadow: 0 2px 2px rgba(15, 23, 42, 0.06);
  width: fit-content;
  min-width: 200px;
  max-width: 100%;
  transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
  cursor: ${({ $interactive }) => ($interactive ? 'pointer' : 'default')};
  outline: none;

  &:hover {
    transform: scale(1.01);
    box-shadow: 0 4px 10px rgba(15, 23, 42, 0.18);
    border-color: rgba(255, 255, 255, 0.7);
  }

  &:focus-visible {
    border-color: rgba(59, 130, 246, 0.5);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
  }
`;

const Avatar = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background-color: rgba(255, 255, 255, 0.04);
  flex-shrink: 0;
`;

const AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
`;

const AvatarFallback = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(0, 0, 0, 0.65);
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
`;

const UserRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.45rem;
`;

const BusinessRow = styled(UserRow)`
  opacity: 0.85;
`;

const RowIcon = styled.div<{ muted?: boolean }>`
  display: flex;
  align-items: center;
  color: ${({ muted }) => (muted ? 'rgba(15, 23, 42, 0.4)' : 'rgba(15, 23, 42, 0.75)')};
  flex-shrink: 0;
  font-size: ${({ muted }) => (muted ? '0.85rem' : '1rem')};
`;

const UserName = styled.span`
  font-size: 0.95rem;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.85);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const BusinessName = styled.span`
  font-size: 0.8rem;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.55);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Indicator = styled.div`
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(15, 23, 42, 0.45);
  flex-shrink: 0;
  transition: color 160ms ease;

  ${PillContainer}:hover & {
    color: rgba(15, 23, 42, 0.8);
  }
`;
