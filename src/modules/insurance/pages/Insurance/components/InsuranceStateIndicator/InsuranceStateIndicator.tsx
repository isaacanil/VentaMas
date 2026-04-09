import { Tag } from 'antd';

interface InsuranceStateIndicatorProps {
  state?: string | null;
}

export const InsuranceStateIndicator = ({
  state,
}: InsuranceStateIndicatorProps) => {
  let color = 'default';
  let text = state ?? '';

  switch (state) {
    case 'approved':
      color = 'success';
      text = 'Aprobado';
      break;
    case 'pending':
      color = 'warning';
      text = 'Pendiente';
      break;
    case 'rejected':
      color = 'error';
      text = 'Rechazado';
      break;
    default:
      color = 'default';
      text = 'Desconocido';
  }

  return (
    <Tag color={color} style={{ fontSize: '14px', padding: '2px 10px' }}>
      {text}
    </Tag>
  );
};
