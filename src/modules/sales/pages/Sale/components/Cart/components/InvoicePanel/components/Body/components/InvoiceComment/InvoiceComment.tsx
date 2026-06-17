import {
  autoUpdate,
  flip,
  offset as floatingOffset,
  shift,
  size,
  useFloating,
} from '@floating-ui/react';
import { Button, Input, Typography } from 'antd';
import {
  CommentOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
  addInvoiceComment,
  deleteInvoiceComment,
  SelectInvoiceComment,
} from '@/features/cart/cartSlice';
import { useClickOutSide } from '@/hooks/useClickOutSide';

import {
  CharCount,
  Chevron,
  Container,
  FloatingPanel,
  PanelActions,
  PanelBody,
  SummaryButton,
  SummaryContent,
  SummaryFooter,
  SummaryHeading,
  SummaryMeta,
} from './InvoiceComment.styles';

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
    middleware: [
      floatingOffset(10),
      flip({ padding: 8 }),
      shift({ padding: 8 }),
      size({
        apply({ rects, elements }) {
          Object.assign(elements.floating.style, {
            width: `${rects.reference.width}px`,
          });
        },
      }),
    ],
  });

  const setReference = useCallback(
    (node: HTMLElement | null) => refs.setReference(node),
    [refs],
  );
  const setFloating = useCallback(
    (node: HTMLElement | null) => refs.setFloating(node),
    [refs],
  );

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
          style={floatingStyles}
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
