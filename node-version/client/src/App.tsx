import { useState } from 'react';
import MainLayout from './layout/MainLayout';
import Dashboard from './components/Dashboard';
import AddSubscriptionForm from './components/AddSubscriptionForm';
import SubscriptionTable from './components/SubscriptionTable';

function App() {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <MainLayout>
      <div className="container">
        <h1>💳 Zapps - Planificador de Suscripciones</h1>
        
        <div className="year-selector">
          <label className="stat-label">Año:</label>
          <select 
            className="select" 
            value={currentYear} 
            onChange={(e) => setCurrentYear(Number(e.target.value))}
          >
            {[2025, 2026, 2027, 2028].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <Dashboard year={currentYear} refreshKey={refreshKey} />

        <div className="grid grid-2">
          <AddSubscriptionForm onSuccess={handleRefresh} />
          <SubscriptionTable refreshKey={refreshKey} onDelete={handleRefresh} />
        </div>
      </div>
    </MainLayout>
  );
}

export default App;
