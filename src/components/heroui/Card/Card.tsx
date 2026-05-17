import { Card as HeroCard } from '@heroui/react';
import styled from 'styled-components';

import { vmSurfaceBorderStyles } from '../styles';

const VmCardRoot = styled(HeroCard)`
  ${vmSurfaceBorderStyles}
`;

export const VmCard = Object.assign(VmCardRoot, {
  Root: VmCardRoot,
  Header: HeroCard.Header,
  Title: HeroCard.Title,
  Description: HeroCard.Description,
  Content: HeroCard.Content,
  Footer: HeroCard.Footer,
});

export type {
  CardContentProps as VmCardContentProps,
  CardDescriptionProps as VmCardDescriptionProps,
  CardFooterProps as VmCardFooterProps,
  CardHeaderProps as VmCardHeaderProps,
  CardRootProps as VmCardProps,
  CardTitleProps as VmCardTitleProps,
} from '@heroui/react';
