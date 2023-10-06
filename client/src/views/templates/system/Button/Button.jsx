
import { forwardRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled, { css } from 'styled-components'
import { Tooltip } from './Tooltip'
import { useWindowWidth } from '../../../../hooks/useWindowWidth'


export const Button = forwardRef(({
  bgcolor,
  border,
  color,
  title,
  alignText = 'center',
  size = 'small',
  startIcon,
  endIcon,
  onClick,
  width,
  height,
  hidden,
  variant,
  disabled,
  borderRadius = 'normal',
  isActivated,
  isActivatedColors,
  iconOn,
  iconOff,
  iconColor,
  titlePosition,
  type = 'button'

}, ref) => {
  const handleClick = (e) => {
    e.stopPropagation()
    onClick()
  }

  return (
    <Container
      size={size}
      bgcolor={bgcolor}
      color={color}
      onClick={onClick && handleClick}
      width={width}
      height={height}
      variant={variant}
      disabled={disabled}
      type={type}
      borderRadius={borderRadius}
      isActivated={isActivated}
      titlePosition={titlePosition}
      border={border}
      iconColor={iconColor}
      isActivatedColors={isActivatedColors}
      hidden={hidden}
      alignText={alignText}
      ref={ref}
    >
      {isActivated ? iconOn : iconOff}
      {startIcon ? startIcon : null}
      {title ? title : null}
      {endIcon ? endIcon : null}
    </Container>
  )
});
const styleByDefault = css`
  //align
  display: flex;
  align-items: center;
  justify-content: ${props => props.alignText || 'center'};
  gap: 0.6em;

  //color
  color: black;
  
  //text
  font-size: 16px;
  font-weight: 500;
  text-align: ${props => props.alignText || 'center'}};
  text-decoration: none;
  text-transform: capitalize;
  line-height: -10px;
  white-space: nowrap;

  //border
  border: none;
  outline: none;

  //cursor
  cursor: pointer;

  //svg
  svg{
    font-size: 1.2em;
    margin: 0;
  }

  //transition
  transition: border-color 0.25s, background-color 500ms;

  //other
  pointer-events: all;

  &:focus, &:focus-visible{
    outline: none;
  }
`
const sizes = {
  small: `
    height: 2em;
    padding: 0 0.4em;
  `,
  medium: `
    height: 2.2em;
    font-size: 16px;
    padding: 0 0.8em;
  `,
  large: `
    height: 2.4em;
    font-size: 16px;
    padding: 0 0.8em;
  `,
  icon24: `
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    svg{
      font-size: 18px;
    }
  `,
  icon32: `
    width: 32px;
    height: 32px;
    svg{
      font-size: 20px;
    }
  `,
}
const borderRadius = {
  normal: `
    border-radius: var(--border-radius);
  `,
  light: `
    border-radius: var(--border-radius-light);
  `,
  none: `
    border-radius: 0;
  `,
  round: `
    border-radius: 100px;
  `,
}

export const Container = styled.button`
  ${styleByDefault}
  ${props => props.size ? sizes[props.size] : sizes.medium}
 
  &:hover{
    ${props => !props.isActivated ? `
      background-color: #d6d6d6;
      backdrop-filter: opacity(10);
    ` : null}
  }

 
 
  ${props => props.borderRadius && borderRadius[props.borderRadius]}

 ${(props) => {
    switch (props.bgcolor) {
      case "neutral":
        return `
        background-color: ${props.theme.colors.neutral.light};
        color: ${props.theme.colors.neutral.main};
        &:hover{
          background-color: ${props.theme.colors.neutral.main};
          color: ${props.theme.colors.neutral.light};
        }
        `


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
            background-color: var(--White4);
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
        background-color: var(--color-warning-main);
        
        color: White;
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
        max-width: 100%;
        min-width: 100%;
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
      case "medium":
        return `  
          height: 30px;
          display: flex;
          align-items: center;
          font-size: 16px;
          padding: 0 0.8em;
          `;
      case "large":
        return `
          height: 2em;
          display: flex;
          align-items: center;
          font-size: 16px;
          padding: 0 1.2em;
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

  @media (max-width: 800px) {
    display: ${props => props.hidden === true ? 'none' : 'flex'};
  }
  
`
export const ButtonGroup = styled.div`
  display: flex;
  gap: 0.4em;
  align-items: center;
`

