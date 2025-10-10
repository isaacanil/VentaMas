import React from 'react'
import { useDispatch } from 'react-redux'
import { Outlet } from 'react-router-dom'




export const Lab = () => {
  const dispatch = useDispatch()


  return (
    <div>

      <Outlet/>
    </div>
  )
}
