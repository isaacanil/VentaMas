import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { addNotification } from './features/notification/NotificationSlice'
import { selectOrderFilterOptions } from './features/order/ordersSlice'
import { colorPalette } from './features/theme/themeSlice'
import { SelectDataFromOrder } from './hooks/useSelectDataFromOrder'
import { Button } from './views'
import { Notification } from './views/templates/system/Notification/Notification'

export const FreeSpace = () => {
  const dispatch = useDispatch()
  const handleGetNotification = () => {
    dispatch(addNotification({message: 'Hola, que haces?', type: 'success' }))
  }
  //   const [users, setUsers] = useState([])
  //   const [rol, setRol] = useState()

  //  useEffect(() => {getUsers(setUsers)}, [])

  //  console.log('usuario:', users, 'rol:', rol)

  //  const rolesList = [
  //   {rol: {name: 'admin'}},
  //   {rol: {name: 'readOnly'}}
  //  ]



  return (
    <div>
     <Notification/>
     <Button title="Click" borderRadius='normal' onClick={handleGetNotification}></Button>
          
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
