import { Form } from 'antd';
import styled from 'styled-components';

export const Container = styled.div`
  padding: 0;
`;

export const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 0.5em;
`;

export const Row = styled.div`
  display: grid;
  grid-template-columns: min-content repeat(auto-fit, minmax(170px, 1fr));
  gap: 0.6em;
`;

export const Items = styled.div`
  display: grid;
  gap: 1em;
`;

export const FormItem = styled(Form.Item)`
  .ant-form-item-label {
    padding: 0;
  }

  margin: 0;

  svg {
    font-size: 1.2em;
    color: #414141;
  }
`;
