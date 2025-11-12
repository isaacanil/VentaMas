import React from 'react';
import styled from 'styled-components';

import { NodeIcon } from './NodeIcon';

const GoBackButton = styled.button`
  background: none;
  border: none;
  display: flex;
  padding: 0;
  width: 1.4em;
  justify-content: center;
  cursor: ${(props) => (props.disabled ? 'default' : 'pointer')};

  &:hover {
    color: #0056b3;
  }
`;

export const NavigationButton = ({
  node,
  isExpanded,
  isSelected,
  hasChildren,
  getNodeIcon,
  onClick,
}) => {
  const isDisabled = !hasChildren || node.isLoading;

  return (
    <GoBackButton
      type="button"
      onClick={isDisabled ? undefined : onClick}
      disabled={isDisabled}
    >
      <NodeIcon
        getNodeIcon={getNodeIcon}
        isExpanded={isExpanded}
        isSelected={isSelected}
        hasChildren={hasChildren}
        isLoading={node.isLoading}
      />
    </GoBackButton>
  );
};
