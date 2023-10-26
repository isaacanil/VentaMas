import styled from 'styled-components';
import React from 'react'

export const Container = ({
  variant = 'default',
  children,
  alignItems = 'start',
  overflow = 'none',
  maxWidth = 'full',
  width = 'full',
  maxHeight = 'full',
  height,
  border = 'none',
  bg = "shade",
  display,
  justifyContent = 'start',
  position = 'static',
  borderRadius = 'none',
  positionPlace = 'none',
  ...props
}) => {
  return (

    <Box
      padding={padding}
      maxWidth={maxWidth}
      overflow={overflow}
      height={height}
      width={width}
      maxHeight={maxHeight}
      display={display}
      variant={variant}
      border={border}
      position={position}
      positionPlace={positionPlace}
      borderRadius={borderRadius}
      bg={bg}
      {...props}
    >
      {children}
    </Box>

  )
}


const variants = {
  modal: `
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    padding: 1em;
    border-radius: 8px;
    overflow: hidden;
    display: grid;
    grid-template-rows: min-content 1fr;
    align-items: stretch;
    position: relative;

    
  `,
  sidebar: `
 
  width: 250px;                
  height: 100%;              
  overflow-y: auto;                  
  padding: 1em;               
  border-right: 1px solid #e0e0e0;  

  `,
  card: `
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    background-color: white;
    padding: 0.5em;
    border-radius: 4px;
  `,
  paper: `
    box-shadow: inset 0 0 4px rgba(0, 0, 0, 0.1);
    background-color: white;
    padding: 0.5em;
    border-radius: 4px;
  `,
  content: `
    background-color: #40d821;
    padding: 1em;
    height: 100%;
    overflow-y: auto;
    max-height: 100%;
  `,
  default: `
    background-color: transparent;
    padding: 0em;
    border-radius: none;
  `,
};




const getWidth = {
  xsmall: '360px',
  small: '600px',
  medium: '960px',
  large: '1280px',
  xlarge: '1920px',
  full: '100%',
  auto: 'auto',
  "min-content": "min-content",
};

const getHeight = {
  small: '500px',
  base: '660px',
  "min-content": 'min-content',
  "auto": "auto",
  full: '100%',
};

const padding = {
  none: '0em',
  small: '0.4em',
  medium: '0.8em',
  base: '1em',
  large: '1.2em',
}
const border = {
  none: 'none',
  small: '1px solid rgba(255, 255, 255, 0.100)',
  base: '1px solid rgba(255, 255, 255, 0.100)',
  large: '3px solid rgba(255, 255, 255, 0.300)',
}
const position = {
  static: 'static',
  relative: 'relative',
  absolute: 'absolute',
  fixed: 'fixed',
  sticky: 'sticky',
}
const borderRadius = {
  none: 'none',
  small: '4px',
  base: '8px',
  large: '10px',
}

const Box = styled.div`
  ${props => variants[props.variant]};
  padding: ${props => props.padding && padding[props.padding]};
  max-width: ${props => props.maxWidth && getWidth[props.maxWidth]};
  width: ${props => (props.width && getWidth[props.width])};
  max-height: ${props => props.maxHeight && getHeight[props.maxHeight]};
  height: ${props => props.height && getHeight[props.height]};
  border-radius: ${props => props.borderRadius ? borderRadius[props.borderRadius] : borderRadius.none};
  background-color: ${props => props.bg && props.theme.bg[props.bg]};
  position: ${props => props.position && position[props.position] };
  box-sizing: border-box;
  display: ${props => props.display };
  overflow: ${props => props.overflow};
  top: ${props => props.positionPlace && props.positionPlace };
`