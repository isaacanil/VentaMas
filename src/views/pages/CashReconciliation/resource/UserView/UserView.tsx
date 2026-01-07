import { Input, Form } from 'antd';
import React from 'react';
import styled from 'styled-components';
import { icons } from '@/constants/icons/icons';
import { FormattedValue } from '@/views/templates/system/FormattedValue/FormattedValue';
import type { CashCountEmployee } from '@/utils/cashCount/types';

interface UserViewProps {
  user?: CashCountEmployee | null;
  user2?: CashCountEmployee | null;
  label?: string;
  label2?: string;
  title?: string;
}

export const UserView: React.FC<UserViewProps> = ({
  user,
  user2,
  label = 'Entregado por',
  label2 = '',
  title,
}) => {
  return (
    <Container>
      {title && <FormattedValue value={title} size={'small'} type={'title'} />}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Group>
          <FormItemStyled
            label={label}
            colon={false}
            labelCol={{ span: 24 }}
            wrapperCol={{ span: 24 }}
          >
            <Input readOnly value={user?.name} />
          </FormItemStyled>
          <Icon>{icons.user.userCheck}</Icon>
        </Group>
        {user2 && (
          <Group>
            <FormItemStyled
              label={label2}
              colon={false}
              labelCol={{ span: 24 }}
              wrapperCol={{ span: 24 }}
            >
              <Input readOnly value={user2?.name} />
            </FormItemStyled>
            <Icon>{icons.user.userCheck}</Icon>
          </Group>
        )}
      </div>
    </Container>
  );
};

const Container = styled.div`
  display: grid;
  gap: 0.4em;
  padding: 0.4em;
  background-color: white;
  border: var(--border-primary);
  border-radius: var(--border-radius);
`;

const Group = styled.div`
  display: grid;
  grid-template-columns: 1fr min-content;
  gap: 0.4em;
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

const Icon = styled.div`
  display: flex;
  align-items: center;
  align-self: end;
  justify-content: center;
  width: 2em;
  height: 2em;
`;
