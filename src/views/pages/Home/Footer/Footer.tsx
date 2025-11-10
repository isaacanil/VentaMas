import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { fbGetAppVersion } from '../../../../firebase/app/fbGetAppVersion';

import type { JSX } from 'react';

const appMetadata = {
  name: 'Ventamax',
  version: 'Versión 02 de Octubre 2023',
  copyright: '© 2023 GISYS. Todos los derechos reservados.',
} as const;

type FirestoreTimestamp = {
  seconds: number;
  nanoseconds?: number;
};

type AppVersionDoc = {
  version?: FirestoreTimestamp | null;
  [key: string]: unknown;
} | null;

function timestampToVersion(timestamp?: FirestoreTimestamp | null): string {
  if (!timestamp || typeof timestamp.seconds !== 'number') return '';
  const date = new Date(timestamp.seconds * 1000);
  const day = `0${date.getDate()}`.slice(-2);
  const monthNames = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();

  return `Versión ${day} de ${month} ${year}`;
}

const Footer = (): JSX.Element => {
  const navigate = useNavigate();
  const [appVersion, setAppVersion] = useState<AppVersionDoc>(null);

  const handleViewChangeLogs = (): void => {
    navigate('/changelogs/list');
  };

  useEffect(() => {
    const fetchAppVersion = async (): Promise<void> => {
      const version = await fbGetAppVersion();
      setAppVersion(version as AppVersionDoc);
    };

    void fetchAppVersion();
  }, []);

  return (
    <FooterContainer>
      <FooterWrapper>
        <Copyright>{appMetadata.copyright}</Copyright>
        <Version onClick={handleViewChangeLogs}>{timestampToVersion(appVersion?.version)}</Version>
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
