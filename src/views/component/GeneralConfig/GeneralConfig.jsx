import {
  faCreditCard,
  faBuilding,
  faFileInvoice,
  faInfoCircle,
  faQuestionCircle, // Add icon for Help/Other group
  faKey,
  faWarehouse
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState, useEffect } from 'react'; // Removed useRef
import { useSelector } from 'react-redux'; // Import useSelector
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

import { selectUser } from '../../../features/auth/userSlice';
import { makeSelectPreviousRelevantRoute } from '../../../features/navigation/navigationSlice';
import { userAccess } from '../../../hooks/abilities/useAbilities';
import ROUTES_NAME from '../../../routes/routesName';
import { MenuApp } from '../../templates/MenuApp/MenuApp';
import { Nav } from '../../templates/system/Nav/Nav';
// Import the factory instead of the direct selector

// Create a specific selector instance using the factory
const selectPreviousRouteIgnoringConfig = makeSelectPreviousRelevantRoute('/general-config');

export default function GeneralConfig() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const [activeTab, setActiveTab] = useState('billing');
  const previousRelevantRoute = useSelector(selectPreviousRouteIgnoringConfig);
  const user = useSelector(selectUser);
  const { abilities } = userAccess();
  const abilityRules = abilities?.rules || [];
  const hasAbilityData = abilityRules.length > 0;
  const isCashierRole = ['cashier', 'specialCashier1', 'specialCashier2'].includes(user?.role);
  const canManageBusinessSettings = hasAbilityData && (abilities.can('manage', 'Business') || abilities.can('manage', 'business-settings'));
  const shouldBlockGeneralConfig = isCashierRole || (hasAbilityData && !canManageBusinessSettings);

  useEffect(() => {
    if (shouldBlockGeneralConfig) {
      const fallbackPath = previousRelevantRoute?.pathname || '/home';
      if (currentPath !== fallbackPath) {
        navigate(fallbackPath, { replace: true });
      }
    }
  }, [shouldBlockGeneralConfig, currentPath, navigate, previousRelevantRoute]);

  // Effect to determine the active tab based on current path
  useEffect(() => {
    if (!canManageBusinessSettings) {
      return;
    }

    if (currentPath.includes('/general-config/users')) {
      navigate(`${ROUTES_NAME.SETTING_TERM.USERS}/${ROUTES_NAME.SETTING_TERM.USERS_LIST}`, { replace: true });
      return;
    }

    if (currentPath.includes('billing')) {
      setActiveTab('billing');
    } else if (currentPath.includes('business')) {
      setActiveTab('business');
    } else if (currentPath.includes('inventory')) {
      setActiveTab('inventory');
    } else if (currentPath.includes('tax-receipt')) {
      setActiveTab('taxReceipt');
    } else if (currentPath.includes('authorization')) {
      setActiveTab('authorization');
    } else if (currentPath.includes('app-info')) {
      setActiveTab('appInfo');
    } else if (currentPath.includes('/general-config')) { // Default case if directly on /general-config
      setActiveTab('billing');
      navigate(ROUTES_NAME.SETTING_TERM.GENERAL_CONFIG_BILLING, { replace: true });
    }
  }, [canManageBusinessSettings, currentPath, navigate]);

  // Updated handleBackClick to use the route from Redux state
  const handleBackClick = () => {
    const targetPath = previousRelevantRoute?.pathname || '/home'; // Use pathname from selector or default to /home
    navigate(targetPath);
  };

  const handleTabChange = (key) => {
    switch (key) {
      case 'billing':
        navigate(ROUTES_NAME.SETTING_TERM.GENERAL_CONFIG_BILLING);
        break;
      case 'business':
        navigate(ROUTES_NAME.SETTING_TERM.GENERAL_CONFIG_BUSINESS);
        break;
      case 'inventory':
        navigate(ROUTES_NAME.SETTING_TERM.GENERAL_CONFIG_INVENTORY);
        break;
      case 'taxReceipt':
        navigate(ROUTES_NAME.SETTING_TERM.GENERAL_CONFIG_TAX_RECEIPT);
        break;
      case 'authorization':
        navigate(ROUTES_NAME.SETTING_TERM.GENERAL_CONFIG_AUTHORIZATION);
        break;
      case 'appInfo':
        navigate(ROUTES_NAME.SETTING_TERM.GENERAL_CONFIG_APP_INFO);
        break;
      default:
        navigate(ROUTES_NAME.SETTING_TERM.GENERAL_CONFIG_BILLING);
    }
  };


  // Update menuItems: change group for appInfo and remove its groupType
  const menuItems = [
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
      groupType: 'labelled'
    },
    {
      key: 'billing',
      icon: <FontAwesomeIcon icon={faCreditCard} />,
      label: 'Ventas y Facturación',
      group: 'basic',
      groupLabel: 'Configuración Básica',
      groupType: 'labelled'
    },
    {
      key: 'taxReceipt',
      icon: <FontAwesomeIcon icon={faFileInvoice} />,
      label: 'Comprobante Fiscal',
      group: 'basic',
      groupLabel: 'Configuración Básica',
      groupType: 'labelled'
    },
    {
      key: 'authorization',
      icon: <FontAwesomeIcon icon={faKey} />,
      label: 'Flujo de Autorizaciones',
      group: 'advanced',
      groupLabel: 'Configuración Avanzada',
      groupType: 'labelled'
    },
    // Change group for appInfo
    {
      key: 'appInfo',
      icon: <FontAwesomeIcon icon={faInfoCircle} />,
      label: 'Info de la Aplicación',
      group: 'help', // New group key
      groupLabel: 'Sistema', // New group label
      groupIcon: <FontAwesomeIcon icon={faQuestionCircle} />, // Add icon for collapsible header
      groupType: 'labelled' // Explicitly set or remove to use default collapsible
    },
  ];


  if (!hasAbilityData && !isCashierRole) {
    return null;
  }

  if (shouldBlockGeneralConfig) {
    return null;
  }

  return (
    <Nav
      menuItems={menuItems}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      header={
        <MenuApp
          onBackClick={handleBackClick} // Uses the updated logic
          sectionName="Configuración General"
        />
      }
    >
      <Outlet />
    </Nav>
  );
}
