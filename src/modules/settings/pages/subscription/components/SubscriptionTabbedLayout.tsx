import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { PropsWithChildren } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ActiveIndicator,
  Content,
  ContentInner,
  NavButton,
  SubNav,
  SubNavInner,
} from './SubscriptionTabbedLayout.styles';

import { PageShell } from '@/components/layout/PageShell';
import { MenuApp } from '@/modules/navigation/public';

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
    <PageShell>
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
    </PageShell>
  );
};

export default SubscriptionTabbedLayout;
