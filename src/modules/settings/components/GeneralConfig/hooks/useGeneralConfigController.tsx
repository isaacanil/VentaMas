import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBuilding,
  faCreditCard,
  faFileInvoice,
  faInfoCircle,
  faKey,
  faMoneyBillTrendUp,
  faToggleOn,
  faWarehouse,
  faWallet,
  faBookOpen,
  faLayerGroup,
} from '@fortawesome/free-solid-svg-icons';

import { selectUser } from '@/features/auth/userSlice';
import { makeSelectPreviousRelevantRoute } from '@/features/navigation/navigationSlice';
import { useUserAccess } from '@/hooks/abilities/useAbilities';
import { useBusinessFeatureEnabled } from '@/hooks/useBusinessFeatureEnabled';
import ROUTES_NAME from '@/router/routes/routesName';
import type { MenuItem } from '@/components/ui/Nav/types';
import { hasBusinessSettingsManageAccess } from '@/utils/access/businessSettingsAccess';
import { isFrontendFeatureEnabled } from '@/utils/runtime/frontendFeatureAccess';

const selectPreviousRouteIgnoringConfig = makeSelectPreviousRelevantRoute(
  ROUTES_NAME.SETTING_TERM.SETTING,
);

const TAB_ROUTES = {
  modules: ROUTES_NAME.SETTING_TERM.GENERAL_CONFIG_MODULES,
  billing: ROUTES_NAME.SETTING_TERM.GENERAL_CONFIG_BILLING,
  subscription: ROUTES_NAME.SETTING_TERM.GENERAL_CONFIG_SUBSCRIPTION,
  business: ROUTES_NAME.SETTING_TERM.GENERAL_CONFIG_BUSINESS,
  accounting:
    ROUTES_NAME.SETTING_TERM.GENERAL_CONFIG_ACCOUNTING_CHART_OF_ACCOUNTS,
  exchangeRates: ROUTES_NAME.SETTING_TERM.GENERAL_CONFIG_EXCHANGE_RATES,
  inventory: ROUTES_NAME.SETTING_TERM.GENERAL_CONFIG_INVENTORY,
  taxReceipt: ROUTES_NAME.SETTING_TERM.GENERAL_CONFIG_TAX_RECEIPT,
  authorization: ROUTES_NAME.SETTING_TERM.GENERAL_CONFIG_AUTHORIZATION,
  appInfo: ROUTES_NAME.SETTING_TERM.GENERAL_CONFIG_APP_INFO,
};

type ConfigTabKey = keyof typeof TAB_ROUTES;
const ACCOUNTING_MENU_ITEMS: MenuItem[] = [
  {
    key: 'accounting-chart-of-accounts',
    icon: <FontAwesomeIcon icon={faBookOpen} />,
    label: 'Catálogo de cuentas',
  },
  {
    key: 'accounting-posting-profiles',
    icon: <FontAwesomeIcon icon={faLayerGroup} />,
    label: 'Perfiles contables',
  },
];

const MENU_ROUTES = {
  ...TAB_ROUTES,
  'accounting-chart-of-accounts':
    ROUTES_NAME.SETTING_TERM.GENERAL_CONFIG_ACCOUNTING_CHART_OF_ACCOUNTS,
  'accounting-posting-profiles':
    ROUTES_NAME.SETTING_TERM.GENERAL_CONFIG_ACCOUNTING_POSTING_PROFILES,
};

type ConfigMenuKey = keyof typeof MENU_ROUTES;

const isExchangeRatesPath = (pathname: string): boolean =>
  pathname.includes('exchange-rates') || pathname.includes('tasa-cambio');

const resolveActiveItemKey = (pathname: string): string => {
  if (isExchangeRatesPath(pathname)) {
    return 'exchangeRates';
  }

  if (pathname.includes('/modules')) {
    return 'modules';
  }

  if (
    pathname.startsWith(
      ROUTES_NAME.SETTING_TERM.GENERAL_CONFIG_ACCOUNTING_POSTING_PROFILES,
    )
  ) {
    return 'accounting-posting-profiles';
  }

  if (
    pathname.startsWith(
      ROUTES_NAME.SETTING_TERM.GENERAL_CONFIG_ACCOUNTING_CHART_OF_ACCOUNTS,
    ) ||
    pathname.startsWith(ROUTES_NAME.SETTING_TERM.GENERAL_CONFIG_ACCOUNTING)
  ) {
    return 'accounting-chart-of-accounts';
  }

  if (pathname.includes('business')) return 'business';
  if (pathname.includes('inventory')) return 'inventory';
  if (pathname.includes('/subscription')) return 'subscription';
  if (pathname.includes('billing')) return 'billing';
  if (pathname.includes('tax-receipt')) return 'taxReceipt';
  if (pathname.includes('authorization')) return 'authorization';
  if (pathname.includes('app-info')) return 'appInfo';

  return 'billing';
};

