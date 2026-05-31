import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { PropsWithChildren, ReactNode } from 'react';
import {
  PageWrapper,
  Container,
  Header,
  HeaderLeft,
  HeaderRight,
  NavigationSlot,
  Title,
  Description,
  StatusBadge,
  BackButton,
} from './SubscriptionShell.styles';

import type { StatusTone } from '../subscription.types';

const TONE_COLORS: Record<StatusTone, { bg: string; text: string }> = {
  green: { bg: '#dcfce7', text: '#166534' },
  orange: { bg: '#ffedd5', text: '#9a3412' },
  red: { bg: '#fee2e2', text: '#991b1b' },
};

interface SubscriptionShellProps extends PropsWithChildren {
  title: string;
  description: string;
  statusLabel: string;
  statusTone: StatusTone;
  onBack: () => void;
  headerAside?: ReactNode;
  navigation?: ReactNode;
}

export const SubscriptionShell = ({
  title,
  description,
  statusLabel,
  statusTone,
  onBack,
  headerAside,
  navigation,
  children,
}: SubscriptionShellProps) => {
  const tone = TONE_COLORS[statusTone];
  const showStatusBadge = statusTone !== 'green';
  const hasHeaderAside = Boolean(headerAside) || showStatusBadge;
  return (
    <PageWrapper>
      <Container>
        <Header>
          <HeaderLeft>
            <BackButton type="button" onClick={onBack}>
              <FontAwesomeIcon icon={faArrowLeft} /> Volver
            </BackButton>
            <Title>{title}</Title>
            <Description>{description}</Description>
          </HeaderLeft>
          {hasHeaderAside ? (
            <HeaderRight>
              {headerAside}
              {showStatusBadge ? (
                <StatusBadge $bg={tone.bg} $color={tone.text}>
                  {statusLabel}
                </StatusBadge>
              ) : null}
            </HeaderRight>
          ) : null}
        </Header>
        {navigation ? <NavigationSlot>{navigation}</NavigationSlot> : null}
        {children}
      </Container>
    </PageWrapper>
  );
};

export default SubscriptionShell;
