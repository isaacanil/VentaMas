import styled from 'styled-components';

import { statusTheme } from '../../constants/constants';

export type AuthorizationStatusBadgeDensity = 'default' | 'spacious';

const paddingInlineByDensity: Record<AuthorizationStatusBadgeDensity, string> =
  {
    default: '10px',
    spacious: '12px',
  };

interface BadgeRootProps {
  $status: string;
  $density: AuthorizationStatusBadgeDensity;
}

export const BadgeRoot = styled.span<BadgeRootProps>`
  justify-self: end;
  padding: 4px ${({ $density }) => paddingInlineByDensity[$density]};
  font-size: 12px;
  font-weight: 600;
  color: ${({ $status }) => statusTheme[$status]?.color || '#434343'};
  background: ${({ $status }) => statusTheme[$status]?.bg || '#f0f0f0'};
  border-radius: 999px;
`;
