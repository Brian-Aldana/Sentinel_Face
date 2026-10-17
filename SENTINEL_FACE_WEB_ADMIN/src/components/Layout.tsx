import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export const Layout: React.FC = () => {
  const location = useLocation();

  const getPageTitle = (pathname: string) => {
    switch (pathname) {
      case '/':
        return 'Dashboard de Operaciones y Seguridad';
      case '/hogares':
        return 'Directorio y Control de Hogares Clientes';
      case '/alertas':
        return 'Centro de Alertas de Seguridad & Anti-Spoofing';
      case '/accesos':
        return 'Historial de Monitoreo Biométrico';
      case '/auditoria':
        return 'Bitácora de Auditoría Administrativa';
      case '/configuracion':
        return 'Configuración Global del Proveedor';
      default:
        if (pathname.startsWith('/hogares/')) return 'Detalle y Gestión del Hogar';
        return 'Sentinel Face';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col min-w-0">
        <Navbar title={getPageTitle(location.pathname)} />
        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
