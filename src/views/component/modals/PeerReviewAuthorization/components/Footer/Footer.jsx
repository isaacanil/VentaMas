import { Button } from 'antd';

export const Footer = ({ onSubmit, onCancel }) => {
  return (
    <div style={{ display: 'flex', justifyContent: 'end', gap: '0.4em' }}>
      <Button onClick={onCancel}>Cancelar</Button>
      <Button type="primary" onClick={onSubmit}>
        Guardar
      </Button>
    </div>
  );
};
