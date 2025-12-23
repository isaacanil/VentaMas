import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import styled, { css } from 'styled-components';

import { toggleDeveloperModal } from '@/features/modals/modalSlice';

import type { JSX, MouseEvent, ReactNode } from 'react';

export interface FeatureCardData {
  id?: number | string;
  title: string;
  icon: ReactNode;
  route?: string;
  action?: string;
  category: string;
  [key: string]: unknown;
}

interface FeatureCardProps {
  card: FeatureCardData;
}

export const FeatureCard = ({ card }: FeatureCardProps): JSX.Element => {
  const dispatch = useDispatch();

  const handleClick = (event: MouseEvent<HTMLDivElement>): void => {
    if (!card.action) return;
    event.preventDefault();

    switch (card.action) {
      case 'openDeveloperModal':
        dispatch(toggleDeveloperModal());
        break;
      default:
        console.warn(`Action not implemented: ${card.action}`);
    }
  };

  const CardContent = (
    <>
      <FeatureCardIcon>{card.icon}</FeatureCardIcon>
      <FeatureCardTitle>{card.title}</FeatureCardTitle>
    </>
  );

  // Si tiene una acción personalizada, usar un div en lugar de Link
  if (card.action || !card.route) {
    return (
      <ActionContainer onClick={handleClick}>{CardContent}</ActionContainer>
    );
  }

  // Si tiene una ruta, usar Link
  return <Container to={card.route}>{CardContent}</Container>;
};

const FeatureCardIcon = styled.div`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 1.3em;
  height: 1.3em;
  font-size: 1.3em;
  color: #0086df;
  transition: color 0.2s ease-in-out;
`;

const FeatureCardTitle = styled.span`
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.95em;
  font-weight: 500;
  color: #2c3e50;
  white-space: nowrap;
  transition: color 0.2s ease-in-out;
`;

const cardBaseStyles = css`
  display: flex;
  gap: 0.8em;
  align-items: center;
  width: 100%;
  min-height: 3em;
  padding: 0.6em 1em;
  text-decoration: none;
  background-color: #fff;
  border: 1px solid #eaeaea;
  border-radius: 8px;
  transition:
    background-color 0.2s ease-in-out,
    border-color 0.2s ease-in-out;
  will-change: background-color, border-color;

  &:hover {
    background-color: #f8f9fa;
    border-color: #0086df;
  }

  &:hover ${FeatureCardTitle} {
    color: #0086df;
  }

  &:hover ${FeatureCardIcon} {
    color: #0086df;
  }
`;

const Container = styled(Link)`
  ${cardBaseStyles}
`;

const ActionContainer = styled.div`
  ${cardBaseStyles}

  cursor: pointer;
`;
