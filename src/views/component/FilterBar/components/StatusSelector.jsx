import {
  faCheckCircle,
  faClock,
  faBan,
  faSpinner,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';

import { Selector } from '../../../../components/common/Selector/Selector';

const defaultStatusOptions = [
  {
    value: 'active',
    label: 'Activo',
    icon: faCheckCircle,
    color: '#177ddc',
    bgColor: '#e6f4ff',
    borderColor: '#91caff',
  },
  {
    value: 'completed',
    label: 'Completado',
    icon: faCheckCircle,
    color: '#52c41a',
    bgColor: '#f6ffed',
    borderColor: '#b7eb8f',
  },
  {
    value: 'pending',
    label: 'Pendiente',
    icon: faClock,
    color: '#faad14',
    bgColor: '#fffbe6',
    borderColor: '#ffe58f',
  },
  {
    value: 'canceled',
    label: 'Cancelado',
    icon: faBan,
    color: '#ff4d4f',
    bgColor: '#fff1f0',
    borderColor: '#ffccc7',
  },
  {
    value: 'deleted',
    label: 'Eliminado',
    icon: faTrash,
    color: '#8c8c8c',
    bgColor: '#fafafa',
    borderColor: '#d9d9d9',
  },
  {
    value: 'processing',
    label: 'En Proceso',
    icon: faSpinner,
    color: '#1890ff',
    bgColor: '#e6f7ff',
    borderColor: '#91d5ff',
  },
];

export const StatusSelector = ({
  value,
  onChange,
  statusOptions = defaultStatusOptions,
  visibleStatus = [],
  placeholder = 'Estado',
  showAllOption = false,
  allowClear = false,
  clearText,
  width,
}) => {
  // Filtrar las opciones según los estados visibles
  const filteredOptions =
    visibleStatus.length > 0
      ? statusOptions.filter((status) => visibleStatus.includes(status.value))
      : statusOptions;

  const defaultStyles = {
    color: '#666',
    bgColor: '#ffffff',
    borderColor: '#d9d9d9',
    icon: faClock,
  };

  return (
    <Selector
      value={value}
      onChange={onChange}
      options={filteredOptions}
      placeholder={placeholder}
      showAllOption={showAllOption}
      allowClear={allowClear}
      clearText={clearText}
      defaultStyles={defaultStyles}
      width={width}
    />
  );
};
