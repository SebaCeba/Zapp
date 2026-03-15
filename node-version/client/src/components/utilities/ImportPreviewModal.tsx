import { useState, useEffect } from 'react';
import { Modal, Button, Table, SelectPicker } from 'rsuite';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const { Column, HeaderCell, Cell } = Table;

interface PreviewItem {
  gmailMessageId: string;
  emailDate: string;
  amount: number;
  description: string;
  metadata?: any;
  suggestedPayMonth?: string | null; // YYYY-MM
}

interface ImportPreviewModalProps {
  open: boolean;
  onClose: () => void;
  items: PreviewItem[];
  provider: string;
  onConfirm: (items: any[]) => void;
}

export default function ImportPreviewModal({
  open,
  onClose,
  items,
  provider,
  onConfirm
}: ImportPreviewModalProps) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  // Estado: { [gmailMessageId]: { payYear, payMonth } }
  const [selectedDates, setSelectedDates] = useState<Record<string, { payYear: number; payMonth: number }>>({});

  // Reinicializar selectedDates cuando cambian los items
  useEffect(() => {
    const initial: Record<string, { payYear: number; payMonth: number }> = {};
    items.forEach(item => {
      // Si hay suggestedPayMonth (YYYY-MM), usarlo; sino, mes/año actual
      if (item.suggestedPayMonth) {
        const [year, month] = item.suggestedPayMonth.split('-').map(Number);
        initial[item.gmailMessageId] = { payYear: year, payMonth: month };
      } else {
        initial[item.gmailMessageId] = { payYear: currentYear, payMonth: currentMonth };
      }
    });
    setSelectedDates(initial);
  }, [items, currentYear, currentMonth]);

  // Generar opciones de años (año actual ± 2)
  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const year = currentYear - 2 + i;
    return { label: year.toString(), value: year };
  });

  // Generar opciones de meses
  const monthOptions = [
    { label: 'Enero', value: 1 },
    { label: 'Febrero', value: 2 },
    { label: 'Marzo', value: 3 },
    { label: 'Abril', value: 4 },
    { label: 'Mayo', value: 5 },
    { label: 'Junio', value: 6 },
    { label: 'Julio', value: 7 },
    { label: 'Agosto', value: 8 },
    { label: 'Septiembre', value: 9 },
    { label: 'Octubre', value: 10 },
    { label: 'Noviembre', value: 11 },
    { label: 'Diciembre', value: 12 }
  ];

  const handleYearChange = (gmailMessageId: string, payYear: number | null) => {
    if (payYear === null) return;
    setSelectedDates(prev => ({
      ...prev,
      [gmailMessageId]: {
        ...prev[gmailMessageId],
        payYear
      }
    }));
  };

  const handleMonthChange = (gmailMessageId: string, payMonth: number | null) => {
    if (payMonth === null) return;
    setSelectedDates(prev => ({
      ...prev,
      [gmailMessageId]: {
        ...prev[gmailMessageId],
        payMonth
      }
    }));
  };

  const handleApplyToAll = () => {
    if (items.length === 0) return;
    const firstItem = items[0];
    const firstSelection = selectedDates[firstItem.gmailMessageId];
    
    const newDates: Record<string, { payYear: number; payMonth: number }> = {};
    items.forEach(item => {
      newDates[item.gmailMessageId] = { ...firstSelection };
    });
    setSelectedDates(newDates);
  };

  const handleConfirm = () => {
    const confirmedItems = items.map(item => {
      const dates = selectedDates[item.gmailMessageId];
      if (!dates) {
        console.error(`No dates found for gmailMessageId: ${item.gmailMessageId}`);
        return null;
      }
      return {
        gmailMessageId: item.gmailMessageId,
        emailDate: item.emailDate,
        payYear: dates.payYear,
        payMonth: dates.payMonth,
        amount: item.amount,
        description: item.description,
        metadata: item.metadata
      };
    }).filter(Boolean);

    onConfirm(confirmedItems);
  };

  if (!open) return null;

  return (
    <Modal 
      open={open} 
      onClose={onClose}
      size="lg"
      overflow={true}
    >
      <Modal.Header>
        <Modal.Title>Confirmar Importación - {provider}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
            📋 {items.length} {items.length === 1 ? 'transacción encontrada' : 'transacciones encontradas'}
          </p>
          <p style={{ color: '#1e40af', fontSize: '0.85rem', backgroundColor: '#f0f9ff', padding: '0.5rem', borderRadius: '4px' }}>
            💡 <strong>Importante:</strong> Selecciona el mes/año en que registrarás cada pago en tu flujo de caja "Actual".
          </p>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <Button
            size="sm"
            appearance="ghost"
            onClick={handleApplyToAll}
          >
            📌 Aplicar primer mes/año a todos
          </Button>
        </div>

        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <Table
            data={items}
            autoHeight
            bordered
            cellBordered
          >
            <Column width={120} align="left">
              <HeaderCell>Fecha Correo</HeaderCell>
              <Cell>
                {(rowData: PreviewItem) => (
                  <span style={{ fontSize: '0.85rem' }}>
                    {format(new Date(rowData.emailDate), 'dd MMM yyyy', { locale: es })}
                  </span>
                )}
              </Cell>
            </Column>

            <Column width={100} align="right">
              <HeaderCell>Monto</HeaderCell>
              <Cell>
                {(rowData: PreviewItem) => (
                  <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                    ${Math.round(rowData.amount).toLocaleString('es-CL')}
                  </span>
                )}
              </Cell>
            </Column>

            <Column width={200} flexGrow={1} align="left">
              <HeaderCell>Descripción</HeaderCell>
              <Cell>
                {(rowData: PreviewItem) => (
                  <span style={{ fontSize: '0.85rem' }}>
                    {rowData.description || 'Sin descripción'}
                  </span>
                )}
              </Cell>
            </Column>

            <Column width={100} align="center">
              <HeaderCell>Año Pago</HeaderCell>
              <Cell>
                {(rowData: PreviewItem) => (
                  <SelectPicker
                    data={yearOptions}
                    value={selectedDates[rowData.gmailMessageId]?.payYear}
                    onChange={(value) => handleYearChange(rowData.gmailMessageId, value)}
                    cleanable={false}
                    searchable={false}
                    size="xs"
                    style={{ width: '90px' }}
                  />
                )}
              </Cell>
            </Column>

            <Column width={130} align="center">
              <HeaderCell>Mes Pago</HeaderCell>
              <Cell>
                {(rowData: PreviewItem) => (
                  <SelectPicker
                    data={monthOptions}
                    value={selectedDates[rowData.gmailMessageId]?.payMonth}
                    onChange={(value) => handleMonthChange(rowData.gmailMessageId, value)}
                    cleanable={false}
                    searchable={false}
                    size="xs"
                    style={{ width: '120px' }}
                  />
                )}
              </Cell>
            </Column>
          </Table>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={onClose} appearance="subtle">
          Cancelar
        </Button>
        <Button 
          onClick={handleConfirm} 
          appearance="primary"
          disabled={items.length === 0}
        >
          ✅ Confirmar y Guardar ({items.length})
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
