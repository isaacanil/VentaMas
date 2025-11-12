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
`
const Container = styled(Link)`
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  padding: 16px;
  color: #333;
  transition: box-shadow 0.25s ease, transform 0.25s ease;
  scroll-margin-top: 120px;
  :hover{
    text-decoration: none;
    color: #333;
    transform: translateY(-2px);
  }

  &.search-highlight {
    box-shadow: 0 0 0 3px var(--primary-color, #1677ff);
    transform: translateY(-2px);
  }

`;
const CardWrapper = styled.div`
  background-color: #fff;
 
  color: #333;
  
`;

const Title = styled.span`
  font-size: 16px;
    font-weight: 600;
  margin-bottom: 6px;
    display: block;

`;

const Description = styled.p`
  font-size: 14px;
    display: block;
    color: #666;
`;





const Icon = styled.div`
  margin-right: 8px;
  font-size: 20px;
`;
