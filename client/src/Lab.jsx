import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Outlet } from 'react-router-dom'
import Typography from './views/templates/system/Typografy/Typografy'



export const Lab = () => {
  const dispatch = useDispatch()


  return (
    <div>

      <Outlet/>
    </div>
  )
}
