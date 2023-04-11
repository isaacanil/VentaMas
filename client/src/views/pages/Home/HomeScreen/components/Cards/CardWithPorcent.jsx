import React from 'react'
import styled from 'styled-components'

export const CardWithPercent = ({title, icon, number}) => {
    return (
        <Container>
            <Head>
                <Title>{title}</Title>
                <Percent>{'10%'}</Percent>
            </Head>
            <Body>
                <Icon>{icon}</Icon>
                <Number>{number}</Number>
            </Body>
        </Container>
    )
}
const Container = styled.div`

`
const Head = styled.div`

`
const Title = styled.div`

` 
const Percent = styled.div`

`
const Body = styled.div`

`
const Icon = styled.div`

`
const Number = styled.div`

`
