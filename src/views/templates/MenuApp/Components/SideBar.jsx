import { motion } from 'framer-motion';
import React, { useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { icons } from '../../../../constants/icons/icons';
import { selectBusinessData } from '../../../../features/auth/businessSlice';
import { selectUser } from '../../../../features/auth/userSlice';
import { SelectSettingCart } from '../../../../features/cart/cartSlice';
import { openNotificationCenter } from '../../../../features/notification/notificationCenterSlice';
import { userAccess } from '../../../../hooks/abilities/useAbilities';
import ROUTES_PATH from '../../../../routes/routesName';
import { hasDeveloperAccess } from '../../../../utils/menuAccess';
import { ButtonIconMenu } from '../../system/Button/ButtonIconMenu';
import { WebName } from '../../system/WebName/WebName';
import { getMenuData } from '../MenuData/MenuData';
import { UserSection } from '../UserSection';

import { MenuLink } from './MenuLink';

const SIDEBAR_VARIANTS = {
  open: {
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 450,
      damping: 50,
      restDelta: 2,
    },
  },
  closed: {
    x: '-100%',
    transition: {
      type: 'spring',
      stiffness: 450,
      damping: 50,
      restDelta: 2,
    },
  },
};

const useMenuFiltering = () => {
  const settings = useSelector(SelectSettingCart);
  const {
    billing: { billingMode, authorizationFlowEnabled },
  } = settings;
  const business = useSelector(selectBusinessData);
  const businessType = business?.businessType || null;
  const links = getMenuData();
  const canSeeDeveloperGroup = hasDeveloperAccess();

  return useMemo(() => {
    const filteredLinks = links.reduce((acc, item) => {
      let includeItem = true;
      if (item.key && item.condition) {
        includeItem = item.condition({
          billingMode,
          businessType,
          authorizationFlowEnabled,
        });
      }

      if (!includeItem) return acc;

      const newItem = { ...item };

      if (item.submenu) {
        const filteredSubmenu = item.submenu.filter((subItem) => {
          if (subItem.key && subItem.condition) {
            return subItem.condition({ billingMode, authorizationFlowEnabled });
          }
          return true;
        });

        if (filteredSubmenu.length > 0) {
          newItem.submenu = filteredSubmenu;
        } else {
          delete newItem.submenu;
        }
      }

      acc.push(newItem);
      return acc;
    }, []);

    const grouped = filteredLinks.reduce((acc, item) => {
      if (!acc[item.group]) {
        acc[item.group] = [];
      }
      acc[item.group].push(item);
      return acc;
    }, {});
    // Remove developer group if user lacks developer access
    if (!canSeeDeveloperGroup && grouped.developer) {
      delete grouped.developer;
    }
    return grouped;
  }, [
    links,
    billingMode,
    businessType,
    authorizationFlowEnabled,
    canSeeDeveloperGroup,
  ]);
};

export const SideBar = ({ isOpen, handleOpenMenu }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const groupedLinks = useMenuFiltering();
  const { abilities } = userAccess();
  const canAccessGeneralConfig =
    abilities.can('manage', 'Business') ||
    abilities.can('manage', 'business-settings');

  const { GENERAL_CONFIG_BUSINESS } = ROUTES_PATH.SETTING_TERM;

  const handleGoToSetting = useCallback(() => {
    if (!canAccessGeneralConfig) return;
    navigate(GENERAL_CONFIG_BUSINESS);
  }, [canAccessGeneralConfig, navigate, GENERAL_CONFIG_BUSINESS]);

  const handleOpenNotifications = useCallback(() => {
    dispatch(openNotificationCenter('taxReceipt'));
    handleOpenMenu();
  }, [dispatch, handleOpenMenu]);

  return (
    <Container
      variants={SIDEBAR_VARIANTS}
      initial="closed"
      animate={isOpen ? 'open' : 'closed'}
    >
      <Wrapper>
        <Header>
          <HeaderContent>
            <LogoContainer />
            <WebName />
          </HeaderContent>
          <ActionButtons>
            <ButtonIconMenu
              icon={icons.system.notification}
              onClick={handleOpenNotifications}
              aria-label="Open notifications"
            />
            {canAccessGeneralConfig && (
              <ButtonIconMenu
                icon={icons.operationModes.setting}
                onClick={handleGoToSetting}
                aria-label="Open settings"
              />
            )}
          </ActionButtons>
        </Header>
        <UserSection user={user} />
        <NavigationBody>
          <NavigationLinks>
            {Object.entries(groupedLinks).map(([group, items]) => (
              <MenuGroup key={group}>
                <MenuContainer>
                  {items.map((item, index) => (
                    <MenuLink item={item} key={`${group}-${index}`} />
                  ))}
                </MenuContainer>
              </MenuGroup>
            ))}
          </NavigationLinks>
        </NavigationBody>
      </Wrapper>
    </Container>
  );
};

const Container = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  z-index: 9900;
  width: 100%;
  max-width: 400px;
  height: 100%;
  overflow: hidden;
  background-color: white;
  border-right: 1px solid rgb(0 0 0 / 10%);
  border-radius: 0 10px 10px 0;
  box-shadow:
    5px 0 15px rgb(0 0 0 / 10%),
    10px 0 25px rgb(0 0 0 / 5%);
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const Wrapper = styled.div`
  display: grid;
  grid-template-rows: auto auto 1fr;
  width: 100%;
  height: 100%;
  overflow: hidden;

  @media (width <= 600px) {
    max-width: 500px;
  }
`;
const NavigationBody = styled.div`
  padding: 0.6em 0.9em;
  overflow: hidden auto;
  background-color: ${(props) => props.theme.bg.color2};
`;

const NavigationLinks = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
  gap: 0.4rem;
  padding: 0;
`;
const MenuGroup = styled.div`
  overflow: hidden;
`;

const MenuContainer = styled.div`
  padding: 0.25rem;
  overflow: hidden;
  background-color: ${(props) => props.theme.bg.shade};
  border: 1px solid rgb(0 0 0 / 10%);
  border-radius: var(--border-radius, 8px);
`;
const Header = styled.div`
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 2.75em;
  padding: 1rem;
  background-color: ${(props) => props.theme.bg.color};

  @media (width <= 768px) {
    height: 2.75em;
  }
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
`;

const LogoContainer = styled.div`
  width: 2.4rem;
  height: 2em;
`;
