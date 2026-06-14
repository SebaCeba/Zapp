import { useState } from 'react';
import { SelectPicker } from 'rsuite';
import MainLayout from './layout/MainLayout';
import PageTitleSection from './layout/PageTitleSection';
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
        <PageTitleSection
          title="Zapps - Planificador de Suscripciones"
          actions={
            <SelectPicker
              data={[2025, 2026, 2027, 2028].map(year => ({ label: year.toString(), value: year }))}
              value={currentYear}
              onChange={(value) => setCurrentYear(value || new Date().getFullYear())}
              cleanable={false}
              searchable={false}
              style={{ width: 120 }}
            />
          }
        />

        <div className="grid grid-2">
          <AddSubscriptionForm onSuccess={handleRefresh} />
          <SubscriptionTable refreshKey={refreshKey} onDelete={handleRefresh} />
        </div>
      </div>
    </MainLayout>
  );
}

export default App;
