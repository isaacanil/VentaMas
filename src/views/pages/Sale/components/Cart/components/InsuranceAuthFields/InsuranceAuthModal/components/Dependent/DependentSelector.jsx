import {
  PlusOutlined,
  EditOutlined,
  MoreOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { Form, Input, Button, Drawer, Tooltip, Dropdown } from 'antd';
import { DateTime } from 'luxon';
import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { normalizeText } from '../../../../../../../../../../utils/text';

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

  .search-container {
    flex: 1;
  }
`;

const DependentsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
  align-content: start;
  padding: 0 1em;
  overflow-y: auto;
`;

const DependentCard = styled.div`
  padding: 12px;
  cursor: pointer;
  background-color: ${(props) => (props.$isSelected ? '#e6f7ff' : 'white')};
  border: 1px solid ${(props) => (props.$isSelected ? '#1890ff' : '#e8e8e8')};
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 2px 8px rgb(0 0 0 / 10%);
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 4px;
  }

  .actions {
    padding: 4px;
    color: #8c8c8c;
    border-radius: 4px;

    &:hover {
      background-color: rgb(0 0 0 / 4%);
    }
  }

  .name {
    font-size: 14px;
    font-weight: 500;
    color: #262626;
  }

  .relationship {
    font-size: 12px;
    color: #8c8c8c;
  }
`;

const DependentInfo = styled.div`
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

  .dependent-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 4px;
  }

  .dependent-name {
    font-size: 16px;
    font-weight: 500;
    color: #262626;
  }

  .dependent-details {
    display: flex;
    gap: 0.4em 1.6em;
    font-size: 14px;
    line-height: 1pc;
    color: #595959;
  }

  .detail-item {
    gap: 4px;
  }

  .detail-label {
    font-size: 12px;
    color: #40a9ff;
  }
`;

const translateRelationship = (relationship) => {
  const translations = {
    // English to Spanish translations
    child: 'Hijo/a',
    spouse: 'Cónyuge',
    father: 'Padre',
    mother: 'Madre',
    other: 'Otro',
    // Keep old translations for backward compatibility
    hijo: 'Hijo/a',
    conyuge: 'Cónyuge',
    padre: 'Padre',
    madre: 'Madre',
    otro: 'Otro',
  };

  return translations[relationship] || relationship;
};

const getGenderText = (gender) => (gender === 'M' ? 'Masculino' : 'Femenino');

// Calculate age function with Luxon
const calculateAge = (birthDateIso) => {
  if (!birthDateIso) return 'N/A';

  try {
    const birthDate = DateTime.fromISO(birthDateIso);
    const now = DateTime.now();
    const diff = now.diff(birthDate, 'years');
    return Math.floor(diff.years);
  } catch (error) {
    console.error('Error calculating age:', error);
    return 'N/A';
  }
};

const DependentSelector = ({
  dependents = [],
  selectedDependent,
  onSelectDependent,
  onAddDependent,
  onEditDependent,
  validateStatus,
  help,
}) => {
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (visible && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current.focus();
      }, 100);
    }
  }, [visible]);

  const filteredDependents = search
    ? dependents.filter((dependent) =>
        normalizeText(dependent.name).includes(normalizeText(search)),
      )
    : dependents;

  const handleDependentSelect = (dependent) => {
    onSelectDependent?.(dependent);
    setVisible(false);
    setSearch('');
  };

  const handleCardClick = (e, dependent) => {
    if (!e.target.closest('.dropdown-container')) {
      if (selectedDependent?.id === dependent.id) return;
      handleDependentSelect(dependent);
    }
  };

  const openModalUpdateMode = (e, dependent) => {
    e.stopPropagation();
    onEditDependent?.(dependent);
    setVisible(false);
  };

  const getMenuItems = (dependent) => [
    {
      key: 'edit',
      label: 'Editar',
      icon: <EditOutlined />,
      onClick: (e) => openModalUpdateMode(e, dependent),
    },
  ];

  const handleClearDependent = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onSelectDependent?.(null);
  };

  const formatDate = (isoDate) => {
    if (!isoDate) return 'N/A';
    const date = new Date(isoDate);
    return date.toLocaleDateString('es-ES');
  };

  return (
    <Form.Item
      label="Dependiente"
      required={false}
      validateStatus={validateStatus}
      help={help}
    >
      <DependentInfo
        className={!selectedDependent ? 'empty' : ''}
        onClick={() => setVisible(true)}
      >
        {!selectedDependent ? (
          <div>
            <PlusOutlined style={{ marginRight: 8 }} />
            Seleccionar Dependiente (Opcional)
          </div>
        ) : (
          <>
            <div className="dependent-header">
              <span className="dependent-name">{selectedDependent.name}</span>
              <CloseOutlined
                onClick={handleClearDependent}
                style={{ cursor: 'pointer', color: '#8c8c8c' }}
              />
            </div>
            <div className="dependent-details">
              <div className="detail-item">
                <div className="detail-label">Parentesco:</div>
                {translateRelationship(selectedDependent.relationship)}
              </div>
              <div className="detail-item">
                <div className="detail-label">Género:</div>
                {getGenderText(selectedDependent.gender)}
              </div>
              <div className="detail-item">
                <div className="detail-label">Edad:</div>
                {calculateAge(selectedDependent.birthDate)} años
              </div>
              <div className="detail-item">
                <div className="detail-label">Fecha de nacimiento:</div>
                {formatDate(selectedDependent.birthDate)}
              </div>
            </div>
          </>
        )}
      </DependentInfo>

      <Drawer
        title="Lista de Dependientes"
        placement="bottom"
        onClose={() => {
          setVisible(false);
          setSearch('');
        }}
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
                placeholder="Buscar dependientes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Tooltip title="Agregar dependiente">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={onAddDependent}
              >
                Dependiente
              </Button>
            </Tooltip>
          </Header>
          <DependentsContainer>
            {filteredDependents.length > 0 ? (
              filteredDependents.map((dependent) => (
                <DependentCard
                  key={dependent.id}
                  onClick={(e) => handleCardClick(e, dependent)}
                  $isSelected={selectedDependent?.id === dependent.id}
                >
                  <div className="card-header">
                    <div className="name">{dependent.name}</div>
                    <div
                      className="dropdown-container"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Dropdown
                        menu={{ items: getMenuItems(dependent) }}
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
                  <div className="relationship">
                    {translateRelationship(dependent.relationship)} •{' '}
                    {getGenderText(dependent.gender)} •{' '}
                    {calculateAge(dependent.birthDate)} años
                  </div>
                </DependentCard>
              ))
            ) : (
              <div
                style={{
                  gridColumn: '1 / -1',
                  textAlign: 'center',
                  padding: '20px',
                  color: '#8c8c8c',
                }}
              >
                No se encontraron dependientes
                {search && ` que coincidan con "${search}"`}
              </div>
            )}
          </DependentsContainer>
        </Wrapper>
      </Drawer>
    </Form.Item>
  );
};

export default DependentSelector;
