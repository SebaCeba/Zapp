import { useState, FormEvent } from 'react';
import { Button, Input, InputNumber, SelectPicker, Panel, DatePicker } from 'rsuite';

interface AddSubscriptionFormProps {
  onSuccess: () => void;
}

const periodicityData = [
  { label: 'Semanal', value: 'weekly' },
  { label: 'Mensual', value: 'monthly' },
  { label: 'Trimestral', value: 'quarterly' },
  { label: 'Semestral', value: 'semiannual' },
  { label: 'Anual', value: 'annual' }
];

export default function AddSubscriptionForm({ onSuccess }: AddSubscriptionFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    periodicity: 'monthly',
    startDate: new Date()
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          startDate: formData.startDate.toISOString().split('T')[0]
        })
      });

      if (response.ok) {
        setFormData({
          name: '',
          price: 0,
          periodicity: 'monthly',
          startDate: new Date()
        });
        onSuccess();
      }
    } catch (error) {
      console.error('Error adding subscription:', error);
    }
  };

  return (
    <Panel bordered header="➕ Nueva Suscripción" style={{ marginBottom: '1rem' }}>
      <form onSubmit={handleSubmit}>
        <div className="grid">
          <div>
            <label className="stat-label">Nombre</label>
            <Input
              placeholder="Ej: Netflix"
              value={formData.name}
              onChange={(value) => setFormData({ ...formData, name: value })}
              required
            />
          </div>

          <div>
            <label className="stat-label">Precio</label>
            <InputNumber
              prefix="$"
              step={0.01}
              value={formData.price}
              onChange={(value) => setFormData({ ...formData, price: Number(value) || 0 })}
              required
              min={0}
            />
          </div>

          <div>
            <label className="stat-label">Periodicidad</label>
            <SelectPicker
              data={periodicityData}
              value={formData.periodicity}
              onChange={(value) => setFormData({ ...formData, periodicity: value || 'monthly' })}
              cleanable={false}
              searchable={false}
              block
            />
          </div>

          <div>
            <label className="stat-label">Fecha de inicio</label>
            <DatePicker
              format="yyyy-MM-dd"
              value={formData.startDate}
              onChange={(value) => setFormData({ ...formData, startDate: value || new Date() })}
              block
            />
          </div>
        </div>

        <Button type="submit" appearance="primary" style={{ marginTop: '1rem' }}>
          Agregar Suscripción
        </Button>
      </form>
    </Panel>
  );
}
