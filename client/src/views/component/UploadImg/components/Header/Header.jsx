import React from 'react'
import { IoIosArrowBack } from 'react-icons/io'
import styled from 'styled-components'
import { Button } from '../../../../templates/system/Button/Button'

export const Header = ({setIsOpen}) => {
    return (
        <Head>
            <Button
                borderRadius='normal'
                startIcon={<IoIosArrowBack />}
                title='atrás'
                onClick={() => setIsOpen(false)}
            />
        </Head>
    )
}

const Head = styled.div`
    height: 2.75em;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    
`