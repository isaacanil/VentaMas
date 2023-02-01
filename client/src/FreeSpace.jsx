import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { colorPalette } from './features/theme/themeSlice'
import { createUser, getUsers } from './firebase/firebaseconfig'
import { ButtonWithMessage } from './views/templates/system/Button/ButtonWithMenssage'
import { Typography } from './views/templates/system/Typografy/Typografy'

export const FreeSpace = () => {
  //   const [users, setUsers] = useState([])
  //   const [rol, setRol] = useState()

  //  useEffect(() => {getUsers(setUsers)}, [])

  //  console.log('usuario:', users, 'rol:', rol)

  //  const rolesList = [
  //   {rol: {name: 'admin'}},
  //   {rol: {name: 'readOnly'}}
  //  ]
  
  const {color} = colorPalette()

  return (
    <div>
      <Typography variant='h1' color={color}>Free Space</Typography>
      {/* <Typography variant='p' color={font2} >Lorem ipsum dolor sit amet consectetur adipisicing elit. Quas in dolore molestiae voluptatem quidem a eligendi, deserunt rem cumque qui necessitatibus distinctio expedita quae minus iusto blanditiis saepe itaque totam?</Typography> */}
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
      {/* <ButtonWithMessage>Hola</ButtonWithMessage> */}
    </div>
  )
}
