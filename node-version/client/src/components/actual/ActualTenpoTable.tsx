import { useState, useEffect, useRef } from 'react';
import { Button, Modal, TreePicker } from 'rsuite';
import { showToast } from '../Toast';
import ActualTenpoRow from './ActualTenpoRow';

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

interface ActualTenpoTableProps {
  purchases: Purchase[];
  year: number;
  month: number;
  onDataChange?: () => void;
  onSelectionChange?: (count: number, amount: number) => void;
}

type SortColumn = 'merchant' | 'purchaseDate' | 'amountTotalClp' | 'installmentsCount' | 'monthTotal';
type SortType = 'asc' | 'desc';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

interface Category {
  id: number;
  name: string;
  parentId: number | null;
  level: number;
  children?: Category[];
}

export default function ActualTenpoTable({ purchases, year, month, onDataChange, onSelectionChange }: ActualTenpoTableProps) {
  // Restaurar sorting desde localStorage
  const getSavedSort = () => {
    try {
      const saved = localStorage.getItem('actualTenpoTableSort');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { column: parsed.column as SortColumn, type: parsed.type as SortType };
      }
    } catch (e) {
      console.error('Error loading sort from localStorage:', e);
    }
    return { column: 'purchaseDate' as SortColumn, type: 'desc' as SortType };
  };

  const savedSort = getSavedSort();
  const [sortColumn, setSortColumn] = useState<SortColumn>(savedSort.column);
  const [sortType, setSortType] = useState<SortType>(savedSort.type);
  const [selectedMerchants, setSelectedMerchants] = useState<Set<string>>(new Set());
  const [showBatchAssignModal, setShowBatchAssignModal] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [assigningBatch, setAssigningBatch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Guardar sorting en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem('actualTenpoTableSort', JSON.stringify({ column: sortColumn, type: sortType }));
  }, [sortColumn, sortType]);
  
  // Atajo de teclado para enfocar el buscador
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K o Cmd+K o solo "/" para enfocar búsqueda
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  const getInstallmentsForMonth = (purchase: Purchase) => {
    return purchase.installments.filter(inst => {
      const dueDate = new Date(inst.dueDate);
      return dueDate.getFullYear() === year && dueDate.getMonth() + 1 === month;
    });
  };

  const getTotalForMonth = () => {
    return purchases.reduce((sum, purchase) => {
      const monthInstallments = getInstallmentsForMonth(purchase);
      return sum + monthInstallments.reduce((s, inst) => s + inst.finalMonthlyAmountClp, 0);
    }, 0);
  };

  const loadCategories = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/tenpo/categories');
      const data = await response.json();
      // Filtrar categorías del sistema como "Sin Categorizar"
      setCategories(data.filter((cat: Category) => !data.find((c: any) => c.id === cat.id && c.isSystem)));
    } catch (error) {
      console.error('Error loading categories:', error);
      alert('Error al cargar las categorías');
    }
  };

  const getFilteredPurchases = () => {
    if (!searchTerm.trim()) return purchases;
    const term = searchTerm.toLowerCase();
    return purchases.filter(p => 
      p.merchant.toLowerCase().includes(term)
    );
  };

  const handleSelectAll = () => {
    const filteredPurchases = getFilteredPurchases();
    const filteredMerchants = filteredPurchases.map(p => p.merchant);
    const allFilteredSelected = filteredMerchants.every(m => selectedMerchants.has(m));
    
    if (allFilteredSelected && filteredMerchants.length > 0) {
      // Deseleccionar todos los filtrados
      setSelectedMerchants(prev => {
        const newSet = new Set(prev);
        filteredMerchants.forEach(m => newSet.delete(m));
        
        // Notificar cambio de selección (simplificado: recalcular todo el set es costoso, 
        // idealmente usar useEffect para esto, ver abajo)
        return newSet;
      });
    } else {
      // Seleccionar todos los filtrados
      setSelectedMerchants(prev => new Set([...prev, ...filteredMerchants]));
    }
  };

  const handleSelectMerchant = (merchant: string) => {
    setSelectedMerchants(prev => {
      const newSet = new Set(prev);
      if (newSet.has(merchant)) {
        newSet.delete(merchant);
      } else {
        newSet.add(merchant);
      }
      return newSet;
    });
  };

  // Efecto para notificar al padre sobre cambios en la selección y montos
  useEffect(() => {
    if (onSelectionChange) {
      // Calcular monto seleccionado
      let totalSelected = 0;
      purchases.forEach(p => {
        if (selectedMerchants.has(p.merchant)) {
          const monthInstallments = getInstallmentsForMonth(p);
          const amount = monthInstallments.reduce((s, inst) => s + inst.finalMonthlyAmountClp, 0);
          totalSelected += amount;
        }
      });
      onSelectionChange(selectedMerchants.size, totalSelected);
    }
  }, [selectedMerchants, purchases, year, month, onSelectionChange]);

  const handleBatchAssign = async () => {
    if (!selectedCategoryId || selectedMerchants.size === 0) return;

    try {
      setAssigningBatch(true);
      const response = await fetch('http://localhost:3000/api/tenpo/merchants/batch-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantNames: Array.from(selectedMerchants),
          categoryId: selectedCategoryId
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al asignar comercios');
      }

      const result = await response.json();
      
      // Limpiar selección primero
      setSelectedMerchants(new Set());
      setSelectedCategoryId(null);
      setShowBatchAssignModal(false);

      // Notificar éxito
      showToast(
        `${result.count || result.assigned} comercio(s) asignado(s) correctamente`,
        'success'
      );
      
      // Recargar datos si es posible
      if (onDataChange) {
        onDataChange();
      }
    } catch (error: any) {
      showToast(error.message, 'error', 5000);
    } finally {
      setAssigningBatch(false);
    }
  };

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortType(sortType === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortType('asc');
    }
  };

  const getSortedPurchases = () => {
    const filtered = getFilteredPurchases();
    const sorted = [...filtered].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortColumn === 'monthTotal') {
        aValue = getInstallmentsForMonth(a).reduce((s, inst) => s + inst.finalMonthlyAmountClp, 0);
        bValue = getInstallmentsForMonth(b).reduce((s, inst) => s + inst.finalMonthlyAmountClp, 0);
      } else {
        aValue = a[sortColumn];
        bValue = b[sortColumn];
      }

      // Manejo de strings
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortType === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      // Manejo de números
      if (sortType === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return sorted;
  };

  const renderSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <span style={{ opacity: 0.3, marginLeft: '0.25rem' }}>⇅</span>;
    }
    return sortType === 'asc' 
      ? <span style={{ marginLeft: '0.25rem' }}>↑</span>
      : <span style={{ marginLeft: '0.25rem' }}>↓</span>;
  };

  const formatMonto = (monto: number) => {
    return monto.toLocaleString('es-CL', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  if (purchases.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
        <p>No hay cuotas de Tenpo programadas para {MESES[month - 1]} {year}</p>
      </div>
    );
  }

  const totalMonth = getTotalForMonth();
  const filteredPurchases = getFilteredPurchases();
  const filteredTotal = filteredPurchases.reduce((sum, purchase) => {
    const monthInstallments = getInstallmentsForMonth(purchase);
    return sum + monthInstallments.reduce((s, inst) => s + inst.finalMonthlyAmountClp, 0);
  }, 0);

  return (
    <div className="category-section" style={{ marginBottom: '2rem' }}>
      {/* Resumen del mes */}
      <div 
        className="category-header" 
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem',
          background: 'var(--gray-100)',
          borderRadius: '8px',
          fontWeight: '600',
          marginBottom: '0.5rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span>💳 Tenpo - Cuotas de {MESES[month - 1]} {year}</span>
          {selectedMerchants.size > 0 && (
            <span style={{ 
              fontSize: '0.85rem', 
              color: '#8b5cf6', 
              fontWeight: '600',
              backgroundColor: '#f3e8ff',
              padding: '0.25rem 0.75rem',
              borderRadius: '12px'
            }}>
              {selectedMerchants.size} seleccionado{selectedMerchants.size !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {selectedMerchants.size > 0 && (
            <Button 
              appearance="primary" 
              size="sm"
              style={{ backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' }}
              onClick={() => {
                loadCategories();
                setShowBatchAssignModal(true);
              }}
            >
              🏷️ Asignar Categoría
            </Button>
          )}
          <div style={{ display: 'flex', gap: '2rem', fontSize: '0.9rem' }}>
            <span>Compras: {purchases.length}</span>
            <span style={{ color: '#1e40af', fontWeight: '700' }}>Total: ${formatMonto(totalMonth)}</span>
          </div>
        </div>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        alignItems: 'center', 
        padding: '0.75rem 1rem',
        backgroundColor: '#f9fafb',
        borderRadius: '6px',
        marginTop: '0.5rem',
        marginBottom: '0.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="🔍 Buscar comercio... (Ctrl+K o /)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '0.95rem',
              outline: 'none',
              transition: 'all 0.15s ease',
              boxShadow: searchTerm ? '0 0 0 3px rgba(139, 92, 246, 0.1)' : 'none'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#8b5cf6';
              e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#d1d5db';
              if (!searchTerm) {
                e.target.style.boxShadow = 'none';
              }
            }}
            onKeyDown={(e) => {
              // Escape para limpiar búsqueda
              if (e.key === 'Escape') {
                setSearchTerm('');
                e.currentTarget.blur();
              }
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', fontSize: '0.85rem', color: '#666' }}>
          {searchTerm && (
            <>
              <span style={{ fontWeight: '600', color: '#8b5cf6' }}>
                {filteredPurchases.length} resultado{filteredPurchases.length !== 1 ? 's' : ''}
              </span>
              {filteredPurchases.length > 0 && filteredPurchases.length !== purchases.length && (
                <span style={{ color: '#1e40af', fontWeight: '600' }}>
                  ${formatMonto(filteredTotal)}
                </span>
              )}
            </>
          )}
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('');
                searchInputRef.current?.focus();
              }}
              tabIndex={-1}
              style={{
                padding: '0.25rem 0.75rem',
                backgroundColor: 'white',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                color: '#666'
              }}
            >
              ✕ Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Tabla de compras */}
      <table className="tabla-presupuesto" style={{ width: '100%', marginTop: '0.5rem' }}>
        <thead>
          <tr>
            <th style={{ width: '40px', textAlign: 'center' }}>
              <input
                type="checkbox"
                checked={filteredPurchases.length > 0 && filteredPurchases.every(p => selectedMerchants.has(p.merchant))}
                onChange={handleSelectAll}
                style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                title={searchTerm ? `Seleccionar todos los ${filteredPurchases.length} filtrados` : 'Seleccionar todos'}
              />
            </th>
            <th 
              onClick={() => handleSort('merchant')} 
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              Comercio{renderSortIcon('merchant')}
            </th>
            <th style={{ textAlign: 'left' }}>
              Categoría
            </th>
            <th 
              onClick={() => handleSort('purchaseDate')} 
              style={{ textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}
            >
              Fecha Compra{renderSortIcon('purchaseDate')}
            </th>
            <th 
              onClick={() => handleSort('amountTotalClp')} 
              className="monto" 
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              Monto Total{renderSortIcon('amountTotalClp')}
            </th>
            <th 
              onClick={() => handleSort('installmentsCount')} 
              style={{ textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}
            >
              N° Cuotas{renderSortIcon('installmentsCount')}
            </th>
            <th 
              onClick={() => handleSort('monthTotal')} 
              className="monto" 
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              Cuota Mes{renderSortIcon('monthTotal')}
            </th>
            <th style={{ textAlign: 'center' }}>Estado</th>
            <th style={{ textAlign: 'center' }}>Cuotas del Mes</th>
          </tr>
        </thead>
        <tbody>
          {filteredPurchases.length === 0 && searchTerm ? (
            <tr>
              <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</div>
                <p>No se encontraron comercios que coincidan con "{searchTerm}"</p>
              </td>
            </tr>
          ) : (
            getSortedPurchases().map((purchase) => {
            const monthInstallments = getInstallmentsForMonth(purchase);
            const monthTotal = monthInstallments.reduce((s, inst) => s + inst.finalMonthlyAmountClp, 0);

            return (
              <ActualTenpoRow
                key={purchase.id}
                purchase={purchase}
                monthInstallments={monthInstallments}
                monthTotal={monthTotal}
                isSelected={selectedMerchants.has(purchase.merchant)}
                onSelect={() => handleSelectMerchant(purchase.merchant)}
              />
            );
          })
          )}
          {/* Fila de total */}
          <tr style={{ 
            fontWeight: '700', 
            backgroundColor: 'var(--gray-100)',
            borderTop: '2px solid var(--gray-300)'
          }}>
            <td></td>
            <td colSpan={5} style={{ textAlign: 'right', paddingRight: '1rem' }}>
              TOTAL DEL MES:
            </td>
            <td className="monto" style={{ color: '#1e40af' }}>
              ${formatMonto(totalMonth)}
            </td>
            <td colSpan={2}></td>
          </tr>
        </tbody>
      </table>

      {/* Modal: Asignar Categoría por Lote */}
      <Modal 
        open={showBatchAssignModal} 
        onClose={() => {
          setShowBatchAssignModal(false);
          setSelectedCategoryId(null);
        }}
        size="sm"
      >
        <Modal.Header>
          <Modal.Title>Asignar Categoría</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div style={{ marginBottom: '1rem' }}>
            <p style={{ color: '#666', marginBottom: '1rem' }}>
              Se asignarán <strong>{selectedMerchants.size}</strong> comercio(s) a la categoría seleccionada:
            </p>
            <div style={{ 
              maxHeight: '120px', 
              overflow: 'auto', 
              backgroundColor: '#f9fafb',
              padding: '0.5rem',
              borderRadius: '4px',
              marginBottom: '1rem'
            }}>
              {Array.from(selectedMerchants).map(merchant => (
                <div key={merchant} style={{ fontSize: '0.9rem', padding: '0.25rem 0' }}>
                  • {merchant}
                </div>
              ))}
            </div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              Categoría *
            </label>
            <TreePicker
              data={categories}
              value={selectedCategoryId}
              onChange={(value) => setSelectedCategoryId(value as number)}
              labelKey="name"
              valueKey="id"
              childrenKey="children"
              placeholder="Selecciona una categoría"
              style={{ width: '100%' }}
              searchable
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            onClick={handleBatchAssign} 
            appearance="primary"
            disabled={!selectedCategoryId || assigningBatch}
            loading={assigningBatch}
          >
            Asignar
          </Button>
          <Button 
            onClick={() => {
              setShowBatchAssignModal(false);
              setSelectedCategoryId(null);
            }} 
            appearance="subtle"
            disabled={assigningBatch}
          >
            Cancelar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
