// @ts-nocheck
import {
  faChevronDown,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styled from 'styled-components';

const SmallIcon = styled(FontAwesomeIcon)`
  font-size: 0.6em;
`;
export const NodeIcon = ({
  hasChildren,
  isExpanded,
  getNodeIcon,
  isLoading,
}) => {
  if (hasChildren) {
    return (
      <FontAwesomeIcon icon={isExpanded ? faChevronDown : faChevronRight} />
    );
  }

  return <SmallIcon icon={getNodeIcon()} spin={isLoading} />;
};
