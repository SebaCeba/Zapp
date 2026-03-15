import { useState } from 'react';
import { Modal, Button, Tag, Divider, Input, DatePicker } from 'rsuite';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { showToast } from '../Toast';

interface Installment {
  id: number;
  installmentNumber: number;
  baseAmountClp: number;
  dueDate: string;
  payDateEstimated: string;
  overrideInterestRate: number | null;
  overrideMonthlyAmountClp: number | null;
  finalMonthlyAmountClp: number;
  estado: 'ESTIMADO' | 'REAL';
}

interface Purchase {
  id: number;
  merchant: string;
  purchaseDate: string;
  amountTotalClp: number;
  installmentsCount: number;
  tieneInteres: boolean;
  modoMonto: 'ESTIMADO' | 'REAL';
  totalFinanciadoEstimado: number | null;
  interesTotalEstimado: number | null;
  feePct?: number | null;
  feeAmountClp?: number | null;
  financedBaseClp?: number | null;
  feeMissing?: boolean;
  scheduleMode?: 'AUTO' | 'MANUAL';
  firstDueDateOverride?: string | null;
  category?: {
    id: number;
    name: string;
    icon: string | null;
    color: string | null;
  } | null;
  installments: Installment[];
}

interface PurchaseDetailModalProps {
  purchase: Purchase | null;
  open: boolean;
  onClose: () => void;
  onDataChange?: () => void;
}

