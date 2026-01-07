// @ts-nocheck
import React from 'react';
import styled from 'styled-components';

import { NodeIcon } from './NodeIcon';

const GoBackButton = styled.button`
  display: flex;
  justify-content: center;
  width: 1.4em;
  padding: 0;
  cursor: ${(props) => (props.disabled ? 'default' : 'pointer')};
  background: none;
  border: none;

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
