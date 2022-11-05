import React, { Fragment } from 'react'
import { DeleteProductAlert } from './DeleteProductAlert'
import { DeleteProductFromCartAlert } from './DeleteProductFromCartAlert'
export const AlertHandler = () => {
  return (
    <Fragment>
       <DeleteProductAlert></DeleteProductAlert>
        <DeleteProductFromCartAlert></DeleteProductFromCartAlert>
    </Fragment>
  )
}

