import React, { useState } from 'react';

import supabase from '../../../../supabase/config';


const RncSearch = () => {
  const [rnc, setRnc] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    setError(''); // Limpiar errores previos
    setResult(null); // Limpiar resultados previos

    try {
      const { data, error } = await supabase
        .from('rnc') // Nombre de la tabla en Supabase
        .select('*')
        .eq('rnc_number', rnc);

      if (error) {
        throw error; // Lanzar error si ocurre algún problema
      }

      if (data.length === 0) {
        setError('No se encontraron resultados para el RNC ingresado.');
      } else {
        setResult(data[0]); // Mostrar el primer resultado (siempre debería ser único por el RNC)
      }
    } catch (err) {
      console.error('Error al buscar:', err.message);
      setError('Hubo un problema al realizar la consulta. Inténtalo de nuevo más tarde.');
    }
  };

  return (
    <div style={styles.container}>
      <h1>Búsqueda de RNC</h1>
      <input
        type="text"
        value={rnc}
        onChange={(e) => setRnc(e.target.value)}
        placeholder="Ingresa el número de RNC"
        style={styles.input}
      />
      <button onClick={handleSearch} style={styles.button}>
        Buscar
      </button>
      {error && <p style={styles.error}>{error}</p>}
      {result && (
        <div style={styles.result}>
          <h3>Resultados:</h3>
          <p><strong>RNC:</strong> {result.rnc_number}</p>
          <p><strong>Nombre Completo:</strong> {result.full_name}</p>
          <p><strong>Nombre Comercial:</strong> {result.business_name}</p>
          <p><strong>Actividad Comercial:</strong> {result.business_activity}</p>
          <p><strong>Estado:</strong> {result.status}</p>
          <p><strong>Condición:</strong> {result.condition}</p>
        </div>
      )}
    </div>
  );
};

// Estilos básicos
const styles = {
  container: {
    maxWidth: '500px',
    margin: '50px auto',
    padding: '20px',
    textAlign: 'center',
    border: '1px solid #ccc',
    borderRadius: '10px',
    backgroundColor: '#f9f9f9',
  },
  input: {
    width: '100%',
    padding: '10px',
    marginBottom: '10px',
    borderRadius: '5px',
    border: '1px solid #ccc',
  },
  button: {
    padding: '10px 20px',
    fontSize: '16px',
    borderRadius: '5px',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
  },
  error: {
    marginTop: '10px',
    color: 'red',
  },
  result: {
    marginTop: '20px',
    textAlign: 'left',
  },
};

export default RncSearch;
