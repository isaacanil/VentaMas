import { useState } from "react"
import { MdSearch } from "react-icons/md"
import styled from "styled-components"
import { Button } from "../../../templates/system/Button/Button"

export const SearchClient = () => {
    const [InputData, setInputData] = useState('Click en el btn para buscar')
    const [isSearchMode, setIsSearchMode] = useState(false)
    return (
        <Container>
           <Head>

           </Head>
            <Body>

            </Body>
        </Container>
    )
}

const Container = styled.div`
    width: 24em;
    height: 15em;
    background-color: blueviolet;
`
const Head = styled.div`

`
const Body = styled.div`
    
`

