import { Button } from 'antd';

interface FooterProps {
  onSubmit: () => void;
  onCancel: () => void;
}

export const Footer = ({ onSubmit, onCancel }: FooterProps) => {
  return (
    <div style={{ display: 'flex', justifyContent: 'end', gap: '0.4em' }}>
      <Button onClick={onCancel}>Cancelar</Button>
      <Button type="primary" onClick={onSubmit}>
        Guardar
      </Button>
    </div>
  );
};
