import React from 'react';
import styled from 'styled-components';

import { ConfirmCancelButtons } from '../../../../resource/ConfirmCancelButtons/ConfirmCancelButtons';

export const Footer = ({ onSubmit, onCancel }) => {
  return (
    <Container>
      <ConfirmCancelButtons onSubmit={onSubmit} onCancel={onCancel} />
    </Container>
  );
};
const Container = styled.div`
  position: sticky;
  bottom: 2px;
  z-index: 1000;
  padding: 0.4em;
  background-color: white;
  border: var(--border-primary);
  border-radius: var(--border-radius);
`;
