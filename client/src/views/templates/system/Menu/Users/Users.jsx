import React, { useEffect, useState } from 'react'
import { TableUser } from './TableUser'
import { fbGetUser } from '../../../../../firebase/Auth/fbGetUser'
import * as antd from 'antd'
const { Table, Button, Input } = antd
export const Users = () => {
    const [users, setUsers] = useState([])
    useEffect(() => {
        fbGetUser().then((res) => {
          setUsers(res)
        })
      }, [])
  return (
    <div>Users
       
        <TableUser users={users}/>
    </div>
  )
}
