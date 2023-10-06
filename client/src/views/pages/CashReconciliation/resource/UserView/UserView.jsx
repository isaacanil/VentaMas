import React from 'react'
import styled from 'styled-components'
import { InputV4 } from '../../../../templates/system/Inputs/GeneralInput/InputV4'
import { icons } from '../../../../../constants/icons/icons'
import { FormattedValue } from '../../../../templates/system/FormattedValue/FormattedValue'
export const UserView = ({user, user2, label='Entregado por', label2='', title}, ) => {
  return (
    <Container>
      {title && <FormattedValue value={title} size={'small'} type={'title'} />}
        <Group>
            <InputV4 disabled label={label} value={user?.name} />
            <Icon>
                {icons.user.userCheck}
            </Icon>
        </Group>
{
    user2 && (
        <Group>
            <InputV4 disabled label={label2} value={user2?.name} />
            <Icon>
                {icons.user.userCheck}
            </Icon>
        </Group>
    )
}
    </Container>
  )
}
 const Container = styled.div`
    padding: 0.4em;
    background-color: white;
    border-radius: var(--border-radius);
    border: var(--border-primary);
    display: grid;
    gap: 0.4em;

 `
 
 const Group = styled.div`
    display: grid;
    grid-template-columns: 1fr min-content;
    gap: 0.4em;
 `
 const Icon = styled.div`
    width: 2em;
    height: 2em;
    align-self: end;
    display: flex;
    align-items: center;
    justify-content: center;

 `