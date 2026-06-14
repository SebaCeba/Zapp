import { useState, useEffect } from 'react';
import { Panel, Button, InputNumber, Input, Divider, Stack, Table, IconButton } from 'rsuite';
import { fetchActualEntries, createActualEntry, deleteActualEntry } from '../../api/actualApi';
import TrashIcon from '@rsuite/icons/Trash';

const { Column, HeaderCell, Cell } = Table;

interface MonthlyPaymentPanelProps {
  selectedAmount: number;
  selectedCount: number;
  year: number;
  month: number;
  onPaymentConfirmed: (payment: any) => void;
  onCancel: () => void;
}

export default function MonthlyPaymentPanel({
  selectedAmount,
  selectedCount,
  year,
  month,
  onPaymentConfirmed
}: MonthlyPaymentPanelProps) {
  // --- Payment History State ---
  const [payments, setPayments] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  
  // --- Manual Entry State ---
  const [newAmount, setNewAmount] = useState<number | null>(null);
  const [newDescription, setNewDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Selection Payment State (Legacy/Hybrid) ---
  const [actualPaidAmount, setActualPaidAmount] = useState<number>(selectedAmount);

  // Load payments on mount or when year/month changes
  useEffect(() => {
    loadPayments();
  }, [year, month]);

  // Sync selection amount
  useEffect(() => {
    setActualPaidAmount(selectedAmount);
  }, [selectedAmount]);

  const loadPayments = async () => {
    setLoadingPayments(true);
    try {
      const data = await fetchActualEntries(year, month, 'PAGO_TC');
      setPayments(data);
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setLoadingPayments(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Seguro que deseas eliminar este pago?')) return;
    try {
      await deleteActualEntry(id);
      await loadPayments();
      // Trigger refresh in parent if needed via a callback, currently onPaymentConfirmed works as a signal
      onPaymentConfirmed({ type: 'delete' }); 
    } catch (error) {
      console.error('Error deleting payment:', error);
    }
  };

  const handleAddManualPayment = async () => {
    if (!newAmount || !newDescription) return;
    setIsSubmitting(true);
    try {
      await createActualEntry({
        year,
        month,
        category: 'PAGO_TC',
        itemKey: `TENPO_PAY_${crypto.randomUUID()}`,
        label: newDescription,
        amountClp: newAmount
      });
      setNewAmount(null);
      setNewDescription('');
      await loadPayments();
      onPaymentConfirmed({ type: 'create' });
    } catch (error) {
      console.error('Error creating payment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Legacy handleConfirm for "Pay Selected" button
  const handleConfirmSelection = async () => {
    if (selectedCount === 0) return;
    setIsSubmitting(true);
    try {
      await createActualEntry({
        year,
        month,
        category: 'PAGO_TC',
        itemKey: `TENPO_PAY_${crypto.randomUUID()}`,
        label: `Pago por selección (${selectedCount} cuotas)`,
        amountClp: actualPaidAmount
      });
      await loadPayments();
      onPaymentConfirmed({ type: 'create_selection' });
    } catch (error) {
      console.error('Error processing selection payment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPaid = payments.reduce((acc, p) => acc + p.amountClp, 0);

  const formatCurrency = (val: number) => '$' + val.toLocaleString('es-CL');
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('es-CL', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  });

  return (
    <Panel 
      header={<h4 style={{ margin: 0 }}>💳 Gestión Pagos {month}/{year}</h4>} 
      bodyFill
      style={{ 
        background: '#fff', 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden',
        border: 'none',
        borderRadius: 0
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        
        {/* --- 1. Total Summary (Fixed at Top) --- */}
        <div style={{ padding: '15px 15px 0 15px', flexShrink: 0 }}>
          <div style={{ textAlign: 'center', background: '#f8f9fa', padding: 10, borderRadius: 8 }}>
            <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Pagado</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#16a34a' }}>
              {formatCurrency(totalPaid)}
            </div>
          </div>
        </div>

        <Divider style={{ margin: '10px 0' }} />

        {/* --- 2. Selection Action Area (Fixed) --- */}
        <div style={{ padding: '0 15px', flexShrink: 0 }}>
          <div style={{ 
            background: selectedCount > 0 ? '#f0f9ff' : '#f9fafb', 
            padding: 12, 
            borderRadius: 8, 
            border: `1px solid ${selectedCount > 0 ? '#bae6fd' : '#e5e7eb'}` 
          }}>
            <h6 style={{ marginBottom: 8, color: selectedCount > 0 ? '#0369a1' : '#6b7280', fontSize: '0.9rem' }}>
              {selectedCount > 0 ? 'Pagar Selección' : 'Selección Actual'}
            </h6>
            
            {selectedCount > 0 ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 8 }}>
                  <span>{selectedCount} cuotas:</span>
                  <strong>{formatCurrency(selectedAmount)}</strong>
                </div>
                
                <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                  <InputNumber 
                    value={actualPaidAmount} 
                    onChange={(val) => setActualPaidAmount(Number(val))} 
                    prefix="$"
                    size="sm"
                    style={{ flex: 1 }}
                  />
                  <Button 
                    appearance="primary" 
                    color="green" 
                    size="sm"
                    onClick={handleConfirmSelection} 
                    loading={isSubmitting}
                  >
                    Pagar
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: 8, lineHeight: '1.3' }}>
                  Seleccione comercios en la tabla para sumarlos aquí.
                </p>
                 <Button 
                    appearance="default" 
                    disabled
                    block
                    size="sm"
                  >
                    Registrar Selección
                  </Button>
              </>
            )}
          </div>
        </div>

        <Divider style={{ margin: '10px 0' }} />

        {/* --- 3. Add Manual Payment (Fixed) --- */}
        <div style={{ padding: '0 15px', flexShrink: 0 }}>
          <h6 style={{ marginBottom: 8, fontSize: '0.9rem' }}>Agregar Pago Manual</h6>
          <Stack spacing={5} alignItems="flex-start" direction="column">
             <Input 
               placeholder="Descripción" 
               value={newDescription}
               onChange={setNewDescription}
               size="sm"
               style={{ width: '100%' }}
             />
             <div style={{ display: 'flex', gap: 5, width: '100%' }}>
                <InputNumber 
                  placeholder="Monto" 
                  value={newAmount} 
                  onChange={(val) => setNewAmount(Number(val))} 
                  prefix="$"
                  size="sm"
                  style={{ flex: 1 }}
                />
                <Button 
                  appearance="primary" 
                  color="blue" 
                  size="sm"
                  onClick={handleAddManualPayment}
                  disabled={!newAmount || !newDescription || isSubmitting}
                  loading={isSubmitting}
                >
                  +
                </Button>
             </div>
          </Stack>
        </div>

        <Divider style={{ margin: '10px 0' }} />

        {/* --- 4. Payment History (Scrollable Area) --- */}
        <div style={{  
          flex: 1, 
          overflowY: 'auto', 
          padding: '0 15px 15px 15px',
          minHeight: 0 // Important for flex scroll
        }}>
           <h6 style={{ marginBottom: 8, fontSize: '0.9rem', position: 'sticky', top: 0, background: '#fff', zIndex: 1, paddingBottom: 5 }}>
             Historial ({payments.length})
           </h6>
           <Table
            autoHeight
            data={payments}
            loading={loadingPayments}
            bordered
            cellBordered
            headerHeight={30}
            rowHeight={40}
            style={{ width: '100%' }}
          >
            <Column width={85} align="center" fixed>
              <HeaderCell style={{ padding: 4, fontSize: '0.75rem' }}>Fecha</HeaderCell>
              <Cell style={{ padding: 4 }}>
                {(rowData) => <span style={{ fontSize: '0.75rem' }}>{formatDate(rowData.createdAt).split(',')[0]}</span>}
              </Cell>
            </Column>

            <Column flexGrow={1}>
              <HeaderCell style={{ padding: 4, fontSize: '0.75rem' }}>Item</HeaderCell>
              <Cell dataKey="label" style={{ padding: '4px 8px', fontSize: '0.8rem' }} />
            </Column>

            <Column width={70} align="right">
              <HeaderCell style={{ padding: 4, fontSize: '0.75rem' }}>Monto</HeaderCell>
              <Cell style={{ padding: 4 }}>
                {(rowData) => <span style={{ fontWeight: 500, fontSize: '0.8rem' }}>{formatCurrency(rowData.amountClp)}</span>}
              </Cell>
            </Column>

            <Column width={40} align="center" fixed="right">
              <HeaderCell style={{ padding: 4 }}>{''}</HeaderCell>
              <Cell style={{ padding: '2px' }}>
                {(rowData) => (
                  <IconButton 
                    icon={<TrashIcon />} 
                    size="xs" 
                    appearance="subtle" 
                    color="red"
                    onClick={() => handleDelete(rowData.id)}
                  />
                )}
              </Cell>
            </Column>
          </Table>
        </div>

      </div>
    </Panel>
  );
}
