import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { PropsWithChildren, ReactNode } from 'react';
import styled from 'styled-components';

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

const PageWrapper = styled.div`
  min-height: 100%;
  padding: 28px 20px 36px;
  background:
    radial-gradient(circle at 0 0, rgb(14 165 233 / 8%), transparent 30%),
    radial-gradient(circle at 100% 100%, rgb(15 23 42 / 9%), transparent 35%),
    #f8fafc;
`;

const Container = styled.div`
  display: grid;
  gap: 18px;
  max-width: 1080px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  gap: 12px;
  align-items: start;
  justify-content: space-between;
  flex-wrap: wrap;
`;

const HeaderLeft = styled.div`
  display: grid;
  gap: 4px;
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;

const NavigationSlot = styled.div`
  display: grid;
`;

const Title = styled.h2`
  margin: 0;
  color: #0f172a;
  font-size: 1.5rem;
  line-height: 1.3;
`;

const Description = styled.p`
  margin: 0;
  color: #475569;
  font-size: 0.95rem;
  line-height: 1.5;
  max-width: 56ch;
`;

const StatusBadge = styled.span<{ $bg: string; $color: string }>`
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  background: ${(p) => p.$bg};
  color: ${(p) => p.$color};
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.02em;
`;

const BackButton = styled.button`
  width: fit-content;
  min-height: 32px;
  padding: 0 12px;
  border: 1px solid rgb(148 163 184 / 22%);
  border-radius: 999px;
  background: rgb(255 255 255 / 80%);
  color: #334155;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;

  &:hover {
    background: #fff;
    border-color: #94a3b8;
  }
`;
