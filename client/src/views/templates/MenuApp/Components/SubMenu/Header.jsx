import { Button } from 'antd'
import React from 'react'
import { IoIosArrowBack } from 'react-icons/io'
import styled from 'styled-components'

export const Header = () => {
    return (
        <Container>
            <Button
                startIcon={<IoIosArrowBack />}
                title='atrás'
                variant='contained'
              
            />
            <Title>{item.title}</Title>
        </Container>
    )
}
const Container = styled.div`
    display: grid;
      grid-template-columns: 1fr 1fr;
      justify-content: space-between;
      align-items: center;
      padding: 0 1.5em 0 1em;
      margin: 0 0 1em;
      
      button {
         color: rgb(66, 165, 245);
         justify-self: flex-start;
      }
`
const Title = styled.span`
      font-size: 16px;
         line-height: 18px;
         font-weight: 500;
         text-align: center;
         text-align: end;
`