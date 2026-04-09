import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { PropsWithChildren } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { PageShell } from '@/components/layout/PageShell';
import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';

export interface SubscriptionTabbedLayoutItem {
  path: string;
  label: string;
  icon: IconDefinition;
}

interface SubscriptionTabbedLayoutProps extends PropsWithChildren {
  sectionName: string;
  onBack: () => void;
  items: SubscriptionTabbedLayoutItem[];
}

export const SubscriptionTabbedLayout = ({
  sectionName,
  onBack,
  items,
  children,
}: SubscriptionTabbedLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Wrapper>
      <MenuApp sectionName={sectionName} onBackClick={onBack} />

      <SubNav>
        <SubNavInner>
          {items.map((item) => {
            const isActive = location.pathname === item.path;

            return (
              <NavButton
                key={item.path}
                type="button"
                $active={isActive}
                onClick={() => navigate(item.path)}
              >
                <FontAwesomeIcon icon={item.icon} />
                <span>{item.label}</span>
                {isActive ? <ActiveIndicator /> : null}
              </NavButton>
            );
          })}
        </SubNavInner>
      </SubNav>

      <Content>
        <ContentInner>{children}</ContentInner>
      </Content>
    </Wrapper>
  );
};

export default SubscriptionTabbedLayout;

const Wrapper = styled(PageShell)``;

const SubNav = styled.div`
  border-bottom: 1px solid #e2e8f0;
  background: #ffffff;
`;

const SubNavInner = styled.div`
  display: flex;
  gap: 2px;
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 24px;

  @media (max-width: 720px) {
    padding: 0 16px;
  }
`;

const NavButton = styled.button<{ $active: boolean }>`
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: none;
  background: transparent;
  color: ${(p) => (p.$active ? '#0f172a' : '#94a3b8')};
  font-size: 0.88rem;
  font-weight: ${(p) => (p.$active ? 600 : 400)};
  cursor: pointer;
  transition: color 0.15s;

  &:hover {
    color: ${(p) => (p.$active ? '#0f172a' : '#475569')};
  }
`;

const ActiveIndicator = styled.span`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  border-radius: 2px 2px 0 0;
  background: #18d6bb;
`;

const Content = styled.div`
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  background: #f8fafc;
`;

const ContentInner = styled.div`
  max-width: 1100px;
  width: 100%;
  margin: 0 auto;
  padding: 32px 24px 48px;

  @media (max-width: 720px) {
    padding: 20px 16px 40px;
  }
`;
