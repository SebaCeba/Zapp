import { useState, useEffect } from 'react';
import { Input, InputNumber, SelectPicker, DatePicker, Button, Table } from 'rsuite';

const { Column, HeaderCell, Cell } = Table;

interface Subscription {
  id: number;
  name: string;
  price: number;
  periodicity: string;
  startDate: string;
}

interface SubscriptionTableProps {
  refreshKey: number;
  onDelete: () => void;
}

const PERIODICITY_LABELS: Record<string, string> = {
  weekly: 'Semanal',
  monthly: 'Mensual',
  quarterly: 'Trimestral',
  semiannual: 'Semestral',
  annual: 'Anual'
};

const PERIODICITY_OPTIONS = [
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensual' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'semiannual', label: 'Semestral' },
  { value: 'annual', label: 'Anual' }
];

export default function SubscriptionTable({ refreshKey, onDelete }: SubscriptionTableProps) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<Subscription>>({});

  useEffect(() => {
    fetchSubscriptions();
  }, [refreshKey]);

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch('/api/subscriptions');
      const data = await response.json();
      setSubscriptions(data);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta suscripción?')) return;
    try {
      await fetch(`/api/subscriptions/${id}`, { method: 'DELETE' });
      onDelete();
    } catch (error) {
      console.error('Error deleting subscription:', error);
    }
  };

  const handleEdit = (sub: Subscription) => {
    setEditId(sub.id);
    setEditData({ ...sub, startDate: sub.startDate.split('T')[0] });
  };

  const handleEditSave = async (id: number) => {
    try {
      const response = await fetch(`/api/subscriptions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      });
      if (response.ok) {
        setEditId(null);
        setEditData({});
        fetchSubscriptions();
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
    }
  };

  const handleEditCancel = () => {
    setEditId(null);
    setEditData({});
  };

  // Custom cells for inline editing
  const NameCell = ({ rowData, ...props }: any) => {
    if (editId === rowData.id) {
      return (
        <Cell {...props}>
          <Input
            name="name"
            value={editData.name || ''}
            onChange={(value) => setEditData(prev => ({ ...prev, name: value }))}
          />
        </Cell>
      );
    }
    return <Cell {...props}>{rowData.name}</Cell>;
  };

  const PriceCell = ({ rowData, ...props }: any) => {
    if (editId === rowData.id) {
      return (
        <Cell {...props}>
          <InputNumber
            name="price"
            step={0.01}
            min={0}
            value={editData.price || 0}
            onChange={(value) => setEditData(prev => ({ ...prev, price: Number(value) || 0 }))}
            prefix="$"
          />
        </Cell>
      );
    }
    return <Cell {...props}>${rowData.price.toLocaleString('es-CL')}</Cell>;
  };

  const PeriodicityCell = ({ rowData, ...props }: any) => {
    if (editId === rowData.id) {
      return (
        <Cell {...props}>
          <SelectPicker
            data={PERIODICITY_OPTIONS}
            value={editData.periodicity || ''}
            onChange={(value) => setEditData(prev => ({ ...prev, periodicity: value || '' }))}
            cleanable={false}
            searchable={false}
            style={{ width: '100%' }}
          />
        </Cell>
      );
    }
    return <Cell {...props}>{PERIODICITY_LABELS[rowData.periodicity] || rowData.periodicity}</Cell>;
  };

  const StartDateCell = ({ rowData, ...props }: any) => {
    if (editId === rowData.id) {
      return (
        <Cell {...props}>
          <DatePicker
            value={editData.startDate ? new Date(editData.startDate) : null}
            onChange={(date) => {
              if (date) {
                const formatted = date.toISOString().split('T')[0];
                setEditData(prev => ({ ...prev, startDate: formatted }));
              }
            }}
            format="yyyy-MM-dd"
            style={{ width: '100%' }}
          />
        </Cell>
      );
    }
    return <Cell {...props}>{new Date(rowData.startDate).toLocaleDateString('es-CL')}</Cell>;
  };

  const ActionsCell = ({ rowData, ...props }: any) => {
    if (editId === rowData.id) {
      return (
        <Cell {...props}>
          <Button appearance="primary" onClick={() => handleEditSave(rowData.id)} style={{ marginRight: 4 }}>
            Guardar
          </Button>
          <Button appearance="default" onClick={handleEditCancel}>
            Cancelar
          </Button>
        </Cell>
      );
    }
    return (
      <Cell {...props}>
        <Button appearance="primary" onClick={() => handleEdit(rowData)} style={{ marginRight: 4 }}>
          Editar
        </Button>
        <Button color="red" appearance="primary" onClick={() => handleDelete(rowData.id)}>
          Eliminar
        </Button>
      </Cell>
    );
  };

  if (loading) return <div className="loading">Cargando...</div>;

  return (
    <div className="card">
      <h2>📋 Suscripciones Activas</h2>
      <Table
        data={subscriptions}
        loading={loading}
        autoHeight
      >
        <Column width={200} flexGrow={1}>
          <HeaderCell className="app-table-header">Nombre</HeaderCell>
          <NameCell dataKey="name" />
        </Column>

        <Column width={150}>
          <HeaderCell className="app-table-header">Precio</HeaderCell>
          <PriceCell dataKey="price" />
        </Column>

        <Column width={150}>
          <HeaderCell className="app-table-header">Periodicidad</HeaderCell>
          <PeriodicityCell dataKey="periodicity" />
        </Column>

        <Column width={150}>
          <HeaderCell className="app-table-header">Inicio</HeaderCell>
          <StartDateCell dataKey="startDate" />
        </Column>

        <Column width={200}>
          <HeaderCell className="app-table-header">Acción</HeaderCell>
          <ActionsCell dataKey="id" />
        </Column>
      </Table>
    </div>
  );
}
