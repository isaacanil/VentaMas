import styled from 'styled-components';

import { useRef } from 'react';
import type { FC } from 'react';

import { FORM_SECTIONS } from '../utils/sections';

const SectionNavigatorWrapper = styled.aside`
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  overflow-y: auto;
  padding: 32px 16px;
  background: #fff;
  border-right: 1px solid #e2e8f0;

  @media (width <= 992px) {
    position: static;
    flex-direction: row;
    height: auto;
    overflow-x: auto;
    border-right: none;
    padding: 0;
    
    /* Hide scrollbar for cleaner look on mobile */
    scrollbar-width: none;
    &::-webkit-scrollbar {
      display: none;
    }
  }
`;

const NavList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;

  @media (width <= 992px) {
    flex-direction: row;
    width: 100%;
  }
`;

interface NavButtonProps {
  $active?: boolean;
}

const NavButton = styled.button<NavButtonProps>`
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 10px 14px;
  font-family: inherit;
  font-weight: 600;
  color: ${({ $active }) => ($active ? '#ffffff' : '#0f172a')};
  text-align: left;
  cursor: pointer;
  background: ${({ $active }) => ($active ? 'var(--color)' : '#f8fafc')};
  border: none;
  border-radius: 12px;
  transition:
    background 0.2s ease,
    color 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    background: ${({ $active }) => ($active ? '#1e3a8a' : '#e2e8f0')};
  }

  svg {
    font-size: 18px;
  }

  @media (width <= 992px) {
    flex-shrink: 0;
  }
`;

interface SectionNavigatorProps {
  activeSection: string;
  onNavigate: (sectionId: string) => void;
}

export const SectionNavigator: FC<SectionNavigatorProps> = ({
  activeSection,
  onNavigate,
}) => {
  const navRef = useRef<HTMLElement>(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const dragDistance = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDown.current = true;
    dragDistance.current = 0;
    if (navRef.current) {
      startX.current = e.pageX - navRef.current.offsetLeft;
      scrollLeft.current = navRef.current.scrollLeft;
    }
  };

  const handleMouseLeave = () => {
    isDown.current = false;
  };

  const handleMouseUp = () => {
    isDown.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDown.current) return;

    // Increment the distance dragged
    dragDistance.current += 1;

    // Prevent default selection text highlighting
    e.preventDefault();

    if (navRef.current) {
      const x = e.pageX - navRef.current.offsetLeft;
      // Scroll distance is multiplied by 2 for smoother/faster drag feeling
      const walk = (x - startX.current) * 2;
      navRef.current.scrollLeft = scrollLeft.current - walk;
    }
  };

  const handleItemClick = (e: React.MouseEvent, sectionId: string) => {
    // If the user was dragging the menu horizontally, do not trigger the navigation click
    if (dragDistance.current > 5) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onNavigate(sectionId);
  };

  return (
    <SectionNavigatorWrapper
      ref={navRef}
      onMouseDown={handleMouseDown}
      onMouseLeave={handleMouseLeave}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      style={{ userSelect: 'none' }}
    >
      <NavList>
        {FORM_SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <NavButton
              key={section.id}
              type="button"
              onClick={(e) => handleItemClick(e, section.id)}
              $active={activeSection === section.id}
            >
              <Icon />
              <span>{section.label}</span>
            </NavButton>
          );
        })}
      </NavList>
    </SectionNavigatorWrapper>
  );
};
