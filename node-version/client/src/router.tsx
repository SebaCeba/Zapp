import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import Creditos from './pages/Creditos';
import Hipotecario from './pages/Hipotecario';
import Home from './pages/Home';
import ServiciosBasicos from './pages/ServiciosBasicos';
import Ingresos from './pages/Ingresos';
import Gastos from './pages/Gastos';
import Ahorros from './pages/Ahorros';
import Supermercado from './pages/Supermercado';
import Actual from './pages/Actual';
import ActualUtilities from './pages/ActualUtilities';
import ConfigServiciosBasicos from './pages/ConfigServiciosBasicos';

// New Tailwind-based pages
import { HomePage } from './pages/HomeNew';
import { ActualPage } from './pages/ActualNew';
import { PresupuestoResumenPage } from './pages/PresupuestoResumenNew';

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        {/* New Tailwind Pages */}
        <Route path="/new" element={<HomePage />} />
        <Route path="/new/actual" element={<ActualPage />} />

        {/* Main Routes - New Design */}
        <Route path="/" element={<HomePage />} />
        <Route path="/presupuesto" element={<PresupuestoResumenPage />} />
        <Route path="/actual" element={<ActualPage />} />
        <Route path="/actual/utilities" element={<ActualUtilities />} />
        <Route path="/app" element={<App />} />
        <Route path="/creditos" element={<Creditos />} />
        <Route path="/hipotecario" element={<Hipotecario />} />
        <Route path="/servicios-basicos" element={<ServiciosBasicos />} />
        <Route path="/ingresos" element={<Ingresos />} />
        <Route path="/ahorros" element={<Ahorros />} />
        <Route path="/gastos" element={<Gastos />} />
        <Route path="/supermercado" element={<Supermercado />} />
        <Route path="/config/servicios-basicos" element={<ConfigServiciosBasicos />} />
      </Routes>
    </BrowserRouter>
  );
}
