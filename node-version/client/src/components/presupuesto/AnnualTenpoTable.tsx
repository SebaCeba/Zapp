import { useState, useMemo } from 'react';
import { Panel, Table, Button, Tag } from 'rsuite';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const { Column, HeaderCell, Cell } = Table;

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

interface AnnualTenpoTableProps {
  purchases: Purchase[];
  selectedYear: number;
  selectedMonth: number | null;
  selectedCategory: string | null;
  onPurchaseClick: (purchase: Purchase) => void;
}

interface PurchaseRow {
  id: number;
  purchase: Purchase;
  merchant: string;
  category: string;
  categoryColor: string;
  purchaseDate: Date;
  amountTotal: number;
  installmentsCount: number;
  monthTotal: number;
  cuotasEnMes: number;
  estado: 'ESTIMADO' | 'REAL';
  tieneInteres: boolean;
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function AnnualTenpoTable({
  purchases,
  selectedYear,
  selectedMonth,
  selectedCategory,
  onPurchaseClick
}: AnnualTenpoTableProps) {

  const [sortColumn, setSortColumn] = useState<string>('purchaseDate');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('desc');

  const filteredData = useMemo(() => {
    const rows: PurchaseRow[] = [];

    purchases.forEach(purchase => {
      // Filtrar cuotas según selección
      let relevantInstallments = purchase.installments.filter(inst => {
        const dueDate = new Date(inst.dueDate);
        if (dueDate.getFullYear() !== selectedYear) return false;
        
        if (selectedMonth && dueDate.getMonth() + 1 !== selectedMonth) return false;
        
        return true;
      });

      // Si hay mes seleccionado, solo mostrar compras con cuotas en ese mes
      if (selectedMonth && relevantInstallments.length === 0) return;

      // Filtrar por categoría si está seleccionada
      const catName = purchase.category?.name || 'Sin Categoría';
      if (selectedCategory && catName !== selectedCategory) return;

      // Calcular monto total del mes seleccionado (o año completo si no hay mes)
      const monthTotal = relevantInstallments.reduce((sum, inst) => sum + inst.finalMonthlyAmountClp, 0);

      // Si hay mes seleccionado, calcular cuántas cuotas caen en ese mes
      const cuotasEnMes = selectedMonth 
        ? purchase.installments.filter(inst => {
            const dueDate = new Date(inst.dueDate);
            return dueDate.getFullYear() === selectedYear && dueDate.getMonth() + 1 === selectedMonth;
          }).length
        : purchase.installments.filter(inst => new Date(inst.dueDate).getFullYear() === selectedYear).length;

      rows.push({
        id: purchase.id,
        purchase,
        merchant: purchase.merchant,
        category: catName,
        categoryColor: purchase.category?.color || '#9ca3af',
        purchaseDate: new Date(purchase.purchaseDate),
        amountTotal: purchase.amountTotalClp,
        installmentsCount: purchase.installmentsCount,
        monthTotal,
        cuotasEnMes,
        estado: purchase.modoMonto,
        tieneInteres: purchase.tieneInteres
      });
    });

    // Sorting
    return rows.sort((a, b) => {
      let compareA: any = a[sortColumn as keyof PurchaseRow];
      let compareB: any = b[sortColumn as keyof PurchaseRow];

      // Manejo especial para fechas
      if (sortColumn === 'purchaseDate') {
        compareA = a.purchaseDate.getTime();
        compareB = b.purchaseDate.getTime();
      }

      if (sortType === 'asc') {
        return compareA > compareB ? 1 : -1;
      } else {
        return compareA < compareB ? 1 : -1;
      }
    });
  }, [purchases, selectedYear, selectedMonth, selectedCategory, sortColumn, sortType]);

  const handleSortColumn = (column: string, type?: 'asc' | 'desc') => {
    setSortColumn(column);
    setSortType(type || 'asc');
  };

  const formatCurrency = (amount: number) => {
    return '$' + new Intl.NumberFormat('es-CL', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.round(amount));
  };

  const formatDate = (date: Date) => {
    return format(date, 'dd/MM/yyyy', { locale: es });
  };

  const totalAmount = filteredData.reduce((sum, row) => sum + row.monthTotal, 0);
  const totalPurchases = filteredData.length;

  const getTitle = () => {
    if (selectedMonth && selectedCategory) {
      return `${MESES[selectedMonth - 1]} ${selectedYear} - ${selectedCategory}`;
    } else if (selectedMonth) {
      return `${MESES[selectedMonth - 1]} ${selectedYear}`;
    } else if (selectedCategory) {
      return `Año ${selectedYear} - ${selectedCategory}`;
    } else {
      return `Todas las compras - ${selectedYear}`;
    }
  };

  return (
    <Panel 
      bordered 
      style={{ background: '#fff', marginBottom: '1.5rem' }}
      header={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h5 style={{ margin: 0, marginBottom: '0.25rem' }}>
              Detalle de Compras
            </h5>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              {getTitle()}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              {totalPurchases} compra{totalPurchases !== 1 ? 's' : ''}
            </div>
            <div style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827' }}>
              {formatCurrency(totalAmount)}
            </div>
          </div>
        </div>
      }
    >
      {filteredData.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
          {selectedMonth || selectedCategory 
            ? 'No hay compras que coincidan con el filtro seleccionado'
            : 'No hay compras registradas para este año'
          }
        </div>
      ) : (
        <Table
          data={filteredData}
          height={Math.min(600, filteredData.length * 60 + 50)}
          hover
          bordered
          cellBordered
          sortColumn={sortColumn}
          sortType={sortType}
          onSortColumn={handleSortColumn}
          rowClassName="cursor-pointer"
          onRowClick={(rowData) => {
            onPurchaseClick(rowData.purchase);
          }}
        >
          <Column width={250} flexGrow={1} sortable>
            <HeaderCell>Comercio</HeaderCell>
            <Cell>
              {(rowData: PurchaseRow) => (
                <div>
                  <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
                    {rowData.merchant}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span>{rowData.installmentsCount} cuotas</span>
                    {rowData.tieneInteres && (
                      <span style={{ color: '#ef4444' }}>📈 Con interés</span>
                    )}
                  </div>
                </div>
              )}
            </Cell>
          </Column>

          <Column width={150} sortable>
            <HeaderCell>Categoría</HeaderCell>
            <Cell>
              {(rowData: PurchaseRow) => (
                <Tag 
                  style={{ 
                    backgroundColor: rowData.categoryColor,
                    color: '#fff',
                    border: 'none'
                  }}
                >
                  {rowData.category}
                </Tag>
              )}
            </Cell>
          </Column>

          <Column width={120} sortable>
            <HeaderCell>Fecha Compra</HeaderCell>
            <Cell>
              {(rowData: PurchaseRow) => (
                <span style={{ fontSize: '0.875rem' }}>
                  {formatDate(rowData.purchaseDate)}
                </span>
              )}
            </Cell>
          </Column>

          <Column width={130} sortable align="right">
            <HeaderCell>Total Compra</HeaderCell>
            <Cell>
              {(rowData: PurchaseRow) => (
                <span style={{ fontWeight: '500' }}>
                  {formatCurrency(rowData.amountTotal)}
                </span>
              )}
            </Cell>
          </Column>

          <Column width={100} sortable align="center">
            <HeaderCell>Cuotas en {selectedMonth ? 'mes' : 'año'}</HeaderCell>
            <Cell>
              {(rowData: PurchaseRow) => (
                <Tag color="blue">
                  {rowData.cuotasEnMes}
                </Tag>
              )}
            </Cell>
          </Column>

          <Column width={140} sortable align="right">
            <HeaderCell>
              {selectedMonth ? `Monto ${MESES[selectedMonth - 1]}` : 'Monto Año'}
            </HeaderCell>
            <Cell>
              {(rowData: PurchaseRow) => (
                <span style={{ fontWeight: '600', color: '#3b82f6' }}>
                  {formatCurrency(rowData.monthTotal)}
                </span>
              )}
            </Cell>
          </Column>

          <Column width={110} align="center">
            <HeaderCell>Estado</HeaderCell>
            <Cell>
              {(rowData: PurchaseRow) => (
                <Tag color={rowData.estado === 'REAL' ? 'green' : 'yellow'}>
                  {rowData.estado}
                </Tag>
              )}
            </Cell>
          </Column>

          <Column width={100} align="center">
            <HeaderCell>Acción</HeaderCell>
            <Cell>
              {(rowData: PurchaseRow) => (
                <Button 
                  appearance="link" 
                  size="xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPurchaseClick(rowData.purchase);
                  }}
                >
                  Ver detalle
                </Button>
              )}
            </Cell>
          </Column>
        </Table>
      )}
    </Panel>
  );
}
