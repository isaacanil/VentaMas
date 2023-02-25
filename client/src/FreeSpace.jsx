import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import styled from 'styled-components'
import { toggleImageViewer } from './features/imageViewer/imageViewerSlice'
import { toggleLoader } from './features/loader/loaderSlice'
import { addNotification } from './features/notification/NotificationSlice'
import { getData } from './firebase/firebaseconfigClients'
import { ProductsByCategory } from './hooks/ProductsByCategory'
import { SelectDataFromOrder } from './hooks/useSelectDataFromOrder'
import { Button, Inventario } from './views'
import Modal from './views/templates/Modal/Modal'
import { Calendar } from './views/templates/system/DatePicker/Calendar'

import DatePicker from './views/templates/system/DatePicker/DatePicker2'
import DateRangeFilter from './views/templates/system/DatePicker/DateRangeFIlter'
import DateFilter from './views/templates/system/DatePicker/DateRangeFilter2'
import ImageViewer from './views/templates/system/ImageViewer/ImageViewer'
import CustomInput from './views/templates/system/Inputs/CustomInput'
import { Input } from './views/templates/system/Inputs/InputV3'
import Loader from './views/templates/system/loader/Loader'
import { Notification } from './views/templates/system/Notification/Notification'

export const FreeSpace = () => {
  const dispatch = useDispatch()
  const handleGetNotification = () => {
  }
  
  //   const [users, setUsers] = useState([])
  //   const [rol, setRol] = useState()
  const handleLoader = () => {
    console.log('hola')
    dispatch(toggleImageViewer({show: true, url: ''}))
  }
  //dispatch(addNotification({message: 'Hola, que haces?', type: 'success' }))
  //  useEffect(() => {getUsers(setUsers)}, [])

  //  console.log('usuario:', users, 'rol:', rol)

  //  const rolesList = [
  //   {rol: {name: 'admin'}},
  //   {rol: {name: 'readOnly'}}
  //  ]
  const [change, setChange] = useState(false)
  const [data, setData] = useState([])
  const handleChange = () => setChange(!change)
  useEffect(()=>{
    getData(setData)
  }, [])
    console.log(data)
    const handleDateChange = (date) => {
      console.log(date)
    }
  return (
    <div>
      {
        //data.length > 0 ? 'Hola' : 'nada'
        data.map((doc)=>(<li>{doc.name}</li>))
      }
     {/* <Notification/> */}
    <DatePicker></DatePicker>
    {/* <DateRangeFilter></DateRangeFilter> */}
    {/* <Calendar></Calendar> */}
    <DateFilter onChange={handleDateChange}></DateFilter>
     <Button title="Click" borderRadius='normal' onClick={handleLoader}></Button>
       <Square visible={change ? true : false}>
        Lorem ipsum dolor sit, amet consectetur adipisicing elit. Ea sunt eum repellat? Tempore magni illum animi dolorem itaque adipisci, odio explicabo molestiae soluta deleniti officia quam necessitatibus porro numquam ex?
       </Square>
       {/* <Modal children={<Inventario/>}/> */}
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
const Square = styled.div`
  width: 200px;
  height: 200px;
  background-color: #ff5100;
  transition: height 1s ease-in-out ;
  overflow: hidden;
  ${props => {
    switch (props.visible) {
      case false:
        return`
          height: 0px;
        `
    
      default:
        break;
    }
  }}
`