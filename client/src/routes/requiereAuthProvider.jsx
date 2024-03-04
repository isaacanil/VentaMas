import React from 'react'
import { RequireAuth } from '../views'
import { ErrorBoundary } from '../views/pages/ErrorElement/ErrorBoundary'


const validateRouteAccess = (children) => {

  return (
    <ErrorBoundary>
      <RequireAuth>
        {children}
      </RequireAuth>
    </ErrorBoundary>
  )
}

export default validateRouteAccess
