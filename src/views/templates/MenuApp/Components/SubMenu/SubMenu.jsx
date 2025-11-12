import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import styled from 'styled-components';

import { Button } from '../../../system/Button/Button';
import { MenuLink } from '../MenuLink';
// import { Group, MenuLinkList } from '../SideBar';

export const SubMenu = ({ isOpen, item, showSubMenu }) => {
  const submenuItems = item.submenu || [];

  const groupedSubmenus = submenuItems.reduce((acc, submenu) => {
    (acc[submenu.group] = acc[submenu.group] || []).push(submenu);
    return acc;
  }, {});
  return (
    <Container isOpen={isOpen}>
      <Header>
        <Button
          startIcon={<FontAwesomeIcon icon={faArrowLeft} />}
          title="atrás"
          variant="contained"
          onClick={showSubMenu}
        />
        <span>{item.title}</span>
      </Header>
      <Body>
        {isOpen
          ? Object.keys(groupedSubmenus).map((group) => (
              <Group key={group}>
                {/* <GroupTitle>{group}</GroupTitle>  */}
                <MenuLinkList>
                  {groupedSubmenus[group].map((submenu, index) => (
                    <MenuLink
                      item={submenu}
                      key={index}
                      onActionDone={showSubMenu}
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
  background-color: ${(props) => props.theme.bg.shade};
  border-radius: var(--border-radius, 8px);
  padding: 0.25rem;
  border: 1px solid rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;
const Body = styled.div`
  /* position: relative; */
  background-color: var(--color2);
  padding: 0.8em;
  display: grid;
  align-content: start;
  gap: 0.6em;
`;

const Container = styled.div`
  background-color: rgb(255, 255, 255);
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
  color: rgb(80, 80, 80);
  ${(props) => {
    switch (props.isOpen) {
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
  justify-content: space-between;
  align-items: center;
  padding: 0 1.5em;
  height: 3.8em;
  margin: 0;
  span {
    font-size: 16px;
    line-height: 18px;
    font-weight: 500;
    text-align: center;
    text-align: end;
  }
  button {
    color: rgb(66, 165, 245);
    justify-self: flex-start;
  }
`;
