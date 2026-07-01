import {
  QuantityAvailabilityDisplay,
  QuantityAvailabilityHint,
} from './QuantityAvailabilityHint';
import {
  QuantityEditor,
  QuantityInput,
} from './QuantityAvailabilityHint.styles';

type CreditNoteQuantityControlProps = {
  quantity: number;
  displayQuantity: number;
  originalQuantity: number;
  creditedByOthers: number;
  maxQuantity: number;
  minQuantity?: number;
  step?: number;
  isEditable: boolean;
  onQuantityChange: (value: number | null) => void;
  compact?: boolean;
  formulaMode?: 'numeric' | 'label';
};

export const CreditNoteQuantityControl = ({
  quantity,
  displayQuantity,
  originalQuantity,
  creditedByOthers,
  maxQuantity,
  minQuantity = 1,
  step = 1,
  isEditable,
  onQuantityChange,
  compact = false,
  formulaMode = 'numeric',
}: CreditNoteQuantityControlProps) => {
  if (!isEditable) {
    return (
      <QuantityAvailabilityDisplay
        quantity={quantity}
        displayQuantity={displayQuantity}
      />
    );
  }

  return (
    <QuantityEditor>
      <QuantityInput
        min={minQuantity}
        max={maxQuantity}
        step={step}
        value={quantity}
        onChange={(value) =>
          onQuantityChange(typeof value === 'number' ? value : null)
        }
        size="small"
      />
      <QuantityAvailabilityHint
        displayQuantity={displayQuantity}
        originalQuantity={originalQuantity}
        creditedByOthers={creditedByOthers}
        maxQuantity={maxQuantity}
        compact={compact}
        formulaMode={formulaMode}
      />
    </QuantityEditor>
  );
};