export interface GeneralConfigSearchEntry {
  key: string;
  label: string;
  description: string;
  tab: ConfigTabKey;
  route: string;
  category: string;
  sectionId?: string;
  extraTokens?: string[];
}

export interface GeneralConfigSearchRecord {
  key: string;
  label: string;
  description: string;
  category: string;
  entry: GeneralConfigSearchEntry;
  tokens: string[];
}

const GENERAL_CONFIG_SEARCH_INDEX: GeneralConfigSearchEntry[] = [
  {
    key: 'modules',
    label: 'Módulos',
    description: 'Activa o desactiva Contabilidad y Tesorería del negocio.',
    tab: 'modules',
    route: TAB_ROUTES.modules,
    category: 'Pantalla',
    extraTokens: ['modulos', 'activar', 'deshabilitar', 'features'],
  },
  {
    key: 'modules-accounting',
    label: 'Módulos · Contabilidad',
    description: 'Gestiona el encendido operativo del módulo de contabilidad.',
    tab: 'modules',
    route: TAB_ROUTES.modules,
    sectionId: 'modules-accounting',
    category: 'Sección',
    extraTokens: ['contabilidad', 'modulo', 'habilitar'],
  },
  {
    key: 'modules-treasury',
    label: 'Módulos · Tesorería',
    description: 'Gestiona el encendido operativo del módulo de tesorería.',
    tab: 'modules',
    route: TAB_ROUTES.modules,
    sectionId: 'modules-treasury',
    category: 'Sección',
    extraTokens: ['tesoreria', 'modulo', 'habilitar', 'bancos', 'caja'],
  },
  {
    key: 'business',
    label: 'Datos de la Empresa',
    description:
      'Mantén actualizados los datos principales de tu organización.',
    tab: 'business',
    route: TAB_ROUTES.business,
    category: 'Pantalla',
    extraTokens: ['empresa', 'negocio', 'perfil'],
  },
  {
    key: 'accounting',
    label: 'Contabilidad',
    description: 'Ordena catálogo, perfiles y estructura base del esquema contable.',
    tab: 'accounting',
    route: TAB_ROUTES.accounting,
    category: 'Pantalla',
    extraTokens: [
      'catalogo',
      'plan contable',
      'perfiles',
      'contabilidad',
    ],
  },
  {
    key: 'accounting-chart-of-accounts',
    label: 'Contabilidad · Catálogo de cuentas',
    description:
      'Revisa la jerarquía contable y administra cuentas posteables o encabezados.',
    tab: 'accounting',
    route: ROUTES_NAME.SETTING_TERM.GENERAL_CONFIG_ACCOUNTING_CHART_OF_ACCOUNTS,
    category: 'Sección',
    extraTokens: ['catalogo', 'cuentas', 'plan contable', 'mayor'],
  },
  {
    key: 'accounting-posting-profiles',
    label: 'Contabilidad · Perfiles contables',
    description:
      'Configura la cobertura por evento y las reglas de contabilización.',
    tab: 'accounting',
    route: ROUTES_NAME.SETTING_TERM.GENERAL_CONFIG_ACCOUNTING_POSTING_PROFILES,
    category: 'Sección',
    extraTokens: ['perfiles contables', 'asientos', 'eventos', 'mapeo'],
  },
  {
    key: 'exchangeRates',
    label: 'Tipos de cambio',
    description:
      'Ajusta la moneda base, monedas configuradas y tasas manuales por divisa.',
    tab: 'exchangeRates',
    route: TAB_ROUTES.exchangeRates,
    category: 'Pantalla',
    extraTokens: [
      'moneda base',
      'tasas',
      'usd',
      'dolar',
      'divisa',
      'tesoreria',
    ],
  },
  {
    key: 'inventory',
    label: 'Inventario',
    description: 'Configura parámetros clave del flujo de inventario.',
    tab: 'inventory',
    route: TAB_ROUTES.inventory,
    category: 'Pantalla',
    extraTokens: ['stock', 'almacenes'],
  },
  {
    key: 'inventory-default-warehouse',
    label: 'Inventario · Almacén predeterminado',
    description: 'Define el almacén que se usará por defecto en operaciones.',
    tab: 'inventory',
    route: TAB_ROUTES.inventory,
    sectionId: 'inventory-default-warehouse',
    category: 'Sección',
    extraTokens: ['almacen', 'predeterminado', 'default', 'bodega'],
  },
  {
    key: 'inventory-stock-alerts',
    label: 'Inventario · Reportes y alertas',
    description: 'Configura reportes y alertas de stock por correo.',
    tab: 'inventory',
    route: TAB_ROUTES.inventory,
    sectionId: 'inventory-stock-alerts',
    category: 'Sección',
    extraTokens: ['reportes', 'alertas', 'stock', 'inventario'],
  },
  {
    key: 'billing',
    label: 'Ventas y Facturación',
    description: 'Ajusta el flujo de facturación, cotizaciones y preferencias.',
    tab: 'billing',
    route: TAB_ROUTES.billing,
    category: 'Pantalla',
    extraTokens: ['ventas', 'facturacion'],
  },
  {
    key: 'subscription',
    label: 'Suscripción y Pagos',
    description:
      'Atajo al centro de suscripción para planes, cobros y checkout.',
    tab: 'subscription',
    route: TAB_ROUTES.subscription,
    category: 'Pantalla',
    extraTokens: ['suscripcion', 'pagos', 'checkout', 'plan', 'account'],
  },
  {
    key: 'subscription-checkout',
    label: 'Account Subscription · Plan y Checkout',
    description: 'Abre el centro de suscripción para cambiar o gestionar plan.',
    tab: 'subscription',
    route: ROUTES_NAME.SETTING_TERM.ACCOUNT_SUBSCRIPTION_MANAGE,
    category: 'Pantalla',
    extraTokens: ['checkout', 'upgrade', 'downgrade', 'account'],
  },
  {
    key: 'subscription-portal',
    label: 'Account Subscription · Facturación',
    description:
      'Abre el centro de suscripción para gestionar facturas y cobros.',
    tab: 'subscription',
    route: ROUTES_NAME.SETTING_TERM.ACCOUNT_SUBSCRIPTION_BILLING,
    category: 'Pantalla',
    extraTokens: ['portal', 'factura', 'cobros', 'account'],
  },
  {
    key: 'billing-mode',
    label: 'Ventas · Modo de Facturación',
    description: 'Selecciona si facturas al contado, crédito u otro modo.',
    tab: 'billing',
    route: TAB_ROUTES.billing,
    sectionId: 'billing-mode',
    category: 'Sección',
    extraTokens: ['facturacion', 'modo', 'ventas'],
  },
  {
    key: 'billing-invoice-settings',
    label: 'Ventas · Configuración de Factura',
    description: 'Define los campos y mensajes que verán tus clientes.',
    tab: 'billing',
    route: TAB_ROUTES.billing,
    sectionId: 'billing-invoice-settings',
    category: 'Sección',
    extraTokens: ['factura', 'documento', 'ventas'],
  },
  {
    key: 'billing-quote-settings',
    label: 'Ventas · Configuración de Cotizaciones',
    description: 'Personaliza los parámetros predeterminados de cotizaciones.',
    tab: 'billing',
    route: TAB_ROUTES.billing,
    sectionId: 'billing-quote-settings',
    category: 'Sección',
    extraTokens: ['cotizacion', 'propuesta', 'venta'],
  },
  {
    key: 'taxReceipt',
    label: 'Comprobante Fiscal',
    description: 'Administra la emisión y secuencia de comprobantes fiscales.',
    tab: 'taxReceipt',
    route: TAB_ROUTES.taxReceipt,
    category: 'Pantalla',
    extraTokens: ['fiscal', 'ncf', 'comprobantes'],
  },
  {
    key: 'authorization',
    label: 'Flujo de Autorizaciones',
    description: 'Configura autorizaciones por PIN y módulos protegidos.',
    tab: 'authorization',
    route: TAB_ROUTES.authorization,
    sectionId: 'authorization-flow-overview',
    category: 'Pantalla',
    extraTokens: ['autorizaciones', 'pin', 'permisos'],
  },
  {
    key: 'appInfo',
    label: 'Info de la Aplicación',
    description: 'Consulta la versión, soporte y políticas de la plataforma.',
    tab: 'appInfo',
    route: TAB_ROUTES.appInfo,
    category: 'Pantalla',
    extraTokens: ['aplicacion', 'soporte', 'version'],
  },
];

