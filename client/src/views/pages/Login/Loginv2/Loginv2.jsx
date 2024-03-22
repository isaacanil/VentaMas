import React, { useState } from "react";
import styled from "styled-components";
import { fbLogin } from "../../../../firebase/Auth/fbLogin";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Login } from "./Login";
import img from './imgs/Imagen de WhatsApp 2024-03-20 a las 16.08.41_2d4b60ad.jpg'
import * as antd from 'antd'
import { icons } from "../../../../constants/icons/icons";
const { Button, Spin } = antd

export const LoginV2 = () => {
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const [loading, setLoading] = useState(false)
    const goToHome = () => {
        navigate('/')
    }

    const homePath = "/home"

    return (
        <Spin 
            spinning={loading} 
            tip="Cargando..." 
            size="large"
        >
            <Background>
                <Container>
                    <ImagenContainer>
                        <ButtonBack
                            icon={icons.arrows.arrowLeft}
                            onClick={goToHome}>

                            Volver atrás
                        </ButtonBack>
                        <Imagen>
                            <img src={img} alt="" />
                        </Imagen>
                    </ImagenContainer>
                    <Login setLoading={setLoading}/>
                </Container>
            </Background>

        </Spin>
    );
};
const Background = styled.div`
     background-color: #4d4d4d;
     height: 100vh;
  overflow-y: auto;
  
`
const ButtonBack = styled(Button)`
    position: absolute;
    cursor: pointer;
    margin-bottom: 1em;
    display: flex;
    top: 2em;
    left:  2em;
    align-items: center;
    gap: 0.5em;
`
const Imagen = styled.div`
   height: 100%;
    overflow: hidden;
    border-radius: 1em;
    img{
        object-fit: cover;
        width: 100%;
        height: 100%;
    }
`
const ImagenContainer = styled.div`
    padding: 1em;
    height: 100vh;
    max-height: 800px;
    position: relative ;
    padding-right: 0;
    @media (max-width: 800px){
        display: none;
    }
`

const Container = styled.div`
    display: grid;
    grid-template-columns: 1.2fr 1fr;
     max-width: 1366px;
    max-height: 800px;
    height: 100vh;
    overflow: 0;
    margin: 0 auto;
    @media (max-width: 1000px){
        grid-template-columns: 1fr 1fr;
    }
    @media (max-width: 800px){
        grid-template-columns: 1fr;
        justify-content: center;
        justify-items: center;
    }
`;

