import { Form, Input } from 'antd';
import styled from 'styled-components';
import type { TextAreaProps } from 'antd/es/input';
import type { ReactNode } from 'react';

interface CommentsProps extends TextAreaProps {
  icon?: ReactNode;
  label?: string;
}

export const Comments: React.FC<CommentsProps> = ({ icon, label, ...props }) => {
  return (
    <Container>
      <FormItemStyled
        label={label}
        colon={false}
        labelCol={{ span: 24 }}
        wrapperCol={{ span: 24 }}
      >
        <Input.TextArea
          placeholder="Escribe aquí ..."
          autoSize={{ minRows: 2, maxRows: 10 }}
          {...props}
        />
        {icon}
      </FormItemStyled>
    </Container>
  );
};

const Container = styled.div`
  padding: 0.4em;
  background-color: white;
  border: var(--border-primary);
  border-radius: 0.5em;
`;
const FormItemStyled = styled(Form.Item)`
  display: flex;
  flex: 1;
  flex-direction: column;
  margin: 0;

  .ant-form-item-label {
    display: block;
    padding: 0;
    margin-bottom: 4px;
    text-align: left;
  }

  .ant-form-item-label > label {
    height: auto;
  }

  .ant-form-item-control {
    width: 100%;
  }
`;
