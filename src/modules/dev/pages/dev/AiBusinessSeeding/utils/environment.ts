import ROUTES_NAME from '@/router/routes/routesName';

export type AiBusinessSeedingEnvironmentId = 'staging' | 'production';

export interface AiBusinessSeedingEnvironment {
  id: AiBusinessSeedingEnvironmentId;
  label: string;
  projectId: string;
  origin: string;
  tone: 'warning' | 'danger';
}

const AI_BUSINESS_SEEDING_ROUTE =
  ROUTES_NAME.DEV_VIEW_TERM.AI_BUSINESS_SEEDING;

export const AI_BUSINESS_SEEDING_ENVIRONMENTS: AiBusinessSeedingEnvironment[] = [
  {
    id: 'staging',
    label: 'Staging',
    projectId: 'ventamax-staging',
    origin: 'https://ventamax-staging.web.app',
    tone: 'warning',
  },
  {
    id: 'production',
    label: 'Produccion',
    projectId: 'ventamaxpos',
    origin: 'https://ventamaxpos.web.app',
    tone: 'danger',
  },
];

const fallbackEnvironment = AI_BUSINESS_SEEDING_ENVIRONMENTS[0];

export const resolveAiBusinessSeedingEnvironment = (
  projectId?: string | null,
) => {
  const normalizedProjectId =
    typeof projectId === 'string' ? projectId.trim().toLowerCase() : '';

  return (
    AI_BUSINESS_SEEDING_ENVIRONMENTS.find(
      (environment) => environment.projectId === normalizedProjectId,
    ) || fallbackEnvironment
  );
};

export const getCurrentAiBusinessSeedingEnvironment = () =>
  resolveAiBusinessSeedingEnvironment(import.meta.env.VITE_FIREBASE_PROJECT_ID);

export const getAiBusinessSeedingEnvironmentUrl = ({
  environment,
  search = '',
}: {
  environment: AiBusinessSeedingEnvironment;
  search?: string;
}) => {
  const normalizedSearch = search.startsWith('?') ? search : '';
  return `${environment.origin}${AI_BUSINESS_SEEDING_ROUTE}${normalizedSearch}`;
};
