import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import ROUTES_NAME from '@/router/routes/routesName';
import { isFrontendFeatureEnabled } from '@/utils/runtime/frontendFeatureAccess';

import type { JSX } from 'react';

interface HomeOnboardingEmptyStateProps {
  displayName?: string | null;
}

export const HomeOnboardingEmptyState = ({
  displayName,
}: HomeOnboardingEmptyStateProps): JSX.Element => {
  const navigate = useNavigate();
  const canCreateBusiness = isFrontendFeatureEnabled('businessCreation');

  return (
    <Card>
      <Eyebrow>Onboarding</Eyebrow>
      <Title>
        {displayName ? `${displayName}, vamos a crear tu negocio` : 'Crea tu negocio'}
      </Title>
      <Description>
        Tu cuenta ya está lista. El siguiente paso es registrar tu negocio para
        activar el panel principal, atajos y módulos.
      </Description>

      {canCreateBusiness ? (
        <Actions>
          <PrimaryButton
            type="button"
            onClick={() => navigate(ROUTES_NAME.DEV_VIEW_TERM.CREATE_BUSINESS)}
          >
            Crear mi negocio
          </PrimaryButton>
        </Actions>
      ) : (
        <BlockedHint>
          La creación de negocios está deshabilitada temporalmente en producción.
        </BlockedHint>
      )}

      <Footnote>
        Al crear tu primer negocio activaremos Demo inicial y luego podrás hacer upgrade desde suscripción.
      </Footnote>
    </Card>
  );
};

export default HomeOnboardingEmptyState;

const Card = styled.section`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  width: 100%;
  padding: 1.35rem;
  margin-top: 0.25rem;
  background:
    radial-gradient(circle at top right, rgb(16 185 129 / 12%), transparent 55%),
    linear-gradient(180deg, #fff, #fbfffd);
  border: 1px solid rgb(15 23 42 / 10%);
  border-radius: 16px;
  box-shadow: 0 10px 24px rgb(15 23 42 / 6%);
`;

const Eyebrow = styled.span`
  display: inline-flex;
  width: fit-content;
  padding: 0.3rem 0.55rem;
  font-size: 0.72rem;
  font-weight: 700;
  color: #065f46;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  background: rgb(16 185 129 / 12%);
  border-radius: 999px;
`;

const Title = styled.h2`
  margin: 0;
  font-size: clamp(1.25rem, 2vw, 1.6rem);
  line-height: 1.15;
  color: #0f172a;
`;

const Description = styled.p`
  margin: 0;
  max-width: 60ch;
  color: #475569;
  line-height: 1.5;
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 0.2rem;
`;

const BaseButton = styled.button`
  min-height: 44px;
  padding: 0.75rem 1rem;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  border-radius: 12px;
  transition:
    transform 120ms ease,
    box-shadow 120ms ease,
    border-color 120ms ease;

  &:hover {
    transform: translateY(-1px);
  }
`;

const PrimaryButton = styled(BaseButton)`
  color: #fff;
  background: #0f766e;
  border: 1px solid #0f766e;
  box-shadow: 0 8px 18px rgb(15 118 110 / 22%);
`;

const Footnote = styled.p`
  margin: 0.2rem 0 0 0;
  font-size: 0.84rem;
  color: #64748b;
`;

const BlockedHint = styled.p`
  margin: 0.1rem 0 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #b45309;
`;
