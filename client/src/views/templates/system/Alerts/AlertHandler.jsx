import React, { Fragment } from 'react'
import { DeleteClientAlert } from './DeleteClientAlert'

import { DeleteProductFromCartAlert } from './DeleteProductFromCartAlert'
export const AlertHandler = () => {
  return (
    <Fragment>
       {/* <DeleteProductAlert></DeleteProductAlert> */}
       <DeleteClientAlert></DeleteClientAlert>
      {/* <DeleteProductFromCartAlert></DeleteProductFromCartAlert> */}
    </Fragment>
  )
}

