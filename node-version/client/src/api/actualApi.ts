import { ActualSummary } from '../types/actual';

const API_BASE = '/api/actual';

export async function fetchActualSummary(year: number, month: number): Promise<ActualSummary> {
  const res = await fetch(`${API_BASE}/summary?year=${year}&month=${month}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const error = new Error(errorData.error || 'Error al cargar resumen');
    (error as any).status = res.status;
    throw error;
  }
  return res.json();
}

export async function fetchActualEntries(year: number, month: number, category?: string): Promise<any[]> {
  const query = new URLSearchParams({ year: year.toString(), month: month.toString() });
  if (category) query.append('category', category);
  
  const res = await fetch(`${API_BASE}/entries?${query.toString()}`);
  if (!res.ok) throw new Error('Error al cargar transacciones');
  return res.json();
}

export async function upsertActualEntry(data: any): Promise<void> {
  const res = await fetch(`${API_BASE}/entry`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Error al actualizar transacción');
}

export async function createActualEntry(data: any): Promise<void> {
  const res = await fetch(`${API_BASE}/entry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Error al crear transacción');
}

export async function deleteActualEntry(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/entry/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Error al eliminar transacción');
}
