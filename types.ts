
export enum DebtStatus {
  OPEN = 'ABERTA',
  PARTIAL = 'PARCIAL',
  PAID = 'QUITADA'
}

export enum InstallmentStatus {
  PENDING = 'PENDENTE',
  PAID = 'PAGO'
}

export interface Debtor {
  id: string;
  name: string;
  tax_id: string; // Mapeado do Supabase
  email: string;
  phone: string;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  tower: string;
  unit: string;
  vgv: number;
  created_at: string;
}

export interface Installment {
  id: string;
  debt_id: string;
  number: number;
  amount: number;
  due_date: string;
  paid_at?: string;
  status: InstallmentStatus;
}

export interface Debt {
  id: string;
  debtor_id: string;
  project_id: string;
  total_value: number;
  commission_rate: number;
  commission_value: number;
  installment_count: number;
  start_date: string;
  status: DebtStatus;
  created_at: string;
  installments?: Installment[];
}
