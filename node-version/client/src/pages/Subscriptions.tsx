import { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout';
import { MetricCard } from '../components/ui';
import { NewSubscriptionForm } from '../components/subscriptions/NewSubscriptionForm';
import { MonthlyEvolutionChart } from '../components/subscriptions/MonthlyEvolutionChart';
import { NextPaymentCard } from '../components/subscriptions/NextPaymentCard';
import { AnnualPlanningTable } from '../components/subscriptions/AnnualPlanningTable';

interface Subscription {
  id: number;
  name: string;
  price: number;
  periodicity: string;
  startDate: string;
  category?: string;
}

const MONTHS_SHORT = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

export function SubscriptionsPage() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchSubscriptions();
  }, [refreshKey]);

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch('/api/subscriptions');
      const data = await response.json();
      setSubscriptions(data);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Calculate metrics
  const totalAnnual = subscriptions.reduce((sum, sub) => {
    // Simplified: assuming monthly for now
    return sum + (sub.price * 12);
  }, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calculate monthly evolution data (simplified)
  const monthlyData = MONTHS_SHORT.map((month) => ({
    month,
    amount: subscriptions.reduce((sum, sub) => sum + sub.price, 0),
  }));

  // Find next payment (simplified: first subscription)
  const nextPayment = subscriptions[0];
  const daysUntilPayment = nextPayment ? 3 : 0; // Mock for now

  if (loading) {
    return (
      <MainLayout headerProps={{ year: selectedYear }}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <span className="material-symbols-outlined text-6xl text-primary animate-pulse">
              subscription
            </span>
            <p className="mt-4 text-slate-500">Cargando suscripciones...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout headerProps={{ year: selectedYear }}>
      {/* Page title */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-tertiary mb-1">
            PRESUPUESTO {selectedYear}
          </p>
          <h1 className="text-3xl font-black text-navy-dark tracking-tight">
            Suscripciones
          </h1>
        </div>
      </div>

      <div className="space-y-8">
        {/* Main Metric */}
        <MetricCard
          icon="payments"
          iconColor="text-primary"
          label="Gasto Anual Proyectado"
          value={formatCurrency(totalAnnual)}
          badgeLabel="CLP Total"
          badgeColor="text-primary"
        />

        {/* Form and Chart Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <NewSubscriptionForm onSuccess={handleRefresh} />
          <MonthlyEvolutionChart year={selectedYear} monthlyData={monthlyData} />
        </div>

        {/* Next Payment Card */}
        {nextPayment && (
          <NextPaymentCard
            serviceName={nextPayment.name}
            daysUntilPayment={daysUntilPayment}
            amount={nextPayment.price}
          />
        )}

        {/* Annual Planning Table */}
        <AnnualPlanningTable
          year={selectedYear}
          subscriptions={subscriptions.map(sub => ({
            ...sub,
            category: sub.category || 'other',
          }))}
          onExport={() => {
            console.log('Export clicked');
            // TODO: Implement export functionality
          }}
        />

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <button className="px-6 py-3 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">
            Descartar
          </button>
          <button className="px-8 py-3 text-sm font-bold bg-primary text-white rounded-xl hover:bg-primary/90 transition-all shadow-sm">
            Guardar Plan {selectedYear}
          </button>
        </div>
      </div>
    </MainLayout>
  );
}
