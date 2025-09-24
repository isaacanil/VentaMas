/*
  NOTA TEMPORAL (2025-09-23):
  Por compatibilidad con la estructura de datos actual, el campo 'type' representa la "Serie"
  y el campo 'serie' representa el "Tipo". Para evitar cambios de esquema ahora, mantenemos los
  nombres de las propiedades (name) pero mostramos las etiquetas y placeholders invertidos.
  Esta discrepancia se corregirá en una migración futura.
  TODO: Migrar modelo → renombrar 'type'→'serie' y 'serie'→'type' y ajustar referencias.
*/
import { Button, Form, Grid, Input, message, Modal, Switch } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "../../../../../../../features/auth/userSlice";
import { updateTaxReceipt } from "../../../../../../../firebase/taxReceipt/updateTaxReceipt";
import NcfSequenceSummary from "./components/NcfSequenceSummary";
import { useSequenceFinder } from "./hooks/useSequenceFinder";
import { confirmSequenceWarnings } from "./utils/confirmSequenceWarnings";
import { buildSequencePreview } from "./utils/sequencePreview";
import { createSequenceLengthResolver } from "./utils/sequenceLength";
import { createSequenceConflictChecker } from "./utils/sequenceConflicts";
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
} from "./TaxReceiptForm.styled";

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

  const normalizeDisabled = (value) => value === true || value === "true";

  useEffect(() => {
    if (currentEditItem) {
      const sequenceValue =
        currentEditItem.sequence === undefined || currentEditItem.sequence === null
          ? currentEditItem.sequence
          : String(currentEditItem.sequence);

      const valuesToSet = {
        ...currentEditItem,
        sequence: sequenceValue,
        isActive: !normalizeDisabled(currentEditItem.disabled),
      };
      form.setFieldsValue(valuesToSet);
    } else {
      form.resetFields();
    }
  }, [currentEditItem, form]);

  const toNumberIfPossible = (value) => {
    if (value === "" || value === null || value === undefined) return value;
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : value;
  };

  const serieValue = Form.useWatch("type", form);
  const tipoValue = Form.useWatch("serie", form);
  const sequenceValue = Form.useWatch("sequence", form);
  const sequenceLengthValue = Form.useWatch("sequenceLength", form);
  const increaseValue = Form.useWatch("increase", form);
  const quantityValue = Form.useWatch("quantity", form);

  const resolveSequenceLength = useMemo(
    () =>
      createSequenceLengthResolver({
        currentSequence: currentEditItem?.sequence,
        currentSequenceLength: currentEditItem?.sequenceLength,
      }),
    [currentEditItem?.sequence, currentEditItem?.sequenceLength]
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
        resolveSequenceLength,
      }),
    [user?.businessID, resolveSequenceLength]
  );

  const { findingNextSequence, handleFindNextAvailableSequence } = useSequenceFinder({
    form,
    resolveSequenceLength,
    checkSequenceConflicts,
  });

  const currentNcfPreview = previewData.current;
  const nextNcfPreview = previewData.next;
  const lastNcfPreview = previewData.last;

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
        title: "Cantidad configurada en cero",
        content: (
          <div>
            <p>
              Si guardas este comprobante con cantidad 0 no estará disponible para facturación.
            </p>
            <p>¿Deseas continuar de todos modos?</p>
          </div>
        ),
        okText: "Guardar igualmente",
        cancelText: "Cancelar",
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
        message.info("Guardado cancelado para ajustar la cantidad.");
        return;
      }

      let sequenceValidation;
      try {
        sequenceValidation = await checkSequenceConflicts(values);
      } catch (validationError) {
        console.error("Error al validar la secuencia con facturas: ", validationError);
        message.error("No se pudo verificar la disponibilidad de la secuencia. Inténtalo nuevamente.");
        return;
      }

      if (!sequenceValidation.ok) {
        if (sequenceValidation.reason === "invalid-sequence") {
          const errorMessage = "La secuencia debe contener solo dígitos.";
          form.setFields([{ name: "sequence", errors: [errorMessage] }]);
          message.error(errorMessage);
          return;
        }

        const nextCandidate =
          sequenceValidation.prefix && sequenceValidation.nextDigits
            ? `${sequenceValidation.prefix}${sequenceValidation.nextDigits.padStart(
                resolveSequenceLength(
                  sequenceValidation.nextDigits.length,
                  values.sequenceLength
                ),
                "0"
              )}`
            : null;

        if (sequenceValidation.reason === "next-sequence-used" || sequenceValidation.hasImmediateNextConflict) {
          const conflictExamples = (sequenceValidation.conflicts ?? [])
            .map((c) => c.ncf)
            .filter(Boolean)
            .slice(0, 3);

          const conflictMessageBase =
            conflictExamples.length === 1
              ? `El NCF ${conflictExamples[0]} ya existe en facturas.`
              : conflictExamples.length > 1
              ? `Los NCF ${conflictExamples.join(", ")} ya existen en facturas.`
              : nextCandidate
              ? `El NCF ${nextCandidate} ya fue utilizado en facturas.`
              : "La secuencia indicada ya fue utilizada en facturas.";

          const conflictMessage = `${conflictMessageBase} Ajusta la secuencia actual para que el próximo comprobante esté libre.`;
          form.setFields([{ name: "sequence", errors: [conflictMessage] }]);
          message.error(conflictMessage);
          return;
        }

        if (sequenceValidation.reason === "current-sequence-used") {
          form.setFields([{ name: "sequence", errors: [] }]);
        } else {
          const conflictMessage =
            nextCandidate
              ? `El NCF ${nextCandidate} ya fue utilizado en facturas. Ajusta la secuencia actual para que el próximo comprobante esté libre.`
              : "La secuencia indicada ya fue utilizada en facturas.";
          message.error(conflictMessage);
          return;
        }
      }

      const confirmed = await confirmSequenceWarnings(sequenceValidation.insights);
      if (!confirmed) {
        message.info("Guardado cancelado para revisar la secuencia.");
        return;
      }

      const { isActive, ...restValues } = values;

      const finalValues = {
        ...restValues,
        disabled:
          typeof isActive === "boolean"
            ? !isActive
            : normalizeDisabled(currentEditItem?.disabled),
        sequence: toNumberIfPossible(restValues.sequence),
        increase: toNumberIfPossible(restValues.increase),
        quantity: toNumberIfPossible(restValues.quantity),
      };

      const data = { ...currentEditItem, ...finalValues };

      await updateTaxReceipt(user, data);
      message.success("Comprobante fiscal actualizado correctamente");
      setEditModalVisible(false);
    } catch (error) {
      if (error?.errorFields) return;
      console.error("Error al guardar el comprobante fiscal:", error);
      message.error("Error al actualizar el comprobante fiscal. Por favor, inténtalo de nuevo más tarde.");
    } finally {
      setIsSaving(false);
    }
  };

  const initialFormValues = currentEditItem
    ? { ...currentEditItem, isActive: !normalizeDisabled(currentEditItem.disabled) }
    : undefined;

  return (
    <Modal
      title="Editar Comprobante Fiscal"
      open={editModalVisible}
      onCancel={() => setEditModalVisible(false)}
      width={screens.lg ? 800 : 600}
      style={{ top: 10 }}
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
      destroyOnClose
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
                    rules={[{ required: true, message: "Por favor ingrese el nombre del comprobante" }]}
                  >
                    <Input placeholder="Nombre del comprobante" />
                  </Form.Item>
                </FullRow>

                {/* AGRUPADOS DE A DOS (fijos 6+6) */}
                <Span6>
                  <Form.Item
                    name="type"
                    label="Serie"
                    rules={[{ required: true, message: "Por favor ingrese el tipo de comprobante" }]}
                  >
                    <Input placeholder="Serie" maxLength={2} />
                  </Form.Item>
                </Span6>

                <Span6>
                  <Form.Item
                    name="serie"
                    label="Tipo"
                    rules={[{ required: true, message: "Por favor ingrese la serie" }]}
                  >
                    <Input placeholder="Tipo" maxLength={2} type="number" />
                  </Form.Item>
                </Span6>

                {/* Secuencia 8 + botón 4 (fijos) */}
                <Span8>
                  <Form.Item
                    name="sequence"
                    label="Secuencia"
                    rules={[{ required: true, message: "Por favor ingrese la secuencia" }]}
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
                    rules={[{ required: true, message: "Por favor ingrese el incremento" }]}
                  >
                    <Input placeholder="Incremento" type="number" />
                  </Form.Item>
                </Span6>

                <Span6>
                  <Form.Item
                    name="quantity"
                    label="Cantidad"
                    rules={[{ required: true, message: "Por favor ingrese la cantidad" }]}
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
                </Span12>

                <Span6>
                  <Form.Item name="isActive" label="Estado" valuePropName="checked">
                    <Switch checkedChildren="Activo" unCheckedChildren="Inactivo" />
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
            </AsidePanel>
          </DesktopOnly>
        </ModalLayout>
      )}
    </Modal>
  );
}
