import React, { useEffect, useState } from 'react'
import { TableUser } from './TableUser'
import { fbGetUser } from '../../../../../firebase/Auth/fbGetUser'
import * as antd from 'antd'
import { MenuApp } from '../../../..'
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
