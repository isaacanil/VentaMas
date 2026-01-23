import { icons } from '@/constants/icons/icons';
import ROUTES_NAME from '@/router/routes/routesName';
import type { ReactNode } from 'react';

const { TAX_RECEIPT, BUSINESS_INFO, APP_INFO, USERS, USERS_LIST, SETTINGS } =
  ROUTES_NAME.SETTING_TERM;
const category = {
  BUSINESS_INFO: 'ConfiguraciÃ³n de la Empresa',
  APP_INFO: 'AplicaciÃ³n',
};

type SettingCategory = (typeof category)[keyof typeof category];

export interface SettingItem {
  title: string;
  description: string;
  type: string;
  icon: ReactNode;
  category: SettingCategory;
  route: string;
}

const getRoute = (routeName: string, alt?: 'users') => {
  switch (alt) {
    case 'users':
      return USERS + '/' + routeName;
    default:
      return SETTINGS + routeName;
  }
};

export const getSettingData = (): SettingItem[] => {
  return [
    {
      title: 'Datos de la Empresa',
      description: 'Completa los datos de tu organizaciÃ³n.',
      type: 'empresa',
      icon: icons.settings.businessInfo,
      category: category.BUSINESS_INFO,
      route: getRoute(BUSINESS_INFO),
    },
    {
      title: 'Comprobante Fiscal',
      description: 'ConfiguraciÃ³n de comprobante fiscal.',
      type: 'fiscal',
      icon: icons.settings.taxReceipt,
      category: category.BUSINESS_INFO,
      route: getRoute(TAX_RECEIPT),
    },
    {
      title: 'AdministraciÃ³n de Usuarios',
      description: 'Gestiona los usuarios de tu cuenta.',
      type: 'usuarios',
      icon: icons.settings.users,
      category: category.BUSINESS_INFO,
      route: getRoute(USERS_LIST, 'users'),
    },
    // {
    //     title: 'Enviar Comentarios',
    //     description: 'Enviar Reporte de Errores y Sugerencias',
    //     type: 'feedback',
    //     category: 'AplicaciÃ³n',
    //     path: '/app/feedback',
    // },
    {
      title: 'InformaciÃ³n de la AplicaciÃ³n',
      description: 'Consulta detalles sobre la aplicaciÃ³n.',
      type: 'aplicaciÃ³n',
      icon: icons.settings.appInfo,
      category: category.APP_INFO,
      route: getRoute(APP_INFO),
    },
  ];
};

