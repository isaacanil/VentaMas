import React, { useEffect, useState } from 'react'
import { createUser, getUsers } from './firebase/firebaseconfig'
import { ButtonWithMessage } from './views/templates/system/Button/ButtonWithMenssage'

export const FreeSpace = () => {
    const [users, setUsers] = useState([])
    const [rol, setRol] = useState()

   useEffect(() => {getUsers(setUsers)}, [])

   console.log('usuario:', users, 'rol:', rol)

   const rolesList = [
    {rol: {name: 'admin'}},
    {rol: {name: 'readOnly'}}
   ]
  return (
    <div>
      FreeSpace
      {/* <select name="" id="" onChange={(e)=>setRol(e.target.value)}>
        {rolesList.map(({rol})=>(
          <option value={rol.name}>{rol.name}</option>
        ))}
      </select>
      <div>
      Hola

      </div>
      <div>
      {
        users.length > 0 ? (
          users.map(({user}, index)=>(
            <li key={index}>
              <div>
              {user.name}
              </div>
              <div>
              {user.rol.name}
              </div>
            </li>
          ))
        ) : null
      }
      </div>
      <button onClick={() => createUser(rol)}>crear</button> */}
      <ButtonWithMessage>Hola</ButtonWithMessage>
    </div>
  )
}
