import { useState, FormEvent } from 'react';
import { Input, Select, Button, Card } from '../primitives';

interface NewSubscriptionFormProps {
  onSuccess: () => void;
}

const CATEGORY_OPTIONS = [
  { label: 'Streaming', value: 'streaming' },
  { label: 'Productividad', value: 'productivity' },
  { label: 'Salud', value: 'health' },
  { label: 'Gaming', value: 'gaming' },
  { label: 'Storage', value: 'storage' },
  { label: 'Educación', value: 'education' },
  { label: 'Otro', value: 'other' },
];

/**
 * Form to add new subscription - Tailwind only, no RSuite
 */
export function NewSubscriptionForm({ onSuccess }: NewSubscriptionFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: 'streaming',
    periodicity: 'monthly',
    nextChargeDate: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          price: parseFloat(formData.price),
          periodicity: formData.periodicity,
          startDate: formData.nextChargeDate,
        }),
      });

      if (response.ok) {
        // Reset form
        setFormData({
          name: '',
          price: '',
          category: 'streaming',
          periodicity: 'monthly',
          nextChargeDate: '',
        });
        onSuccess();
      }
    } catch (error) {
      console.error('Error adding subscription:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border border-[#F1EFE9]">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-900 mb-1">Nueva Suscripción</h3>
        <p className="text-sm text-slate-500">Agrega un nuevo servicio recurrente.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="NOMBRE DEL SERVICIO"
          placeholder="Ej: Netflix, Spotify"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />

        <Input
          label="PRECIO MENSUAL (CLP)"
          type="number"
          placeholder="0"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          required
          min="0"
          step="1"
        />

        <Select
          label="CATEGORÍA"
          options={CATEGORY_OPTIONS}
          value={formData.category}
          onChange={(value) => setFormData({ ...formData, category: value })}
        />

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">
            FECHA DE PRÓXIMO COBRO
          </label>
          <input
            type="date"
            value={formData.nextChargeDate}
            onChange={(e) => setFormData({ ...formData, nextChargeDate: e.target.value })}
            className="w-full px-4 py-2.5 bg-surface-container/30 border-none rounded-xl text-sm transition-all focus:ring-1 focus:ring-primary focus:outline-none"
            required
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          fullWidth
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Guardando...' : 'Agregar Suscripción'}
        </Button>
      </form>
    </Card>
  );
}
