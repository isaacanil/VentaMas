import React, { useState } from "react";
import styled from "styled-components";
import { InputV4 } from "../../templates/system/Inputs/GeneralInput/InputV4";
import { fbLogin } from "../../../firebase/Auth/fbLogin";
import ROUTES_NAME from "../../../routes/routesName";
import findRouteByName from "../../templates/MenuApp/findRouteByName";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { fbSignIn } from "../../../firebase/Auth/fbAuthV2/fbSignIn/fbSignIn";
import { addNotification } from "../../../features/notification/NotificationSlice";
import { ErrorComponent } from "../../templates/system/ErrorComponent/ErrorComponent";
import Typography from "../../templates/system/Typografy/Typografy";
import ROUTES_PATH from "../../../routes/routesName";
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
    margin-left: 0;
    margin-right: 0;
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
const errors = {
    nameEmpty: "El nombre de usuario no puede estar vacío",
    passwordEmpty: "El password no puede estar vacío",
    userNotFound: "El usuario no existe",
    passwordIncorrect: "El contraseña es incorrecto",
    nameEmptyAndPasswordEmpty: "El nombre de usuario y la contraseña no pueden estar vacíos",
}
export const BasicLogin = () => {
    const navigate = useNavigate()
    const dispatch = useDispatch()

    const [user, setUser] = useState({
        name: "",
        password: "",
    })
    const [error, setError] = useState(null)
    
  
    const homePath = ROUTES_NAME.BASIC_TERM.HOME

    const handleChange = (e) => {
        const lowercasedValue = e.target.value.toLowerCase();
        setUser({ ...user, [e.target.name]: lowercasedValue });
    };
    const handleSubmit = (e) => {
        e.preventDefault()
        if (user.name === "" && user.password === "") {
            setError(errors.nameEmptyAndPasswordEmpty)
            return
        }
        if (user.name === "") {
            //quiero que pueda guardar varios errores entonce seria un array
            setError(errors.nameEmpty)
            return
        }
        if (user.password === "") {
            setError(errors.passwordEmpty)
            return
        }
        fbSignIn(user, dispatch, navigate, homePath, setError)
    }

    return (
        <Backdrop>
            <Container>
                <Head>
                    
                    <Typography variant="h2">Iniciar Sección</Typography>
                </Head>
                <form onSubmit={handleSubmit}>
                    <Body>
                        <Group>
                        </Group>
                        <Group>
                            <InputV4
                                type="text"
                                placeholder="Nombre de usuario"
                                label="Nombre de usuario"
                                name="name"
                                value={user.name}
                                onChange={handleChange}
                            />
                        </Group>
                        < Group>
                            <InputV4
                                type="password"
                                placeholder="Contraseña"
                                label="Contraseña"
                                value={user.password}
                                onChange={(e) => setUser({ ...user, password: e.target.value })}
                            />
                        </Group>
                    </Body>
                    <ErrorComponent errors={error} />
                    <Footer>
                        <Group>
                            <Button>Continuar</Button>
                        </Group>
                    </Footer>
                </form>
            </Container>
        </Backdrop>
    );
};


