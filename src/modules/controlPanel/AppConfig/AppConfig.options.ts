import ROUTES_NAME from '@/router/routes/routesName';

export interface ConfigOption {
  title: string;
  description: string;
  route: string;
}

export const APP_CONFIG_OPTIONS: ConfigOption[] = [
  {
    title: 'Imagen de Login',
    description:
      'Configurar la imagen que se muestra en la página de inicio de sesión',
    route: ROUTES_NAME.DEV_VIEW_TERM.APP_CONFIG.LOGIN_IMAGE,
  },
];
