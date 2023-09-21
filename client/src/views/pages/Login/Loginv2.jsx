import React, { useState } from "react";
import styled from "styled-components";
import { InputV4 } from "../../templates/system/Inputs/GeneralInput/InputV4";
import { fbLogin } from "../../../firebase/Auth/fbLogin";
import ROUTES_NAME from "../../../routes/routesName";
import findRouteByName from "../../templates/MenuApp/findRouteByName";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";

const Backdrop = styled.div`
  display: grid;
    place-items: center;
    height: 100vh;
  margin: 0 auto;
  background-color: var(--color2);
 
`;

const Container = styled.div`
    max-width: 600px;
    width: 100%;
    background-color: white;
    border-radius: var(--border-radius);
    padding: 1em;
    display: grid;
    grid-template-rows: min-content 1fr;
     form{
    width: 100%;
    height: 400px;
    display: grid;
    grid-template-rows: 1fr min-content;
  }
`
const Titulo = styled.h1`

`
const Head = styled.div``
const Body = styled.div``

const Footer = styled.div``
const Group = styled.div`
    display: flex;
    flex-direction: column;
    margin-bottom: 1.5rem;
    width: 100%;
`;

const Button = styled.button`
  padding: 4px;
  height: 2em;
  margin-top: 4px;
  background-color: var(--color);
  border-radius: var(--border-radius-light);
  border: var(--border-primary);
`;

export const LoginV2 = () => {  
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const [user, setUser] = useState({
        email: "",
        password: "",
    })
    
    const homePath = "/home"
const handleSubmit = (e) => {
    e.preventDefault()
    fbLogin(user, homePath, navigate, dispatch)
}
    return (
        <Backdrop>
            <Container>
                <Head>
                    <Titulo>Login</Titulo>
                </Head>
                <form onSubmit={handleSubmit}>
                    <Body>npm run
                        <Group>
                        </Group>
                        <Group>
                            <InputV4
                                type="text"
                                placeholder="Email"
                                label="Email"
                                value={user.email}
                                onChange={(e) => setUser({ ...user, email: e.target.value })}
                            />
                        </Group>
                        < Group>
                            <InputV4
                                type="password"
                                placeholder="Password"
                                label="Password"
                                value={user.password}
                                onChange={(e) => setUser({ ...user, password: e.target.value })}
                            />
                        </Group>
                    </Body>
                    <Footer>

                        <Group>
                            <Button>Login</Button>
                        </Group>
                    </Footer>
                </form>
            </Container>
        </Backdrop>
    );
};


