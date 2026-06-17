import type { FrontendFeatureBlockedViewProps } from './FrontendFeatureBlockedView';
import type { FrontendFeatureKey } from '@/utils/runtime/frontendFeatureAccess';

export const CLAIM_BUSINESS_BLOCKED_COPY: FrontendFeatureBlockedViewProps = {
  eyebrow: 'Reclamo pausado',
  title: 'El reclamo de propiedad no est\u00e1 disponible en producci\u00f3n.',
  description:
    'Este flujo todav\u00eda est\u00e1 en preparaci\u00f3n y por ahora solo est\u00e1 habilitado en staging y localhost.',
  primaryTo: '/login',
  primaryLabel: 'Ir a iniciar sesi\u00f3n',
  secondaryTo: '/',
  secondaryLabel: 'Volver al inicio',
};

export const FRONTEND_FEATURE_BLOCKED_COPY: Record<
  FrontendFeatureKey,
  FrontendFeatureBlockedViewProps
> = {
  userRegistration: {
    eyebrow: 'Registro pausado',
    title: 'La creación de cuentas no está disponible en este entorno.',
    description:
      'El registro público sigue deshabilitado en producción mientras terminamos este flujo. Para pruebas internas usa staging o localhost.',
    primaryTo: '/login',
    primaryLabel: 'Ir a iniciar sesión',
    secondaryTo: '/',
    secondaryLabel: 'Volver al inicio',
  },
  businessCreation: {
    eyebrow: 'Negocios pausados',
    title: 'La creación de negocios está deshabilitada en producción.',
    description:
      'Este flujo sigue en preparación y por ahora solo está habilitado en staging y localhost.',
    primaryTo: '/home',
    primaryLabel: 'Volver al inicio',
  },
  subscriptionManagement: {
    eyebrow: 'Suscripciones pausadas',
    title: 'La gestión de suscripciones no está disponible en producción.',
    description:
      'El frontend de suscripciones todavía no está listo para usuarios finales. Para validaciones internas usa staging o localhost.',
    primaryTo: '/home',
    primaryLabel: 'Volver al inicio',
  },
  invoiceTemplateV2Beta: {
    eyebrow: 'Plantilla en validación',
    title:
      'Esta plantilla de factura todavía no está disponible en producción.',
    description:
      'La plantilla nueva sigue habilitada solo para validaciones internas en staging y localhost.',
    primaryTo: '/home',
    primaryLabel: 'Volver al inicio',
  },
};
