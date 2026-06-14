import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { fetchTcConfig, upsertTcConfig } from '../api/tcBillingApi';
import styles from './TcConfigForm.module.css';

interface TcConfigFormProps {
  tcKey: string;
  onSave: () => void;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

export default function TcConfigForm({ tcKey, onSave, onError, onSuccess }: TcConfigFormProps) {
  const [closingDay, setClosingDay] = useState<number>(21);
  const [dueDay, setDueDay] = useState<number>(5);
  const [businessDayRule, setBusinessDayRule] = useState<'PREVIOUS' | 'NEXT' | 'NONE'>('PREVIOUS');
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    loadConfig();
  }, [tcKey]);

  const loadConfig = async () => {
    try {
      const config = await fetchTcConfig(tcKey);
      setClosingDay(config.closingDay);
      setDueDay(config.dueDay);
      setBusinessDayRule(config.businessDayRule);
    } catch (error: any) {
      // Si no existe configuración, usar defaults
      if (error.status === 404) {
        setClosingDay(21);
        setDueDay(5);
        setBusinessDayRule('PREVIOUS');
      } else {
        onError(error.message || 'Error al cargar configuración');
      }
    } finally {
      setInitialLoad(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (closingDay < 1 || closingDay > 31) {
      onError('Día de cierre debe estar entre 1 y 31');
      return;
    }

    if (dueDay < 1 || dueDay > 31) {
      onError('Día de pago debe estar entre 1 y 31');
      return;
    }

    setLoading(true);
    try {
      await upsertTcConfig({
        tcKey,
        closingDay,
        dueDay,
        businessDayRule
      });
      onSuccess('Configuración guardada exitosamente');
      onSave();
    } catch (error: any) {
      onError(error.message || 'Error al guardar configuración');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoad) {
    return <div className={styles.tcConfigForm}>Cargando configuración...</div>;
  }

  return (
    <form className={styles.tcConfigForm} onSubmit={handleSubmit}>
      <h3>Configuración de Ciclo</h3>

      <div className={styles.tcConfigForm__grid}>
        <div className={styles.tcConfigForm__field}>
          <label className={styles.tcConfigForm__label}>
            Día de cierre nominal
          </label>
          <input
            type="number"
            min="1"
            max="31"
            value={closingDay}
            onChange={(e) => setClosingDay(parseInt(e.target.value))}
            className={styles.tcConfigForm__input}
            required
          />
          <span className={styles.tcConfigForm__helper}>
            Día del mes en que cierra el período (1-31)
          </span>
        </div>

        <div className={styles.tcConfigForm__field}>
          <label className={styles.tcConfigForm__label}>
            Día de pago
          </label>
          <input
            type="number"
            min="1"
            max="31"
            value={dueDay}
            onChange={(e) => setDueDay(parseInt(e.target.value))}
            className={styles.tcConfigForm__input}
            required
          />
          <span className={styles.tcConfigForm__helper}>
            Día de vencimiento en el mes siguiente (1-31)
          </span>
        </div>

        <div className={styles.tcConfigForm__field}>
          <label className={styles.tcConfigForm__label}>
            Regla día hábil
          </label>
          <select
            value={businessDayRule}
            onChange={(e) => setBusinessDayRule(e.target.value as any)}
            className={styles.tcConfigForm__select}
          >
            <option value="PREVIOUS">PREVIOUS (viernes anterior)</option>
            <option value="NEXT">NEXT (lunes siguiente)</option>
            <option value="NONE">NONE (no ajustar)</option>
          </select>
          <span className={styles.tcConfigForm__helper}>
            Ajuste si el cierre cae fin de semana
          </span>
        </div>
      </div>

      <div className={styles.tcConfigForm__actions}>
        <button
          type="submit"
          className={`${styles.tcConfigForm__button} ${styles['tcConfigForm__button--primary']}`}
          disabled={loading}
        >
          {loading ? 'Guardando...' : 'Guardar Configuración'}
        </button>
      </div>
    </form>
  );
}
