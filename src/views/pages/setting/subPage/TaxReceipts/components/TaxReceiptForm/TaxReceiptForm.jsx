/*
  NOTA TEMPORAL (2025-09-23):
  Por compatibilidad con la estructura de datos actual, el campo 'type' representa la "Serie"
  y el campo 'serie' representa el "Tipo". Para evitar cambios de esquema ahora, mantenemos los
  nombres de las propiedades (name) pero mostramos las etiquetas y placeholders invertidos.
  Esta discrepancia se corregirá en una migración futura.
  TODO: Migrar modelo → renombrar 'type'→'serie' y 'serie'→'type' y ajustar referencias.
*/
import { Button, Form, Grid, Input, message, Modal, Switch } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '../../../../../../../features/auth/userSlice';
import { logSequenceWarning } from '../../../../../../../firebase/taxReceipt/logSequenceWarning';
import { updateTaxReceipt } from '../../../../../../../firebase/taxReceipt/updateTaxReceipt';

import NcfSequenceSummary from './components/NcfSequenceSummary';
import SequenceLedgerInsights from './components/SequenceLedgerInsights';
import { useSequenceFinder } from './hooks/useSequenceFinder';
import {
  AsidePanel,
  DesktopOnly,
  FormGrid,
  FullRow,
  MobileOnly,
  ModalLayout,
  SequenceActionItem,
  Span12,
  Span4,
  Span6,
  Span8,
} from './TaxReceiptForm.styled';
import { confirmSequenceWarnings } from './utils/confirmSequenceWarnings';
import { buildPrefix, toDigits } from './utils/ncfUtils';
import { createSequenceConflictChecker } from './utils/sequenceConflicts';
import { createSequenceLengthResolver } from './utils/sequenceLength';
import { buildSequencePreview } from './utils/sequencePreview';

/* ===== Lógica original ===== */

