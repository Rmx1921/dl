import React, { useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import SerialNumberGenerator from './components/SerialNumberGenerator';
import BillDetails from './components/BillDetails';
import UpdateManager from './components/UpdateManager';
import DataExport from './components/DataExport';

function App() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!window.electronAPI) return;
    const routeHandlers = [
      { event: 'onOpenBillsPage', path: '/bills', listenerName: 'open-bills-page' },
      { event: 'onOpenUpdaterPage', path: '/updater', listenerName: 'open-updater-page' },
      { event: 'onOpenExportPage', path: '/export', listenerName: 'open-export-page' }
    ];
    const cleanup = routeHandlers.map(handler => {
      if (window.electronAPI[handler.event]) {
        try {
          const navigationListener = () => navigate(handler.path);
          window.electronAPI[handler.event](navigationListener);
          return () => {
            if (window.electronAPI.removeAllListeners) {
              window.electronAPI.removeAllListeners(handler.listenerName);
            }
          };
        } catch (error) {
          console.error(`Error setting up ${handler.event} listener:`, error);
          return null;
        }
      }
      return null;
    }).filter(Boolean);
    return () => {
      cleanup.forEach(cleanupFn => cleanupFn());
    };
  }, [navigate]);

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<SerialNumberGenerator />} />
        <Route path="/bills" element={<BillDetails />} />
        <Route path="/updater" element={<UpdateManager />} />
        <Route path="/export" element={<DataExport />} />
      </Routes>
    </div>
  );
}

export default App;