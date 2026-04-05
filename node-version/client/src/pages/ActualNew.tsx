import { useState } from 'react';
import { MainLayout } from '../components/layout';
import { Card, Badge } from '../components/primitives';

interface Transaction {
  id: string;
  date: string;
  category: string;
  categoryIcon: string;
  categoryColor: string;
  description: string;
  amount: number;
  status: 'cleared' | 'pending';
}

const mockTransactions: Transaction[] = [
  {
    id: '1',
    date: '12 Jun, 2024',
    category: 'Shopping',
    categoryIcon: 'shopping_bag',
    categoryColor: 'blue',
    description: 'Apple Store - iPhone 15 Case',
    amount: 59.00,
    status: 'cleared',
  },
  {
    id: '2',
    date: '10 Jun, 2024',
    category: 'Alimentación',
    categoryIcon: 'restaurant',
    categoryColor: 'amber',
    description: 'Whole Foods Market',
    amount: 142.30,
    status: 'pending',
  },
  {
    id: '3',
    date: '08 Jun, 2024',
    category: 'Transporte',
    categoryIcon: 'directions_car',
    categoryColor: 'purple',
    description: 'Shell Station Fuel',
    amount: 64.12,
    status: 'cleared',
  },
];

export function ActualPage() {
  const [activeTab, setActiveTab] = useState<'actual' | 'history'>('actual');

  const headerProps = {
    year: 2024,
    tabs: [
      { label: 'Actual', active: activeTab === 'actual', onClick: () => setActiveTab('actual') },
      { label: 'History', active: activeTab === 'history', onClick: () => setActiveTab('history') },
    ],
    actions: (
      <div className="relative hidden md:block mr-2">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
          search
        </span>
        <input
          className="pl-9 pr-4 py-2 bg-surface-container/50 border-none rounded-xl text-sm w-48 focus:ring-1 focus:ring-navy-dark transition-all focus:w-64"
          placeholder="Buscar..."
          type="text"
        />
      </div>
    ),
  };

  return (
    <MainLayout headerProps={headerProps}>
      {/* Summary Header Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Monthly Status */}
        <Card className="col-span-1 md:col-span-2" variant="rounded" padding="lg">
          <div className="flex flex-col h-full justify-between">
            <div>
              <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                Status Mensual
              </h2>
              <div className="flex items-baseline gap-4 mt-1">
                <span className="text-4xl font-black tracking-tight tabular-nums text-navy-dark">
                  $3,420.50
                </span>
                <span className="text-slate-400 font-medium">de $4,500.00 presupuestados</span>
              </div>
            </div>
            <div className="mt-8">
              <div className="flex justify-between text-xs mb-3">
                <span className="font-bold text-navy-dark">76% del presupuesto utilizado</span>
                <span className="text-slate-400 font-medium">Restan $1,079.50</span>
              </div>
              <div className="w-full h-2.5 bg-surface-container rounded-full overflow-hidden">
                <div className="bg-navy-dark h-full rounded-full" style={{ width: '76%' }}></div>
              </div>
            </div>
          </div>
        </Card>

        {/* Available Balance */}
        <Card className="bg-primary text-white" variant="rounded" padding="lg">
          <div className="flex flex-col justify-between h-full">
            <div>
              <h3 className="text-[10px] font-bold opacity-80 uppercase tracking-widest mb-1">
                Saldo Disponible
              </h3>
              <p className="text-3xl font-black tabular-nums mt-2">$12,840.12</p>
            </div>
            <button className="mt-8 w-full bg-white text-primary font-black py-4 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 active:scale-[0.98] transition-all cursor-pointer text-sm shadow-sm">
              <span
                className="material-symbols-outlined text-[20px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                add
              </span>
              Add Transaction
            </button>
          </div>
        </Card>
      </section>

      {/* Transactions Ledger */}
      <Card variant="hero" padding="none">
        <div className="p-8 border-b border-surface-container-low flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-black text-navy-dark">Transacciones Actuales</h2>
            <p className="text-sm text-slate-400 font-medium mt-1">
              Junio 2024 • Registro detallado
            </p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                search
              </span>
              <input
                className="pl-9 pr-4 py-2.5 bg-surface-container/30 border-none rounded-xl text-sm w-full sm:w-64 focus:ring-1 focus:ring-primary transition-all"
                placeholder="Buscar..."
                type="text"
              />
            </div>
            <button className="p-2.5 bg-surface-container/30 rounded-xl hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined text-slate-600">filter_list</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-surface-container/30">
                <th className="px-8 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                  Fecha
                </th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                  Categoría
                </th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                  Descripción
                </th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">
                  Monto
                </th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">
                  Status
                </th>
                <th className="px-8 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low text-sm">
              {mockTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-surface-container-low/50 transition-colors group">
                  <td className="py-5 px-8 text-slate-600 font-medium tabular-nums">
                    {transaction.date}
                  </td>
                  <td className="py-5 px-6">
                    <Badge variant={transaction.categoryColor as any} size="md" icon={
                      <span className="material-symbols-outlined text-[14px]">
                        {transaction.categoryIcon}
                      </span>
                    }>
                      {transaction.category}
                    </Badge>
                  </td>
                  <td className="py-5 px-6 font-bold text-navy-dark">
                    {transaction.description}
                  </td>
                  <td className="py-5 px-6 text-right font-black tabular-nums text-navy-dark">
                    ${transaction.amount.toFixed(2)}
                  </td>
                  <td className="py-5 px-6 text-center">
                    <Badge
                      variant={transaction.status === 'cleared' ? 'success' : 'primary'}
                      size="md"
                      icon={
                        <span className="material-symbols-outlined text-[14px]">
                          {transaction.status === 'cleared' ? 'check_circle' : 'schedule'}
                        </span>
                      }
                    >
                      {transaction.status === 'cleared' ? 'Cleared' : 'Pending'}
                    </Badge>
                  </td>
                  <td className="py-5 px-8 text-right">
                    <button className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-surface-container rounded-lg transition-all">
                      <span className="material-symbols-outlined text-slate-400 text-[20px]">
                        more_horiz
                      </span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-6 bg-surface-container/10 border-t border-surface-container-low flex justify-between items-center">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
            Mostrando 5 de 42 transacciones
          </span>
          <div className="flex gap-2">
            <button className="px-5 py-2 text-[11px] font-black uppercase tracking-widest text-slate-500 bg-surface-container/50 rounded-xl hover:bg-surface-container transition-all">
              Anterior
            </button>
            <button className="px-5 py-2 text-[11px] font-black uppercase tracking-widest text-white bg-primary rounded-xl hover:opacity-90 transition-all">
              Siguiente
            </button>
          </div>
        </div>
      </Card>

      {/* Secondary Analytics Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card variant="hero" padding="lg" className="flex flex-col justify-between h-48 border border-transparent">
          <div className="flex justify-between items-start">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Top Gasto
            </h3>
            <span className="material-symbols-outlined text-slate-300">trending_up</span>
          </div>
          <div>
            <p className="text-2xl font-black text-navy-dark">Vivienda</p>
            <p className="text-sm text-slate-400 font-medium">65.8% del total actual</p>
          </div>
        </Card>

        <Card variant="hero" padding="lg" className="flex flex-col justify-between h-48">
          <div className="flex justify-between items-start">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Ahorro Proyectado
            </h3>
            <span className="material-symbols-outlined text-slate-300">savings</span>
          </div>
          <div>
            <p className="text-2xl font-black text-navy-dark">$1,079.50</p>
            <p className="text-sm text-emerald-600 font-bold">+$240 vs mes anterior</p>
          </div>
        </Card>

        <div className="relative rounded-[32px] overflow-hidden h-48 group cursor-pointer shadow-sm bg-navy-dark">
          <div className="absolute inset-0 bg-navy-dark/50 group-hover:bg-navy-dark/40 transition-colors p-8 flex flex-col justify-end">
            <h3 className="text-white font-black text-lg">Resumen de Cuenta</h3>
            <p className="text-white/80 text-xs font-medium">Descargar reporte detallado PDF</p>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
