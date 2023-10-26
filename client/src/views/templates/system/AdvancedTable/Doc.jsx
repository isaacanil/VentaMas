
import styled from 'styled-components';
import Typography from '../Typografy/Typografy';
import { Switch } from '../Switch/Switch';
import { useState } from 'react';
import { Container } from '../layout/Container/Container';

const Contenedor = styled.div`
  font-family: 'Arial', sans-serif;
  padding: 20px;
  background-color: #f9f9f9;
`;

const data = [
  {
    "title": "Actualización 1",
    "date": "12 de Julio",
    "content": "Contenido de la actualización 1"
  },
  // Más actualizaciones aquí
]
export function Doc() {
  return (
    <UpdateContainer>
      <Switch
        size='medium'
        value={open}
        onChange={() => setOpen(!open)}
      />
      <Container
      >
        <Typography variant='h2' >
          h2. Heading
        </Typography>
        <Typography variant='h3' >
          h3. Heading
        </Typography>
      </Container>
    </UpdateContainer >
  );
}




const UpdateContainer = styled.div`
  padding: 10px;
  margin: 10px;
`;

/*     <Typography variant='h1' >
      h1. Heading
      </Typography>
      <Typography variant='h2' >
      h2. Heading
      </Typography>
      <Typography variant='h3' >
      h3. Heading
      </Typography>
      <Typography variant='h4' >
      h4. Heading
      </Typography>
      <Typography variant='h5' >
      h5. Heading
      </Typography>
      <Typography  >
      Lorem ipsum dolor sit amet consectetur, adipisicing elit. Explicabo voluptate obcaecati, sed eaque nihil ipsa, neque cumque accusamus totam cum rerum commodi in deserunt molestias! Magnam nisi modi mollitia tenetur.
      </Typography>
      <Typography variant='body2' >
      Lorem ipsum dolor sit amet consectetur, adipisicing elit. Explicabo voluptate obcaecati, sed eaque nihil ipsa, neque cumque accusamus totam cum rerum commodi in deserunt molestias! Magnam nisi modi mollitia tenetur.
      </Typography>
      <Typography variant='l1' >
      l1. Label
      </Typography>
      <Typography variant='l2' >
      l2. Label
      </Typography>
      <Typography variant='l3' >
      l3. Label
      </Typography> */