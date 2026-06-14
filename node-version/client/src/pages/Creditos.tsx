import { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout';
import YearAndUFSelector from '../components/YearAndUFSelector';
import ObligacionForm, { ObligacionFormData } from '../components/ObligacionForm';
import VistaPreviaObligacion from '../components/VistaPreviaObligacion';
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
    fetch(`http://localhost:3000/api/obligaciones/supuestos/${year}`)
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
      fetch('http://localhost:3000/api/obligaciones/supuestos', {
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
      await fetch('http://localhost:3000/api/obligaciones', {
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

  const headerProps = {
    year,
    title: 'Créditos y Obligaciones',
  };

  if (loading || uf === null || ufVariation === null) {
    return (
      <MainLayout headerProps={headerProps}>
        <div className="flex items-center justify-center py-16">
          <p className="text-slate-500">Cargando supuestos anuales...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout headerProps={headerProps}>
      <div className="space-y-6">
        <YearAndUFSelector
          year={year}
          setYear={setYear}
          uf={uf}
          setUf={setUf}
          ufVariation={ufVariation}
          setUfVariation={setUfVariation}
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
