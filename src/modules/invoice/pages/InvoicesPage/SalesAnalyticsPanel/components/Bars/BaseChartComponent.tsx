import React from 'react';
import type { ReactNode } from 'react';
import styled from 'styled-components';
import Typography from '@/components/ui/Typografy/Typografy';

type BaseChartContainerProps = {
  title: ReactNode;
  children: ReactNode;
  height?: string;
};

type ContainerProps = {
  $height: string;
};

const reduceHeight = (height: string, offset: number) => {
  const value = Number.parseFloat(height);
  if (!Number.isFinite(value)) {
    return height;
  }

  const unit = height.replace(String(value), '') || 'px';
  return `${Math.max(value - offset, 0)}${unit}`;
};

export const BaseChartContainer = ({
  title,
  children,
  height = '200px',
}: BaseChartContainerProps) => {
  return (
    <Container $height={height}>
      <TitleContainer>
        <Typography variant="h3">{title}</Typography>
      </TitleContainer>
      <ChartContainer>{children}</ChartContainer>
    </Container>
  );
};

const Container = styled.div<ContainerProps>`
  display: grid;
  gap: 1em;
  height: ${(props: ContainerProps) => props.$height};

  @media (width <= 768px) {
    gap: 0.5em;
    height: ${(props: ContainerProps) => reduceHeight(props.$height, 20)};
  }

  @media (width <= 480px) {
    gap: 0.25em;
    height: ${(props: ContainerProps) => reduceHeight(props.$height, 40)};
  }
`;

const TitleContainer = styled.div`
  @media (width <= 768px) {
    h3 {
      font-size: 1.1em !important;
      text-align: center;
    }
  }

  @media (width <= 480px) {
    h3 {
      font-size: 1em !important;
      line-height: 1.2;
    }
  }
`;

const ChartContainer = styled.div`
  height: 100%;
  overflow: hidden;

  @media (width <= 768px) {
    overflow-x: auto;
  }
`;
