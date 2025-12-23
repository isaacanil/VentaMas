import { Select, Button } from 'antd';
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

import { fbGetBusinesses } from '@/firebase/dev/businesses/fbGetBusinesses';

const { Option } = Select;

const SwitchBusiness = () => {
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState(null);

  useEffect(() => {
    fbGetBusinesses(setBusinesses);
  }, []);

  const handleChange = (value) => {
    setSelectedBusiness(value);
  };
  const handleSwitch = () => {
    if (selectedBusiness) {
      // Logic to switch the active business
    }
  };

  return (
    <Container>
      <h1>Cambiar Negocio</h1>
      <Select
        placeholder="Selecciona un negocio"
        style={{ width: 300, marginTop: '1em' }}
        onChange={handleChange}
        value={selectedBusiness}
      >
        {businesses.map(({ business }) => (
          <Option key={business.id || business.name} value={business.id}>
            {business.name}
          </Option>
        ))}
      </Select>
      <Button type="primary" onClick={handleSwitch} style={{ marginLeft: 16 }}>
        Cambiar
      </Button>
    </Container>
  );
};

const Container = styled.div`
  padding: 2em;
`;

export default SwitchBusiness;
