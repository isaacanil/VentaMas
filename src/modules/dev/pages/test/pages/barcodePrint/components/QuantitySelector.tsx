import { InputNumber } from 'antd';
import React from 'react';

const clampInt = (n: number, min: number, max: number) => {
  const x = Number.isFinite(n) ? Math.floor(n) : min;
  return Math.max(min, Math.min(max, x));
};

interface QuantitySelectorProps {
  quantity: number;
  onChange: (value: number) => void;
  max?: number;
  disabled?: boolean;
}

const QuantitySelector = ({
  quantity,
  onChange,
  max = 100,
  disabled = false,
}: QuantitySelectorProps) => {
  const handleChange = (value: number | string | null) => {
    // AntD InputNumber puede entregar number o '' (string vacía) al limpiar
    // Normalizamos a entero entre 1 y max
    if (value === '' || value === null || value === undefined) {
      onChange(1);
      return;
    }
    const n = typeof value === 'string' ? parseFloat(value) : value;
    onChange(clampInt(n, 1, max));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const n = raw === '' ? 1 : Number(raw);
    onChange(clampInt(n, 1, max));
  };

  return (
    <div className="quantity-input-group">
      <InputNumber
        value={quantity}
        min={1}
        max={max}
        step={1}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={disabled}
        style={{ width: '100%' }}
        controls
      />
    </div>
  );
};

export default QuantitySelector;
