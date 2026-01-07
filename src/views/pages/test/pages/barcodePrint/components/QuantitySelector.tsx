// @ts-nocheck
import { InputNumber } from 'antd';
import React from 'react';

const clampInt = (n, min, max) => {
  const x = Number.isFinite(n) ? Math.floor(n) : min;
  return Math.max(min, Math.min(max, x));
};

const QuantitySelector = ({
  quantity,
  onChange,
  max = 100,
  disabled = false,
}) => {
  const handleChange = (value) => {
    // AntD InputNumber puede entregar number o '' (string vacía) al limpiar
    // Normalizamos a entero entre 1 y max
    if (value === '' || value === null || value === undefined) {
      onChange(1);
      return;
    }
    const n = typeof value === 'string' ? parseFloat(value) : value;
    onChange(clampInt(n, 1, max));
  };

  const handleBlur = (e) => {
    const raw = e?.target?.value;
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
