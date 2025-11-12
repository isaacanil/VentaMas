import { Input, Form } from 'antd';
import React from 'react';
import styled from 'styled-components';

import { icons } from '../../../../../constants/icons/icons';
import { FormattedValue } from '../../../../templates/system/FormattedValue/FormattedValue';

export const UserView = ({
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
  padding: 0.4em;
  background-color: white;
  border-radius: var(--border-radius);
  border: var(--border-primary);
  display: grid;
  gap: 0.4em;
`;

const Group = styled.div`
  display: grid;
  grid-template-columns: 1fr min-content;
  gap: 0.4em;
`;

const FormItemStyled = styled(Form.Item)`
  margin: 0;
  flex: 1;
  display: flex;
  flex-direction: column;

  .ant-form-item-label {
    text-align: left;
    padding: 0;
    display: block;
    margin-bottom: 4px;
  }

  .ant-form-item-label > label {
    height: auto;
  }

  .ant-form-item-control {
    width: 100%;
  }
`;

const Icon = styled.div`
  width: 2em;
  height: 2em;
  align-self: end;
  display: flex;
  align-items: center;
  justify-content: center;
`;
