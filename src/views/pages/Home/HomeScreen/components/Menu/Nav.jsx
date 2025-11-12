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
        {items && items.map((item, index) => (
          <SidebarItem 
            key={item.label + index}
            item={item}
            isActive={activeMenuIndex === index}
            onClick={() => handleMenuItemClick(index)}
          />
        ))}
            </SidebarMenu>
        </SidebarContainer>
    )
};

const SidebarContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  width: 8em;
  background-color: #fff;
  border-right: 1px solid #e5e5e5;
  transition: width 0.2s ease-in-out;
`;

const SidebarMenu = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
 
  gap: 1em;
`;
