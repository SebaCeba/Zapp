import React, { useState } from 'react';
import { recalculateCycles } from '../api/tcBillingApi';
import { RecalculateResponse } from '../types/tcBilling';
import styles from './TcRecalculationPanel.module.css';

interface TcRecalculationPanelProps {
  tcKey: string;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onRecalculated: () => void;
}

export default function TcRecalculationPanel({ tcKey, onSuccess, onError, onRecalculated }: TcRecalculationPanelProps) {
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [previewData, setPreviewData] = useState<RecalculateResponse | null>(null);

  const handlePreview = async () => {
    setLoading(true);
    setPreviewData(null);
    try {
      const result = await recalculateCycles({ tcKey, dryRun: true });
      setPreviewData(result);
      if (result.affectedCount === 0) {
        onSuccess('No hay cuotas que requieran actualización');
      } else {
        onSuccess(`Vista previa generada: ${result.affectedCount} registros serán modificados`);
      }
    } catch (error: any) {
      onError(error.message || 'Error al generar vista previa');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!previewData || previewData.affectedCount === 0) {
      onError('Debe generar una vista previa antes de aplicar cambios');
      return;
    }

    if (!confirm(`¿Confirma la actualización de ${previewData.affectedCount} registros?`)) {
      return;
    }

    setApplying(true);
    try {
      const result = await recalculateCycles({ tcKey, dryRun: false });
      onSuccess(`✓ Recalculación aplicada: ${result.affectedCount} registros actualizados`);
      setPreviewData(null);
      onRecalculated();
    } catch (error: any) {
      onError(error.message || 'Error al aplicar recalculación');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className={styles.tcRecalculation}>
      <h3>Recalculación de Ciclos</h3>
      <p className={styles.tcRecalculation__description}>
        Esta operación recalcula las fechas de vencimiento de cuotas según la configuración actual.
        Solo afecta cuotas pendientes (installmentNumber=1) de compras REAL (nunca MANUAL).
      </p>

      <div className={styles.tcRecalculation__actions}>
        <button
          onClick={handlePreview}
          disabled={loading}
          className={`${styles.tcRecalculation__button} ${styles['tcRecalculation__button--preview']}`}
        >
          {loading ? 'Generando vista previa...' : '🔍 Vista previa (dry-run)'}
        </button>

        {previewData && previewData.affectedCount > 0 && (
          <button
            onClick={handleApply}
            disabled={applying}
            className={`${styles.tcRecalculation__button} ${styles['tcRecalculation__button--apply']}`}
          >
            {applying ? 'Aplicando cambios...' : '✓ Aplicar cambios'}
          </button>
        )}
      </div>

      {previewData && (
        <div className={styles.tcRecalculation__preview}>
          <div className={styles.tcRecalculation__previewTitle}>
            Vista Previa de Recalculación
          </div>

          <div className={styles.tcRecalculation__previewSummary}>
            Se modificarán <strong>{previewData.affectedCount}</strong> registros
          </div>

          {previewData.sample && previewData.sample.length > 0 && (
            <>
              <div className={styles.tcRecalculation__sampleTitle}>
                Muestra de cambios (hasta 5 ejemplos):
              </div>
              <ul className={styles.tcRecalculation__sampleList}>
                {previewData.sample.map((item, index) => (
                  <li key={index}>
                    Cuota <code>#{item.installmentId}</code> | 
                    Compra <code>{item.purchaseTransactionId}</code> | 
                    Vencimiento: <code>{item.oldDueDate}</code> → <code>{item.newDueDate}</code>
                  </li>
                ))}
              </ul>

              {previewData.affectedCount > 5 && (
                <p className={styles.tcRecalculation__sampleTitle}>
                  ... y {previewData.affectedCount - 5} registros más
                </p>
              )}
            </>
          )}

          {previewData.affectedCount === 0 && (
            <div className={styles.tcRecalculation__success}>
              ✓ No hay cuotas que requieran actualización. Todos los registros están sincronizados.
            </div>
          )}

          {previewData.affectedCount > 0 && (
            <div className={styles.tcRecalculation__warning}>
              ⚠️ Esta acción es IRREVERSIBLE. Verifique la vista previa antes de aplicar.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
