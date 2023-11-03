
import { forwardRef, useState } from 'react'
import styled, { css } from 'styled-components'



export const Button = forwardRef(({

  border,
  color = "on-gray",
  title,
  alignText = 'center',
  size = 'small',
  startIcon,
  endIcon,
  onClick,
  width,
  height,
  hidden,
  variant = 'contained',
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
  
  //text
  font-size: 16px;
  font-weight: 500;
  text-align: ${props => props.alignText || 'center'};
  text-decoration: none;
  text-transform: capitalize;   

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
  icon16: `
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    svg{
      font-size: 16px;
    }
  `,
  icon24: `
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
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
      
       opacity: 0.8;
    ` : null}
  }

 
 
  ${props => props.borderRadius && borderRadius[props.borderRadius]}
  ${props => {
    switch (props.variant) {
      case 'contained':
        return `
        ${props.theme?.colors?.[props.color] && `
          background-color: ${props.theme?.colors?.[props.color]["bg"]};
          color: ${props.theme.colors[props.color]["text"]};
          backdrop: blur(10px);
          hover{
            background-color: ${props.theme.colors[props.color]["bg"]};
            color: ${props.theme.colors[props.color]["text"]};
          }
          `
          }
        `
      case 'outlined':
        return `
            background-color: transparent;
            color: ${props.theme.colors[props.color]["bg"]};
            border: 1px solid ${props.theme.colors[props.color]["bg"]};
          `
      case 'text':
        return `
              background-color: transparent;
              color: ${props.theme.colors[props.color]["bg"]};
            `
      case 'textContained':
        return `
              background-color: ${props.theme.colors[props.color]["bg"]};
              color: ${props.theme.colors[props.color]["bg"]};
              border: none;
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
    if (props.disabled) {
      return `
           opacity: 0.4;
           cursor: not-allowed;
           pointer-events: none;
          `;
    }
  }}

  ${(props) => {
    switch (props.isActivatedColors) {
      case 'style1':
        switch (props.isActivated) {
          case true:
            return `
              background-color: ${props.theme.colors[props.color]["bg"]};
              color: ${props.theme.colors[props.color]["text"]};
              :hover{
                background-color: ${props.theme.colors[props.color]["bg"]};
                color: ${props.theme.colors[props.color]["text"]};
              }
            `
          case false:
            return `
              background-color: ${props.theme.colors[props.color]["bg"]};
              color: ${props.theme.colors[props.color]["text"]};
              :hover{
                background-color: ${props.theme.colors[props.color]["bg"]};
                color: ${props.theme.colors[props.color]["text"]};
              }
            `
          default:
            break;
        }
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

