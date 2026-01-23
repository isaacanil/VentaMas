import styled from 'styled-components';

import type { ReactNode } from 'react';

interface CardWithPercentProps {
  title: string;
  icon: ReactNode;
  number: number | string;
}

export const CardWithPercent = ({
  title,
  icon,
  number,
}: CardWithPercentProps) => {
  return (
    <Container>
      <Head>
        <Title>{title}</Title>
        <Percent>{'10%'}</Percent>
      </Head>
      <Body>
        <Icon>{icon}</Icon>
        <Number>{number}</Number>
      </Body>
    </Container>
  );
};
const Container = styled.div``;
const Head = styled.div``;
const Title = styled.div``;
const Percent = styled.div``;
const Body = styled.div``;
const Icon = styled.div``;
const Number = styled.div``;
