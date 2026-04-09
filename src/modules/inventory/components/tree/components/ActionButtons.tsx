// ActionButtons.tsx
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Dropdown } from 'antd';
import PropTypes from 'prop-types';
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
`;

type ActionButtonsProps = {
  node: TreeNodeData;
  actions?: TreeAction<TreeNodeData>[];
  level: number;
  path?: TreeNodeId[];
};

const ActionButtons = ({ node, actions, level, path }: ActionButtonsProps) => {
  // Agregar 'path' como prop
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
              onClick={(e) => {
                e.stopPropagation();
                action.handler(node, level, path); // Pasar 'path' al handler
              }}
              title={action.name}
            >
              <FontAwesomeIcon icon={action.icon} />
            </ActionButton>
          );
        } else if (action.type === 'dropdown') {
          const items =
            typeof action.items === 'function'
              ? action.items(node, level, path) // Pasar 'path' a las items
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
                  onClick: (e) => {
                    e.domEvent.stopPropagation();
                    item.handler(node, level, path);
                  },
                })),
              }}
              trigger={['click']}
            >
              <ActionButton
                onClick={(e) => e.stopPropagation()}
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

ActionButtons.propTypes = {
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      type: PropTypes.oneOf(['button', 'dropdown']).isRequired,
      icon: PropTypes.object.isRequired, // Asegúrate de que los íconos sean objetos válidos de FontAwesome
      handler: PropTypes.func, // Cambiar a opcional
      show: PropTypes.func, // Opcional
      items: PropTypes.oneOfType([
        PropTypes.arrayOf(
          PropTypes.shape({
            name: PropTypes.string.isRequired,
            icon: PropTypes.object.isRequired,
            handler: PropTypes.func.isRequired,
          }),
        ),
        PropTypes.func,
      ]),
    }),
  ),
  node: PropTypes.object.isRequired,
  level: PropTypes.number.isRequired,
  path: PropTypes.array, // Nueva propType para 'path'
};

ActionButtons.defaultProps = {
  actions: [],
  path: undefined,
};

export default ActionButtons;
