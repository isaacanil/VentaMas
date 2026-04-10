import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import styled from 'styled-components';

import type { MenuItem } from '@/types/menu';
import { MenuLink } from '@/modules/navigation/components/MenuApp/Components/MenuLink';
import { Button } from '@/components/ui/Button/Button';

interface SubMenuProps {
  isOpen: boolean;
  item: MenuItem;
  onClose: () => void;
  onActionDone?: () => void;
  parentTitle?: string;
}

export const SubMenu = ({
  isOpen,
  item,
  onClose,
  onActionDone,
  parentTitle,
}: SubMenuProps) => {
  const submenuItems = item.submenu || [];
  const handleSubmenuItemActionDone = () => {
    onClose();
    onActionDone?.();
  };

  const groupedSubmenus = submenuItems.reduce<Record<string, MenuItem[]>>(
    (acc, submenu) => {
      const groupKey = submenu.group ?? 'general';
      (acc[groupKey] = acc[groupKey] || []).push(submenu);
      return acc;
    },
    {},
  );

  return (
    <Container $isOpen={isOpen} $isNested={!!parentTitle}>
      <Header>
        <Button
          startIcon={<FontAwesomeIcon icon={faArrowLeft} />}
          title={parentTitle ?? 'Atrás'}
          variant="contained"
          onClick={onClose}
        />
        <span>{item.title}</span>
      </Header>
      <Body>
        {isOpen
          ? Object.keys(groupedSubmenus).map((group) => (
              <Group key={group}>
                <MenuLinkList>
                  {groupedSubmenus[group].map((submenu, index) => (
                    <MenuLink
                      item={submenu}
                      key={index}
                      onActionDone={handleSubmenuItemActionDone}
                      parentTitle={item.title}
                    />
                  ))}
                </MenuLinkList>
              </Group>
            ))
          : null}
      </Body>
    </Container>
  );
};
const Group = styled.div`
  overflow: hidden;
`;

const MenuLinkList = styled.div`
  padding: 0.25rem;
  overflow: hidden;
  background-color: ${(props) => props.theme.bg.shade};
  border: 1px solid rgb(0 0 0 / 10%);
  border-radius: var(--border-radius, 8px);
`;
const Body = styled.div`
  display: grid;
  gap: 0.6em;
  align-content: start;
  padding: 0.8em;
  background-color: var(--color2);
`;

const Container = styled.div<{ $isOpen: boolean; $isNested?: boolean }>`
  background-color: rgb(255 255 255);
  width: 100%;
  display: grid;
  grid-template-rows: min-content 1fr;
  position: absolute;
  z-index: 1;
  top: ${({ $isNested }) => ($isNested ? '0' : '2.75em')};
  left: 0;
  max-width: 500px;
  height: ${({ $isNested }) => ($isNested ? '100%' : 'calc(100% - 2.75em)')};
  transform: translateX(-100%);
  transition: 200ms transform ease-in-out;
  color: rgb(80 80 80);
  ${({ $isOpen }) => {
    switch ($isOpen) {
      case true:
        return `
                transform: translateX(0px);
                z-index: 9999;
                `;
      default:
        break;
    }
  }}
`;
const Header = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  justify-content: space-between;
  height: 3.8em;
  padding: 0 1.5em;
  margin: 0;

  span {
    font-size: 16px;
    font-weight: 500;
    line-height: 18px;
    text-align: center;
    text-align: end;
  }

  button {
    justify-self: flex-start;
    color: rgb(66 165 245);
  }
`;
