import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { Body } from './components/Body/Body'
import { Footer } from './components/Footer/Footer'
import { Header } from './components/Header/Header'
import { fbValidateUser } from '../../../../firebase/Auth/fbAuthV2/fbSignIn/fbVerifyUser'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { clearCashCount } from '../../../../features/cashCount/cashCountManagementSlice'
import { useDispatch } from 'react-redux'

export const PeerReviewAuthorization = ({ isOpen, setIsOpen, onSubmit, description }) => {

    const [user, setUser] = useState({
        name: '',
        password: ''
    })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const dispatch = useDispatch()

    const navigate = useNavigate()
    const clearUser = () => {
        setUser({
            name: '',
            password: ''
        })
    }
    const handleSubmit = async (user) => {
        if (user.name.trim() === '' || user.password.trim() === '') { 
            setError('Asegurate de que los campos no este vacios'); 
            return 
        }
        try {
            const {userData, response } = await fbValidateUser(user)
            if(response?.error){
                setError(response.error)
                return
            }
            onSubmit(userData)
            setTimeout(() => {
                navigate(-1)
                dispatch(clearCashCount())
            }, 1000)
        } catch (error) {
            setLoading(false);
            setError('An error occurred. Please try again.');
            console.log(err);
        }


        clearUser()
        setIsOpen(false)
    }

    const handleCancel = () => {
        setTimeout(() => {
            setIsOpen(false)
        }, 300)

        clearUser()

        setError('')
        setLoading(false)

    }

    const backdropVariant = {
        open: { opacity: 1, pointerEvents: 'auto' },
        closed: { opacity: 0, pointerEvents: 'none' }
    }

    const containerVariant = {
        open: { opacity: 1, y: 0 },
        closed: { opacity: 0, y: '-100%' }
    }

    return (

        <Backdrop
            variants={backdropVariant}
            initial='closed'
            animate={isOpen ? 'open' : 'closed'}
            transition={{ duration: 0.3 }}

        >
            <Container
                variants={containerVariant}
                initial='closed'
                animate={isOpen ? 'open' : 'closed'}
                transition={{ duration: 0.3 }}
            >
                <Header description={description} />
              
                {loading ? <p>Loading...</p> : (
                    <>
                        <Body user={user} setUser={setUser} />
                        { <Error error={error}>{error && error}</Error>}
                        <Footer
                            onCancel={handleCancel}
                            onSubmit={() => handleSubmit(user)}
                        />
                    </>
                )}
                  
            </Container>
        </Backdrop>

    )
}
const Error = styled.p`
    font-size: 1em;
    height: 2em;
    display: flex;
    align-items: center;
    justify-content: center;
    ${({ error }) => error && `
    background-color: var(--color-danger-light);
    color: var(--color-danger-dark);
    border-radius: var(--border-radius);
    border: var(--border-danger);
    `}
   
    margin: 0;
    padding: 0;
`
const Backdrop = styled(motion.div)`
    background-color: rgba(0,0,0,0.5);
    position: absolute;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    padding: 1em;
`

const Container = styled(motion.div)`
    max-width: 500px;
    height: 400px;
    position: relative;
    margin: 0 auto;
    display: grid;
    grid-template-rows: min-content min-content 1fr min-content;
    align-items: start;
    align-content: start;
    gap: 1.4em;
    padding: 1em;
    background-color: white;
    border-radius: 0.5em;
    border: var(--border-primary);
    overflow: auto;
   
 
`

