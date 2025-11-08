import React, { Fragment } from 'react'
import { useMatch } from 'react-router-dom'

import Style from './ProductControl.module.scss'

export const ControlSearchProduct = () => {

  const matchWithInventory = useMatch('/app/inventario/items')
  const matchWithVenta = useMatch('/app/venta/:id')

  return (
    <Fragment>
      <div className={Style.Container}>
        {
          matchWithVenta ? <Carrusel/> : null
        }
        {
          matchWithInventory ? (
            <Fragment>
              
              
             
            </Fragment>
          ) : null
        }

      </div>


    </Fragment>

  )
}

