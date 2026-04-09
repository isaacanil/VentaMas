import FrontendFeatureBlockedView from './FrontendFeatureBlockedView';
import {
  isFrontendFeatureEnabled,
  type FrontendFeatureKey,
} from '@/utils/runtime/frontendFeatureAccess';

import type { JSX, ReactNode } from 'react';

interface FrontendFeatureRouteGateProps {
  feature: FrontendFeatureKey;
  children: ReactNode;
  blockedView?: Partial<(typeof FEATURE_COPY)[FrontendFeatureKey]>;
}

const FEATURE_COPY: Record<
  FrontendFeatureKey,
  {
    eyebrow: string;
    title: string;
    description: string;
    primaryTo: string;
    primaryLabel: string;
    secondaryTo?: string;
    secondaryLabel?: string;
  }
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
};

export const FrontendFeatureRouteGate = ({
  feature,
  children,
  blockedView,
}: FrontendFeatureRouteGateProps): JSX.Element => {
  if (isFrontendFeatureEnabled(feature)) {
    return <>{children}</>;
  }

  return (
    <FrontendFeatureBlockedView
      {...FEATURE_COPY[feature]}
      {...blockedView}
    />
  );
};

export default FrontendFeatureRouteGate;
