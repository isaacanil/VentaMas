import React from 'react'
import styled from 'styled-components'

export const Body = ({ children, message  }) => {
    return (
        <Container>
            {children}
            {message}
        </Container>
    )
}
const Container = styled.div``