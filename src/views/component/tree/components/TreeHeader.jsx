import { SearchOutlined, UpOutlined, DownOutlined } from '@ant-design/icons';
import { Input, Button, Tooltip } from 'antd';
import React, { useMemo } from 'react';
import styled from 'styled-components';

const HeaderContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 10px;
`;

const ActionsContainer = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;
`;

const TreeHeader = ({
  searchTerm,
  setSearchTerm,
  allExpanded,
  handleToggleAll,
  headerActions = [],
  showToggleAllButton = true,
  searchPlaceholder = 'Buscar por nombre o producto...',
}) => {
  const actions = Array.isArray(headerActions) ? headerActions : [];
  const hasActions = actions.length > 0 || showToggleAllButton;
  const context = useMemo(
    () => ({
      searchTerm,
      setSearchTerm,
      allExpanded,
      handleToggleAll,
    }),
    [searchTerm, setSearchTerm, allExpanded, handleToggleAll],
  );

  return (
    <HeaderContainer>
      <Input
        placeholder={searchPlaceholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        prefix={<SearchOutlined />}
        style={{ marginRight: hasActions ? '10px' : 0, flex: 1 }}
      />
      {hasActions && (
        <ActionsContainer>
          {actions.map((action, index) => {
            if (!action) return null;
            if (typeof action.render === 'function') {
              return (
                <React.Fragment key={action.key ?? index}>
                  {action.render(context)}
                </React.Fragment>
              );
            }

            const {
              key,
              icon,
              label,
              onClick,
              tooltip,
              type = 'text',
              buttonProps = {},
            } = action;
            const { onClick: buttonOnClick, ...restButtonProps } =
              buttonProps || {};

            const resolvedIcon =
              typeof icon === 'function' ? icon(context) : icon;
            const resolvedLabel =
              typeof label === 'function' ? label(context) : label;

            const buttonNode = (
              <Button
                key={key ?? index}
                onClick={(event) => {
                  event.stopPropagation();
                  if (typeof onClick === 'function') {
                    onClick(context);
                  }
                  if (typeof buttonOnClick === 'function') {
                    buttonOnClick(event, context);
                  }
                }}
                icon={resolvedIcon}
                type={type}
                {...restButtonProps}
              >
                {resolvedLabel}
              </Button>
            );

            return tooltip ? (
              <Tooltip
                key={`tooltip-${key ?? index}`}
                title={
                  typeof tooltip === 'function' ? tooltip(context) : tooltip
                }
              >
                {buttonNode}
              </Tooltip>
            ) : (
              buttonNode
            );
          })}
          {showToggleAllButton && (
            <Button
              onClick={handleToggleAll}
              icon={allExpanded ? <UpOutlined /> : <DownOutlined />}
              type="text"
            />
          )}
        </ActionsContainer>
      )}
    </HeaderContainer>
  );
};

export default TreeHeader;
