// @ts-nocheck
import React, { useState } from 'react';
import styled from 'styled-components';

import { SidebarItem } from './SidebarItem';

export const Sidebar = ({ items }) => {
  const [activeMenuIndex, setActiveMenuIndex] = useState(null);

  const handleMenuItemClick = (index) => {
    if (activeMenuIndex === index) {
      setActiveMenuIndex(null);
    } else {
      setActiveMenuIndex(index);
    }
  };

  return (
    <SidebarContainer>
      <SidebarMenu>
        {items &&
          items.map((item, index) => (
            <SidebarItem
              key={item.label + index}
              item={item}
              isActive={activeMenuIndex === index}
              onClick={() => handleMenuItemClick(index)}
            />
          ))}
      </SidebarMenu>
    </SidebarContainer>
  );
};

const SidebarContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 8em;
  height: 100vh;
  background-color: #fff;
  border-right: 1px solid #e5e5e5;
  transition: width 0.2s ease-in-out;
`;

const SidebarMenu = styled.ul`
  display: grid;
  gap: 1em;
  padding: 0;
  margin: 0;
  list-style: none;
`;
