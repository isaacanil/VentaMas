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
        <h2>VENTAMAX</h2>
        <p>
        "Nos complace presentarte nuestro nuevo software de punto de venta. Estamos seguros de que te ayudará a optimizar y mejorar la gestión de tu negocio. Además, nuestro equipo de atención al cliente está a tu disposición para brindarte toda la ayuda que necesites. ¡No pierdas más tiempo y prueba nuestro software hoy mismo!".
        </p>
        <p>VENTAMAX es un software que te permite administrar tu negocio desde un solo lugar, puedes manejar las compras y ventas de tu negocio, ademas como aplicación web, podrás utilizarlo desde tu computadora, móvil y tablet.</p>
        <Link to='/login'>Login</Link>
        <br />
        <Link to='/register'>Register</Link>
    </div>
  )
}
