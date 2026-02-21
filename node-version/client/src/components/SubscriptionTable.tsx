import { useState, useEffect } from 'react';
import { Input, InputNumber, SelectPicker, DatePicker, Button } from 'rsuite';

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

  if (loading) return <div className="loading">Cargando...</div>;

  return (
    <div className="card">
      <h2>📋 Suscripciones Activas</h2>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Precio</th>
              <th>Periodicidad</th>
              <th>Inicio</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((sub) => (
              <tr key={sub.id}>
                {editId === sub.id ? (
                  <>
                    <td>
                      <Input
                        name="name"
                        value={editData.name || ''}
                        onChange={(value) => setEditData(prev => ({ ...prev, name: value }))}
                      />
                    </td>
                    <td>
                      <InputNumber
                        name="price"
                        step={0.01}
                        min={0}
                        value={editData.price || 0}
                        onChange={(value) => setEditData(prev => ({ ...prev, price: Number(value) || 0 }))}
                        prefix="$"
                      />
                    </td>
                    <td>
                      <SelectPicker
                        data={PERIODICITY_OPTIONS}
                        value={editData.periodicity || ''}
                        onChange={(value) => setEditData(prev => ({ ...prev, periodicity: value || '' }))}
                        cleanable={false}
                        searchable={false}
                        style={{ width: '100%' }}
                      />
                    </td>
                    <td>
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
                    </td>
                    <td>
                      <Button appearance="primary" onClick={() => handleEditSave(sub.id)} style={{marginRight:4}}>Guardar</Button>
                      <Button appearance="default" onClick={handleEditCancel}>Cancelar</Button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{sub.name}</td>
                    <td>${sub.price.toLocaleString('es-CL')}</td>
                    <td>{PERIODICITY_LABELS[sub.periodicity] || sub.periodicity}</td>
                    <td>{new Date(sub.startDate).toLocaleDateString('es-CL')}</td>
                    <td>
                      <Button appearance="primary" onClick={() => handleEdit(sub)} style={{marginRight:4}}>Editar</Button>
                      <Button color="red" appearance="primary" onClick={() => handleDelete(sub.id)}>Eliminar</Button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
