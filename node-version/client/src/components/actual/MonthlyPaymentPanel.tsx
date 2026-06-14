import { useState, useEffect } from 'react';
import { Button } from '../primitives';
import { Input } from '../primitives';
import { fetchActualEntries, createActualEntry, deleteActualEntry } from '../../api/actualApi';

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
  onPaymentConfirmed,
  onCancel
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
        itemKey: `TC_PAY_${crypto.randomUUID()}`,
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
        itemKey: `TC_PAY_${crypto.randomUUID()}`,
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
    <div className="bg-white h-full flex flex-col overflow-hidden border-none rounded-none">
      {/* Header */}
      <div className="px-4 py-3 border-b border-outline-variant/20">
        <h4 className="m-0 text-base font-semibold text-on-surface">💳 Gestión Pagos {month}/{year}</h4>
      </div>
      
      <div className="flex flex-col h-full">
        
        {/* --- 1. Total Summary (Fixed at Top) --- */}
        <div className="px-4 pt-4 pb-0 flex-shrink-0">
          <div className="text-center bg-surface-container/20 p-3 rounded-lg">
            <div className="text-xs text-outline uppercase tracking-wide mb-0.5">Total Pagado</div>
            <div className="text-2xl font-bold text-success">
              {formatCurrency(totalPaid)}
            </div>
          </div>
        </div>

        <hr className="my-2.5 border-outline-variant/20" />

        {/* --- 2. Selection Action Area (Fixed) --- */}
        <div className="px-4 flex-shrink-0">
          <div className={`p-3 rounded-lg border ${
            selectedCount > 0 
              ? 'bg-info-container/15 border-info/30' 
              : 'bg-surface-container/10 border-outline-variant/30'
          }`}>
            <h6 className={`mb-2 text-sm font-medium ${
              selectedCount > 0 ? 'text-info' : 'text-outline'
            }`}>
              {selectedCount > 0 ? 'Pagar Selección' : 'Selección Actual'}
            </h6>
            
            {selectedCount > 0 ? (
              <>
                <div className="flex justify-between text-xs mb-2">
                  <span>{selectedCount} cuotas:</span>
                  <strong>{formatCurrency(selectedAmount)}</strong>
                </div>
                
                <div className="flex gap-1.5 items-center">
                  <Input 
                    type="number"
                    value={actualPaidAmount || ''} 
                    onChange={(e) => setActualPaidAmount(Number(e.target.value))} 
                    placeholder="$"
                    className="flex-1 text-sm py-1.5"
                  />
                  <Button 
                    variant="primary"
                    size="sm"
                    onClick={handleConfirmSelection} 
                    disabled={isSubmitting}
                    className="bg-success hover:bg-success/90"
                  >
                    Pagar
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-xs text-outline mb-2 leading-tight">
                  Seleccione comercios en la tabla para sumarlos aquí.
                </p>
                <Button 
                  variant="secondary"
                  disabled
                  size="sm"
                  className="w-full"
                >
                  Registrar Selección
                </Button>
              </>
            )}
          </div>
        </div>

        <hr className="my-2.5 border-outline-variant/20" />

        {/* --- 3. Add Manual Payment (Fixed) --- */}
        <div className="px-4 flex-shrink-0">
          <h6 className="mb-2 text-sm font-medium">Agregar Pago Manual</h6>
          <div className="flex flex-col gap-1.5">
            <Input 
              placeholder="Descripción" 
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="w-full text-sm py-1.5"
            />
            <div className="flex gap-1.5 w-full">
              <Input 
                type="number"
                placeholder="Monto" 
                value={newAmount || ''} 
                onChange={(e) => setNewAmount(Number(e.target.value))} 
                className="flex-1 text-sm py-1.5"
              />
              <Button 
                variant="primary"
                size="sm"
                onClick={handleAddManualPayment}
                disabled={!newAmount || !newDescription || isSubmitting}
              >
                +
              </Button>
            </div>
          </div>
        </div>

        <hr className="my-2.5 border-outline-variant/20" />

        {/* --- 4. Payment History (Scrollable Area) --- */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 min-h-0">
          <h6 className="mb-2 text-sm font-medium sticky top-0 bg-white z-10 pb-1.5">
            Historial ({payments.length})
          </h6>
          
          {loadingPayments ? (
            <div className="text-center py-8 text-sm text-outline">Cargando...</div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8 text-sm text-outline">No hay pagos registrados</div>
          ) : (
            <div className="border border-outline-variant/30 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-surface-container/20">
                  <tr>
                    <th className="px-1 py-2 text-xs font-medium text-outline text-center w-20">
                      Fecha
                    </th>
                    <th className="px-2 py-2 text-xs font-medium text-outline text-left">
                      Item
                    </th>
                    <th className="px-1 py-2 text-xs font-medium text-outline text-right w-16">
                      Monto
                    </th>
                    <th className="px-1 py-2 text-xs font-medium text-outline text-center w-10">
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-surface-container/10 transition-colors">
                      <td className="px-1 py-2.5 text-xs text-center">
                        {formatDate(payment.createdAt).split(',')[0]}
                      </td>
                      <td className="px-2 py-2.5 text-xs">
                        {payment.label}
                      </td>
                      <td className="px-1 py-2.5 text-xs text-right font-medium">
                        {formatCurrency(payment.amountClp)}
                      </td>
                      <td className="px-1 py-2.5 text-center">
                        <button
                          onClick={() => handleDelete(payment.id)}
                          className="p-0.5 text-error hover:bg-error/10 rounded transition-colors"
                          title="Eliminar"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