const normalizeText = (value = '') =>
  value
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

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
  const activeTab = useMemo(() => {
    if (isExchangeRatesPath(currentPath)) return 'exchangeRates';
    if (currentPath.includes('/modules')) return 'modules';
    if (currentPath.includes('business')) return 'business';
    if (
      currentPath.includes('contabilidad') ||
      currentPath.includes('accounting')
    ) {
      return 'accounting';
    }
    if (currentPath.includes('inventory')) return 'inventory';
    if (currentPath.includes('/subscription')) return 'subscription';
    if (currentPath.includes('billing')) return 'billing';
    if (currentPath.includes('tax-receipt')) return 'taxReceipt';
    if (currentPath.includes('authorization')) return 'authorization';
    if (currentPath.includes('app-info')) return 'appInfo';
    return 'billing';
  }, [currentPath]);
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

    if (element.dataset.configExpandable === 'true') {
      const header = element.querySelector(
        '[data-role="config-section-header"]',
      );
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
      const targetRoute =
        MENU_ROUTES[key as ConfigMenuKey] || TAB_ROUTES.billing;
      navigate(targetRoute);
    },
    [navigate],
  );

  const menuItems = useMemo<MenuItem[]>(
    () =>
      [
        {
          key: 'modules',
          icon: <FontAwesomeIcon icon={faToggleOn} />,
          label: 'Módulos',
          group: 'business-management',
          groupLabel: 'Mi Negocio',
          groupType: 'labelled',
        },
        {
          key: 'business',
          icon: <FontAwesomeIcon icon={faBuilding} />,
          label: 'Datos de la Empresa',
          group: 'business-management',
          groupLabel: 'Mi Negocio',
          groupType: 'labelled',
        },
        {
          key: 'subscription',
          icon: <FontAwesomeIcon icon={faWallet} />,
          label: 'Suscripción y Pagos',
          group: 'business-management',
          groupLabel: 'Mi Negocio',
          groupType: 'labelled',
        },
        {
          key: 'inventory',
          icon: <FontAwesomeIcon icon={faWarehouse} />,
          label: 'Inventario',
          group: 'operations',
          groupLabel: 'Operaciones',
          groupType: 'labelled',
        },
        {
          key: 'billing',
          icon: <FontAwesomeIcon icon={faCreditCard} />,
          label: 'Ventas y Facturación',
          group: 'operations',
          groupLabel: 'Operaciones',
          groupType: 'labelled',
        },
        {
          key: 'taxReceipt',
          icon: <FontAwesomeIcon icon={faFileInvoice} />,
          label: 'Comprobante Fiscal',
          group: 'operations',
          groupLabel: 'Operaciones',
          groupType: 'labelled',
        },
        {
          key: 'accounting',
          icon: <FontAwesomeIcon icon={faMoneyBillTrendUp} />,
          label: 'Contabilidad',
          children: ACCOUNTING_MENU_ITEMS,
          group: 'finance-accounting',
          groupLabel: 'Finanzas y Contabilidad',
          groupType: 'labelled',
        },
        {
          key: 'exchangeRates',
          icon: <FontAwesomeIcon icon={faMoneyBillTrendUp} />,
          label: 'Tipos de cambio',
          group: 'finance-accounting',
          groupLabel: 'Finanzas y Contabilidad',
          groupType: 'labelled',
        },
        {
          key: 'authorization',
          icon: <FontAwesomeIcon icon={faKey} />,
          label: 'Flujo de Autorizaciones',
          group: 'security-system',
          groupLabel: 'Seguridad y Sistema',
          groupType: 'labelled',
        },
        {
          key: 'appInfo',
          icon: <FontAwesomeIcon icon={faInfoCircle} />,
          label: 'Info de la Aplicación',
          group: 'security-system',
          groupLabel: 'Seguridad y Sistema',
          groupType: 'labelled',
        },
      ].filter((item) =>
        item.key === 'subscription'
          ? canManageSubscriptions
          : item.key === 'accounting' || item.key === 'exchangeRates'
            ? accountingEnabled
            : true,
      ),
    [accountingEnabled, canManageSubscriptions],
  );

  const searchEntries = useMemo<GeneralConfigSearchEntry[]>(() => {
    const availableTabs = new Set(menuItems.map((item) => item.key));
    return GENERAL_CONFIG_SEARCH_INDEX.filter((entry) =>
      availableTabs.has(entry.tab),
    );
  }, [menuItems]);

  const searchRecords = useMemo<GeneralConfigSearchRecord[]>(() => {
    return searchEntries.map((entry) => {
      const tokens = [
        normalizeText(entry.label),
        normalizeText(entry.description),
        normalizeText(entry.category),
        ...(entry.extraTokens || []).map(normalizeText),
      ].filter(Boolean);

      return {
        key: entry.key,
        label: entry.label,
        description: entry.description,
        category: entry.category,
        entry,
        tokens,
      };
    });
  }, [searchEntries]);

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
