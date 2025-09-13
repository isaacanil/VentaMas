import { Button } from 'antd'
import { FooterBar } from './InventoryControl.styles'

export function InventoryFooterBar({
  hasChanges,
  onSave,
  saving,
  onFinalize,
  finalizing,
  readOnly,
}) {
  return (
    <FooterBar>
      <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap',alignItems:'center'}}>
        {hasChanges && (
          <span style={{ fontSize: 12, color: '#d97706', marginRight: 4 }}>Cambios sin guardar</span>
        )}
        <Button type="primary" onClick={onSave} loading={saving} disabled={!hasChanges || readOnly}>
          Guardar Cambios
        </Button>
        <Button onClick={onFinalize} danger disabled={readOnly} loading={finalizing}>
          Finalizar Inventario
        </Button>
      </div>
    </FooterBar>
  )
}

export default InventoryFooterBar

