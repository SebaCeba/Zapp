export enum ActualCategory {
  INGRESOS = 'INGRESOS',
  SUSCRIPCIONES = 'SUSCRIPCIONES',
  OBLIGACIONES = 'OBLIGACIONES',
  HIPOTECARIO = 'HIPOTECARIO',
  SERVICIOS_BASICOS = 'SERVICIOS_BASICOS',
  SUPERMERCADO = 'SUPERMERCADO',
  PAGO_TC = 'PAGO_TC',
  AJUSTES = 'AJUSTES'
}

export interface ActualLine {
  itemKey: string;
  itemName: string;
  budgetClp: number;
  actualClp: number;
  deltaClp: number;
  pctExec: number | null;
}

export interface CategorySummary {
  name: ActualCategory;
  budgetClp: number;
  actualClp: number;
  deltaClp: number;
  pctExec: number | null;
  lines: ActualLine[];
}

export interface ActualSummary {
  year: number;
  month: number;
  totalIngresos: number;
  totalGastos: number;
  balance: number;
  categories: CategorySummary[];
}

export interface UpsertActualEntryPayload {
  year: number;
  month: number;
  category: ActualCategory;
  itemKey: string;
  amountClp: number;
}
