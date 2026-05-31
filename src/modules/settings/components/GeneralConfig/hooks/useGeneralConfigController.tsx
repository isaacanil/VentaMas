import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import { selectUser } from '@/features/auth/userSlice';
import { makeSelectPreviousRelevantRoute } from '@/features/navigation/navigationSlice';
import { useUserAccess } from '@/hooks/abilities/useAbilities';
import { useBusinessFeatureEnabled } from '@/hooks/useBusinessFeatureEnabled';
import ROUTES_NAME from '@/router/routes/routesName';
import { hasBusinessSettingsManageAccess } from '@/utils/access/businessSettingsAccess';
import { isFrontendFeatureEnabled } from '@/utils/runtime/frontendFeatureAccess';

import {
  buildGeneralConfigMenuItems,
  buildGeneralConfigSearchRecords,
  resolveActiveItemKey,
  resolveActiveTabKey,
  resolveGeneralConfigRoute,
  type GeneralConfigSearchEntry,
  type GeneralConfigSearchRecord,
} from '../utils/generalConfigControllerData';

export type { GeneralConfigSearchEntry, GeneralConfigSearchRecord };

const selectPreviousRouteIgnoringConfig = makeSelectPreviousRelevantRoute(
  ROUTES_NAME.SETTING_TERM.SETTING,
);

export const useGeneralConfigController = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const highlightTimersRef = useRef<Record<string, number>>({});
  const pendingTargetRef = useRef<GeneralConfigSearchEntry | null>(null);
  const scrollRetryRef = useRef<number | null>(null);
  const previousRelevantRoute = useSelector(selectPreviousRouteIgnoringConfig);
  const user = useSelector(selectUser);
  const { abilities } = useUserAccess();
  const abilityRules = abilities?.rules || [];
  const hasAbilityData = abilityRules.length > 0;
  const canManageBusinessSettingsByRole = hasBusinessSettingsManageAccess(user);
  const canManageBusinessSettings =
    hasAbilityData &&
    (abilities.can('manage', 'Business') ||
      abilities.can('manage', 'business-settings'));
  const shouldBlockGeneralConfig =
    (hasAbilityData && !canManageBusinessSettings) ||
    (!hasAbilityData && !canManageBusinessSettingsByRole);
  const canManageSubscriptions = isFrontendFeatureEnabled(
    'subscriptionManagement',
  );
  const accountingEnabled = useBusinessFeatureEnabled('accounting');
  const activeTab = useMemo(
    () => resolveActiveTabKey(currentPath),
    [currentPath],
  );
  const activeItemKey = useMemo(
    () => resolveActiveItemKey(currentPath),
    [currentPath],
  );

  const clearScrollRetry = useCallback(() => {
    if (scrollRetryRef.current) {
      window.clearInterval(scrollRetryRef.current);
      scrollRetryRef.current = null;
    }
  }, []);

  const scrollToSection = useCallback((sectionId?: string) => {
    if (!sectionId) return true;

    const element =
      document.querySelector(`[data-config-section="${sectionId}"]`) ||
      document.getElementById(sectionId);

    if (!element) {
      return false;
    }

    const emphasize = () => {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
      element.classList.add('config-search-highlight');

      if (highlightTimersRef.current[sectionId]) {
        window.clearTimeout(highlightTimersRef.current[sectionId]);
      }

      highlightTimersRef.current[sectionId] = window.setTimeout(() => {
        element.classList.remove('config-search-highlight');
        delete highlightTimersRef.current[sectionId];
      }, 2000);
    };

    const expandableElement = element as HTMLElement;
    if (expandableElement.dataset.configExpandable === 'true') {
      const header = element.querySelector(
        '[data-role="config-section-header"]',
      ) as HTMLElement | null;
      if (header && header.getAttribute('data-expanded') === 'false') {
        header.click();
        window.setTimeout(emphasize, 220);
        return true;
      }
    }

    emphasize();
    return true;
  }, []);

  const startScrollRetry = useCallback(
    (sectionId?: string) => {
      if (!sectionId) {
        pendingTargetRef.current = null;
        return;
      }

      if (scrollToSection(sectionId)) {
        pendingTargetRef.current = null;
        clearScrollRetry();
        return;
      }

      clearScrollRetry();
      let attempts = 0;
      const maxAttempts = 20;

      scrollRetryRef.current = window.setInterval(() => {
        attempts += 1;
        if (scrollToSection(sectionId) || attempts >= maxAttempts) {
          clearScrollRetry();
          pendingTargetRef.current = null;
        }
      }, 150);
    },
    [clearScrollRetry, scrollToSection],
  );

  const blockedFallbackPath = previousRelevantRoute?.pathname || '/home';

  const handleBackClick = useCallback(() => {
    navigate(previousRelevantRoute?.pathname || '/home');
  }, [navigate, previousRelevantRoute?.pathname]);

  const handleTabChange = useCallback(
    (key: string) => {
      navigate(resolveGeneralConfigRoute(key));
    },
    [navigate],
  );

  const menuItems = useMemo(
    () =>
      buildGeneralConfigMenuItems({
        accountingEnabled,
        canManageSubscriptions,
      }),
    [accountingEnabled, canManageSubscriptions],
  );

  const searchRecords = useMemo<GeneralConfigSearchRecord[]>(
    () => buildGeneralConfigSearchRecords(menuItems),
    [menuItems],
  );

  const handleSearchEntrySelect = useCallback(
    (entry?: GeneralConfigSearchEntry | null) => {
      if (!entry) return;

      pendingTargetRef.current = entry;
      clearScrollRetry();

      if (entry.route && entry.route !== currentPath) {
        navigate(entry.route);
      } else if (entry.sectionId) {
        startScrollRetry(entry.sectionId);
      } else {
        pendingTargetRef.current = null;
      }
    },
    [clearScrollRetry, currentPath, navigate, startScrollRetry],
  );

  useEffect(() => {
    const target = pendingTargetRef.current;
    if (!target) return;
    if (target.route && target.route !== currentPath) {
      return;
    }

    if (target.sectionId) {
      startScrollRetry(target.sectionId);
    } else {
      pendingTargetRef.current = null;
    }
  }, [currentPath, startScrollRetry]);

  useEffect(() => {
    return () => {
      clearScrollRetry();
      Object.values(highlightTimersRef.current).forEach((timerId) => {
        window.clearTimeout(timerId);
      });
      highlightTimersRef.current = {};
    };
  }, [clearScrollRetry]);

  return {
    activeItemKey,
    activeTab,
    blockedFallbackPath,
    canManageBusinessSettingsByRole,
    currentPath,
    handleBackClick,
    handleSearchEntrySelect,
    handleTabChange,
    hasAbilityData,
    menuItems,
    searchRecords,
    shouldBlockGeneralConfig,
  };
};
