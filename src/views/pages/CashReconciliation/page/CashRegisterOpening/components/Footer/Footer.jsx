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
  bottom: 0;
  padding: 0.4em;
  background-color: #ffffff96;
  border: var(--border-primary);

  /* position: absolute;
      bottom: 4px;
      right: 0; */
  border-radius: var(--border-radius);
  backdrop-filter: blur(5px);
`;
