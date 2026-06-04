import {
  faArrowTrendUp,
  faBolt,
  faChartLine,
  faLock,
  faStar,
} from '@fortawesome/free-solid-svg-icons';

export const DEFAULT_BENEFITS = [
  'Desbloquea mas capacidad operativa sin perder el contexto de trabajo.',
  'Amplia limites para usuarios, facturas y crecimiento del negocio.',
  'Gestiona upgrade y cobros desde el centro de suscripcion.',
];

export const UPGRADE_MODAL_ICONS = {
  lock: faLock,
  reason: faStar,
  benefits: [faBolt, faChartLine, faArrowTrendUp],
} as const;

export const getBenefitIcon = (index: number) =>
  UPGRADE_MODAL_ICONS.benefits[index] ?? faArrowTrendUp;
