import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import {
  QuickActionButton,
  QuickActionDesc,
  QuickActionLabel,
} from './QuickAction.styles';

interface QuickActionProps {
  label: string;
  description: string;
  onClick: () => void;
  danger?: boolean;
}

export const QuickAction = ({
  label,
  description,
  onClick,
  danger,
}: QuickActionProps) => (
  <QuickActionButton onClick={onClick} $danger={danger}>
    <div>
      <QuickActionLabel $danger={danger}>{label}</QuickActionLabel>
      <QuickActionDesc>{description}</QuickActionDesc>
    </div>
    <FontAwesomeIcon icon={faArrowRight} />
  </QuickActionButton>
);
