// @ts-nocheck
import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const CardComponent = ({ data, ...rest }, ref) => {
  const { title, route, description, icon } = data;
  const path = route || '#';
  return (
    <Container to={path} ref={ref} {...rest}>
      <Head>
        <Icon>{icon}</Icon>
        <Title>{title}</Title>
      </Head>
      <CardWrapper>
        <Description>{description}</Description>
      </CardWrapper>
    </Container>
  );
};

export const Card = React.forwardRef(CardComponent);
Card.displayName = 'SettingCard';

const Head = styled.div`
  display: flex;
  gap: 0.6em;
`;
const Container = styled(Link)`
  padding: 16px;
  color: #333;
  scroll-margin-top: 120px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 10%);
  transition:
    box-shadow 0.25s ease,
    transform 0.25s ease;

  &:hover {
    color: #333;
    text-decoration: none;
    transform: translateY(-2px);
  }

  &.search-highlight {
    box-shadow: 0 0 0 3px var(--primary-color, #1677ff);
    transform: translateY(-2px);
  }
`;
const CardWrapper = styled.div`
  color: #333;
  background-color: #fff;
`;

const Title = styled.span`
  display: block;
  margin-bottom: 6px;
  font-size: 16px;
  font-weight: 600;
`;

const Description = styled.p`
  display: block;
  font-size: 14px;
  color: #666;
`;

const Icon = styled.div`
  margin-right: 8px;
  font-size: 20px;
`;
