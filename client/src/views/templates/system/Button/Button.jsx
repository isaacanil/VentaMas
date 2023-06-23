
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { Tooltip } from './Tooltip'


export const Button = ({
  bgcolor,
  border,
  color,
  title,
  startIcon,
  endIcon,
  onClick,
  width,
  height,
  variant,
  disabled,
  borderRadius,
  isActivated,
  isActivatedColors,
  iconOn,
  iconOff,
  iconColor,
  titlePosition,
  tooltipDescription,
  tooltipPlacement,

}) => {
  const handleClick = (e) => {
    e.stopPropagation()
    onClick()
  }
  return (
    <Tooltip
    placement={tooltipPlacement}
    description={tooltipDescription}
      Children={
        <Container
          bgcolor={bgcolor}
          color={color}
          onClick={onClick && handleClick}
          width={width}
          height={height}
          variant={variant}
          disabled={disabled}
          borderRadius={borderRadius}
          isActivated={isActivated}
          titlePosition={titlePosition}
          border={border}
          iconColor={iconColor}
          isActivatedColors={isActivatedColors}
        >

          {isActivated ? iconOn : iconOff}
          {startIcon ? startIcon : null}
          {title ? title : null}
          {endIcon ? endIcon : null}

        </Container>
      } />


  )
}

export const Container = styled.button`
  //border
  border-radius: 100px;
  outline: none;
  border: none;
  height: 30px;
  display: flex;
  align-items: center;
  white-space: nowrap;
  gap: 0.4em;
  padding: 0 0.8em;
  outline: none;
  color: black;
  font-weight: 500;
  font-size: 14px;
  
  pointer-events: all;
  font-family: inherit;
  svg{
    font-size: 1.2em;
    margin: 0;
  }
  cursor: pointer;
  transition: border-color 0.25s;
  
  &:hover{
    ${props => !props.isActivated ? `
      background-color: #d6d6d6;
      backdrop-filter: opacity(10);
    ` : null}
  }
  &:focus, &:focus-visible{
    outline: none;
  }
 
  transition: background-color 500ms;
  ${(props) => {
    switch (props.titlePosition) {
      case 'center':
        return `
          justify-content: center;
        `

      default:
        break;
    }
  }}

 ${(props) => {
    switch (props.borderRadius) {
      case 'normal':
        return `
        border-radius: var(--border-radius);
      `
      case 'light':
        return `
        border-radius: var(--border-radius-light);
      `
      default:
        break;
    }
  }}
 ${(props) => {
    switch (props.bgcolor) {
      case "error":
        return `
            background-color: #d34343;
            color: white;
            Justify-content: center;
            &:hover{
              background-color: #b10505;
              color: white
            }
          `
      case "success":
        return `
            background-color: ##B2DFDB;
            color: #636363;
            &:hover{
              background-color: #B2DFDB;
              color: white
            }
          `
      case "black":
        return `
        background-color: #020202;
            color: white;      
            &:hover{
              background-color: #1f1f1f;
              color: white
            }
          
        `
      case "dark":
        return `
          background-color: #2a2b2b;
          color: white;
          &:hover{
            background-color: #1f1f1f;
            color: white
          }
          `
      case "gray":
        return `
            background-color: var(--White3);
            color: var(--font-color-dark-slightly);
            :hover{
             color: var(--font-color-dark-slightly);
            }
            
           
          `
      case "primary":
        return `
        background-color: #42a5f5;
        color: white;
        &:hover{
                background-color: #4589d8;  
              color: white
            }
            `
      case "warning":
        return `
        background-color: var(--color-warning);
        color: white;
        :hover{
          background-color: #f5a742;
        }
        `
      case "op1":
        return `
        background-color: rgba(0, 0, 0, 0.200);
        color: white;
        &:hover{
                background-color: #bdbdbd;
                outline: none;      
              color: white
            }
            `
      default:
        return `
            background-color: white;
          `
    }
  }} 
  ${(props) => {
    switch (props.width) {
      case "w100":
        return `
        
        width: 100% !important;
        
          `;
      case "auto":
        return `
              width: auto;
            `
      case "icon32":
        return `
          min-width: 32px;
          max-width: 32px;
          min-height: 32px;
          max-height: 32px;
          display: grid;
          align-items: center;
          justify-content: center;
          padding: 0;
          margin: 0;
          font-size: 18px;
        `
      case "icon24":
        return `
          min-width: 27px;
          max-width: 27px;
          max-height: 27px;
          min-height: 27px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
        `
    }
  }}
   ${(props) => {
    switch (props.height) {
      case "small":
        return `
           height: 24px;
           display: flex;
           align-items: center;
           padding: 0 0.4em;

          `;

    }
  }}
   ${(props) => {
    switch (props.border) {
      case "light":
        return `
          border: var(--border-primary);

          `;

    }
  }}
   ${(props) => {
    switch (props.variant) {
      case "contained":
        return `
           outline: none;
            border: none;
            padding: 0;
            background-color: transparent;
            &:hover{
              background-color: transparent;
            }

          `;
      case "auto":
        return `
              width: auto;
            `
      default:
        return `
            width: auto;
          `
    }
  }}
   ${(props) => {
    switch (props.color) {
      case "gray-dark":
        return `
           color: #4b4b4b;

          `
      case "primary":
        return `
          color: #1768c4;
            :hover{
              color: #1768c4;
            }

        `
      case "danger":
        return `
          color: #cf1616;
            :hover{
              color: #c41d17;
            }

        `


      default:
        return
    }
  }}
  ${(props) => {
    switch (props.disabled) {
      case true:
        return `
           opacity: 0.4;
           cursor: not-allowed;
           pointer-events: none;
          `;
      case 'style1':
        return `
          background-color: var(--color);
          color: var(--White);
          cursor: not-allowed;
          pointer-events: none;
          `
      case false:
        return `
            
            `
      default:
        return `
           
          `
    }
  }}
  /* ${(props) => {
    switch (props.isActivated) {
      case true:
        return `
          background-color: #ffffff;
          color: black;
          :hover{
            background-color: #e9e9e9;
            color: black;
          }
        `
      case false:
        return `
          background-color: rgba(0, 0, 0, 0.26);
          color: white;
          :hover{
            background-color: #e9e9e94b;
            color: black;
          }
        `
      case props.isActivated:
        return `
          background-color: ${props.isActivated};
        `
      default:
        break;
    }
  }} */
  ${(props) => {
    switch (props.isActivatedColors) {
      case 'style1':
        return `
        ${props.isActivated === true ? `
        background-color: #ffffff;
          color: black;
          :hover{
            background-color: #e9e9e9;
            color: black;
          }
        ` : `
        background-color: rgba(0, 0, 0, 0.26);
          color: white;
          :hover{
            background-color: #e9e9e94b;
            color: black;
          }
        `}
         
        `
      case false:
        return `
          background-color: rgba(0, 0, 0, 0.26);
          color: white;
      
        `
      case props.isActivated:
        return `
          background-color: ${props.isActivated};
        `
      default:
        break;
    }
  }}
  
  
`
export const ButtonGroup = styled.div`
  display: flex;
  gap: 0.4em;
`

