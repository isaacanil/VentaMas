import { Alert as HeroAlert } from '@heroui/react';
import styled from 'styled-components';

import { vmSurfaceBorderStyles } from '../styles';

const VmAlertRoot = styled(HeroAlert)`
  ${vmSurfaceBorderStyles}
`;

export const VmAlert = Object.assign(VmAlertRoot, {
  Root: VmAlertRoot,
  Indicator: HeroAlert.Indicator,
  Content: HeroAlert.Content,
  Title: HeroAlert.Title,
  Description: HeroAlert.Description,
});

export type {
  AlertContentProps as VmAlertContentProps,
  AlertDescriptionProps as VmAlertDescriptionProps,
  AlertIndicatorProps as VmAlertIndicatorProps,
  AlertRootProps as VmAlertProps,
  AlertTitleProps as VmAlertTitleProps,
} from '@heroui/react';
