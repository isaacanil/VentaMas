import React from 'react'
import { Button } from './Button'
export const SubmitButton = ({title, isReady}) => {
    let btn;
   
    isReady ? (
        <Button title={title} disabled /> 
    ) : <Button title={title} />

  return (
    {btn}
  )
}
