import React from 'react'
import { RequireAuth } from '../views'
import { inspectUserAccess } from '../hooks/abilities/useAbilities';

const validateRouteAccess = (children) => {
  
  return (
      <RequireAuth>
        {children}
      </RequireAuth>
  )
}

export default validateRouteAccess
