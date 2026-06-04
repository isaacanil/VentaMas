import { getStatusLabel } from '../../constants/constants';
import type { AuthorizationStatus } from '../../types';
import {
  BadgeRoot,
  type AuthorizationStatusBadgeDensity,
} from './AuthorizationStatusBadge.styles';

interface AuthorizationStatusBadgeProps {
  status: AuthorizationStatus | string;
  density?: AuthorizationStatusBadgeDensity;
}

export const AuthorizationStatusBadge = ({
  status,
  density = 'default',
}: AuthorizationStatusBadgeProps) => (
  <BadgeRoot $status={status} $density={density}>
    {getStatusLabel(status as AuthorizationStatus)}
  </BadgeRoot>
);
