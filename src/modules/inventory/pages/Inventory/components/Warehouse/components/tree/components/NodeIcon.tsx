import {
  faChevronDown,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styled from 'styled-components';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';

const SmallIcon = styled(FontAwesomeIcon)`
  font-size: 0.6em;
`;
type NodeIconProps = {
  hasChildren: boolean;
  isExpanded: boolean;
  isSelected?: boolean;
  getNodeIcon: () => IconProp | null;
  isLoading?: boolean;
};

export const NodeIcon = ({
  hasChildren,
  isExpanded,
  getNodeIcon,
  isLoading,
}: NodeIconProps) => {
  if (hasChildren) {
    return (
      <FontAwesomeIcon icon={isExpanded ? faChevronDown : faChevronRight} />
    );
  }

  return <SmallIcon icon={getNodeIcon()} spin={isLoading} />;
};
