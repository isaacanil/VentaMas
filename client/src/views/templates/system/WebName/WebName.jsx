import React from 'react'

import styled from 'styled-components'

const Container = styled('div')`
 

  
`
const WebNameItem = styled('span')`
  ${(props) => {
    switch (props.size) {
      case "large":
        return `
        font-size: 1.5em;
      `
    }
  }}
  font-weight: bold;
  color: rgb(46, 46, 46);
`
export const WebName = (size) => {

  return (
    <Container>
      <WebNameItem size="large">VentaMAX</WebNameItem>
    </Container>
  )
}
