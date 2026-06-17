import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBookOpen,
  faBuilding,
  faCreditCard,
  faFileInvoice,
  faInfoCircle,
  faKey,
  faLayerGroup,
  faMoneyBillTrendUp,
  faToggleOn,
  faWarehouse,
  faWallet,
} from '@fortawesome/free-solid-svg-icons';

import ROUTES_NAME from '@/router/routes/routesName';
import { normalizeSearchText } from '@/utils/searchText';

import type { MenuItem } from '../components/GeneralConfigNav/types';

export const TAB_ROUTES = {
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
    label: 'Catalogo de cuentas',
  },
  {
    key: 'accounting-posting-profiles',
    icon: <FontAwesomeIcon icon={faLayerGroup} />,
    label: 'Reglas de contabilización',
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

export const isExchangeRatesPath = (pathname: string): boolean =>
  pathname.includes('exchange-rates') || pathname.includes('tasa-cambio');

export const resolveActiveTabKey = (pathname: string): ConfigTabKey => {
  if (isExchangeRatesPath(pathname)) return 'exchangeRates';
  if (pathname.includes('/modules')) return 'modules';
  if (pathname.includes('business')) return 'business';

  if (pathname.includes('contabilidad') || pathname.includes('accounting')) {
    return 'accounting';
  }

  if (pathname.includes('inventory')) return 'inventory';
  if (pathname.includes('/subscription')) return 'subscription';
  if (pathname.includes('billing')) return 'billing';
  if (pathname.includes('tax-receipt')) return 'taxReceipt';
  if (pathname.includes('authorization')) return 'authorization';
  if (pathname.includes('app-info')) return 'appInfo';

  return 'billing';
};

export const resolveActiveItemKey = (pathname: string): string => {
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

export const resolveGeneralConfigRoute = (key: string) =>
  MENU_ROUTES[key as ConfigMenuKey] || TAB_ROUTES.billing;

export const buildGeneralConfigMenuItems = ({
  accountingEnabled,
  canManageSubscriptions,
}: {
  accountingEnabled: boolean;
  canManageSubscriptions: boolean;
}): MenuItem[] =>
  [
    {
      key: 'modules',
      icon: <FontAwesomeIcon icon={faToggleOn} />,
      label: 'Modulos',
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
      label: 'Suscripcion y Pagos',
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
      label: 'Ventas y Facturacion',
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
      label: 'Info de la Aplicacion',
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
  ) as MenuItem[];

const GENERAL_CONFIG_SEARCH_INDEX: GeneralConfigSearchEntry[] = [
  {
    key: 'modules',
    label: 'Modulos',
    description: 'Activa o desactiva Contabilidad y Tesoreria del negocio.',
    tab: 'modules',
    route: TAB_ROUTES.modules,
    category: 'Pantalla',
    extraTokens: ['modulos', 'activar', 'deshabilitar', 'features'],
  },
  {
    key: 'modules-accounting',
    label: 'Modulos - Contabilidad',
    description: 'Gestiona el encendido operativo del modulo de contabilidad.',
    tab: 'modules',
    route: TAB_ROUTES.modules,
    sectionId: 'modules-accounting',
    category: 'Seccion',
    extraTokens: ['contabilidad', 'modulo', 'habilitar'],
  },
  {
    key: 'modules-treasury',
    label: 'Modulos - Tesoreria',
    description: 'Gestiona el encendido operativo del modulo de tesoreria.',
    tab: 'modules',
    route: TAB_ROUTES.modules,
    sectionId: 'modules-treasury',
    category: 'Seccion',
    extraTokens: ['tesoreria', 'modulo', 'habilitar', 'bancos', 'caja'],
  },
  {
    key: 'business',
    label: 'Datos de la Empresa',
    description:
      'Manten actualizados los datos principales de tu organizacion.',
    tab: 'business',
    route: TAB_ROUTES.business,
    category: 'Pantalla',
    extraTokens: ['empresa', 'negocio', 'perfil'],
  },
  {
    key: 'accounting',
    label: 'Contabilidad',
    description:
      'Ordena catalogo, reglas y estructura base del esquema contable.',
    tab: 'accounting',
    route: TAB_ROUTES.accounting,
    category: 'Pantalla',
    extraTokens: [
      'catalogo',
      'plan contable',
      'reglas',
      'perfiles',
      'contabilidad',
    ],
  },
  {
    key: 'accounting-chart-of-accounts',
    label: 'Contabilidad - Catalogo de cuentas',
    description:
      'Revisa la jerarquia contable y administra cuentas posteables o encabezados.',
    tab: 'accounting',
    route: ROUTES_NAME.SETTING_TERM.GENERAL_CONFIG_ACCOUNTING_CHART_OF_ACCOUNTS,
    category: 'Seccion',
    extraTokens: ['catalogo', 'cuentas', 'plan contable', 'mayor'],
  },
  {
    key: 'accounting-posting-profiles',
    label: 'Contabilidad - Reglas de contabilización',
    description:
      'Configura la cobertura por evento y las reglas de contabilizacion.',
    tab: 'accounting',
    route: ROUTES_NAME.SETTING_TERM.GENERAL_CONFIG_ACCOUNTING_POSTING_PROFILES,
    category: 'Seccion',
    extraTokens: [
      'perfiles contables',
      'reglas contables',
      'reglas de contabilizacion',
      'asientos',
      'eventos',
      'mapeo',
    ],
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
    description: 'Configura parametros clave del flujo de inventario.',
    tab: 'inventory',
    route: TAB_ROUTES.inventory,
    category: 'Pantalla',
    extraTokens: ['stock', 'almacenes'],
  },
  {
    key: 'inventory-default-warehouse',
    label: 'Inventario - Almacen predeterminado',
    description: 'Define el almacen que se usara por defecto en operaciones.',
    tab: 'inventory',
    route: TAB_ROUTES.inventory,
    sectionId: 'inventory-default-warehouse',
    category: 'Seccion',
    extraTokens: ['almacen', 'predeterminado', 'default', 'bodega'],
  },
  {
    key: 'inventory-stock-alerts',
    label: 'Inventario - Reportes y alertas',
    description: 'Configura reportes y alertas de stock por correo.',
    tab: 'inventory',
    route: TAB_ROUTES.inventory,
    sectionId: 'inventory-stock-alerts',
    category: 'Seccion',
    extraTokens: ['reportes', 'alertas', 'stock', 'inventario'],
  },
  {
    key: 'billing',
    label: 'Ventas y Facturacion',
    description: 'Ajusta el flujo de facturacion, cotizaciones y preferencias.',
    tab: 'billing',
    route: TAB_ROUTES.billing,
    category: 'Pantalla',
    extraTokens: ['ventas', 'facturacion'],
  },
  {
    key: 'subscription',
    label: 'Suscripcion y Pagos',
    description:
      'Atajo al centro de suscripcion para planes, cobros y checkout.',
    tab: 'subscription',
    route: TAB_ROUTES.subscription,
    category: 'Pantalla',
    extraTokens: ['suscripcion', 'pagos', 'checkout', 'plan', 'account'],
  },
  {
    key: 'subscription-checkout',
    label: 'Account Subscription - Plan y Checkout',
    description: 'Abre el centro de suscripcion para cambiar o gestionar plan.',
    tab: 'subscription',
    route: ROUTES_NAME.SETTING_TERM.ACCOUNT_SUBSCRIPTION_MANAGE,
    category: 'Pantalla',
    extraTokens: ['checkout', 'upgrade', 'downgrade', 'account'],
  },
  {
    key: 'subscription-portal',
    label: 'Account Subscription - Facturacion',
    description:
      'Abre el centro de suscripcion para gestionar facturas y cobros.',
    tab: 'subscription',
    route: ROUTES_NAME.SETTING_TERM.ACCOUNT_SUBSCRIPTION_BILLING,
    category: 'Pantalla',
    extraTokens: ['portal', 'factura', 'cobros', 'account'],
  },
  {
    key: 'billing-mode',
    label: 'Ventas - Modo de Facturacion',
    description: 'Selecciona si facturas al contado, credito u otro modo.',
    tab: 'billing',
    route: TAB_ROUTES.billing,
    sectionId: 'billing-mode',
    category: 'Seccion',
    extraTokens: ['facturacion', 'modo', 'ventas'],
  },
  {
    key: 'billing-invoice-settings',
    label: 'Ventas - Configuracion de Factura',
    description: 'Define los campos y mensajes que veran tus clientes.',
    tab: 'billing',
    route: TAB_ROUTES.billing,
    sectionId: 'billing-invoice-settings',
    category: 'Seccion',
    extraTokens: ['factura', 'documento', 'ventas'],
  },
  {
    key: 'billing-quote-settings',
    label: 'Ventas - Configuracion de Cotizaciones',
    description: 'Personaliza los parametros predeterminados de cotizaciones.',
    tab: 'billing',
    route: TAB_ROUTES.billing,
    sectionId: 'billing-quote-settings',
    category: 'Seccion',
    extraTokens: ['cotizacion', 'propuesta', 'venta'],
  },
  {
    key: 'billing-service-commissions',
    label: 'Ventas - Comisiones de Servicios',
    description: 'Activa colaborador por linea y tasa base de comision.',
    tab: 'billing',
    route: TAB_ROUTES.billing,
    sectionId: 'billing-service-commissions',
    category: 'Seccion',
    extraTokens: ['comisiones', 'colaborador', 'vendedor', 'servicios'],
  },
  {
    key: 'taxReceipt',
    label: 'Comprobante Fiscal',
    description: 'Administra la emision y secuencia de comprobantes fiscales.',
    tab: 'taxReceipt',
    route: TAB_ROUTES.taxReceipt,
    category: 'Pantalla',
    extraTokens: ['fiscal', 'ncf', 'comprobantes'],
  },
  {
    key: 'authorization',
    label: 'Flujo de Autorizaciones',
    description: 'Configura autorizaciones por PIN y modulos protegidos.',
    tab: 'authorization',
    route: TAB_ROUTES.authorization,
    sectionId: 'authorization-flow-overview',
    category: 'Pantalla',
    extraTokens: ['autorizaciones', 'pin', 'permisos'],
  },
  {
    key: 'appInfo',
    label: 'Info de la Aplicacion',
    description: 'Consulta la version, soporte y politicas de la plataforma.',
    tab: 'appInfo',
    route: TAB_ROUTES.appInfo,
    category: 'Pantalla',
    extraTokens: ['aplicacion', 'soporte', 'version'],
  },
];

export const buildGeneralConfigSearchRecords = (
  menuItems: MenuItem[],
): GeneralConfigSearchRecord[] => {
  const availableTabs = new Set(menuItems.map((item) => item.key));
  const entries = GENERAL_CONFIG_SEARCH_INDEX.filter((entry) =>
    availableTabs.has(entry.tab),
  );

  return entries.map((entry) => {
    const tokens = [
      normalizeSearchText(entry.label),
      normalizeSearchText(entry.description),
      normalizeSearchText(entry.category),
      ...(entry.extraTokens || []).map(normalizeSearchText),
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
};
