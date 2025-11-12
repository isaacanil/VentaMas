import styled from 'styled-components';

import { FORM_SECTIONS } from '../utils/sections';

const SectionNavigatorWrapper = styled.aside`
  position: sticky;
  top: 0;
  height: 100vh;
  padding: 32px 16px;
  border-right: 1px solid #e2e8f0;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 16px;
  z-index: 10;

  @media (max-width: 992px) {
    position: static;
    height: auto;
    border-right: none;
    border-bottom: 1px solid #e2e8f0;
    flex-direction: row;
    overflow-x: auto;
  }
`;

const NavList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;

  @media (max-width: 992px) {
    flex-direction: row;
    width: 100%;
  }
`;

const NavButton = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  background: ${({ $active }) => ($active ? '#1d4ed8' : '#f8fafc')};
  color: ${({ $active }) => ($active ? '#ffffff' : '#0f172a')};
  font-weight: 600;
  transition:
    background 0.2s ease,
    color 0.2s ease,
    box-shadow 0.2s ease;
  font-family: inherit;
  text-align: left;

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
