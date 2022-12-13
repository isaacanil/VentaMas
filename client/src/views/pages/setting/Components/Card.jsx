import { styled } from "@stitches/react"
export const Card = ({data}) => {
    return (
        <Container>
            <Title>
                {data.title}
            </Title>
            <Description>
                {data.description}
            </Description>

        </Container>
    )
}

const Container = styled('div', {
    backgroundColor: '#dbdbdb',
    padding: '.8em',
    borderRadius: '08px'
    
})
const Title = styled('h3', {
   color: '#283t',
   margin: 0,
   marginBottom: '0.3em'
})
const Description = styled('div', {
    
})
const Links = styled('div', {
    
})