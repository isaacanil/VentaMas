// ColoredNumber.js
import React from 'react'
import styled from 'styled-components'

const getColor = (value, color) => {
  if (color) return color; // Si se especifica un color manualmente, usarlo
  if (value > 0) return 'green'
  if (value < 0) return 'red'
  if (value === 0) return 'gray'
  return 'black' // Para cualquier otro caso, se usará color negro
}

const ColoredNumber = ({ value, color }) => {
  const finalColor = getColor(value, color)
  
  return <Number style={{ color: finalColor }}>{value}</Number>
}

const Number = styled.span`
  font-weight: 600;
  padding: 0 0.4em;
  align-items: center;
`

export default ColoredNumber
