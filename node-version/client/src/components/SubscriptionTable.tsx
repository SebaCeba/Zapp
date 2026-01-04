import { useState, useEffect } from 'react';

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

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
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
                      <input
                        className="input"
                        name="name"
                        value={editData.name || ''}
                        onChange={handleEditChange}
                      />
                    </td>
                    <td>
                      <input
                        className="input"
                        name="price"
                        type="number"
                        step="0.01"
                        value={editData.price || ''}
                        onChange={handleEditChange}
                      />
                    </td>
                    <td>
                      <select
                        className="select"
                        name="periodicity"
                        value={editData.periodicity || ''}
                        onChange={handleEditChange}
                      >
                        {PERIODICITY_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        className="input"
                        name="startDate"
                        type="date"
                        value={editData.startDate || ''}
                        onChange={handleEditChange}
                      />
                    </td>
                    <td>
                      <button className="btn btn-primary" onClick={() => handleEditSave(sub.id)} style={{marginRight:4}}>Guardar</button>
                      <button className="btn" onClick={handleEditCancel}>Cancelar</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{sub.name}</td>
                    <td>${sub.price.toLocaleString('es-CL')}</td>
                    <td>{PERIODICITY_LABELS[sub.periodicity] || sub.periodicity}</td>
                    <td>{new Date(sub.startDate).toLocaleDateString('es-CL')}</td>
                    <td>
                      <button className="btn btn-primary" onClick={() => handleEdit(sub)} style={{marginRight:4}}>Editar</button>
                      <button className="btn btn-danger" onClick={() => handleDelete(sub.id)}>Eliminar</button>
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
