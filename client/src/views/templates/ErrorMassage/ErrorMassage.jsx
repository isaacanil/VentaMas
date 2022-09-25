import React,{Fragment} from 'react'
import Style from './ErrorMassage.module.scss'
export const ErrorMessage = (props) => {
  return (
    <Fragment>
      <label htmlFor="" className={Style.Danger}>{props.text}</label>
    </Fragment>
  )
}

