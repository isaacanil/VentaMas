import React from 'react'
import styled from 'styled-components'

export const Head = () => {
    return (
        <div className={LoginStyle.Login_header}>
            <div className={LoginStyle.WebName}>
                <span>Ventamax</span>
            </div>
            <span className={LoginStyle.Title}>Acceder</span>
        </div>
    )
}
const Container = styled.div`
`