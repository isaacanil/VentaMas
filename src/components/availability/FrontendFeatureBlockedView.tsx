import type { JSX } from 'react';

import {
  Actions,
  Card,
  Description,
  Eyebrow,
  PrimaryLink,
  SecondaryLink,
  Shell,
  Title,
} from './FrontendFeatureBlockedView.styles';

export interface FrontendFeatureBlockedViewProps {
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
