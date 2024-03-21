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
        <Backdrop>
            <Imagen>
                <img src={img} alt="" />
            </Imagen>
            <Login  />
        </Backdrop>
    );
};

const Imagen = styled.div`
    height: 100vh;
    overflow: hidden;
    img{
        object-fit: cover;
        width: 100%;
        height: 100%;
    }
`

const Backdrop = styled.div`
display: grid;
grid-template-columns: 1.5fr 1fr;
 
`;

