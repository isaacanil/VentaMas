import {
  faCreditCard,
  faBuilding,
  faFileInvoice,
  faInfoCircle,
  faQuestionCircle, // Add icon for Help/Other group
  faKey,
  faWarehouse,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useMemo, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux'; // Import useSelector
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import styled, { createGlobalStyle } from 'styled-components';

import { selectUser } from '../../../features/auth/userSlice';
import { makeSelectPreviousRelevantRoute } from '../../../features/navigation/navigationSlice';
import { useUserAccess } from '../../../hooks/abilities/useAbilities';
import ROUTES_NAME from '@/router/routes/routesName';
import { MenuApp } from '../../templates/MenuApp/MenuApp';
import { Nav } from '../../templates/system/Nav/Nav';

import { GeneralConfigSearch } from './components/Search/GeneralConfigSearch';
// Import the factory instead of the direct selector

// Create a specific selector instance using the factory
const selectPreviousRouteIgnoringConfig =
  makeSelectPreviousRelevantRoute('/general-config');

const TAB_ROUTES = {
  billing: ROUTES_NAME.SETTING_TERM.GENERAL_CONFIG_BILLING,
  business: ROUTES_NAME.SETTING_TERM.GENERAL_CONFIG_BUSINESS,
  inventory: ROUTES_NAME.SETTING_TERM.GENERAL_CONFIG_INVENTORY,
  taxReceipt: ROUTES_NAME.SETTING_TERM.GENERAL_CONFIG_TAX_RECEIPT,
  authorization: ROUTES_NAME.SETTING_TERM.GENERAL_CONFIG_AUTHORIZATION,
  appInfo: ROUTES_NAME.SETTING_TERM.GENERAL_CONFIG_APP_INFO,
};

const GENERAL_CONFIG_SEARCH_INDEX = [
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

const SearchHighlightStyles = createGlobalStyle`
  [data-config-section] {
    scroll-margin-top: 120px;
  }

  .config-search-highlight {
    outline: 2px solid var(--primary-color, #1677ff);
    outline-offset: 0;
    border-radius: 12px;
    box-shadow: 0 0 0 3px var(--primary-color, #1677ff);
    transition: box-shadow 0.25s ease;
  }
`;

export default function GeneralConfig() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  // Derivar activeTab directamente de la ruta actual
  let activeTab = 'billing';
  if (currentPath.includes('business')) {
    activeTab = 'business';
  } else if (currentPath.includes('inventory')) {
    activeTab = 'inventory';
  } else if (currentPath.includes('billing')) {
    activeTab = 'billing';
  } else if (currentPath.includes('tax-receipt')) {
    activeTab = 'taxReceipt';
  } else if (currentPath.includes('authorization')) {
    activeTab = 'authorization';
  } else if (currentPath.includes('app-info')) {
    activeTab = 'appInfo';
  }

  const highlightTimersRef = useRef({});
  const pendingTargetRef = useRef(null);
  const scrollRetryRef = useRef(null);
  const previousRelevantRoute = useSelector(selectPreviousRouteIgnoringConfig);
  const user = useSelector(selectUser);
  const { abilities } = useUserAccess();
  const abilityRules = abilities?.rules || [];
  const hasAbilityData = abilityRules.length > 0;
  const isCashierRole = [
    'cashier',
    'specialCashier1',
    'specialCashier2',
  ].includes(user?.role);
  const canManageBusinessSettings =
    hasAbilityData &&
    (abilities.can('manage', 'Business') ||
      abilities.can('manage', 'business-settings'));
  const shouldBlockGeneralConfig =
    isCashierRole || (hasAbilityData && !canManageBusinessSettings);

  const clearScrollRetry = useCallback(() => {
    if (scrollRetryRef.current) {
      window.clearInterval(scrollRetryRef.current);
      scrollRetryRef.current = null;
    }
  }, []);

  const scrollToSection = useCallback((sectionId) => {
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
    (sectionId) => {
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

  useEffect(() => {
    if (shouldBlockGeneralConfig) {
      const fallbackPath = previousRelevantRoute?.pathname || '/home';
      if (currentPath !== fallbackPath) {
        navigate(fallbackPath, { replace: true });
      }
    }
  }, [shouldBlockGeneralConfig, currentPath, navigate, previousRelevantRoute]);

  // Redirección si estamos en la ruta base
  useEffect(() => {
    if (currentPath.endsWith('/general-config') || currentPath.endsWith('/general-config/')) {
      navigate(ROUTES_NAME.SETTING_TERM.GENERAL_CONFIG_BILLING, {
        replace: true,
      });
    }
  }, [currentPath, navigate]);

  // Redirección usuarios
  useEffect(() => {
    if (canManageBusinessSettings && currentPath.includes('/general-config/users')) {
      navigate(
        `${ROUTES_NAME.SETTING_TERM.USERS}/${ROUTES_NAME.SETTING_TERM.USERS_LIST}`,
        {
          replace: true,
        },
      );
    }
  }, [canManageBusinessSettings, currentPath, navigate]);

  // Updated handleBackClick to use the route from Redux state
  const handleBackClick = () => {
    const targetPath = previousRelevantRoute?.pathname || '/home'; // Use pathname from selector or default to /home
    navigate(targetPath);
  };

  const handleTabChange = useCallback(
    (key) => {
      const targetRoute = TAB_ROUTES[key] || TAB_ROUTES.billing;
      navigate(targetRoute);
    },
    [navigate],
  );

  // Update menuItems: change group for appInfo and keep labelled grouping
  const menuItems = useMemo(
    () => [
      {
        key: 'business',
        icon: <FontAwesomeIcon icon={faBuilding} />,
        label: 'Datos de la Empresa',
      },
      {
        key: 'inventory',
        icon: <FontAwesomeIcon icon={faWarehouse} />,
        label: 'Inventario',
        group: 'basic',
        groupLabel: 'Configuración Básica',
        groupType: 'labelled',
      },
      {
        key: 'billing',
        icon: <FontAwesomeIcon icon={faCreditCard} />,
        label: 'Ventas y Facturación',
        group: 'basic',
        groupLabel: 'Configuración Básica',
        groupType: 'labelled',
      },
      {
        key: 'taxReceipt',
        icon: <FontAwesomeIcon icon={faFileInvoice} />,
        label: 'Comprobante Fiscal',
        group: 'basic',
        groupLabel: 'Configuración Básica',
        groupType: 'labelled',
      },
      {
        key: 'authorization',
        icon: <FontAwesomeIcon icon={faKey} />,
        label: 'Flujo de Autorizaciones',
        group: 'advanced',
        groupLabel: 'Configuración Avanzada',
        groupType: 'labelled',
      },
      // Change group for appInfo
      {
        key: 'appInfo',
        icon: <FontAwesomeIcon icon={faInfoCircle} />,
        label: 'Info de la Aplicación',
        group: 'help', // New group key
        groupLabel: 'Sistema', // New group label
        groupIcon: <FontAwesomeIcon icon={faQuestionCircle} />, // Add icon for collapsible header
        groupType: 'labelled', // Explicitly set or remove to use default collapsible
      },
    ],
    [],
  );

  const searchEntries = useMemo(() => {
    const availableTabs = new Set(menuItems.map((item) => item.key));
    return GENERAL_CONFIG_SEARCH_INDEX.filter((entry) =>
      availableTabs.has(entry.tab),
    );
  }, [menuItems]);

  const searchRecords = useMemo(() => {
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
    (entry) => {
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

  const headerContent = (
    <HeaderWrapper>
      <MenuApp
        onBackClick={handleBackClick}
        sectionName="Configuración General"
      />
      <GeneralConfigSearch
        records={searchRecords}
        onSelect={handleSearchEntrySelect}
        dependencyKey={currentPath}
      />
    </HeaderWrapper>
  );

  if (!hasAbilityData && !isCashierRole) {
    return null;
  }

  if (shouldBlockGeneralConfig) {
    return null;
  }

  return (
    <>
      <SearchHighlightStyles />
      <Nav
        menuItems={menuItems}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        header={headerContent}
      >
        <Outlet />
      </Nav>
    </>
  );
}

const HeaderWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6em;
`;
