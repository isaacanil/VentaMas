// ActionButtons.jsx
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Dropdown } from 'antd';
import PropTypes from 'prop-types';
import React, { useMemo } from 'react';
import styled from 'styled-components';

const ActionButtonsContainer = styled.div`
  display: flex;
  align-items: center;
  margin-left: auto;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
  background: inherit;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  display: flex;
  cursor: pointer;
  margin-left: 5px;

  &:hover {
    color: #0056b3;
  }
`;

const ActionButtons = ({ node, actions, level, path }) => { // Agregar 'path' como prop
  const safeActions = Array.isArray(actions) ? actions : [];
  const visibleActions = useMemo(() => safeActions.filter(action => {
    if (!action) return false;
    if (action.show && !action.show(node, level)) return false;
    if (action.type === 'dropdown') {
      return !!action.items;
    }
    return typeof action.handler === 'function';
  }), [safeActions, level, node]);

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
          const items = typeof action.items === 'function'
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
                      <FontAwesomeIcon icon={item.icon} style={{ marginRight: '5px' }} />
                      {item.name}
                    </>
                  ),
                  danger: item.name.toLowerCase().includes('eliminar'),
                  onClick: (e) => {
                    e.domEvent.stopPropagation();
                    item.handler(node, level, path);
                  }
                }))
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
          })
        ),
        PropTypes.func,
      ]),
    })
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
