import React, { useState } from "react";
import styled from "styled-components";
import { fbLogin } from "../../../../firebase/Auth/fbLogin";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Login } from "./Login";
import img from './imgs/Imagen de WhatsApp 2024-03-20 a las 16.08.41_2d4b60ad.jpg'

export const LoginV2 = () => {
    const navigate = useNavigate()
    const dispatch = useDispatch()


    const homePath = "/home"

    return (
        <Background>
        <Container>
            <ImagenContainer>
                <Imagen>
                    <img src={img} alt="" />
                </Imagen>
            </ImagenContainer>
            <Login />
        </Container>
        </Background>
    );
};
const Background = styled.div`
     background-color: var(--color2);
     height: 100vh;
  overflow: hidden;
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

