import React from 'react'
import styled from 'styled-components'
import { InputV4 } from '../../../../../templates/system/Inputs/GeneralInput/InputV4'

export const Body = ({ user, setUser }) => {

  return (
    <Component>
      <InputV4
        label='Nombre de Usuario'
        value={user.name}
        onChange={e => setUser({ ...user, name: e.target.value })}
      />
      <InputV4
        label='Password'
        type='password'
        value={user.password}
        onChange={e => setUser({ ...user, password: e.target.value })}
      />
    </Component>
  )
}

const Component = styled.div`
    display: grid;
    gap: 0.8em;
`