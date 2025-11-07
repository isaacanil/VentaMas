import { Alert } from 'antd';

export const ModeBanner = ({ isUpdateMode }) => {
  if (isUpdateMode) return null;
  
  return (
    <Alert
      type="info"
      showIcon
      message="Estás creando un nuevo producto para tu catálogo."
      style={{ borderRadius: 16 }}
    />
  );
};
