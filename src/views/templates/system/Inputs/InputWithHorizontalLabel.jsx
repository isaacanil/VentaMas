import { InputNumber } from 'antd';
import styled from 'styled-components';

import { FormattedValue } from '../FormattedValue/FormattedValue';

export const InputWithHorizontalLabel = ({ label = null, ...props }) => {
  return (
    <Container label={label}>
      {label && (
        <FormattedValue
          size={'small'}
          type={'title'}
          {...props}
          value={label}
        />
      )}
      <InputNumber prefix="$" {...props} style={{ width: '100%' }} />
    </Container>
  );
};
const Container = styled.div`
  display: grid;
  align-items: center;
  align-content: center;
  padding: 0 0.4em;
  gap: 1em;
  ${(label) =>
    label &&
    `
        grid-template-columns: 10em 1fr;
    `}
`;
