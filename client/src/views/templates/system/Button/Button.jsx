
import styled from 'styled-components'

export const Button = ({type, bgcolor, color, title, startIcon, endIcon, onClick, width, variant, disabled, borderRadius }) => {
  
    return (
      <Container 
        bgcolor={bgcolor}
        color={color}
        onClick={onClick}
        width={width}
        variant={variant}
        disabled={disabled}
        borderRadius={borderRadius}
        >
          {startIcon ? startIcon : null}
          {title ? title : null}
          {endIcon ? endIcon : null}
      </Container>
    )
}

export const Container = styled.button`
  //border
  border-radius: 100px;
  border: 1px solid #00000030;
  height: 2em;
  display: flex;
  align-items: center;
  white-space: nowrap;
  gap: 0.4em;
  padding: 0 0.6em;
  //container
  //background-color: #2a2b2b;
  svg{
    font-size: 1.2em;
    margin: 0;
  }
  //padding
  
  //contain

  /*font */
  color: black;
  font-size: 1em;
  font-weight: 500;
  font-family: inherit;
 
  cursor: pointer;
  transition: border-color 0.25s;
  
  &:hover{
    background-color: #d6d6d6;
    backdrop-filter: opacity(10);
    color: black;
  }
  &:focus, &:focus-visible{
    outline: 4px auto -webkit-focus-ring-color;
  }
 ${(props) => {
  switch (props.borderRadius) {
    case 'normal':
      return`
        border-radius: 10px;
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
            background-color: #8d8d8d;
            color: white;
            
           
           
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
            case "op1":
        return `
        background-color: rgba(0, 0, 0, 0.200);
        color: white;
        &:hover{
                background-color: #4589d8;
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
      case "100":
        return `
           width: 100%;
          `;
      case "auto":
        return `
              width: auto;
            `
      case "icon32":
        return`
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
        return`
          min-width: 27px;
          max-width: 27px;
          max-height: 27px;
          min-height: 27px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
        `
      default:
        return `
            width: auto;
          `
    }
  }}
   ${(props) => {
    switch (props.height) {
      case "small":
        return `
           height: 1.6em;

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
    switch (props.disabled) {
      case true:
        return `
           opacity: 0.4;
           cursor: not-allowed;
           pointer-events: none;
          `;
      case false:
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
    switch (props.isActived) {
      case 'true':
        return`
          background-color: #e9e9e9;
          color: black;
        `
      case 'false':
        return`
          background-color: rgba(0, 0, 0, 0.26);
          color: white;
        `
      default:
        break;
    }
  }}
  
  
`
export const ButtonGroup = styled.div`
  display: flex;
  gap: 1em;
`

