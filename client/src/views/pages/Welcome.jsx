import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Link, useMatch, useNavigate } from 'react-router-dom'
import { Button } from '../'
import { selectUser } from '../../features/auth/userSlice'
export const Welcome = () => {
  const user = useSelector(selectUser)
  const Navigate = useNavigate()
  useEffect(() => {
    if(user){
      Navigate('/app/')
    }
  }, [user])
 
  return (
    <div>
        <h2>VentaMax</h2>
        <p>VENTAMAX es un software que te permite administrar tu negocio desde un solo lugar, puedes manejar las compras y ventas de tu negocio, ademas como aplicación web, podrás utilizarlos desde tu computadora hasta en el móvil.</p>
        <Link to='/login'>Login</Link>
        <br />
        <Link to='/register'>Register</Link>
    </div>
  )
}
