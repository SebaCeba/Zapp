import { ActualSummary, UpsertActualEntryPayload } from '../types/actual';

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

export async function upsertActualEntry(payload: UpsertActualEntryPayload): Promise<void> {
  const res = await fetch(`${API_BASE}/entry`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const error = new Error(errorData.error || 'Error al guardar');
    (error as any).status = res.status;
    throw error;
  }
}
