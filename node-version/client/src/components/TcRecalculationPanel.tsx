import { useState } from 'react';
import { recalculateCycles } from '../api/tcBillingApi';
import { RecalculateResponse } from '../types/tcBilling';
import styles from './TcRecalculationPanel.module.css';

interface TcRecalculationPanelProps {
  tcKey: string;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onRecalculated: () => void;
}

const RECALCULATION_SCOPE = 'FUTURE_ONLY' as const;

function getAffectedCount(data: RecalculateResponse): number {
  return data.dryRun ? data.wouldChangeCount || 0 : data.changedCount || 0;
}

export default function TcRecalculationPanel({ tcKey, onSuccess, onError, onRecalculated }: TcRecalculationPanelProps) {
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [previewData, setPreviewData] = useState<RecalculateResponse | null>(null);
  const currentYear = new Date().getFullYear();

  const handlePreview = async () => {
    setLoading(true);
    setPreviewData(null);
    try {
      const result = await recalculateCycles({
        tcKey,
        year: currentYear,
        scope: RECALCULATION_SCOPE,
        dryRun: true
      });
      const affectedCount = getAffectedCount(result);
      setPreviewData(result);

      if (affectedCount === 0) {
        onSuccess('No hay cuotas que requieran actualizacion');
      } else {
        onSuccess(`Vista previa generada: ${affectedCount} registros seran modificados`);
      }
    } catch (error: any) {
      onError(error.message || 'Error al generar vista previa');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!previewData || getAffectedCount(previewData) === 0) {
      onError('Debe generar una vista previa antes de aplicar cambios');
      return;
    }

    if (!confirm(`Confirma la actualizacion de ${getAffectedCount(previewData)} registros?`)) {
      return;
    }

    setApplying(true);
    try {
      const result = await recalculateCycles({
        tcKey,
        year: currentYear,
        scope: RECALCULATION_SCOPE,
        dryRun: false
      });
      onSuccess(`Recalculacion aplicada: ${getAffectedCount(result)} registros actualizados`);
      setPreviewData(null);
      onRecalculated();
    } catch (error: any) {
      onError(error.message || 'Error al aplicar recalculacion');
    } finally {
      setApplying(false);
    }
  };

  const affectedCount = previewData ? getAffectedCount(previewData) : 0;
  const sampleChanges = previewData?.sampleChanges || [];

  return (
    <div className={styles.tcRecalculation}>
      <h3>Recalculacion de Ciclos</h3>
      <p className={styles.tcRecalculation__description}>
        Esta operacion recalcula las fechas de vencimiento de cuotas segun la configuracion actual.
        Solo afecta cuotas pendientes (installmentNumber=1) de compras REAL (nunca MANUAL).
      </p>

      <div className={styles.tcRecalculation__actions}>
        <button
          onClick={handlePreview}
          disabled={loading}
          className={`${styles.tcRecalculation__button} ${styles['tcRecalculation__button--preview']}`}
        >
          {loading ? 'Generando vista previa...' : 'Vista previa (dry-run)'}
        </button>

        {previewData && affectedCount > 0 && (
          <button
            onClick={handleApply}
            disabled={applying}
            className={`${styles.tcRecalculation__button} ${styles['tcRecalculation__button--apply']}`}
          >
            {applying ? 'Aplicando cambios...' : 'Aplicar cambios'}
          </button>
        )}
      </div>

      {previewData && (
        <div className={styles.tcRecalculation__preview}>
          <div className={styles.tcRecalculation__previewTitle}>
            Vista Previa de Recalculacion
          </div>

          <div className={styles.tcRecalculation__previewSummary}>
            Se modificaran <strong>{affectedCount}</strong> registros
          </div>

          {sampleChanges.length > 0 && (
            <>
              <div className={styles.tcRecalculation__sampleTitle}>
                Muestra de cambios (hasta 5 ejemplos):
              </div>
              <ul className={styles.tcRecalculation__sampleList}>
                {sampleChanges.slice(0, 5).map((item, index) => (
                  <li key={index}>
                    Cuota <code>#{item.installmentId}</code> |
                    Compra <code>{item.purchaseId}</code> |
                    Vencimiento: <code>{item.oldDate}</code> a <code>{item.newDate}</code>
                  </li>
                ))}
              </ul>

              {affectedCount > 5 && (
                <p className={styles.tcRecalculation__sampleTitle}>
                  ... y {affectedCount - 5} registros mas
                </p>
              )}
            </>
          )}

          {affectedCount === 0 && (
            <div className={styles.tcRecalculation__success}>
              No hay cuotas que requieran actualizacion. Todos los registros estan sincronizados.
            </div>
          )}

          {affectedCount > 0 && (
            <div className={styles.tcRecalculation__warning}>
              Esta accion es irreversible. Verifique la vista previa antes de aplicar.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
