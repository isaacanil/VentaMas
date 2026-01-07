import styled from 'styled-components';

import { FormattedValue } from '@/views/templates/system/FormattedValue/FormattedValue';

export const CashReconciliationState = () => {
  return (
    <Container>
      <Label>Estado: </Label>
      <State>
        <FormattedValue
          type={'subtitle'}
          size={'small'}
          value={'En proceso de cierre'}
        />
      </State>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  gap: 1em;
  align-items: center;
`;
const Label = styled.span`
  margin-bottom: 0;
  font-size: 13px;
  color: var(--gray5);
`;
const State = styled.div`
  padding: 0.2em 0.6em;
  background-color: #eee094;
  border-radius: var(--border-radius);
`;
