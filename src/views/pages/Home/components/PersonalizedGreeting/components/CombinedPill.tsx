import styled from 'styled-components';

import type { KeyboardEvent, JSX } from 'react';

type CombinedPillProps = {
  userName: string;
  onClick?: () => void;
};

export const CombinedPill = ({
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
        <UserRow>
          <UserName title={userName}>{userName}</UserName>
        </UserRow>
    </PillContainer>
  );
};

const PillContainer = styled.div<{ $interactive: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.5rem 0.75rem;
  border-radius: 999px;
  backdrop-filter: blur(18px);
  width: fit-content;
  max-width: 100%;
    background: rgba(15, 23, 42, 0.2);
    box-shadow: 0 10px 20px rgba(15, 23, 42, 0.18);
    color: #fff;
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

const UserRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  min-width: 0;
`;

const UserName = styled.span`
  font-size: 0.95rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.97);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: clamp(140px, 35vw, 260px);
  display: inline-block;
`;
