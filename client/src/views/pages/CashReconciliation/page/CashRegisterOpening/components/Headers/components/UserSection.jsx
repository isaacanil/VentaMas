import React from 'react'
import { useSelector } from 'react-redux'
import { selectUser } from '../../../../../../../../features/auth/userSlice'

export const UserSection = () => {
    const user = useSelector(selectUser)
  return (
    <div>Usuario: {user?.displayName}</div>
  )
}

