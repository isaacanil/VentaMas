import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Button, Inventario } from './views'
import { selectUser } from './features/auth/userSlice'
import { fbAddMultiCategories } from './constants/firebase/categories/fbAddMultiCategories'
import { categories } from './constants/firebase/categories/categories'
import { bills } from './constants/firebase/bills/bills'
import { fbAddMultiBills } from './constants/firebase/bills/fbAddMultiBills'


export const FreeSpace = () => {
  const dispatch = useDispatch()

  const [change, setChange] = useState(false)
  const [data, setData] = useState([])
  const handleChange = () => setChange(!change)
 
const user = useSelector(selectUser)
const handleAddMultiProducts = () => {
  fbAddMultiBills(user, bills)
}


  return (
    <div>
      <h1> Agregar los Clients </h1>
      <Button title='Click' onClick={handleAddMultiProducts}></Button>
    
    </div>
  )
}
