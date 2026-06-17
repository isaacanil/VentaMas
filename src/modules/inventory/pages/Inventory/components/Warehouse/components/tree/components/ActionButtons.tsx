import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Dropdown } from 'antd';
import React, { useMemo } from 'react';
import styled from 'styled-components';
import type { TreeAction, TreeNodeData, TreeNodeId } from '../types';

const ActionButtonsContainer = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  flex-shrink: 0;
  align-items: center;
  margin-left: auto;
  background: inherit;
`;

const ActionButton = styled.button`
  display: flex;
  margin-left: 5px;
  cursor: pointer;
  background: none;
  border: none;

  &:hover {
    color: #0056b3;
  }

  &:focus-visible {
    outline: 2px solid #1677ff;
    outline-offset: 2px;
  }
`;

type ActionButtonsProps = {
  node: TreeNodeData;
  actions?: TreeAction<TreeNodeData>[];
  level: number;
  path?: TreeNodeId[];
};

const ActionButtons = ({ node, actions, level, path }: ActionButtonsProps) => {
  const visibleActions = useMemo<TreeAction<TreeNodeData>[]>(() => {
    const safeActions = Array.isArray(actions) ? actions : [];
    return safeActions.filter((action) => {
      if (!action) return false;
      if (action.show && !action.show(node, level)) return false;
      if (action.type === 'dropdown') {
        return !!action.items;
      }
      return typeof action.handler === 'function';
    });
  }, [actions, level, node]);

  return (
    <ActionButtonsContainer>
      {visibleActions.map((action) => {
        if (action.type === 'button') {
          return (
            <ActionButton
              key={action.name}
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                action.handler(node, level, path);
              }}
              title={action.name}
            >
              <FontAwesomeIcon icon={action.icon} />
            </ActionButton>
          );
        }

        if (action.type === 'dropdown') {
          const items =
            typeof action.items === 'function'
              ? action.items(node, level, path)
              : action.items;

          if (!items || items.length === 0) return null;

          return (
            <Dropdown
              key={action.name}
              menu={{
                items: items.map((item) => ({
                  key: item.name,
                  label: (
                    <>
                      <FontAwesomeIcon
                        icon={item.icon}
                        style={{ marginRight: '5px' }}
                      />
                      {item.name}
                    </>
                  ),
                  danger: item.name.toLowerCase().includes('eliminar'),
                  onClick: (event) => {
                    event.domEvent.stopPropagation();
                    item.handler(node, level, path);
                  },
                })),
              }}
              trigger={['click']}
            >
              <ActionButton
                type="button"
                onClick={(event) => event.stopPropagation()}
                title={action.name}
              >
                <FontAwesomeIcon icon={action.icon} />
              </ActionButton>
            </Dropdown>
          );
        }

        return null;
      })}
    </ActionButtonsContainer>
  );
};

export default ActionButtons;