export default function PurchaseDetailModal({ purchase, open, onClose, onDataChange }: PurchaseDetailModalProps) {
  const [confirmingReal, setConfirmingReal] = useState(false);
  const [cuotaRealInput, setCuotaRealInput] = useState('');
  const [adjustingSchedule, setAdjustingSchedule] = useState(false);
  const [scheduleDateInput, setScheduleDateInput] = useState<Date | null>(null);

  if (!purchase) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: es });
  };

  const handleToggleInteres = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/tenpo/purchases/${purchase.id}/interes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tieneInteres: !purchase.tieneInteres })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al cambiar interés');
      }

      showToast(`Interés ${!purchase.tieneInteres ? 'activado' : 'desactivado'} y cuotas recalculadas`, 'success');
      
      if (onDataChange) onDataChange();
      onClose();
    } catch (error: any) {
      console.error('Error toggling interés:', error);
      showToast(error.message || 'Error al cambiar interés', 'error');
    }
  };

  const handleConfirmarReal = async () => {
    if (!cuotaRealInput) {
      showToast('Ingresa el monto de la cuota', 'error');
      return;
    }

    const cuotaReal = parseInt(cuotaRealInput);
    if (isNaN(cuotaReal) || cuotaReal <= 0) {
      showToast('Monto inválido', 'error');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/tenpo/purchases/${purchase.id}/confirmar-real`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cuotaReal })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al confirmar');
      }

      showToast('Valor real confirmado - Las cuotas ya no se recalcularán automáticamente', 'success');
      
      setConfirmingReal(false);
      setCuotaRealInput('');
      if (onDataChange) onDataChange();
      onClose();
    } catch (error: any) {
      console.error('Error confirmando:', error);
      showToast(error.message || 'Error al confirmar valor real', 'error');
    }
  };

  const handleAdjustSchedule = async () => {
    if (!scheduleDateInput) {
      // Usuario quiere volver a AUTO
      try {
        const response = await fetch(`http://localhost:3000/api/tenpo/purchases/${purchase.id}/schedule`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scheduleMode: 'AUTO' })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error al cambiar calendario');
        }

        showToast('Calendario vuelto a modo automático', 'success');
        
        setAdjustingSchedule(false);
        setScheduleDateInput(null);
        if (onDataChange) onDataChange();
        onClose();
      } catch (error: any) {
        console.error('Error:', error);
        showToast(error.message || 'Error al cambiar calendario', 'error');
      }
      return;
    }

    // Usuario ingresó nueva fecha
    try {
      const response = await fetch(`http://localhost:3000/api/tenpo/purchases/${purchase.id}/schedule`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          scheduleMode: 'MANUAL',
          firstDueDateOverride: format(scheduleDateInput, 'yyyy-MM-dd')
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al cambiar calendario');
      }

      showToast('Calendario ajustado - Las cuotas se recalcularon con la nueva fecha', 'success');
      
      setAdjustingSchedule(false);
      setScheduleDateInput(null);
      if (onDataChange) onDataChange();
      onClose();
    } catch (error: any) {
      console.error('Error:', error);
      showToast(error.message || 'Error al cambiar calendario', 'error');
    }
  };

  return (
    <Modal 
      open={open} 
      onClose={onClose} 
      size="lg"
      backdrop="static"
    >
      <Modal.Header>
        <Modal.Title>
          Detalle de Compra
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {/* Información principal */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h5 style={{ marginBottom: '0.75rem', color: '#111827', fontSize: '1.125rem' }}>
            {purchase.merchant}
          </h5>
          
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <Tag color={purchase.modoMonto === 'REAL' ? 'green' : 'yellow'}>
              {purchase.modoMonto === 'REAL' ? 'CONFIRMADO' : 'ESTIMADO'}
            </Tag>
            
            {purchase.category && (
              <Tag color="blue" style={{ backgroundColor: purchase.category.color || '#3b82f6' }}>
                {purchase.category.icon} {purchase.category.name}
              </Tag>
            )}
            
            {!purchase.category && (
              <Tag color="red">
                Sin Categoría
              </Tag>
            )}
            
            {purchase.scheduleMode === 'MANUAL' && (
              <Tag color="cyan">
                📅 Calendario Manual
              </Tag>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', fontSize: '0.875rem' }}>
            <div>
              <span style={{ color: '#6b7280' }}>Fecha de compra:</span>
              <div style={{ fontWeight: '500', color: '#111827' }}>{formatDate(purchase.purchaseDate)}</div>
            </div>
            <div>
              <span style={{ color: '#6b7280' }}>Monto total:</span>
              <div style={{ fontWeight: '600', color: '#111827', fontSize: '1rem' }}>
                {formatCurrency(purchase.amountTotalClp)}
              </div>
            </div>
            <div>
              <span style={{ color: '#6b7280' }}>Número de cuotas:</span>
              <div style={{ fontWeight: '500', color: '#111827' }}>{purchase.installmentsCount}</div>
            </div>
            <div>
              <span style={{ color: '#6b7280' }}>Con interés:</span>
              <div style={{ fontWeight: '500', color: purchase.tieneInteres ? '#ef4444' : '#10b981' }}>
                {purchase.tieneInteres ? 'Sí (2.11% mensual)' : 'No'}
              </div>
            </div>
            {purchase.tieneInteres && purchase.totalFinanciadoEstimado && (
              <>
                <div>
                  <span style={{ color: '#6b7280' }}>Total financiado:</span>
                  <div style={{ fontWeight: '600', color: '#ef4444' }}>
                    {formatCurrency(purchase.totalFinanciadoEstimado)}
                  </div>
                </div>
                <div>
                  <span style={{ color: '#6b7280' }}>Interés total:</span>
                  <div style={{ fontWeight: '600', color: '#ef4444' }}>
                    {formatCurrency(purchase.interesTotalEstimado || 0)}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <Divider />

        {/* Calendario de cuotas */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h6 style={{ marginBottom: '0.75rem', color: '#374151' }}>
            Calendario de Cuotas ({purchase.installments.length})
          </h6>
          
          <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
            <table style={{ width: '100%', fontSize: '0.875rem' }}>
              <thead style={{ backgroundColor: '#f9fafb', position: 'sticky', top: 0 }}>
                <tr>
                  <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Cuota</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Vencimiento</th>
                  <th style={{ padding: '0.5rem', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>Monto</th>
                  <th style={{ padding: '0.5rem', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {purchase.installments.map((inst) => (
                  <tr key={inst.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.5rem' }}>{inst.installmentNumber}/{purchase.installmentsCount}</td>
                    <td style={{ padding: '0.5rem' }}>{formatDate(inst.dueDate)}</td>
                    <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: '500' }}>
                      {formatCurrency(inst.finalMonthlyAmountClp)}
                    </td>
                    <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                      <Tag size="sm" color={inst.estado === 'REAL' ? 'green' : 'blue'}>
                        {inst.estado}
                      </Tag>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Acciones */}
        {purchase.modoMonto === 'ESTIMADO' && (
          <>
            <Divider />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Toggle interés */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                  {purchase.tieneInteres ? '🔻 Desactivar interés' : '📈 Activar interés (2.11%)'}
                </span>
                <Button 
                  size="sm" 
                  appearance="ghost" 
                  color={purchase.tieneInteres ? 'red' : 'green'}
                  onClick={handleToggleInteres}
                >
                  {purchase.tieneInteres ? 'Desactivar' : 'Activar'}
                </Button>
              </div>

              {/* Confirmar valor real */}
              {!confirmingReal ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#f0fdf4', borderRadius: '6px' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                    ✓ Confirmar valor real de cuota
                  </span>
                  <Button 
                    size="sm" 
                    appearance="primary" 
                    color="green"
                    onClick={() => setConfirmingReal(true)}
                  >
                    Confirmar
                  </Button>
                </div>
              ) : (
                <div style={{ padding: '0.75rem', backgroundColor: '#f0fdf4', borderRadius: '6px' }}>
                  <div style={{ marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                    Confirmar valor real de cuota mensual:
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Input 
                      placeholder="Ej: 25000"
                      value={cuotaRealInput}
                      onChange={setCuotaRealInput}
                      style={{ flex: 1 }}
                    />
                    <Button 
                      appearance="primary" 
                      color="green"
                      onClick={handleConfirmarReal}
                    >
                      Guardar
                    </Button>
                    <Button 
                      appearance="subtle"
                      onClick={() => {
                        setConfirmingReal(false);
                        setCuotaRealInput('');
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}

              {/* Ajustar calendario */}
              {!adjustingSchedule ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#eff6ff', borderRadius: '6px' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                    📅 Ajustar fecha de primer vencimiento
                  </span>
                  <Button 
                    size="sm" 
                    appearance="primary" 
                    color="cyan"
                    onClick={() => {
                      setAdjustingSchedule(true);
                      if (purchase.firstDueDateOverride) {
                        setScheduleDateInput(new Date(purchase.firstDueDateOverride));
                      }
                    }}
                  >
                    Ajustar
                  </Button>
                </div>
              ) : (
                <div style={{ padding: '0.75rem', backgroundColor: '#eff6ff', borderRadius: '6px' }}>
                  <div style={{ marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                    Nueva fecha de primer vencimiento (o dejar vacío para volver a automático):
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <DatePicker 
                      format="dd/MM/yyyy"
                      value={scheduleDateInput}
                      onChange={setScheduleDateInput}
                      placeholder="Seleccionar fecha"
                      style={{ flex: 1 }}
                      cleanable
                    />
                    <Button 
                      appearance="primary" 
                      color="cyan"
                      onClick={handleAdjustSchedule}
                    >
                      Aplicar
                    </Button>
                    <Button 
                      appearance="subtle"
                      onClick={() => {
                        setAdjustingSchedule(false);
                        setScheduleDateInput(null);
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={onClose} appearance="subtle">
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
