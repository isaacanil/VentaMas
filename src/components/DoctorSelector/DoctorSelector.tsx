import {
  PlusOutlined,
  EditOutlined,
  MoreOutlined,
  CloseOutlined,
  MedicineBoxOutlined,
} from '@ant-design/icons';
import {
  Form,
  Input,
  Button,
  Drawer,
  Tooltip,
  Dropdown,
  type InputRef,
  type FormItemProps,
  type MenuProps,
} from 'antd';
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { useDispatch } from 'react-redux';

import type { AppDispatch } from '@/app/store';
import { openModal } from '@/features/doctors/doctorsSlice';
import type { DoctorRecord } from '@/types/doctors';
import { normalizeText } from '@/utils/text';
import {
  DoctorCard,
  DoctorInfo,
  DoctorsContainer,
  Header,
  Wrapper,
  doctorDrawerStyles,
} from './DoctorSelector.styles';

interface DoctorSelectorProps {
  doctors?: DoctorRecord[];
  selectedDoctor?: DoctorRecord | null;
  onSelectDoctor?: (doctor: DoctorRecord | null) => void;
  validateStatus?: FormItemProps['validateStatus'];
  help?: FormItemProps['help'];
}

const EMPTY_DOCTORS: DoctorRecord[] = [];

const DoctorSelector = ({
  doctors = EMPTY_DOCTORS,
  selectedDoctor,
  onSelectDoctor,
  validateStatus,
  help,
}: DoctorSelectorProps) => {
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');
  const searchInputRef = useRef<InputRef | null>(null);
  const dispatch = useDispatch<AppDispatch>();

  const normalizedSearch = normalizeText(search);
  useEffect(() => {
    if (visible && searchInputRef.current) {
      const focusTimer = window.setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      return () => window.clearTimeout(focusTimer);
    }
    return undefined;
  }, [visible]);

  const filteredDoctors = search
    ? doctors.filter(
        (doctor) =>
          normalizeText(doctor.name || '').includes(normalizedSearch) ||
          normalizeText(doctor.specialty || '').includes(normalizedSearch),
      )
    : doctors;

  const handleDoctorSelect = (doctor: DoctorRecord) => {
    onSelectDoctor?.(doctor);
    setVisible(false);
    setSearch('');
  };

  const handleAddDoctor = () => {
    dispatch(openModal({ mode: 'add' }));
    setVisible(false);
  };

  const handleCardClick = (
    e: ReactMouseEvent<HTMLElement>,
    doctor: DoctorRecord,
  ) => {
    const target = e.target as HTMLElement | null;
    if (!target?.closest('.dropdown-container')) {
      handleDoctorSelect(doctor);
    }
  };

  const handleCardKeyDown = (
    event: ReactKeyboardEvent<HTMLDivElement>,
    doctor: DoctorRecord,
  ) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    const target = event.target as HTMLElement | null;
    if (target?.closest('.dropdown-container')) {
      return;
    }
    event.preventDefault();
    handleDoctorSelect(doctor);
  };

  const openModalUpdateMode = (_event: unknown, doctor: DoctorRecord) => {
    dispatch(openModal({ mode: 'edit', doctor }));
    setVisible(false);
  };

  const getMenuItems = (doctor: DoctorRecord): MenuProps['items'] => [
    {
      key: 'edit',
      label: 'Editar',
      icon: <EditOutlined />,
      onClick: (e) => openModalUpdateMode(e, doctor),
    },
  ];

  const handleClearDoctor = (e: ReactMouseEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onSelectDoctor?.(null);
  };

  return (
    <Form.Item required validateStatus={validateStatus} help={help}>
      <DoctorInfo
        className={!selectedDoctor ? 'empty' : ''}
        onClick={() => setVisible(true)}
      >
        {!selectedDoctor ? (
          <div>
            <MedicineBoxOutlined className="selector-icon" />
            Seleccionar Médico
          </div>
        ) : (
          <>
            <div className="doctor-header">
              <span className="doctor-name">{selectedDoctor.name}</span>
              <CloseOutlined
                onClick={handleClearDoctor}
                className="clear-icon"
              />
            </div>
            <div className="doctor-details">
              <div className="detail-item">
                <div className="detail-label">Especialidad:</div>
                {selectedDoctor.specialty || 'N/A'}
              </div>
            </div>
          </>
        )}
      </DoctorInfo>

      <Drawer
        title="Lista de Médicos"
        placement="bottom"
        onClose={() => setVisible(false)}
        open={visible}
        height={'80%'}
        styles={doctorDrawerStyles}
      >
        <Wrapper>
          <Header>
            <div className="search-container">
              <Input
                ref={searchInputRef}
                placeholder="Buscar médicos..."
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSearch(e.target.value)
                }
              />
            </div>
            <Tooltip title="Agregar médico">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddDoctor}
              >
                Médico
              </Button>
            </Tooltip>
          </Header>
          <DoctorsContainer>
            {filteredDoctors.map((doctor) => (
              <DoctorCard
                key={doctor.id}
                role="button"
                tabIndex={0}
                onClick={(e) => handleCardClick(e, doctor)}
                onKeyDown={(event) => handleCardKeyDown(event, doctor)}
                $isSelected={selectedDoctor?.id === doctor.id}
              >
                <div className="card-header">
                  <div className="name">{doctor.name}</div>
                  <div className="dropdown-container">
                    <Dropdown
                      menu={{ items: getMenuItems(doctor) }}
                      trigger={['click']}
                    >
                      <Button
                        type="text"
                        className="actions"
                        icon={<MoreOutlined />}
                        onClick={(e: ReactMouseEvent<HTMLElement>) =>
                          e.stopPropagation()
                        }
                      />
                    </Dropdown>
                  </div>
                </div>
                <div className="specialty">
                  Especialidad: {doctor.specialty || 'N/A'}
                </div>
              </DoctorCard>
            ))}
          </DoctorsContainer>
        </Wrapper>
      </Drawer>
    </Form.Item>
  );
};

export default DoctorSelector;
