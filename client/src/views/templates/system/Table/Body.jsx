import React from 'react'
import styled from 'styled-components'

export const Body = ({ children, messageNoData  }) => {
    return (
        <Container>
            {children}
            {messageNoData}
        </Container>
    )
}
const Container = styled.div``