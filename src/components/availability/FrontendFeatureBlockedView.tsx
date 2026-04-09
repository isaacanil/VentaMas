import { Link } from 'react-router-dom';
import styled from 'styled-components';

import type { JSX } from 'react';

interface FrontendFeatureBlockedViewProps {
  eyebrow: string;
  title: string;
  description: string;
  primaryTo: string;
  primaryLabel: string;
  secondaryTo?: string;
  secondaryLabel?: string;
}

export const FrontendFeatureBlockedView = ({
  eyebrow,
  title,
  description,
  primaryTo,
  primaryLabel,
  secondaryTo,
  secondaryLabel,
}: FrontendFeatureBlockedViewProps): JSX.Element => (
  <Shell>
    <Card>
      <Eyebrow>{eyebrow}</Eyebrow>
      <Title>{title}</Title>
      <Description>{description}</Description>
      <Actions>
        <PrimaryLink to={primaryTo}>{primaryLabel}</PrimaryLink>
        {secondaryTo && secondaryLabel ? (
          <SecondaryLink to={secondaryTo}>{secondaryLabel}</SecondaryLink>
        ) : null}
      </Actions>
    </Card>
  </Shell>
);

export default FrontendFeatureBlockedView;

const Shell = styled.main`
  display: grid;
  min-height: 100vh;
  padding: 24px;
  place-items: center;
  background:
    radial-gradient(circle at top, rgb(15 118 110 / 10%), transparent 40%),
    linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%);
`;

const Card = styled.section`
  display: grid;
  gap: 14px;
  width: min(100%, 640px);
  padding: 28px;
  background: rgb(255 255 255 / 88%);
  border: 1px solid rgb(15 23 42 / 10%);
  border-radius: 24px;
  box-shadow: 0 24px 60px rgb(15 23 42 / 10%);
  backdrop-filter: blur(12px);
`;

const Eyebrow = styled.span`
  font-size: 0.75rem;
  font-weight: 800;
  color: #0f766e;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const Title = styled.h1`
  margin: 0;
  font-size: clamp(1.8rem, 3vw, 2.4rem);
  line-height: 1.05;
  color: #0f172a;
`;

const Description = styled.p`
  margin: 0;
  font-size: 1rem;
  line-height: 1.6;
  color: #475569;
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 8px;
`;

const BaseLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0.75rem 1rem;
  font-weight: 700;
  text-decoration: none;
  border-radius: 12px;
`;

const PrimaryLink = styled(BaseLink)`
  color: #fff;
  background: #0f766e;
  box-shadow: 0 12px 28px rgb(15 118 110 / 24%);
`;

const SecondaryLink = styled(BaseLink)`
  color: #0f172a;
  background: #fff;
  border: 1px solid rgb(15 23 42 / 12%);
`;
