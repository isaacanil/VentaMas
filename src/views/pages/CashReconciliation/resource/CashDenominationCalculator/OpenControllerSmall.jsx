import React from 'react';
import styled from 'styled-components';

import { icons } from '../../../../../constants/icons/icons';

export const OpenControllerSmall = ({ isExpanded, onClick }) => {
  return (
    <Container onClick={onClick}>
      {isExpanded ? icons.arrows.chevronUp : icons.arrows.chevronDown}
    </Container>
  );
};
const Container = styled.div``;
