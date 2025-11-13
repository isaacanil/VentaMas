import React from 'react';
import styled from 'styled-components';

export const StatusIndicatorDot = ({ color }) => {
  return <Container color={color}></Container>;
};
const Container = styled.div`
  width: 1.2em;
  height: 0.6em;
  background-color: ${(props) => props.color};
  border-radius: 10px;
`;
