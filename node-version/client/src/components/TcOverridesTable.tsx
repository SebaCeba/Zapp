import { useState, useEffect } from 'react';
import { format, parse } from 'date-fns';
import { fetchTcConfig, upsertOverride, deleteOverride } from '../api/tcBillingApi';
import { TcBillingConfig } from '../types/tcBilling';
import styles from './TcOverridesTable.module.css';

interface TcOverridesTableProps {
  tcKey: string;
  onUpdate: () => void;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

interface MonthOverride {
  month: number;
  effectiveCloseDate: string | null;
  hasOverride: boolean;
}

export default function TcOverridesTable({ tcKey, onUpdate, onError, onSuccess }: TcOverridesTableProps) {
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [config, setConfig] = useState<TcBillingConfig | null>(null);
  const [monthsData, setMonthsData] = useState<MonthOverride[]>([]);
  const [savingMonth, setSavingMonth] = useState<number | null>(null);
  const [deletingMonth, setDeletingMonth] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [tcKey, year]);

  const loadData = async () => {
    setLoading(true);
    try {
      const configData = await fetchTcConfig(tcKey);
      setConfig(configData);

      // Construir array de 12 meses con overrides
      const months: MonthOverride[] = [];
      for (let m = 1; m <= 12; m++) {
        const override = configData.overrides.find(o => o.year === year && o.month === m);
        months.push({
          month: m,
          effectiveCloseDate: override ? override.effectiveCloseDate.split('T')[0] : null,
          hasOverride: !!override
        });
      }
      setMonthsData(months);
    } catch (error: any) {
      onError(error.message || 'Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (month: number, value: string) => {
    setMonthsData(prev => prev.map(m =>
      m.month === month ? { ...m, effectiveCloseDate: value } : m
    ));
  };

  const handleSave = async (month: number) => {
    const monthData = monthsData.find(m => m.month === month);
    if (!monthData || !monthData.effectiveCloseDate) {
      onError('Debe ingresar una fecha válida');
      return;
    }

    setSavingMonth(month);
    try {
      await upsertOverride({
        tcKey,
        year,
        month,
        effectiveCloseDate: monthData.effectiveCloseDate
      });
      onSuccess(`Override guardado para ${MONTH_NAMES[month - 1]}`);
      await loadData();
      onUpdate();
    } catch (error: any) {
      onError(error.message || 'Error al guardar override');
    } finally {
      setSavingMonth(null);
    }
  };

  const handleDelete = async (month: number) => {
    if (!confirm(`¿Eliminar override de ${MONTH_NAMES[month - 1]} ${year}?`)) {
      return;
    }

    setDeletingMonth(month);
    try {
      await deleteOverride(tcKey, year, month);
      onSuccess(`Override eliminado para ${MONTH_NAMES[month - 1]}`);
      await loadData();
      onUpdate();
    } catch (error: any) {
      onError(error.message || 'Error al eliminar override');
    } finally {
      setDeletingMonth(null);
    }
  };

  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = currentYear - 2; y <= currentYear + 2; y++) {
      years.push(y);
    }
    return years;
  };

  const getDefaultCloseDate = (month: number): string => {
    if (!config) return '-';
    return `${year}-${month.toString().padStart(2, '0')}-${config.closingDay.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className={styles.tcOverrides}>
        <div className={styles.tcOverrides__loading}>Cargando overrides...</div>
      </div>
    );
  }

  return (
    <div className={styles.tcOverrides}>
      <div className={styles.tcOverrides__header}>
        <h3>Overrides Mensuales</h3>
        <div className={styles.tcOverrides__yearSelector}>
          <span className={styles.tcOverrides__yearLabel}>Año:</span>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className={styles.tcOverrides__yearSelect}
          >
            {generateYearOptions().map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <table className={styles.tcOverrides__table}>
        <thead>
          <tr>
            <th>Mes</th>
            <th>Cierre por defecto</th>
            <th>Override</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {monthsData.map((monthData) => (
            <tr key={monthData.month}>
              <td>{MONTH_NAMES[monthData.month - 1]}</td>
              <td>{format(parse(getDefaultCloseDate(monthData.month), 'yyyy-MM-dd', new Date()), 'dd-MMM-yyyy')}</td>
              <td>
                <input
                  type="date"
                  value={monthData.effectiveCloseDate || ''}
                  onChange={(e) => handleDateChange(monthData.month, e.target.value)}
                  className={styles.tcOverrides__input}
                />
              </td>
              <td>
                <div className={styles.tcOverrides__actions}>
                  <button
                    onClick={() => handleSave(monthData.month)}
                    disabled={savingMonth === monthData.month || !monthData.effectiveCloseDate}
                    className={`${styles.tcOverrides__button} ${styles['tcOverrides__button--save']}`}
                  >
                    {savingMonth === monthData.month ? 'Guardando...' : 'Guardar'}
                  </button>
                  {monthData.hasOverride && (
                    <button
                      onClick={() => handleDelete(monthData.month)}
                      disabled={deletingMonth === monthData.month}
                      className={`${styles.tcOverrides__button} ${styles['tcOverrides__button--delete']}`}
                    >
                      {deletingMonth === monthData.month ? 'Eliminando...' : 'Eliminar'}
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className={styles.tcOverrides__helper}>
        Los overrides mensuales sobrescriben la configuración general para meses específicos.
        Útil para ajustes por feriados o casos excepcionales.
      </p>
    </div>
  );
}
