import React from 'react'
import { RequireAuth } from '../views'

const validateRouteAccess = (children) => {
  return (
    <RequireAuth>
        {children}
    </RequireAuth>
  )
}

export default validateRouteAccess
