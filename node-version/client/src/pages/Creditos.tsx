import React, { useState, useEffect } from 'react';
import MainLayout from '../layout/MainLayout';
import PageTitleSection from '../layout/PageTitleSection';
import YearAndUFSelector from '../components/YearAndUFSelector';
import ObligacionForm, { ObligacionFormData } from '../components/ObligacionForm';
import VistaPreviaObligacion from '../components/VistaPreviaObligacion';
import DashboardObligaciones from '../components/DashboardObligaciones';
import TablaObligaciones from '../components/TablaObligaciones';

export default function Creditos() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [uf, setUf] = useState<number | null>(null);
  const [ufVariation, setUfVariation] = useState<number | null>(null);
  const [previewData, setPreviewData] = useState<ObligacionFormData|null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);

  // Cargar supuestos anuales al cambiar el año
  useEffect(() => {
    setLoading(true);
    fetch(`/api/obligaciones/supuestos/${year}`)
      .then(res => res.json())
      .then(data => {
        setUf(data.valorUfBase);
        setUfVariation(data.variacionAnualUf);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [year]);

  // Guardar supuestos cuando cambien
  useEffect(() => {
    if (uf === null || ufVariation === null || loading) return;
    
    const timer = setTimeout(() => {
      fetch('/api/obligaciones/supuestos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anio: year, valorUfBase: uf, variacionAnualUf: ufVariation })
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [year, uf, ufVariation, loading]);

  const handleSaveObligacion = async () => {
    if (!previewData) return;
    try {
      await fetch('/api/obligaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: previewData.nombre,
          tipo: previewData.tipo,
          moneda: previewData.moneda,
          montoCuota: previewData.monto,
          cuotasTotales: previewData.cuotas,
          mesInicio: previewData.mesInicio,
          anioInicio: previewData.anioInicio
        })
      });
      alert('Obligación guardada exitosamente');
      setPreviewData(null);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      alert('Error al guardar la obligación');
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (loading || uf === null || ufVariation === null) {
    return (
      <MainLayout>
        <div className="container" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: '#666' }}>Cargando supuestos anuales...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container">
        <PageTitleSection
          title="Créditos y Seguros"
          description="Gestiona obligaciones de cuota conocida (consumo y seguros) y visualiza el impacto anual proyectado en CLP."
        />
        <YearAndUFSelector
          year={year}
          setYear={setYear}
          uf={uf}
          setUf={setUf}
          ufVariation={ufVariation}
          setUfVariation={setUfVariation}
        />
        <DashboardObligaciones
          year={year}
          uf={uf}
          ufVariation={ufVariation}
          refreshKey={refreshKey}
        />
        {previewData ? (
          <VistaPreviaObligacion
            data={previewData}
            year={year}
            uf={uf}
            ufVariation={ufVariation}
            onBack={() => setPreviewData(null)}
            onSave={handleSaveObligacion}
          />
        ) : (
          <ObligacionForm onPreview={setPreviewData} />
        )}
        <TablaObligaciones
          refreshKey={refreshKey}
          onDelete={handleRefresh}
        />
      </div>
    </MainLayout>
  );
}
