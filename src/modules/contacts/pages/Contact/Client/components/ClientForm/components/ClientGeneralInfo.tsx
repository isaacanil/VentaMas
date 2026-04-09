import { AnimatePresence, m } from 'framer-motion';
import { GlobalOutlined } from '@/constants/icons/antd';
import { Form, Input, Button } from 'antd';
import type { FormInstance } from 'antd';
import { useEffect, type KeyboardEvent } from 'react';
import styled from 'styled-components';

import { useRncSearch } from '@/hooks/useRncSearch';
import { DgiiSyncAlert } from '@/modules/contacts/components/Rnc/DgiiSyncAlert/DgiiSyncAlert';
import { RncPanel } from '@/modules/contacts/components/Rnc/RncPanel/RncPanel';
import type { ClientInput } from '@/firebase/client/clientNormalizer';

const Wrapper = styled.div<{ $hasRnc?: boolean }>`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5em;
`;

type ClientGeneralInfoProps = {
  form: FormInstance;
  customerData: ClientInput;
  onRncPanelChange?: (hasPanel: boolean) => void;
};

export const ClientGeneralInfo = ({
  form,
  customerData,
  onRncPanelChange,
}: ClientGeneralInfoProps) => {
  const {
    loading,
    error,
    rncInfo,
    differences,
    consultarRNC,
    syncWithDgii,
    compareDgiiData,
  } = useRncSearch(form, 'personalID');

  const hasRncPanel = !!(loading || rncInfo);

  useEffect(() => {
    onRncPanelChange?.(hasRncPanel);
    return () => onRncPanelChange?.(false);
  }, [hasRncPanel, onRncPanelChange]);

  // Add formValues watch for comparison
  const formValues = Form.useWatch([], form) as Record<string, string | number>;

  // Add effects for RNC handling
  useEffect(() => {
    if (rncInfo && formValues) {
      compareDgiiData(formValues, rncInfo);
    }
  }, [formValues, rncInfo, compareDgiiData]);

  useEffect(() => {
    // Check RNC when component loads with customerData
    if (customerData?.personalID) {
      const rnc = customerData.personalID.trim();
      if (rnc.length >= 9 && rnc.length <= 11) {
        consultarRNC(rnc, true); // true for silent mode
      }
    }
  }, [customerData?.personalID, consultarRNC]);

  const handleRNCSearch = (value: string) => {
    const rnc = (value || form.getFieldValue('personalID'))?.trim();
    if (rnc && rnc.length >= 9 && rnc.length <= 11) {
      consultarRNC(rnc);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.stopPropagation(); // Previene que el evento llegue al document
    }
  };

  return (
    <Wrapper $hasRnc={hasRncPanel} as={m.div} layout>
      <m.div layout>
        {differences.length > 0 && (
          <DgiiSyncAlert
            differences={differences}
            onSync={syncWithDgii}
            loading={loading}
          />
        )}
        <Form
          form={form}
          layout="vertical"
          name="form_in_modal"
          initialValues={{
            ...customerData,
            modifier: 'public',
          }}
        >
          <Form.Item
            name="personalID"
            label={<span>Cédula/RNC</span>}
            validateStatus={error ? 'error' : undefined}
            help={
              error ? (
                <span style={{ color: '#ff4d4f' }}>{error}</span>
              ) : rncInfo?.status === 'SUSPENDIDO' ? (
                <span style={{ color: '#e49800', fontSize: '13px' }}>
                  ⚠️ Este RNC se encuentra actualmente suspendido en la DGII
                </span>
              ) : rncInfo?.status === 'DADO DE BAJA' ? (
                <span style={{ color: '#ff4d4f', fontSize: '13px' }}>
                  ⚠️ Este RNC se encuentra dado de baja en la DGII
                </span>
              ) : null
            }
          >
            <Input.Search
              placeholder="Cédula o RNC"
              enterButton={
                <Button type="primary" icon={<GlobalOutlined />}>
                  Buscar RNC
                </Button>
              }
              onSearch={handleRNCSearch}
              onKeyDown={handleKeyDown}
              loading={loading}
              disabled={loading}
            />
          </Form.Item>

          {error && (
            <p
              style={{ color: 'red', marginTop: '-10px', marginBottom: '10px' }}
            >
              {error}
            </p>
          )}

          <Form.Item
            name="name"
            label="Nombre Completo"
            rules={[
              {
                required: true,
                message: 'Por favor ingrese el nombre del cliente',
              },
            ]}
          >
            <Input />
          </Form.Item>
          <FlexContainer>
            <Form.Item
              name="tel"
              label="Teléfono 1"
              style={{
                width: '100%',
              }}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="tel2"
              label="Teléfono 2"
              style={{
                width: '100%',
              }}
            >
              <Input />
            </Form.Item>
          </FlexContainer>

          <Form.Item name="address" label="Dirección">
            <Input />
          </Form.Item>
          <Form.Item name="sector" label="Sector">
            <Input />
          </Form.Item>
          <Form.Item name="province" label="Provincia">
            <Input />
          </Form.Item>
        </Form>
      </m.div>
      <AnimatePresence>
        {hasRncPanel && (
          <m.div
            layout
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <RncPanel rncInfo={rncInfo} loading={loading} />
          </m.div>
        )}
      </AnimatePresence>
    </Wrapper>
  );
};

const FlexContainer = styled.div`
  display: flex;
  flex-grow: 1;
  gap: 1em;
`;
