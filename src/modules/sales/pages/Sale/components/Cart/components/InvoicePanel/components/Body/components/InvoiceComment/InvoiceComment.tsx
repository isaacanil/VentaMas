import {
  autoUpdate,
  flip,
  offset as floatingOffset,
  shift,
  useFloating,
} from '@floating-ui/react';
import { Button, Input, Typography } from 'antd';
import {
  CommentOutlined,
  DownOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import {
  addInvoiceComment,
  deleteInvoiceComment,
  SelectInvoiceComment,
} from '@/features/cart/cartSlice';
import { useClickOutSide } from '@/hooks/useClickOutSide';

const { Text } = Typography;
const { TextArea } = Input;

export const InvoiceComment = () => {
  const dispatch = useDispatch();
  const currentComment = (useSelector(SelectInvoiceComment) as string) || '';

  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const { refs, floatingStyles } = useFloating({
    placement: 'bottom-start',
    whileElementsMounted: autoUpdate,
    middleware: [floatingOffset(10), flip({ padding: 8 }), shift({ padding: 8 })],
  });

  const setReference = useCallback(
    (node: HTMLElement | null) => refs.setReference(node),
    [refs],
  );
  const setFloating = useCallback(
    (node: HTMLElement | null) => refs.setFloating(node),
    [refs],
  );

  const referenceWidth =
    refs.reference.current instanceof HTMLElement
      ? refs.reference.current.getBoundingClientRect().width
      : null;

  useClickOutSide(containerRef, isOpen, () => setIsOpen(false));

  useEffect(() => {
    if (!isOpen) return undefined;

    const frameId = window.requestAnimationFrame(() => {
      const textarea = containerRef.current?.querySelector('textarea');

      if (!textarea) return;

      textarea.focus({ preventScroll: true });
      const cursorPosition = textarea.value.length;
      textarea.setSelectionRange(cursorPosition, cursorPosition);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [isOpen]);

  const handleOpen = () => {
    setDraft(currentComment);
    setIsOpen((prev) => !prev);
  };

  const handleSave = () => {
    dispatch(addInvoiceComment(draft.trim()));
    setIsOpen(false);
  };

  const handleDelete = () => {
    dispatch(deleteInvoiceComment());
    setDraft('');
    setIsOpen(false);
  };

  const summaryText = currentComment
    ? currentComment.length > 48
      ? `${currentComment.slice(0, 48)}...`
      : currentComment
    : 'No hay comentario para esta factura';

  return (
    <Container ref={containerRef}>
      <SummaryButton
        ref={setReference}
        type="button"
        onClick={handleOpen}
        aria-expanded={isOpen}
      >
        <SummaryContent>
          <SummaryHeading>
            <CommentOutlined />
            <Text strong>Comentario</Text>
          </SummaryHeading>
          <SummaryMeta>
            <Chevron $expanded={isOpen} />
          </SummaryMeta>
        </SummaryContent>
        <SummaryFooter>
          <Text type={currentComment ? undefined : 'secondary'}>
            {summaryText}
          </Text>
        </SummaryFooter>
      </SummaryButton>

      {isOpen && (
        <FloatingPanel
          ref={setFloating}
          style={{
            ...floatingStyles,
            width: referenceWidth ?? undefined,
          }}
        >
          <PanelBody>
            <TextArea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Agregar un comentario a la factura..."
              autoSize={{ minRows: 3, maxRows: 8 }}
              maxLength={600}
            />
            <CharCount>{draft.length}/600</CharCount>
          </PanelBody>
          <PanelActions>
            {currentComment && (
              <Button
                danger
                size="small"
                icon={<DeleteOutlined />}
                onClick={handleDelete}
              >
                Eliminar
              </Button>
            )}
            <Button type="primary" size="small" onClick={handleSave}>
              Guardar
            </Button>
          </PanelActions>
        </FloatingPanel>
      )}
    </Container>
  );
};

const Container = styled.div`
  width: 100%;
`;

const SummaryButton = styled.button`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  padding: 12px;
  border: 1px solid #d9d9d9;
  border-radius: 10px;
  background: #fafafa;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.16s ease,
    background-color 0.16s ease;

  &:hover {
    border-color: #bfbfbf;
  }
`;

const SummaryContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
`;

const SummaryHeading = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SummaryMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SummaryFooter = styled.div`
  width: 100%;
`;

const Chevron = styled(DownOutlined)<{ $expanded: boolean }>`
  color: rgba(0, 0, 0, 0.45);
  transition: transform 0.16s ease;
  transform: rotate(${({ $expanded }) => ($expanded ? '180deg' : '0deg')});
`;

const FloatingPanel = styled.div`
  display: flex;
  flex-direction: column;
  border: 1px solid #f0f0f0;
  border-radius: 10px;
  background: #ffffff;
  box-shadow: 0 10px 30px rgb(0 0 0 / 12%);
  overflow: hidden;
  z-index: 1200;
`;

const PanelBody = styled.div`
  position: relative;
  padding: 12px 12px 20px;

  .ant-input {
    font-size: 13px;
  }
`;

const CharCount = styled.span`
  position: absolute;
  right: 16px;
  bottom: 6px;
  font-size: 11px;
  color: rgba(0, 0, 0, 0.35);
`;

const PanelActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 8px 12px;
  border-top: 1px solid #f5f5f5;
  background: #fafafa;
`;
