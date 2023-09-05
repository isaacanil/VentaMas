import React from 'react';
import styled from 'styled-components';

const FooterContainer = styled.div`
  background-color: #ffffff;
  color: #575757;
  padding: 1em;
  max-width: 100vw;


`;
const FooterWrapper = styled.div`
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 400px));
    justify-content: space-between;
  
`
const Version = styled.div`
 text-align: right;
  padding: 0.2em;
  font-size: 0.8em;
  font-weight: 500;
  color: #575757;

`;

const AppName = styled.div`
 

  /* Puedes añadir estilos específicos aquí */
`;

const Copyright = styled.div`
  text-align: left;
  padding: 0.2em;
  font-size: 0.8em;
  font-weight: 500;
  color: #575757;
  /* Puedes añadir estilos específicos aquí */
`;
const appMetadata = {
    name: 'Ventamax',
    version: 'Versión 1 de Septiembre 2023',
    copyright: "© 2023 GISYS. Todos los derechos reservados."
}
const Footer = () => {
    return (
        <FooterContainer>
            <FooterWrapper>
            <Copyright>
                    {appMetadata.copyright}
                </Copyright>
                <Version>
                    {appMetadata.version}
                </Version>
               
            </FooterWrapper>
        </FooterContainer>
    );
};

export default Footer;
