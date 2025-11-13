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
  gap: 0.65rem;
  align-items: center;
  width: fit-content;
  max-width: 100%;
  padding: 0.5rem 0.75rem;
  color: #fff;
  cursor: ${({ $interactive }) => ($interactive ? 'pointer' : 'default')};
  outline: none;
  background: rgb(15 23 42 / 20%);
  border-radius: 999px;
  box-shadow: 0 10px 20px rgb(15 23 42 / 18%);
  backdrop-filter: blur(18px);
  transition:
    transform 180ms ease,
    box-shadow 180ms ease,
    border-color 180ms ease;

  &:hover {
    border-color: rgb(255 255 255 / 70%);
    box-shadow: 0 4px 10px rgb(15 23 42 / 18%);
    transform: scale(1.01);
  }

  &:focus-visible {
    border-color: rgb(59 130 246 / 50%);
    box-shadow: 0 0 0 3px rgb(59 130 246 / 25%);
  }
`;

const UserRow = styled.div`
  display: flex;
  gap: 0.45rem;
  align-items: center;
  min-width: 0;
`;

const UserName = styled.span`
  display: inline-block;
  max-width: clamp(140px, 35vw, 260px);
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.95rem;
  font-weight: 600;
  color: rgb(255 255 255 / 97%);
  white-space: nowrap;
`;
