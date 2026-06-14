import { useState, useEffect } from 'react';
import { format, parse, getDay as getWeekDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { fetchAnnualCycles } from '../api/tcBillingApi';
import { BillingCycle } from '../types/tcBilling';
import styles from './TcAnnualCyclesTable.module.css';

interface TcAnnualCyclesTableProps {
  tcKey: string;
  refreshTrigger?: number;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DAY_NAMES_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function TcAnnualCyclesTable({ tcKey, refreshTrigger }: TcAnnualCyclesTableProps) {
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [cycles, setCycles] = useState<BillingCycle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCycles();
  }, [tcKey, year, refreshTrigger]);

  const loadCycles = async () => {
    setLoading(true);
    try {
      const data = await fetchAnnualCycles(tcKey, year);
      setCycles(data.cycles);
    } catch (error: any) {
      console.error('Error loading cycles:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDayName = (dateStr: string): string => {
    const date = parse(dateStr, 'yyyy-MM-dd', new Date());
    const dayIndex = getWeekDay(date);
    return DAY_NAMES_SHORT[dayIndex];
  };

  const getMonthDay = (dateStr: string): string => {
    const date = parse(dateStr, 'yyyy-MM-dd', new Date());
    return format(date, 'd');
  };

  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = currentYear - 2; y <= currentYear + 2; y++) {
      years.push(y);
    }
    return years;
  };

  if (loading) {
    return (
      <div className={styles.tcAnnualCycles}>
        <div className={styles.tcAnnualCycles__loading}>Cargando ciclos...</div>
      </div>
    );
  }

  return (
    <div className={styles.tcAnnualCycles}>
      <div className={styles.tcAnnualCycles__header}>
        <h3>Ciclos Anuales {year}</h3>
        <div className={styles.tcAnnualCycles__yearSelector}>
          <span className={styles.tcAnnualCycles__yearLabel}>Año:</span>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className={styles.tcAnnualCycles__yearSelect}
          >
            {generateYearOptions().map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <table className={styles.tcAnnualCycles__table}>
        <thead>
          <tr>
            <th>Mes</th>
            <th>Desde</th>
            <th>Día</th>
            <th>Hasta</th>
            <th>Día</th>
            <th>Cierre Nominal</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {cycles.map((cycle) => (
            <tr key={cycle.month}>
              <td>{MONTH_NAMES[cycle.month - 1]}</td>
              <td>
                {format(parse(cycle.fromDate, 'yyyy-MM-dd', new Date()), 'dd-MMM', { locale: es })}
                <span className={styles.tcAnnualCycles__dayName}>
                  {getDayName(cycle.fromDate)}
                </span>
              </td>
              <td>{getMonthDay(cycle.fromDate)}</td>
              <td>
                {format(parse(cycle.toDate, 'yyyy-MM-dd', new Date()), 'dd-MMM', { locale: es })}
                <span className={styles.tcAnnualCycles__dayName}>
                  {getDayName(cycle.toDate)}
                </span>
              </td>
              <td>{getMonthDay(cycle.toDate)}</td>
              <td>
                {format(parse(cycle.nominalToDate, 'yyyy-MM-dd', new Date()), 'dd-MMM', { locale: es })}
              </td>
              <td>
                {cycle.overrideApplied && (
                  <span className={`${styles.tcAnnualCycles__badge} ${styles['tcAnnualCycles__badge--override']}`}>
                    Override
                  </span>
                )}
                {cycle.ruleApplied && (
                  <span className={`${styles.tcAnnualCycles__badge} ${styles['tcAnnualCycles__badge--rule']}`}>
                    Regla
                  </span>
                )}
                {!cycle.overrideApplied && !cycle.ruleApplied && (
                  <span style={{ color: '#999' }}>-</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
