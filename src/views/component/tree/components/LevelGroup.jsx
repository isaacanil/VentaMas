import React from 'react';
import styled from 'styled-components';

const LevelContainer = styled.div`
  display: flex;
  align-items: center;
`;

const LevelIndicator = styled.div`
  width: 15px;
  height: 100%;
  border-right: 1px solid #e0e0e0;
  display: inline-block;
`;


const LevelGroup = ({ level }) => {
  return (
    <LevelContainer>
      {Array(level).fill(null).map((_, index) => (
        <LevelIndicator key={index} />
      ))}
    </LevelContainer>
  );
};

export default LevelGroup;
