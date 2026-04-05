import { MainLayout } from '../components/layout';
import { Card } from '../components/primitives';

export function HomePage() {
  const headerProps = {
    year: 2024,
    onYearChange: (year: number) => console.log('Year changed to:', year),
  };

  return (
    <MainLayout headerProps={headerProps}>
      {/* Hero Section: Net Worth */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Net Worth Card */}
        <div className="lg:col-span-2 bg-primary text-white p-8 rounded-[32px] shadow-sm relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-xs font-bold opacity-80 uppercase tracking-widest mb-1">
              Total Net Worth
            </p>
            <h2 className="text-5xl font-black tabular-nums tracking-tight">$42,850.42</h2>
            <div className="mt-6 flex items-center gap-4">
              <div className="flex items-center gap-1 bg-white/20 backdrop-blur px-3 py-1.5 rounded-full text-xs font-bold">
                <span className="material-symbols-outlined text-sm">trending_up</span>
                <span>+12.4%</span>
              </div>
              <p className="text-xs opacity-70 italic">vs last month (+ $4,720.00)</p>
            </div>
          </div>
          <div className="absolute right-0 top-0 h-full w-1/3 opacity-10 transform translate-x-12 translate-y-4">
            <span className="material-symbols-outlined text-[12rem]">account_balance</span>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 gap-4">
          <button className="flex flex-col items-center justify-center gap-3 bg-white hover:bg-slate-50 transition-all duration-300 p-6 rounded-3xl group">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined">add_card</span>
            </div>
            <span className="text-xs font-bold text-navy-dark">Add Expense</span>
          </button>
          
          <button className="flex flex-col items-center justify-center gap-3 bg-white hover:bg-slate-50 transition-all duration-300 p-6 rounded-3xl group">
            <div className="w-12 h-12 bg-tertiary/10 text-tertiary rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined">edit_calendar</span>
            </div>
            <span className="text-xs font-bold text-navy-dark">Update Budget</span>
          </button>
          
          <button className="flex flex-col items-center justify-center gap-3 bg-white hover:bg-slate-50 transition-all duration-300 p-6 rounded-3xl group">
            <div className="w-12 h-12 bg-secondary/10 text-secondary rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined">savings</span>
            </div>
            <span className="text-xs font-bold text-navy-dark">New Goal</span>
          </button>
          
          <button className="flex flex-col items-center justify-center gap-3 bg-white hover:bg-slate-50 transition-all duration-300 p-6 rounded-3xl group">
            <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined">ios_share</span>
            </div>
            <span className="text-xs font-bold text-navy-dark">Export PDF</span>
          </button>
        </div>
      </section>

      {/* Bento Layout: Month Summary & Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Current Month Summary */}
        <Card className="md:col-span-5" variant="hero" padding="lg">
          <div className="space-y-8">
            <div className="flex justify-between items-end">
              <h3 className="text-lg font-bold text-navy-dark">Current Month</h3>
              <span className="text-[10px] font-bold text-primary tracking-widest uppercase">
                October 2024
              </span>
            </div>

            <div className="space-y-6">
              {/* Housing & Utils */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Housing & Utils</span>
                  <span className="tabular-nums font-semibold text-navy-dark">$1,450 / $1,500</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: '96.6%' }}></div>
                </div>
              </div>

              {/* Food & Dining */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Food & Dining</span>
                  <span className="tabular-nums font-semibold text-navy-dark">$420 / $600</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-primary/60 rounded-full" style={{ width: '70%' }}></div>
                </div>
              </div>

              {/* Transport */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Transport</span>
                  <span className="tabular-nums font-semibold text-navy-dark">$215 / $200</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-error rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>

              {/* Entertainment */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Entertainment</span>
                  <span className="tabular-nums font-semibold text-navy-dark">$85 / $300</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-tertiary/40 rounded-full" style={{ width: '28%' }}></div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-50 flex justify-between items-center">
              <div className="text-center">
                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                  Projected Savings
                </p>
                <p className="text-2xl font-black text-navy-dark tabular-nums">$1,240.00</p>
              </div>
              <div className="h-10 w-[1px] bg-slate-100"></div>
              <div className="text-center">
                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                  Daily Average
                </p>
                <p className="text-2xl font-black text-navy-dark tabular-nums">$72.50</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="md:col-span-7" variant="hero" padding="lg">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-bold text-navy-dark">Recent Activity</h3>
            <button className="text-xs font-bold text-primary hover:underline">View All</button>
          </div>
          
          <div className="space-y-2">
            {/* Activity Item 1 */}
            <div className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors rounded-2xl group cursor-pointer">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                <span className="material-symbols-outlined">shopping_bag</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-navy-dark">Apple Store</p>
                <p className="text-xs text-slate-400">Electronic Gadgets • Today</p>
              </div>
              <p className="text-sm font-black tabular-nums text-navy-dark">-$129.00</p>
            </div>

            {/* Activity Item 2 */}
            <div className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors rounded-2xl group cursor-pointer">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <span className="material-symbols-outlined">payments</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-navy-dark">Salary Deposit</p>
                <p className="text-xs text-slate-400">Main Income • Yesterday</p>
              </div>
              <p className="text-sm font-black tabular-nums text-emerald-600">+$4,200.00</p>
            </div>

            {/* Activity Item 3 */}
            <div className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors rounded-2xl group cursor-pointer">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                <span className="material-symbols-outlined">restaurant</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-navy-dark">La Brasserie</p>
                <p className="text-xs text-slate-400">Dining Out • Oct 24</p>
              </div>
              <p className="text-sm font-black tabular-nums text-navy-dark">-$84.20</p>
            </div>

            {/* Activity Item 4 */}
            <div className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors rounded-2xl group cursor-pointer">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                <span className="material-symbols-outlined">bolt</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-navy-dark">Electric Grid Co.</p>
                <p className="text-xs text-slate-400">Utilities • Oct 22</p>
              </div>
              <p className="text-sm font-black tabular-nums text-navy-dark">-$112.00</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Bottom Highlights: Account Summary Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <span className="material-symbols-outlined">credit_card</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Visa Platinum
            </p>
            <p className="text-sm font-bold text-navy-dark tabular-nums">$2,450.00</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-tertiary/10 rounded-xl flex items-center justify-center text-tertiary">
            <span className="material-symbols-outlined">show_chart</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Portfolio</p>
            <p className="text-sm font-bold text-navy-dark tabular-nums">$24,110.00</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
            <span className="material-symbols-outlined">account_balance</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Savings Acct
            </p>
            <p className="text-sm font-bold text-navy-dark tabular-nums">$16,290.42</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
            <span className="material-symbols-outlined">lock</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Emergency Fund
            </p>
            <p className="text-sm font-bold text-navy-dark tabular-nums">$5,000.00</p>
          </div>
        </div>
      </section>

      {/* FAB: Add Transaction */}
      <button className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all flex items-center justify-center z-50">
        <span className="material-symbols-outlined text-3xl">add</span>
      </button>
    </MainLayout>
  );
}
