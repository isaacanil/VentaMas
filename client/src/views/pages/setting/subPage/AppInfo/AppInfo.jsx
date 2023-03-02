import React from 'react';
import styled from 'styled-components';
import BackButton from '../../GoBackToSetting';

const InfoWrapper = styled.div`
  background-color: #f7f7f7;
  padding: 3rem 2rem;
  border-radius: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 600px;
  margin: 1em auto;
`;

const InfoHeader = styled.h2`
  font-size: 1.2rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 2rem;
`;

const InfoList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`;

const InfoItem = styled.li`
  font-size: 1.25rem;
  margin-bottom: 1.5rem;
  span{
    display: block;
    font-size: 1rem;
   // text-align: right;
  }
`;

const InfoLabel = styled.span`
  font-weight: 600;
  margin-right: 1rem;
  text-align: left !important;
`;

const infoItems = [  {    label: 'Versión:',    value: 'v3.3.0'  },  {    label: 'Email:',    value: 'pos.ventamax@gmail.com'  },  {    label: 'Teléfono:',    value: '555-1234'  },  {    label: 'Derecho de autor:',    value: 'GISIS S.A © 2023. Todos los derechos reservados.'  },  {    label: 'Términos de servicio:',    value: 'Los usuarios deben aceptar los términos y condiciones de la aplicación para utilizarla.'  },  {    label: 'Política de privacidad:',    value: 'La aplicación recopila y utiliza información personal de los usuarios de acuerdo con nuestra política de privacidad.'  },  {    label: 'FAQ:',    value: 'Para obtener ayuda con la aplicación, consulte nuestras preguntas frecuentes.'  },  {    label: 'Soporte técnico:',    value: 'Para obtener ayuda adicional, comuníquese con nuestro equipo de soporte técnico.'  },  {    label: 'Actualizaciones:',    value: 'La aplicación se actualiza periódicamente con nuevas funciones, mejoras y correcciones de errores para garantizar una mejor experiencia de usuario.'  },  {    label: 'Licencia:',    value: 'Esta aplicación utiliza software de terceros, que está sujeto a sus propias licencias y términos de uso.'  },  {    label: 'Información legal:',    value: 'Para obtener información adicional sobre nuestros términos y condiciones de compra, políticas de reembolso y otros detalles legales, consulte nuestro sitio web.'  }];

const AppInfo = () => {
  return (
    <InfoWrapper>
        <BackButton></BackButton>
      <InfoHeader>Información de la aplicación web</InfoHeader>
      <InfoList>
        {infoItems.map((item, index) => (
          <InfoItem key={index}>
            <InfoLabel>{item.label}</InfoLabel>
            <span>{item.value}</span>
          </InfoItem>
        ))}
      </InfoList>
    </InfoWrapper>
  );
};

export default AppInfo
