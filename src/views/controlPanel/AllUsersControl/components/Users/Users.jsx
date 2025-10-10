import * as antd from 'antd'
import React, { useEffect, useState } from 'react'

import { fbGetUser } from '../../../../../firebase/Auth/fbGetUser'
import { MenuApp } from '../../../../templates/MenuApp/MenuApp';

import { TableUser } from './TableUser'

const { Table, Button, Input } = antd
export const Users = () => {
  const [users, setUsers] = useState([])
  useEffect(() => {
    fbGetUser().then((res) => {
      setUsers(res)
    })
  }, [])
  return (
    <div>
      <MenuApp sectionName={"Usuarios"} />
      <TableUser users={users} />
    </div>
  )
}
