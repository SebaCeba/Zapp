// ============================================================
// API CLIENT — v2 Dimensional Star Schema
// Base: /api/v2/*
// ============================================================

const BASE = '/api/v2';

// ---- Types ----

export interface MonthlyTotal {
  year: number;
  month: number;
  yearMonth: string;
  totalClp: number;
  totalUsd: number;
  count: number;
}

export interface AccountTotal {
  accountBaseId: number;
  accountCode: string;
  accountName: string;
  totalClp: number;
  totalUsd: number;
  count: number;
}

export interface ComparisonSummary {
  budgetTotal: number;
  actualTotal: number;
  varianceTotal: number;
  variancePercent: number;
  overBudgetCount: number;
  underBudgetCount: number;
  onTargetCount: number;
}

export interface ComparisonLine {
  accountCode: string;
  accountName: string;
  budgetAmount: number;
  actualAmount: number;
  variance: number;
  variancePercent: number;
  status: 'over' | 'under' | 'on_target';
}

export interface AccountNode {
  accountId: number;
  accountCode: string;
  accountName: string;
  accountType: string;
  hierarchyLevel: number;
  isBaseMember: boolean;
  totalClp: number;
  count: number;
  children: AccountNode[];
}

// ---- Fetch helpers ----

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ---- Budget endpoints ----

export function fetchBudgetMonthly(year: number): Promise<MonthlyTotal[]> {
  return get<MonthlyTotal[]>(`/budget/monthly/${year}`);
}

export function fetchBudgetByAccount(
  year: number,
  month?: number,
  accountPrefix?: string
): Promise<AccountTotal[]> {
  const params = new URLSearchParams();
  if (accountPrefix) params.set('accountPrefix', accountPrefix);
  const query = params.toString() ? `?${params}` : '';
  const monthPart = month ? `/${month}` : '';
  return get<AccountTotal[]>(`/budget/by-account/${year}${monthPart}${query}`);
}

export function fetchBudgetDetail(year: number, month: number): Promise<any> {
  return get(`/budget/${year}/${month}`);
}

// ---- Actual endpoints ----

export function fetchActualMonthly(year: number): Promise<MonthlyTotal[]> {
  return get<MonthlyTotal[]>(`/actual/monthly/${year}`);
}

export function fetchActualByAccount(
  year: number,
  month?: number,
  accountPrefix?: string
): Promise<AccountTotal[]> {
  const params = new URLSearchParams();
  if (accountPrefix) params.set('accountPrefix', accountPrefix);
  const query = params.toString() ? `?${params}` : '';
  const monthPart = month ? `/${month}` : '';
  return get<AccountTotal[]>(`/actual/by-account/${year}${monthPart}${query}`);
}

// ---- Comparison endpoints ----

export function fetchComparisonLines(year: number, month?: number): Promise<ComparisonLine[]> {
  const monthPart = month ? `/${month}` : '';
  return get<ComparisonLine[]>(`/comparison/${year}${monthPart}`);
}

export function fetchComparisonSummary(year: number, month?: number): Promise<ComparisonSummary> {
  const monthPart = month ? `/${month}` : '';
  return get<ComparisonSummary>(`/comparison/summary/${year}${monthPart}`);
}

// ---- Facts mutation ----

export interface UpsertFactPayload {
  scenario: 'BUDGET' | 'ACTUAL';
  year: number;
  month: number;
  accountCode: string;
  amountClp: number;
}

export async function upsertFact(payload: UpsertFactPayload): Promise<void> {
  const res = await fetch(`${BASE}/facts`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
}

// ---- Accounts endpoints ----

export function fetchAccountHierarchy(
  scenario: 'BUDGET' | 'ACTUAL',
  year: number,
  month?: number
): Promise<AccountNode[]> {
  const monthPart = month ? `/${month}` : '';
  return get<AccountNode[]>(`/accounts/hierarchy/${scenario}/${year}${monthPart}`);
}
