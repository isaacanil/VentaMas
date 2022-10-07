import React from 'react'

export const FloatingMessage = ({title, children}) => {
  return (
    <abbr title={title}>
        {children}
    </abbr>
  )
}
