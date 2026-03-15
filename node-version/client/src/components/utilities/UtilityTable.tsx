import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from 'rsuite';
import { useState, Fragment } from 'react';
import PayPeriodPicker from './PayPeriodPicker';

interface Transaction {
  id: number;
  providerKey: string;
  transactionDate: string;
  amount: number;
  description: string | null;
  source: string;
  createdAt: string;
  metadata?: string | null;
  provider: {
    id: number;
    nombre: string;
  };
}

interface PendingItem {
  gmailMessageId: string;
  emailDate: string;
  amount: number;
  description: string;
  metadata?: any;
  suggestedPayMonth?: string | null;
}

interface UtilityTableProps {
  transactions: Transaction[];
  pendingItems?: PendingItem[];
  pendingSelections?: Record<string, { payYear: number; payMonth: number }>;
  onPendingSelectionChange?: (gmailMessageId: string, field: 'payYear' | 'payMonth', value: number) => void;
  onSavedPayPeriodChange?: (transactionId: number, payYear: number, payMonth: number) => void;
  onDelete: (id: number) => void;
}

export default function UtilityTable({ 
  transactions, 
  pendingItems = [],
  pendingSelections = {},
  onPendingSelectionChange,
  onSavedPayPeriodChange,
  onDelete 
}: UtilityTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  
  // Track dirty (modified) saved transactions: transactionId -> {payYear, payMonth}
  const [dirtyTransactions, setDirtyTransactions] = useState<Record<number, { payYear: number; payMonth: number }>>({});

  const toggleRow = (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const parseMetadata = (metadataStr: string | null | undefined) => {
    if (!metadataStr) return null;
    try {
      return JSON.parse(metadataStr);
    } catch {
      return null;
    }
  };

  const hasPending = pendingItems.length > 0;

  if (transactions.length === 0 && pendingItems.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem', marginBottom: '1rem' }}>
        <h3 style={{ color: '#999', marginBottom: '1rem' }}>📋 Sin transacciones</h3>
        <p style={{ color: '#666' }}>
          Importa un CSV o agrega un gasto manualmente para comenzar.
        </p>
      </div>
    );
  }

  return (
    <div className="card" style={{ overflowX: 'auto', marginBottom: hasPending ? '5rem' : '1rem' }}>
      <table className="table" style={{ minWidth: '100%' }}>
        <thead>
          <tr>
            <th style={{ minWidth: '50px', textAlign: 'center' }}>Info</th>
            <th style={{ minWidth: '120px' }}>Fecha</th>
            <th style={{ minWidth: '120px', textAlign: 'right' }}>Monto</th>
            <th style={{ minWidth: '200px' }}>Descripción</th>
            <th style={{ minWidth: '130px', textAlign: 'center' }}>Periodo Pago</th>
            <th style={{ minWidth: '80px', textAlign: 'center' }}>Origen</th>
            <th style={{ minWidth: '100px', textAlign: 'center' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {/* Sección de pendientes */}
          {pendingItems.length > 0 && (
            <tr style={{ backgroundColor: '#fef3c7' }}>
              <td colSpan={7} style={{ padding: '0.5rem 1rem', fontWeight: 'bold', color: '#92400e' }}>
                🗓️ PENDIENTES POR GUARDAR ({pendingItems.length})
              </td>
            </tr>
          )}
          {pendingItems.map((item) => {
            const selection = pendingSelections[item.gmailMessageId] || { 
              payYear: new Date().getFullYear(), 
              payMonth: new Date().getMonth() + 1 
            };
            const metadata = item.metadata;
            
            return (
              <tr key={item.gmailMessageId} style={{ backgroundColor: '#fefce8' }}>
                <td style={{ textAlign: 'center' }}>
                  <span style={{ 
                    backgroundColor: '#fbbf24', 
                    color: 'white', 
                    padding: '0.25rem 0.5rem', 
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    fontWeight: 'bold'
                  }}>
                    NUEVO
                  </span>
                </td>
                <td>
                  <div style={{ fontSize: '0.85rem' }}>
                    {format(new Date(item.emailDate), 'dd MMM yyyy', { locale: es })}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#78350f', marginTop: '0.2rem' }}>
                    Correo recibido
                  </div>
                </td>
                <td style={{ textAlign: 'right', fontWeight: '600' }}>
                  ${Math.round(item.amount).toLocaleString('es-CL')}
                </td>
                <td>
                  <div style={{ fontSize: '0.85rem' }}>
                    {item.description || (
                      <span style={{ color: '#999', fontStyle: 'italic' }}>Sin descripción</span>
                    )}
                  </div>
                  {metadata?.accountNumber && (
                    <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '0.2rem' }}>
                      Cuenta: {metadata.accountNumber}
                    </div>
                  )}
                </td>
                <td style={{ textAlign: 'center', padding: '0.5rem' }}>
                  <PayPeriodPicker
                    value={selection}
                    onChange={(year, month) => {
                      onPendingSelectionChange?.(item.gmailMessageId, 'payYear', year);
                      onPendingSelectionChange?.(item.gmailMessageId, 'payMonth', month);
                    }}
                    size="xs"
                  />
                </td>
                <td style={{ textAlign: 'center' }}>
                  <span 
                    style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      backgroundColor: '#f0fdf4',
                      color: '#15803d'
                    }}
                  >
                    📧
                  </span>
                </td>
                <td style={{ textAlign: 'center', color: '#999', fontSize: '0.85rem' }}>
                  -
                </td>
              </tr>
            );
          })}

          {/* Separador visual si hay pendientes y guardadas */}
          {pendingItems.length > 0 && transactions.length > 0 && (
            <tr style={{ backgroundColor: '#e5e7eb' }}>
              <td colSpan={7} style={{ padding: '0.5rem 1rem', fontWeight: 'bold', color: '#374151' }}>
                💾 TRANSACCIONES GUARDADAS ({transactions.length})
              </td>
            </tr>
          )}

          {/* Sección de transacciones guardadas */}
          {transactions.map(transaction => {
            const metadata = parseMetadata(transaction.metadata);
            const hasMetadata = metadata && (
              metadata.periodStart || 
              metadata.periodEnd || 
              metadata.accountNumber || 
              metadata.address
            );
            const isExpanded = expandedRows.has(transaction.id);
            
            // Get current pay period from dirty state or transaction date
            const transactionDate = new Date(transaction.transactionDate);
            const isDirty = transaction.id in dirtyTransactions;
            const currentPayPeriod = isDirty 
              ? dirtyTransactions[transaction.id]
              : { payYear: transactionDate.getFullYear(), payMonth: transactionDate.getMonth() + 1 };

            const handlePayPeriodChange = (year: number, month: number) => {
              setDirtyTransactions(prev => ({
                ...prev,
                [transaction.id]: { payYear: year, payMonth: month }
              }));
            };

            const handleSavePayPeriod = () => {
              if (isDirty && onSavedPayPeriodChange) {
                const { payYear, payMonth } = dirtyTransactions[transaction.id];
                onSavedPayPeriodChange(transaction.id, payYear, payMonth);
                // Remove from dirty state after save
                setDirtyTransactions(prev => {
                  const newState = { ...prev };
                  delete newState[transaction.id];
                  return newState;
                });
              }
            };

            const handleDiscardChanges = () => {
              setDirtyTransactions(prev => {
                const newState = { ...prev };
                delete newState[transaction.id];
                return newState;
              });
            };

            return (
              <Fragment key={transaction.id}>
                <tr style={isDirty ? { backgroundColor: '#fef3c7' } : undefined}>
                  <td style={{ textAlign: 'center' }}>
                    {hasMetadata && (
                      <button
                        onClick={() => toggleRow(transaction.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '1rem',
                          padding: '0.25rem',
                          color: isExpanded ? '#1e40af' : '#666'
                        }}
                        title="Ver detalles"
                      >
                        {isExpanded ? '▼' : '▶'}
                      </button>
                    )}
                  </td>
                  <td>
                    <div style={{ fontSize: '0.85rem' }}>
                      {format(new Date(transaction.transactionDate), 'dd MMM yyyy', { locale: es })}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '0.2rem' }}>
                      Pago registrado
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: '600' }}>
                    ${Math.round(transaction.amount).toLocaleString('es-CL')}
                  </td>
                  <td>
                    {transaction.description || (
                      <span style={{ color: '#999', fontStyle: 'italic' }}>Sin descripción</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center', padding: '0.5rem' }}>
                    <PayPeriodPicker
                      value={currentPayPeriod}
                      onChange={handlePayPeriodChange}
                      size="xs"
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span 
                      style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        backgroundColor: transaction.source === 'manual' ? '#eff6ff' : '#f0fdf4',
                        color: transaction.source === 'manual' ? '#1e40af' : '#15803d'
                      }}
                    >
                      {transaction.source === 'manual' ? '✍️' : transaction.source === 'gmail' ? '📧' : '📄'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                      {isDirty ? (
                        <>
                          <Button
                            size="xs"
                            appearance="primary"
                            color="green"
                            onClick={handleSavePayPeriod}
                            title="Guardar cambios"
                          >
                            💾
                          </Button>
                          <Button
                            size="xs"
                            appearance="subtle"
                            onClick={handleDiscardChanges}
                            title="Descartar cambios"
                          >
                            ✖️
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="xs"
                          appearance="subtle"
                          color="red"
                          onClick={() => onDelete(transaction.id)}
                        >
                          🗑️
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>

                {/* Fila expandible con metadata */}
                {isExpanded && hasMetadata && (
                  <tr key={`${transaction.id}-details`} style={{ backgroundColor: '#f9fafb' }}>
                    <td colSpan={7} style={{ padding: '1rem' }}>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                        gap: '0.75rem',
                        fontSize: '0.875rem'
                      }}>
                        {metadata.address && (
                          <div>
                            <strong style={{ color: '#666' }}>📍 Dirección:</strong>
                            <div style={{ marginTop: '0.25rem' }}>{metadata.address}</div>
                          </div>
                        )}
                        {metadata.accountNumber && (
                          <div>
                            <strong style={{ color: '#666' }}>🔢 N° Cuenta:</strong>
                            <div style={{ marginTop: '0.25rem' }}>{metadata.accountNumber}</div>
                          </div>
                        )}
                        {metadata.periodStart && metadata.periodEnd && (
                          <div>
                            <strong style={{ color: '#666' }}>📅 Período Facturación:</strong>
                            <div style={{ marginTop: '0.25rem' }}>
                              {metadata.periodStart} al {metadata.periodEnd}
                            </div>
                          </div>
                        )}
                        {metadata.emailDate && (
                          <div>
                            <strong style={{ color: '#666' }}>📧 Fecha Correo:</strong>
                            <div style={{ marginTop: '0.25rem' }}>
                              {format(new Date(metadata.emailDate), 'dd MMM yyyy HH:mm', { locale: es })}
                            </div>
                          </div>
                        )}
                        {metadata.userSelectedPayMonth && (
                          <div>
                            <strong style={{ color: '#666' }}>💰 Mes Asignado por Usuario:</strong>
                            <div style={{ marginTop: '0.25rem' }}>{metadata.userSelectedPayMonth}</div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
