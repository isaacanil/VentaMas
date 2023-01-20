import React, { useEffect, useState } from 'react'
import { getUsers } from './firebase/firebaseconfig'

export const FreeSpace = () => {
    const [user, setUser] = useState()
   useEffect(() => {setUser(getUsers)}, [])
   console.log(user)
  return (
    <div>FreeSpace</div>
  )
}
