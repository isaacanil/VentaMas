import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../'
export const Welcome = () => {
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
