import { InfoCircleOutlined } from '@/constants/icons/antd';
import { Tooltip } from 'antd';

import {
  HintTrigger,
  QuantityDisplay,
  QuantityLimit,
  QuantityValue,
  TooltipDivider,
  TooltipFormula,
  TooltipLine,
  TooltipTitle,
} from './QuantityAvailabilityHint.styles';

type QuantityAvailabilityDisplayProps = {
  quantity: number;
  displayQuantity: number;
};

type QuantityAvailabilityHintProps = {
  displayQuantity: number;
  originalQuantity: number;
  creditedByOthers: number;
  maxQuantity: number;
  compact?: boolean;
  formulaMode?: 'numeric' | 'label';
};

export const QuantityAvailabilityDisplay = ({
  quantity,
  displayQuantity,
}: QuantityAvailabilityDisplayProps) => (
  <QuantityDisplay>
    <QuantityValue>{quantity}</QuantityValue>
    <QuantityLimit>/{displayQuantity}</QuantityLimit>
  </QuantityDisplay>
);

export const QuantityAvailabilityHint = ({
  displayQuantity,
  originalQuantity,
  creditedByOthers,
  maxQuantity,
  compact = false,
  formulaMode = 'numeric',
}: QuantityAvailabilityHintProps) => {
  const formula =
    formulaMode === 'label'
      ? `Formula: Factura - Otras NC = ${originalQuantity} - ${creditedByOthers} = ${maxQuantity}`
      : `Formula: ${originalQuantity} - ${creditedByOthers} = ${maxQuantity}`;

  return (
    <Tooltip
      title={
        <div>
          <TooltipTitle>Calculo de cantidad maxima</TooltipTitle>
          <TooltipLine>- Factura original: {originalQuantity}</TooltipLine>
          <TooltipLine>
            - Acreditado en otras NC: {creditedByOthers}
          </TooltipLine>
          <TooltipDivider>
            <strong>Maximo disponible: {maxQuantity}</strong>
          </TooltipDivider>
          <TooltipFormula>{formula}</TooltipFormula>
        </div>
      }
      placement="topLeft"
    >
      <HintTrigger $compact={compact}>
        /{displayQuantity} <InfoCircleOutlined />
      </HintTrigger>
    </Tooltip>
  );
};
