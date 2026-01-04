import { useState, FormEvent } from 'react';

interface AddSubscriptionFormProps {
  onSuccess: () => void;
}

export default function AddSubscriptionForm({ onSuccess }: AddSubscriptionFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    periodicity: 'monthly',
    startDate: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setFormData({
          name: '',
          price: '',
          periodicity: 'monthly',
          startDate: new Date().toISOString().split('T')[0]
        });
        onSuccess();
      }
    } catch (error) {
      console.error('Error adding subscription:', error);
    }
  };

  return (
    <div className="card">
      <h2>➕ Nueva Suscripción</h2>
      <form onSubmit={handleSubmit}>
        <div className="grid">
          <div>
            <label className="stat-label">Nombre</label>
            <input
              className="input"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="stat-label">Precio</label>
            <input
              className="input"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="stat-label">Periodicidad</label>
            <select
              className="select"
              value={formData.periodicity}
              onChange={(e) => setFormData({ ...formData, periodicity: e.target.value })}
            >
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensual</option>
              <option value="quarterly">Trimestral</option>
              <option value="semiannual">Semestral</option>
              <option value="annual">Anual</option>
            </select>
          </div>

          <div>
            <label className="stat-label">Fecha de inicio</label>
            <input
              className="input"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
            />
          </div>
        </div>

        <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Agregar Suscripción
        </button>
      </form>
    </div>
  );
}
