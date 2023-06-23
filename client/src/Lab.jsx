import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Outlet } from 'react-router-dom'



export const Lab = () => {
  const dispatch = useDispatch()


  return (
    <div>
      <Outlet/>
    </div>
  )
}
