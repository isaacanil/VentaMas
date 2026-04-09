import { useState } from 'react';
import styled from 'styled-components';

import { SidebarItem } from './SidebarItem';

import type { ReactNode } from 'react';

interface SidebarMenuItem {
  icon: ReactNode;
  label: string;
}

interface SidebarProps {
  items: SidebarMenuItem[];
}

export const Sidebar = ({ items }: SidebarProps) => {
  const [activeMenuIndex, setActiveMenuIndex] = useState<number | null>(null);

  const handleMenuItemClick = (index: number) => {
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