export default function TaxReceiptForm({
  editModalVisible,
  setEditModalVisible,
  currentEditItem,
}) {
  const [form] = Form.useForm();
  const user = useSelector(selectUser);
  const [isSaving, setIsSaving] = useState(false);
  const screens = Grid.useBreakpoint();
  const [sequenceAnalysis, setSequenceAnalysis] = useState({
    status: 'idle',
    result: null,
    error: null,
  });
  const analysisRequestRef = useRef(0);

  const normalizeDisabled = (value) => value === true || value === 'true';

  useEffect(() => {
    if (currentEditItem) {
      form.resetFields();
      const sequenceValue =
        currentEditItem.sequence === undefined ||
        currentEditItem.sequence === null
          ? currentEditItem.sequence
          : String(currentEditItem.sequence);

      const valuesToSet = {
        ...currentEditItem,
        sequence: sequenceValue,
        isActive: !normalizeDisabled(currentEditItem.disabled),
      };
      form.setFieldsValue(valuesToSet);
    }
  }, [currentEditItem, form]);

  const toNumberIfPossible = (value) => {
    if (value === '' || value === null || value === undefined) return value;
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : value;
  };

  const serieValue = Form.useWatch('type', form);
  const tipoValue = Form.useWatch('serie', form);
  const sequenceValue = Form.useWatch('sequence', form);
  const sequenceLengthValue = Form.useWatch('sequenceLength', form);
  const increaseValue = Form.useWatch('increase', form);
  const quantityValue = Form.useWatch('quantity', form);

  const resolveSequenceLength = useMemo(
    () =>
      createSequenceLengthResolver({
        currentSequence: currentEditItem?.sequence,
        currentSequenceLength: currentEditItem?.sequenceLength,
      }),
    [currentEditItem?.sequence, currentEditItem?.sequenceLength],
  );

  const previewData = buildSequencePreview({
    serieValue,
    tipoValue,
    sequenceValue,
    sequenceLengthValue,
    increaseValue,
    quantityValue,
    resolveSequenceLength,
  });

  const checkSequenceConflicts = useMemo(
    () =>
      createSequenceConflictChecker({
        businessID: user?.businessID,
        userID: user?.uid,
        resolveSequenceLength,
      }),
    [user?.businessID, user?.uid, resolveSequenceLength],
  );

  const { findingNextSequence, handleFindNextAvailableSequence } =
    useSequenceFinder({
      form,
      resolveSequenceLength,
      checkSequenceConflicts,
    });

  const currentNcfPreview = previewData.current;
  const nextNcfPreview = previewData.next;
  const lastNcfPreview = previewData.last;
  const previewSequenceLength = previewData.sequenceLength;
  const previewPrefix = previewData.prefix;

  useEffect(() => {
    if (!checkSequenceConflicts) return undefined;

    const prefix = buildPrefix(serieValue, tipoValue);
    const digits = toDigits(sequenceValue ?? '');
    if (!prefix || !digits) {
      setSequenceAnalysis({ status: 'idle', result: null, error: null });
      return undefined;
    }

    const pendingValues = form.getFieldsValue([
      'type',
      'serie',
      'sequence',
      'sequenceLength',
      'increase',
      'quantity',
    ]);

    const requestId = analysisRequestRef.current + 1;
    analysisRequestRef.current = requestId;

    const handle = setTimeout(() => {
      setSequenceAnalysis((prev) => ({
        status: 'loading',
        result: prev.result,
        error: null,
      }));

      checkSequenceConflicts(pendingValues)
        .then((result) => {
          if (analysisRequestRef.current !== requestId) return;
          setSequenceAnalysis({ status: 'success', result, error: null });
        })
        .catch((error) => {
          if (analysisRequestRef.current !== requestId) return;
          setSequenceAnalysis({ status: 'error', result: null, error });
        });
    }, 350);

    return () => {
      clearTimeout(handle);
    };
  }, [
    checkSequenceConflicts,
    form,
    serieValue,
    tipoValue,
    sequenceValue,
    sequenceLengthValue,
    increaseValue,
    quantityValue,
  ]);

  const confirmZeroQuantity = (quantity) => {
    const numericQuantity = Number(quantity);
    if (!Number.isFinite(numericQuantity) || numericQuantity !== 0) {
      return Promise.resolve(true);
    }

    return new Promise((resolve) => {
      let settled = false;
      const safeResolve = (value) => {
        if (!settled) {
          settled = true;
          resolve(value);
        }
      };

      Modal.confirm({
        title: 'Cantidad configurada en cero',
        content: (
          <div>
            <p>
              Si guardas este comprobante con cantidad 0 no estará disponible
              para facturación.
            </p>
            <p>¿Deseas continuar de todos modos?</p>
          </div>
        ),
        okText: 'Guardar igualmente',
        cancelText: 'Cancelar',
        centered: true,
        onOk: () => safeResolve(true),
        onCancel: () => safeResolve(false),
        afterClose: () => safeResolve(false),
      });
    });
  };

  const handleSaveEdit = async () => {
    if (isSaving) return;

    try {
      setIsSaving(true);
      const values = await form.validateFields();

      const zeroQuantityConfirmed = await confirmZeroQuantity(values.quantity);
      if (!zeroQuantityConfirmed) {
        message.info('Guardado cancelado para ajustar la cantidad.');
        return;
      }

      let sequenceValidation;
      try {
        sequenceValidation = await checkSequenceConflicts(values);
      } catch (validationError) {
        console.error(
          'Error al validar la secuencia con facturas: ',
          validationError,
        );
        message.error(
          'No se pudo verificar la disponibilidad de la secuencia. Inténtalo nuevamente.',
        );
        return;
      }

      if (!sequenceValidation.ok) {
        if (sequenceValidation.reason === 'invalid-sequence') {
          const errorMessage = 'La secuencia debe contener solo dígitos.';
          form.setFields([{ name: 'sequence', errors: [errorMessage] }]);
          message.error(errorMessage);
          return;
        }

        const nextCandidate =
          sequenceValidation.prefix && sequenceValidation.nextDigits
            ? `${sequenceValidation.prefix}${sequenceValidation.nextDigits.padStart(
                resolveSequenceLength(
                  sequenceValidation.nextDigits.length,
                  values.sequenceLength,
                ),
                '0',
              )}`
            : null;

        if (
          sequenceValidation.reason === 'next-sequence-used' ||
          sequenceValidation.hasImmediateNextConflict
        ) {
          const conflictExamples = (sequenceValidation.conflicts ?? [])
            .map((c) => c.ncf)
            .filter(Boolean)
            .slice(0, 3);

          const conflictMessageBase =
            conflictExamples.length === 1
              ? `El próximo NCF (${conflictExamples[0]}) ya fue emitido.`
              : conflictExamples.length > 1
                ? `Los próximos NCF (${conflictExamples.join(', ')}) ya fueron emitidos.`
                : nextCandidate
                  ? `El próximo NCF (${nextCandidate}) ya fue emitido.`
                  : 'La secuencia indicada ya fue utilizada previamente.';

          const conflictMessage = `${conflictMessageBase} Ajusta la secuencia actual para que el próximo comprobante esté libre.`;
          form.setFields([{ name: 'sequence', errors: [conflictMessage] }]);
          message.error(conflictMessage);
          return;
        }

        if (sequenceValidation.reason === 'current-sequence-used') {
          form.setFields([{ name: 'sequence', errors: [] }]);
        } else {
          const conflictMessage = nextCandidate
            ? `El próximo NCF (${nextCandidate}) ya fue emitido. Ajusta la secuencia actual para que el próximo comprobante esté libre.`
            : 'La secuencia indicada ya fue utilizada previamente.';
          message.error(conflictMessage);
          return;
        }
      }

      const warningDecision = await confirmSequenceWarnings(sequenceValidation);
      if (!warningDecision.accepted) {
        message.info('Guardado cancelado para revisar la secuencia.');
        return;
      }

      if (warningDecision.warned) {
        try {
          await logSequenceWarning({
            businessId: user?.businessID,
            userId: user?.uid,
            userEmail: user?.email,
            receiptId: currentEditItem?.id,
            formValues: values,
            validation: sequenceValidation,
          });
        } catch (auditError) {
          console.error(
            'No se pudo registrar la auditoría de advertencia de NCF:',
            auditError,
          );
        }
      }

      const { isActive, ...restValues } = values;

      const finalValues = {
        ...restValues,
        disabled:
          typeof isActive === 'boolean'
            ? !isActive
            : normalizeDisabled(currentEditItem?.disabled),
        sequence: toNumberIfPossible(restValues.sequence),
        increase: toNumberIfPossible(restValues.increase),
        quantity: toNumberIfPossible(restValues.quantity),
      };

      const data = { ...currentEditItem, ...finalValues };

      await updateTaxReceipt(user, data);
      message.success('Comprobante fiscal actualizado correctamente');
      setEditModalVisible(false);
    } catch (error) {
      if (error?.errorFields) return;
      console.error('Error al guardar el comprobante fiscal:', error);
      message.error(
        'Error al actualizar el comprobante fiscal. Por favor, inténtalo de nuevo más tarde.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const initialFormValues = currentEditItem
    ? {
        ...currentEditItem,
        isActive: !normalizeDisabled(currentEditItem.disabled),
      }
    : undefined;

  return (
    <Modal
      title="Editar Comprobante Fiscal"
      open={editModalVisible}
      onCancel={() => setEditModalVisible(false)}
      width={screens.lg ? 800 : 600}
      style={{ top: '10px' }}
      footer={[
        <Button key="cancel" onClick={() => setEditModalVisible(false)}>
          Cancelar
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleSaveEdit}
          loading={isSaving}
          disabled={isSaving}
        >
          Guardar
        </Button>,
      ]}
      destroyOnHidden
    >
      {currentEditItem && (
        <ModalLayout>
          {/* Columna principal */}
          <div>
            <Form
              form={form}
              layout="vertical"
              name="editTaxReceiptForm"
              initialValues={initialFormValues}
            >
              <FormGrid>
                {/* FILA ENTERA: Nombre */}
                <FullRow>
                  <Form.Item
                    name="name"
                    label="Nombre"
                    rules={[
                      {
                        required: true,
                        message: 'Por favor ingrese el nombre del comprobante',
                      },
                    ]}
                  >
                    <Input placeholder="Nombre del comprobante" />
                  </Form.Item>
                </FullRow>

                {/* AGRUPADOS DE A DOS (fijos 6+6) */}
                <Span6>
                  <Form.Item
                    name="type"
                    label="Serie"
                    rules={[
                      {
                        required: true,
                        message: 'Por favor ingrese el tipo de comprobante',
                      },
                    ]}
                  >
                    <Input placeholder="Serie" maxLength={2} />
                  </Form.Item>
                </Span6>

                <Span6>
                  <Form.Item
                    name="serie"
                    label="Tipo"
                    rules={[
                      { required: true, message: 'Por favor ingrese la serie' },
                    ]}
                  >
                    <Input placeholder="Tipo" maxLength={2} type="number" />
                  </Form.Item>
                </Span6>

                {/* Secuencia 8 + botón 4 (fijos) */}
                <Span8>
                  <Form.Item
                    name="sequence"
                    label="Secuencia"
                    rules={[
                      {
                        required: true,
                        message: 'Por favor ingrese la secuencia',
                      },
                    ]}
                  >
                    <Input placeholder="Secuencia" maxLength={10} />
                  </Form.Item>
                </Span8>

                <Span4>
                  <SequenceActionItem label=" " colon={false}>
                    <Button
                      type="primary"
                      onClick={handleFindNextAvailableSequence}
                      loading={findingNextSequence}
                      disabled={findingNextSequence}
                    >
                      Buscar disponible
                    </Button>
                  </SequenceActionItem>
                </Span4>

                {/* Incremento y Cantidad (6+6 fijos) */}
                <Span6>
                  <Form.Item
                    name="increase"
                    label="Incremento"
                    rules={[
                      {
                        required: true,
                        message: 'Por favor ingrese el incremento',
                      },
                    ]}
                  >
                    <Input placeholder="Incremento" type="number" />
                  </Form.Item>
                </Span6>

                <Span6>
                  <Form.Item
                    name="quantity"
                    label="Cantidad"
                    rules={[
                      {
                        required: true,
                        message: 'Por favor ingrese la cantidad',
                      },
                    ]}
                  >
                    <Input placeholder="Cantidad" type="number" />
                  </Form.Item>
                </Span6>

                {/* Resumen solo en móvil/tablet (la parrilla de campos NO cambia) */}
                <Span12 as={MobileOnly}>
                  <NcfSequenceSummary
                    current={currentNcfPreview}
                    next={nextNcfPreview}
                    last={lastNcfPreview}
                    quantity={quantityValue}
                    increment={increaseValue}
                  />
                  <SequenceLedgerInsights
                    analysisState={sequenceAnalysis}
                    displayLength={previewSequenceLength}
                    prefix={previewPrefix}
                  />
                </Span12>

                <Span6>
                  <Form.Item
                    name="isActive"
                    label="Estado"
                    valuePropName="checked"
                  >
                    <Switch
                      checkedChildren="Activo"
                      unCheckedChildren="Inactivo"
                    />
                  </Form.Item>
                </Span6>
              </FormGrid>
            </Form>
          </div>

          {/* ASIDE solo escritorio */}
          <DesktopOnly>
            <AsidePanel>
              <NcfSequenceSummary
                current={currentNcfPreview}
                next={nextNcfPreview}
                last={lastNcfPreview}
                quantity={quantityValue}
                increment={increaseValue}
              />
              <SequenceLedgerInsights
                analysisState={sequenceAnalysis}
                displayLength={previewSequenceLength}
                prefix={previewPrefix}
              />
            </AsidePanel>
          </DesktopOnly>
        </ModalLayout>
      )}
    </Modal>
  );
}
