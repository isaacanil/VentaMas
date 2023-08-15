
import styled from 'styled-components';

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
    <div>
      <h1>Actualizaciones de Ventamax</h1>
      {
        data.map((update) => (
          <Update
            content={update.content}
            date={update.date}
            title={update.title}
          />
        ))
      }
    </div>
  );
}


function Update({ title, date, content }) {
  return (
    <UpdateContainer>
      <h2>{title}</h2>
      <p>{date}</p>
      <p>{content}</p>
    </UpdateContainer>
  );
}

const UpdateContainer = styled.div`

  padding: 10px;
  margin: 10px;
  *{
    margin: 0;
    padding: 0;
  }
h2 {
  color: #333;
}

 p {
  color: #666;
}
`;

