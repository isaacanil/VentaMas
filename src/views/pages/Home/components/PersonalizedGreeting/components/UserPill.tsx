// UserPill component - displays user name in a pill style
import type { JSX } from 'react';
import styled from 'styled-components';

type UserPillProps = {
  userName: string;
};

export const UserPill = ({ userName }: UserPillProps): JSX.Element => {
  return (
    <UserPillContainer>
      <UserIcon>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="currentColor" />
        </svg>
      </UserIcon>
      <UserText>{userName}</UserText>
    </UserPillContainer>
  );
};

const UserPillContainer = styled.div`
  display: flex;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 24px;
  padding: 5px 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`;

const UserIcon = styled.span`
  display: flex;
  align-items: center;
  margin-right: 6px;
  color: var(--color-primary-500, #4299e1);
`;

const UserText = styled.span`
  font-size: 0.9rem;
  font-weight: 500;
  font-family: 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: var(--color-primary-600, #3182ce);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 140px;
`;
