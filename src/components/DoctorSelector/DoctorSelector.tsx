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
} from 'antd';
import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { openModal } from '@/features/doctors/doctorsSlice';
import type { DoctorRecord } from '@/types/doctors';
import { normalizeText } from '@/utils/text';

const Wrapper = styled.div`
  display: grid;
  grid-template-rows: min-content 1fr;
  gap: 8px;
  height: 100%;
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 0 1em;

  & .search-container {
    flex: 1;
  }
`;

const DoctorsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
  align-content: start;
  padding: 0 1em;
  overflow-y: auto;
`;

interface DoctorCardProps {
  $isSelected?: boolean;
}

const DoctorCard = styled.div<DoctorCardProps>`
  padding: 12px;
  cursor: pointer;
  background-color: ${(props) => (props.$isSelected ? '#e6f7ff' : 'white')};
  border: 1px solid ${(props) => (props.$isSelected ? '#1890ff' : '#e8e8e8')};
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 2px 8px rgb(0 0 0 / 10%);
  }

  & .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 4px;
  }

  & .actions {
    padding: 4px;
    color: #8c8c8c;
    border-radius: 4px;

    &:hover {
      background-color: rgb(0 0 0 / 4%);
    }
  }

  & .name {
    font-size: 14px;
    font-weight: 500;
    color: #262626;
  }

  & .specialty {
    font-size: 12px;
    color: #8c8c8c;
  }
`;

const DoctorInfo = styled.div`
  padding: 0.4em 0.6em 0.6em;
  cursor: pointer;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  transition: all 0.2s;

  &:hover {
    border-color: #40a9ff;
  }

  &.empty {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100px;
    color: #8c8c8c;
  }

  & .doctor-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 4px;
  }

  & .doctor-name {
    font-size: 16px;
    font-weight: 500;
    color: #262626;
  }

  & .doctor-details {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 1.3em;
    font-size: 14px;
    line-height: 1.1pc;
    color: #595959;
  }

  & .detail-item {
    gap: 4px;
  }

  & .detail-label {
    font-size: 12px;
    color: #40a9ff;
  }
`;

interface DoctorSelectorProps {
  doctors?: DoctorRecord[];
  selectedDoctor?: DoctorRecord | null;
  onSelectDoctor?: (doctor: DoctorRecord | null) => void;
  validateStatus?: FormItemProps['validateStatus'];
  help?: FormItemProps['help'];
}

const DoctorSelector = ({
  doctors = [],
  selectedDoctor,
  onSelectDoctor,
  validateStatus,
  help,
}: DoctorSelectorProps) => {
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');
  const searchInputRef = useRef<InputRef | null>(null);
  const dispatch = useDispatch();

  useEffect(() => {
    if (visible && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [visible]);

  const filteredDoctors = search
    ? doctors.filter(
        (doctor) =>
          normalizeText(doctor.name || '').includes(normalizeText(search)) ||
          normalizeText(doctor.specialty || '').includes(normalizeText(search)),
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

  const openModalUpdateMode = (_event: unknown, doctor: DoctorRecord) => {
    dispatch(openModal({ mode: 'edit', doctor }));
    setVisible(false);
  };

  const getMenuItems = (doctor: DoctorRecord) => [
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
            <MedicineBoxOutlined style={{ marginRight: '8px' }} />
            Seleccionar Médico
          </div>
        ) : (
          <>
            <div className="doctor-header">
              <span className="doctor-name">{selectedDoctor.name}</span>
              <CloseOutlined
                onClick={handleClearDoctor}
                style={{ cursor: 'pointer', color: '#8c8c8c' }}
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
        styles={{
          body: { padding: '1em' },
        }}
      >
        <Wrapper>
          <Header>
            <div className="search-container">
              <Input
                ref={searchInputRef}
                placeholder="Buscar médicos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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
                onClick={(e) => handleCardClick(e, doctor)}
                $isSelected={selectedDoctor?.id === doctor.id}
              >
                <div className="card-header">
                  <div className="name">{doctor.name}</div>
                  <div
                    className="dropdown-container"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Dropdown
                      menu={{ items: getMenuItems(doctor) }}
                      trigger={['click']}
                    >
                      <Button
                        type="text"
                        className="actions"
                        icon={<MoreOutlined />}
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
