import { Button, Form, InputNumber } from 'antd';
import styled from 'styled-components';

export const CardDescription = styled.p`
  margin-bottom: 20px;
  color: #888;
`;

export const FormContainer = styled(Form)`
  display: flex;
  flex-direction: column;
`;

export const StyledButton = styled(Button)`
  width: 100%;
  color: white;
  background-color: #1890ff;

  &:hover {
    background-color: #40a9ff;
  }
`;

export const DimensionInputGroup = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.6em;
`;

export const FullWidthInputNumber = styled(InputNumber)`
  width: 100%;

  input[type='number'] {
    width: 100%;
    max-width: none;
  }
`;
