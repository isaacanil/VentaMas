import styled, { css } from 'styled-components';

import PersonalizedGreeting from '@/modules/home/pages/Home/components/PersonalizedGreeting/PersonalizedGreeting';
import { NotificationButton } from '@/modules/navigation/components/MenuApp/Components/NotificationButton/NotificationButton';
import { BusinessInfoPill } from '@/modules/home/pages/Home/components/BusinessInfoPill/BusinessInfoPill';

import { ShortcutSearch } from './components/ShortcutSearch';

interface MenuWebsiteProps {
  activeShortcutScope?: 'developer' | 'user';
  forceWorkspaceOpen?: boolean;
  includeDeveloperFeatures?: boolean;
  onShortcutSearchFocus?: () => void;
  onShortcutSearchValueChange?: (value: string) => void;
  onWorkspaceOpenChange?: (isOpen: boolean) => void;
  shortcutSearchValue?: string;
  showBusinessSelector?: boolean;
}

export const MenuWebsite = ({
  activeShortcutScope = 'user',
  forceWorkspaceOpen = false,
  includeDeveloperFeatures = false,
  onShortcutSearchFocus,
  onShortcutSearchValueChange,
  onWorkspaceOpenChange,
  shortcutSearchValue = '',
  showBusinessSelector = true,
}: MenuWebsiteProps) => {
  return (
    <Container>
      {showBusinessSelector ? (
        <BusinessInfoPill
          forceWorkspaceOpen={forceWorkspaceOpen}
          onWorkspaceOpenChange={onWorkspaceOpenChange}
        />
      ) : (
        <HeaderSpacer aria-hidden="true" />
      )}
      <ShortcutSearch
        activeScope={activeShortcutScope}
        includeDeveloperFeatures={includeDeveloperFeatures}
        onFocusSearch={onShortcutSearchFocus}
        onSearchValueChange={onShortcutSearchValueChange}
        searchValue={shortcutSearchValue}
      />
      <RightActions>
        <StyledNotificationButton aria-label="Centro de notificaciones" />
        <PersonalizedGreeting />
      </RightActions>
    </Container>
  );
};
const Container = styled.header`
  display: flex;
  flex-wrap: wrap;
  gap: 0.8em;
  row-gap: 0.75rem;
  align-items: center;
  justify-content: space-between;
  width: min(1200px, 100%);
  padding: 0.3rem 0.5rem;
  margin: 0 auto;
  color: #fff;
  background: ${(props) => props.theme.bg.color};
  border: 1px solid rgb(255 255 255 / 25%);
  border-radius: 100px;
  backdrop-filter: blur(6px);
`;

const HeaderSpacer = styled.span`
  flex: 0 0 180px;
  min-width: 0;
`;

const RightActions = styled.div`
  display: flex;
  flex: 0 0 auto;
  gap: 0.5rem;
  align-items: center;
  justify-content: flex-end;

  @media (width <= 768px) {
    margin-left: auto;
  }
`;

const iconButtonStyles = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  padding: 0;
  color: #fff;
  cursor: pointer;
  outline: none;
  background: rgb(15 23 42 / 20%);
  border: none;
  border-radius: 999px;
  box-shadow: 0 10px 20px rgb(15 23 42 / 18%);
  backdrop-filter: blur(10px);
  transition:
    background-color 180ms ease,
    border-color 180ms ease,
    transform 180ms ease,
    box-shadow 180ms ease;

  &:hover {
    background: rgb(255 255 255 / 22%);
    border-color: rgb(255 255 255 / 60%);
    box-shadow: 0 14px 28px rgb(15 23 42 / 24%);
    transform: translateY(-1px);
  }

  &:active {
    box-shadow: 0 8px 18px rgb(15 23 42 / 20%);
    transform: translateY(0);
  }

  &:focus-visible {
    outline: 2px solid rgb(255 255 255 / 90%);
    outline-offset: 2px;
  }

  svg {
    font-size: 1.05rem;
  }
`;

const StyledNotificationButton = styled(NotificationButton)`
  && {
    ${iconButtonStyles}
  }
`;
