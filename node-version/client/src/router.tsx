import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import Creditos from './pages/Creditos';
import Hipotecario from './pages/Hipotecario';
import Home from './pages/Home';
import ServiciosBasicos from './pages/ServiciosBasicos';
import Ingresos from './pages/Ingresos';
import Presupuesto from './pages/Presupuesto';

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/presupuesto" element={<Presupuesto />} />
        <Route path="/app" element={<App />} />
        <Route path="/creditos" element={<Creditos />} />
        <Route path="/hipotecario" element={<Hipotecario />} />
        <Route path="/servicios-basicos" element={<ServiciosBasicos />} />
        <Route path="/ingresos" element={<Ingresos />} />
      </Routes>
    </BrowserRouter>
  );
}
