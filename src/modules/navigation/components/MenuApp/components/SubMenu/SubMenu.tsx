import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import { createPortal } from 'react-dom';
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
  submenuPortalElement?: HTMLElement | null;
}

export const SubMenu = ({
  isOpen,
  item,
  onClose,
  onActionDone,
  parentTitle,
  submenuPortalElement,
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

  const content = (
    <Container
      $isOpen={isOpen}
      $isNested={!!parentTitle}
      $isPortaled={Boolean(submenuPortalElement)}
    >
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
                  {groupedSubmenus[group].map((submenu) => (
                    <MenuLink
                      item={submenu}
                      key={String(
                        submenu.key ?? submenu.route ?? submenu.title,
                      )}
                      onActionDone={handleSubmenuItemActionDone}
                      parentTitle={item.title}
                      submenuPortalElement={submenuPortalElement}
                    />
                  ))}
                </MenuLinkList>
              </Group>
            ))
          : null}
      </Body>
    </Container>
  );

  if (submenuPortalElement) {
    return createPortal(content, submenuPortalElement);
  }

  return content;
};
const Group = styled.div`
  flex: 0 0 auto;
  overflow: hidden;
`;

const MenuLinkList = styled.div`
  flex: 0 0 auto;
  padding: 0.25rem;
  overflow: hidden;
  background-color: ${(props) => props.theme.bg.shade};
  border: 1px solid rgb(0 0 0 / 10%);
  border-radius: var(--border-radius, 8px);
`;
const Body = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 0.6em;
  align-items: stretch;
  min-height: 0;
  padding: 0.8em;
  overflow: hidden scroll;
  overscroll-behavior: contain;
  background-color: var(--color2);
  scrollbar-gutter: stable;
  -webkit-overflow-scrolling: touch;
`;

const Container = styled.div<{
  $isOpen: boolean;
  $isNested?: boolean;
  $isPortaled?: boolean;
}>`
  background-color: rgb(255 255 255);
  width: 100%;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: absolute;
  z-index: 1;
  top: ${({ $isNested, $isPortaled }) =>
    $isPortaled || !$isNested ? '2.75em' : '0'};
  left: 0;
  max-width: 500px;
  height: ${({ $isNested, $isPortaled }) =>
    $isPortaled || !$isNested ? 'calc(100% - 2.75em)' : '100%'};
  pointer-events: auto;
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
