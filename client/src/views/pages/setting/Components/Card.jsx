import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { AiOutlineSetting } from 'react-icons/ai';

const CardWrapper = styled(Link)`
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  padding: 16px;
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

const Container = styled(Link)`
  color: #333;
  text-decoration: none;
`;

const LinkWrapper = styled(Container)`
  font-size: 16px;
  margin-top: 16px;
  display: flex;
  align-items: center;
`;

const Icon = styled(AiOutlineSetting)`
  margin-right: 8px;
  font-size: 20px;
`;

export const Card = ({ data }) => {
  const { title, path, description } = data;

  return (
    <CardWrapper  to={path}>
      <Title>{title}</Title>
      <Description>{description}</Description>
    </CardWrapper>
  );
};


