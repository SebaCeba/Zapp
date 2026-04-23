import { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout';
import { MetricCard } from '../components/ui';
import { NewSubscriptionForm } from '../components/subscriptions/NewSubscriptionForm';
import { MonthlyEvolutionChart } from '../components/subscriptions/MonthlyEvolutionChart';
import { NextPaymentCard } from '../components/subscriptions/NextPaymentCard';
import { AnnualPlanningTable } from '../components/subscriptions/AnnualPlanningTable';
import { ScenarioSelector, ScenarioType } from '../components/common/ScenarioSelector';
import { calculateAnnualCost, calculateMonthlyTotals } from '../utils/subscriptionPeriodicity';

interface SubscriptionV2 {
  accountId: number;
  accountCode: string;
  accountName: string;
  periodicity: string;
  startDate: string;
  monthlyPrice: number | null;
  activeMonths: number[];
  totalAnnual: number;
  hasActuals: boolean;
  hasBudget: boolean;
  lastModified: string;
}

interface SubscriptionSummary {
  totalSubscriptions: number;
  totalAnnualBudget: number;
  totalAnnualActual: number;
}

const MONTHS_SHORT = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

export function SubscriptionsPage() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [scenario, setScenario] = useState<ScenarioType>('BUDGET');
  const [subscriptions, setSubscriptions] = useState<SubscriptionV2[]>([]);
  const [summary, setSummary] = useState<SubscriptionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchSubscriptions();
  }, [refreshKey, selectedYear, scenario]);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v2/subscriptions?scenario=${scenario}&year=${selectedYear}`);
      const data = await response.json();
      setSubscriptions(data.subscriptions || []);
      setSummary(data.summary || null);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      setSubscriptions([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleSaveBudget = async () => {
    // This functionality would save current plan as BUDGET
    // For now, just refresh to show updated data
    console.log('Save budget plan for year:', selectedYear);
    handleRefresh();
  };

  // Calculate metrics from API summary or subscriptions
  const totalAnnual = summary
    ? (scenario === 'BUDGET' ? summary.totalAnnualBudget : summary.totalAnnualActual)
    : subscriptions.reduce((sum, sub) => sum + sub.totalAnnual, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calculate monthly evolution data from subscriptions
  const monthlyTotals = Array(12).fill(0);
  subscriptions.forEach(sub => {
    sub.activeMonths.forEach(month => {
      const price = sub.monthlyPrice || 0;
      monthlyTotals[month - 1] += price;
    });
  });
  const monthlyData = MONTHS_SHORT.map((month, idx) => ({
    month,
    amount: monthlyTotals[idx],
  }));

  // Find next payment (simplified: first subscription with price)
  const nextPayment = subscriptions.find(s => s.monthlyPrice && s.monthlyPrice > 0);
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
      {/* Page title and scenario selector */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-tertiary mb-1">
            PRESUPUESTO {selectedYear}
          </p>
          <h1 className="text-3xl font-black text-navy-dark tracking-tight">
            Suscripciones
          </h1>
        </div>
        <ScenarioSelector value={scenario} onChange={setScenario} />
      </div>

      <div className="space-y-8">
        {/* Main Metric */}
        <MetricCard
          icon="payments"
          iconColor="text-primary"
          label={scenario === 'BUDGET' ? 'Gasto Anual Presupuestado' : 'Gasto Anual Real'}
          value={formatCurrency(totalAnnual)}
          badgeLabel={`CLP Total - ${scenario === 'BUDGET' ? 'Presupuesto' : 'Real'}`}
          badgeColor="text-primary"
        />

        {/* Form and Chart Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <NewSubscriptionForm 
            year={selectedYear} 
            scenario={scenario}
            onSuccess={handleRefresh} 
          />
          <MonthlyEvolutionChart year={selectedYear} monthlyData={monthlyData} />
        </div>

        {/* Next Payment Card */}
        {nextPayment && (
          <NextPaymentCard
            serviceName={nextPayment.accountName}
            daysUntilPayment={daysUntilPayment}
            amount={nextPayment.monthlyPrice || 0}
          />
        )}

        {/* Annual Planning Table */}
        <AnnualPlanningTable
          year={selectedYear}
          subscriptions={subscriptions.map(sub => ({
            id: sub.accountId,
            name: sub.accountName,
            price: sub.monthlyPrice || 0,
            category: 'other',
            periodicity: sub.periodicity,
            startDate: sub.startDate,
          }))}
          onExport={() => {
            console.log('Export clicked');
            // TODO: Implement export functionality
          }}
        />

        {/* Action Buttons - Only show for BUDGET scenario */}
        {scenario === 'BUDGET' && (
          <div className="flex justify-center gap-4">
            <button 
              onClick={handleRefresh}
              className="px-6 py-3 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Refrescar
            </button>
            <button 
              onClick={handleSaveBudget}
              className="px-8 py-3 text-sm font-bold bg-primary text-white rounded-xl hover:bg-primary/90 transition-all shadow-sm"
            >
              Guardar Plan {selectedYear}
            </button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
