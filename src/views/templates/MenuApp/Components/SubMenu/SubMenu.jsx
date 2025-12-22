import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import styled from 'styled-components';

import { Button } from '../../../system/Button/Button';
import { MenuLink } from '../MenuLink';

export const SubMenu = ({ isOpen, item, onClose }) => {
  const submenuItems = item.submenu || [];

  const groupedSubmenus = submenuItems.reduce((acc, submenu) => {
    (acc[submenu.group] = acc[submenu.group] || []).push(submenu);
    return acc;
  }, {});

  return (
    <Container $isOpen={isOpen}>
      <Header>
        <Button
          startIcon={<FontAwesomeIcon icon={faArrowLeft} />}
          title="atrás"
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
                    <MenuLink item={submenu} key={index} onActionDone={onClose} />
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

const Container = styled.div`
  background-color: rgb(255 255 255);
  width: 100%;
  display: grid;
  grid-template-rows: min-content 1fr;
  position: absolute;
  z-index: 1;
  top: 2.75em;
  left: 0;
  max-width: 500px;
  height: calc(100% - 2.75em);
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
