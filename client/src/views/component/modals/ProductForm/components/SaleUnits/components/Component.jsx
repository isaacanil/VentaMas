import { useState } from 'react';
import styled from 'styled-components';
import { v4 as uuidv4 } from 'uuid';
import { Button as AntButton, Input as AntInput, Switch as AntSwitch } from 'antd';
import { faPlus, faPencilAlt, faTrashAlt, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

// Styled Components Definitions
const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 16px;
`;

const CardHeaderWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: #f5f5f5;
  border-bottom: 1px solid #e8e8e8;
`;

const Grid = styled.div`
  display: grid;
  gap: 16px;
  grid-template-columns: 1fr;
  
  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
  }
  
  @media (min-width: 1024px) {
    grid-template-columns: 1fr 1fr 1fr;
  }
`;

const Card = styled.div`
  background-color: ${(props) => (props.active ? '#f0f0f0' : '#d0d0d0')};
  opacity: ${(props) => (props.active ? '1' : '0.5')};
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  overflow: hidden;
`;

const CardContentWrapper = styled.div`
  padding: 16px;
`;

const InfoText = styled.p`
  font-size: 0.875rem;
  color: #444;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const GridForm = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
`;

const FullWidthButton = styled(AntButton)`
  width: 100%;
`;

export default function Component() {
  const [saleUnits, setSaleUnits] = useState([
    {
      id: uuidv4(),
      unitName: 'Caja',
      quantity: 30,
      pricing: { cost: 100, price: 150, listPrice: 160, avgPrice: 155, minPrice: 140, tax: 'IVA' },
      active: true,
    },
    {
      id: uuidv4(),
      unitName: 'Pastilla',
      quantity: 1,
      pricing: { cost: 3, price: 5, listPrice: 5.5, avgPrice: 5.25, minPrice: 4.5, tax: 'IVA' },
      active: true,
    },
  ]);

  const [editingUnit, setEditingUnit] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const addSaleUnit = (newUnit) => {
    setSaleUnits([...saleUnits, { ...newUnit, id: uuidv4(), active: true }]);
  };

  const updateSaleUnit = (updatedUnit) => {
    setSaleUnits(saleUnits.map((unit) => (unit.id === updatedUnit.id ? updatedUnit : unit)));
  };

  const deleteSaleUnit = (id) => {
    setSaleUnits(saleUnits.filter((unit) => unit.id !== id));
  };

  const toggleUnitActive = (id) => {
    setSaleUnits(saleUnits.map((unit) => (unit.id === id ? { ...unit, active: !unit.active } : unit)));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newUnit = {
      unitName: formData.get('unitName'),
      quantity: Number(formData.get('quantity')),
      pricing: {
        cost: Number(formData.get('cost')),
        price: Number(formData.get('price')),
        listPrice: Number(formData.get('listPrice')),
        avgPrice: Number(formData.get('avgPrice')),
        minPrice: Number(formData.get('minPrice')),
        tax: formData.get('tax'),
      },
    };

    if (editingUnit) {
      updateSaleUnit({ ...newUnit, id: editingUnit.id, active: editingUnit.active });
    } else {
      addSaleUnit(newUnit);
    }

    setIsDialogOpen(false);
    setEditingUnit(null);
    e.currentTarget.reset();
  };

  return (
    <Container>
      <Card>
        <CardHeaderWrapper>
          <h3>Unidades de Venta</h3>
          <AntButton type="primary" icon={<FontAwesomeIcon icon={faPlus} />} onClick={() => setEditingUnit(null)}>
            Agregar Unidad
          </AntButton>
        </CardHeaderWrapper>
        <CardContentWrapper>
          <Grid>
            {saleUnits.map((unit) => (
              <Card key={unit.id} active={unit.active}>
                <CardContentWrapper>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <h3 style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>{unit.unitName}</h3>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <AntSwitch
                        checked={unit.active}
                        onChange={() => toggleUnitActive(unit.id)}
                      />
                      <AntButton
                        type="text"
                        icon={<FontAwesomeIcon icon={faPencilAlt} />}
                        onClick={() => {
                          setEditingUnit(unit);
                          setIsDialogOpen(true);
                        }}
                      />
                      <AntButton
                        type="text"
                        icon={<FontAwesomeIcon icon={faTrashAlt} />}
                        onClick={() => deleteSaleUnit(unit.id)}
                      />
                    </div>
                  </div>
                  <InfoText>Cantidad: {unit.quantity}</InfoText>
                  <InfoText>Precio: ${unit.pricing.price}</InfoText>
                  <AntButton type="text" size="small" icon={<FontAwesomeIcon icon={faInfoCircle} />}>Más información</AntButton>
                </CardContentWrapper>
              </Card>
            ))}
          </Grid>
        </CardContentWrapper>
      </Card>
      {isDialogOpen && (
        <div style={{ padding: '24px', background: '#fff', borderRadius: '8px', maxWidth: '425px', margin: '0 auto', marginTop: '24px' }}>
          <h3>{editingUnit ? 'Editar Unidad de Venta' : 'Agregar Nueva Unidad de Venta'}</h3>
          <Form onSubmit={handleSubmit}>
            <GridForm>
              <div>
                <label htmlFor="unitName">Nombre de la Unidad</label>
                <AntInput id="unitName" name="unitName" defaultValue={editingUnit?.unitName} required />
              </div>
              <div>
                <label htmlFor="quantity">Cantidad</label>
                <AntInput id="quantity" name="quantity" type="number" defaultValue={editingUnit?.quantity} required />
              </div>
            </GridForm>
            <GridForm>
              <div>
                <label htmlFor="cost">Costo</label>
                <AntInput id="cost" name="cost" type="number" step="0.01" defaultValue={editingUnit?.pricing.cost} required />
              </div>
              <div>
                <label htmlFor="price">Precio</label>
                <AntInput id="price" name="price" type="number" step="0.01" defaultValue={editingUnit?.pricing.price} required />
              </div>
            </GridForm>
            <GridForm>
              <div>
                <label htmlFor="listPrice">Precio de Lista</label>
                <AntInput id="listPrice" name="listPrice" type="number" step="0.01" defaultValue={editingUnit?.pricing.listPrice} required />
              </div>
              <div>
                <label htmlFor="avgPrice">Precio Promedio</label>
                <AntInput id="avgPrice" name="avgPrice" type="number" step="0.01" defaultValue={editingUnit?.pricing.avgPrice} required />
              </div>
            </GridForm>
            <GridForm>
              <div>
                <label htmlFor="minPrice">Precio Mínimo</label>
                <AntInput id="minPrice" name="minPrice" type="number" step="0.01" defaultValue={editingUnit?.pricing.minPrice} required />
              </div>
              <div>
                <label htmlFor="tax">Impuesto</label>
                <AntInput id="tax" name="tax" defaultValue={editingUnit?.pricing.tax} required />
              </div>
            </GridForm>
            <FullWidthButton type="primary" htmlType="submit">
              {editingUnit ? 'Actualizar' : 'Agregar'} Unidad
            </FullWidthButton>
          </Form>
        </div>
      )}
    </Container>
  );
}