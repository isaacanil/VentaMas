import React from 'react';
import styled from 'styled-components';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';
import type { TreeNodeData } from '../types';

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

type NavigationButtonProps = {
  node: TreeNodeData;
  isExpanded: boolean;
  isSelected: boolean;
  hasChildren: boolean;
  getNodeIcon: () => IconProp | null;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  isLoading?: boolean;
};

export const NavigationButton = ({
  node,
  isExpanded,
  isSelected,
  hasChildren,
  getNodeIcon,
  onClick,
  isLoading,
}: NavigationButtonProps) => {
  const resolvedLoading =
    typeof isLoading === 'boolean' ? isLoading : node.isLoading;
  const isDisabled = !hasChildren || resolvedLoading;

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
        isLoading={resolvedLoading}
      />
    </GoBackButton>
  );
};
