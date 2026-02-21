import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import TcConfigForm from '../components/TcConfigForm';
import TcAnnualCyclesTable from '../components/TcAnnualCyclesTable';
import TcOverridesTable from '../components/TcOverridesTable';
import TcRecalculationPanel from '../components/TcRecalculationPanel';
import styles from './ConfiguracionTC.module.css';

type TabType = 'config' | 'cycles' | 'overrides';

interface Toast {
  message: string;
  type: 'success' | 'error';
}

export default function ConfiguracionTC() {
  const { tcKey } = useParams<{ tcKey: string }>();
  const [activeTab, setActiveTab] = useState<TabType>('config');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    if (!tcKey) {
      showError('No se especificó tcKey en la URL');
    }
  }, [tcKey]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showSuccess = (message: string) => {
    setToast({ message, type: 'success' });
  };

  const showError = (message: string) => {
    setToast({ message, type: 'error' });
  };

  const handleConfigUpdate = () => {
    setRefreshTrigger(prev => prev + 1);
    showSuccess('Configuración actualizada correctamente');
  };

  const handleOverridesUpdate = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleRecalculated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  if (!tcKey) {
    return (
      <div className={styles.configuracionTC}>
        <div className={styles.configuracionTC__error}>
          Error: No se especificó la tarjeta de crédito (tcKey) en la URL
        </div>
      </div>
    );
  }

  return (
    <div className={styles.configuracionTC}>
      {toast && (
        <div className={`${styles.configuracionTC__toast} ${styles[`configuracionTC__toast--${toast.type}`]}`}>
          {toast.message}
        </div>
      )}

      <div className={styles.configuracionTC__header}>
        <h1 className={styles.configuracionTC__title}>Configuración de Ciclos de Facturación</h1>
        <p className={styles.configuracionTC__subtitle}>Tarjeta: {tcKey}</p>
      </div>

      <div className={styles.configuracionTC__tabs}>
        <button
          onClick={() => setActiveTab('config')}
          className={`${styles.configuracionTC__tab} ${activeTab === 'config' ? styles['configuracionTC__tab--active'] : ''}`}
        >
          Configuración General
        </button>
        <button
          onClick={() => setActiveTab('cycles')}
          className={`${styles.configuracionTC__tab} ${activeTab === 'cycles' ? styles['configuracionTC__tab--active'] : ''}`}
        >
          Ciclos Anuales
        </button>
        <button
          onClick={() => setActiveTab('overrides')}
          className={`${styles.configuracionTC__tab} ${activeTab === 'overrides' ? styles['configuracionTC__tab--active'] : ''}`}
        >
          Overrides Mensuales
        </button>
      </div>

      <div className={styles.configuracionTC__content}>
        {activeTab === 'config' && (
          <TcConfigForm
            tcKey={tcKey}
            onSave={handleConfigUpdate}
            onError={showError}
            onSuccess={showSuccess}
          />
        )}

        {activeTab === 'cycles' && (
          <TcAnnualCyclesTable
            tcKey={tcKey}
            refreshTrigger={refreshTrigger}
          />
        )}

        {activeTab === 'overrides' && (
          <TcOverridesTable
            tcKey={tcKey}
            onUpdate={handleOverridesUpdate}
            onError={showError}
            onSuccess={showSuccess}
          />
        )}
      </div>

      <TcRecalculationPanel
        tcKey={tcKey}
        onSuccess={showSuccess}
        onError={showError}
        onRecalculated={handleRecalculated}
      />
    </div>
  );
}
