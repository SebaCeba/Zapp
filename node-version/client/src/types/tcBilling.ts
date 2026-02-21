export interface TcBillingConfig {
  id: number;
  tcKey: string;
  closingDay: number;
  dueDay: number;
  businessDayRule: 'PREVIOUS' | 'NEXT' | 'NONE';
  createdAt: string;
  updatedAt: string;
  overrides: TcBillingOverride[];
}

export interface TcBillingOverride {
  id: number;
  tcKey: string;
  year: number;
  month: number;
  effectiveCloseDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface BillingCycle {
  month: number;
  fromDate: string;
  toDate: string;
  nominalToDate: string;
  ruleApplied: boolean;
  overrideApplied: boolean;
}

export interface AnnualCyclesResponse {
  tcKey: string;
  year: number;
  cycles: BillingCycle[];
}

export interface RecalculateRequest {
  tcKey: string;
  year: number;
  scope: 'FUTURE_ONLY' | 'ALL_NON_REAL_NON_MANUAL';
  dryRun?: boolean;
}

export interface RecalculateSample {
  purchaseId: number;
  installmentId: number;
  oldDate: string;
  newDate: string;
}

export interface RecalculateResponse {
  dryRun?: boolean;
  wouldChangeCount?: number;
  changedCount?: number;
  sampleChanges?: RecalculateSample[];
  success?: boolean;
  message?: string;
}
