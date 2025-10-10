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
  cursor: pointer;

  &:hover {
    color: #0056b3;
  }
`;

export const NavigationButton = ({ node, isExpanded, isSelected, hasChildren, setExpandedNodes, getNodeIcon }) => {
  return (
    <GoBackButton
    
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
