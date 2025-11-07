import type { JSX, MouseEvent, ReactNode } from 'react';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import styled, { css } from 'styled-components';

import { toggleDeveloperModal } from '../../../../../features/modals/modalSlice';

export type FeatureCardData = {
  id?: number | string;
  title: string;
  icon: ReactNode;
  route?: string;
  action?: string;
  category: string;
  [key: string]: unknown;
};

type FeatureCardProps = {
  card: FeatureCardData;
};

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
    return <ActionContainer onClick={handleClick}>{CardContent}</ActionContainer>;
  }

  // Si tiene una ruta, usar Link
  return <Container to={card.route}>{CardContent}</Container>;
};

const FeatureCardIcon = styled.div`
    font-size: 1.3em;
    width: 1.3em;
    height: 1.3em;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #0086df;
    transition: color 0.2s ease-in-out;
    flex-shrink: 0;
`;

const FeatureCardTitle = styled.span`
    color: #2c3e50;
    font-size: 0.95em;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: color 0.2s ease-in-out;
    flex: 1;
`;

const cardBaseStyles = css`
    border-radius: 8px;
    background-color: #fff;
    min-height: 3em;
    border: 1px solid #eaeaea;
    width: 100%;
    padding: 0.6em 1em;
    display: flex;
    align-items: center;
    gap: 0.8em;
    text-decoration: none;
    transition: background-color 0.2s ease-in-out, border-color 0.2s ease-in-out;
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
