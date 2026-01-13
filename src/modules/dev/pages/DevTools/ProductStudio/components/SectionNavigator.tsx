// @ts-nocheck
import styled from 'styled-components';

import { FORM_SECTIONS } from '../utils/sections';

const SectionNavigatorWrapper = styled.aside`
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100vh;
  padding: 32px 16px;
  background: #fff;
  border-right: 1px solid #e2e8f0;

  @media (width <= 992px) {
    position: static;
    flex-direction: row;
    height: auto;
    overflow-x: auto;
    border-right: none;
    border-bottom: 1px solid #e2e8f0;
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

const NavButton = styled.button`
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 10px 14px;
  font-family: inherit;
  font-weight: 600;
  color: ${({ $active }) => ($active ? '#ffffff' : '#0f172a')};
  text-align: left;
  cursor: pointer;
  background: ${({ $active }) => ($active ? '#1d4ed8' : '#f8fafc')};
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
`;

export const SectionNavigator = ({ activeSection, onNavigate }) => (
  <SectionNavigatorWrapper>
    <NavList>
      {FORM_SECTIONS.map((section) => {
        const Icon = section.icon;
        return (
          <NavButton
            key={section.id}
            type="button"
            onClick={() => onNavigate(section.id)}
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
