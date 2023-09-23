import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const appMetadata = {
  name: 'Ventamax',
  version: 'Versión 21 de Septiembre 2023',
  copyright: "© 2023 GISYS. Todos los derechos reservados."
}
const Footer = () => {
  const navigate = useNavigate()
  const handleViewChangeLogs = () => {
    navigate("/changelogs/list")
  }
  return (
    <FooterContainer>
      <FooterWrapper>
        <Copyright>
          {appMetadata.copyright}
        </Copyright>
        <Version onClick={handleViewChangeLogs}>
          {appMetadata.version}
        </Version>
      </FooterWrapper>
    </FooterContainer>
  );
};

export default Footer;


const FooterContainer = styled.div`
  background-color: #ffffff;
  color: #575757;
  padding: 1em;
  max-width: 100vw;
  width: 100%;
  display: flex;
  justify-content: center;


`;
const FooterWrapper = styled.div`
    width: 100%;
    max-width: 1200px;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 400px));
    justify-content: space-between;
    @media (max-width: 768px) {
      grid-template-columns: 1fr;
   
    }
  
`
const Version = styled.div`
 text-align: right;
  padding: 0.2em;
  font-size: 14px;
  font-weight: 500;
  color: #575757;
  background-color: #ffffff;
  :hover{
    text-decoration: underline;
    cursor: pointer;
  }
`;

const Copyright = styled.div`
  text-align: left;
  padding: 0.2em;
  font-size: 14px;
  font-weight: 500;
  color: #575757;
  /* Puedes añadir estilos específicos aquí */
`;