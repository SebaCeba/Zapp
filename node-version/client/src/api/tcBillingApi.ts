import {
  TcBillingConfig,
  TcBillingOverride,
  AnnualCyclesResponse,
  RecalculateRequest,
  RecalculateResponse
} from '../types/tcBilling';

const API_BASE = '/api/tc-billing';

export async function fetchTcConfig(tcKey: string): Promise<TcBillingConfig> {
  const res = await fetch(`${API_BASE}/config?tcKey=${tcKey}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const error = new Error(errorData.error || 'Error al cargar configuración');
    (error as any).status = res.status;
    throw error;
  }
  return res.json();
}

export async function upsertTcConfig(payload: {
  tcKey: string;
  closingDay: number;
  dueDay: number;
  businessDayRule: 'PREVIOUS' | 'NEXT' | 'NONE';
}): Promise<TcBillingConfig> {
  const res = await fetch(`${API_BASE}/config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const error = new Error(errorData.error || 'Error al guardar configuración');
    (error as any).status = res.status;
    throw error;
  }
  return res.json();
}

export async function fetchAnnualCycles(tcKey: string, year: number): Promise<AnnualCyclesResponse> {
  const res = await fetch(`${API_BASE}/cycles?tcKey=${tcKey}&year=${year}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const error = new Error(errorData.error || 'Error al cargar ciclos');
    (error as any).status = res.status;
    throw error;
  }
  return res.json();
}

export async function upsertOverride(payload: {
  tcKey: string;
  year: number;
  month: number;
  effectiveCloseDate: string;
}): Promise<TcBillingOverride> {
  const res = await fetch(`${API_BASE}/overrides`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const error = new Error(errorData.error || 'Error al guardar override');
    (error as any).status = res.status;
    throw error;
  }
  return res.json();
}

export async function deleteOverride(tcKey: string, year: number, month: number): Promise<void> {
  const res = await fetch(`${API_BASE}/overrides?tcKey=${tcKey}&year=${year}&month=${month}`, {
    method: 'DELETE'
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const error = new Error(errorData.error || 'Error al eliminar override');
    (error as any).status = res.status;
    throw error;
  }
}

export async function recalculateCycles(request: RecalculateRequest): Promise<RecalculateResponse> {
  const res = await fetch(`${API_BASE}/recalculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const error = new Error(errorData.error || 'Error al recalcular ciclos');
    (error as any).status = res.status;
    throw error;
  }
  return res.json();
}
